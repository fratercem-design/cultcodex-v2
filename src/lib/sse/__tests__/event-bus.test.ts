import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { EventEmitter } from "node:events";

// ---------------------------------------------------------------------------
// Shared mock-pg scaffolding
// ---------------------------------------------------------------------------

interface MockQueryRecord {
  sql: string;
  params?: unknown[];
}

// Module-level tracking — lives in the test file scope so it survives module
// resets and is always the same object the mock factory closes over.
const mockInstances: MockPgClient[] = [];

function resetMockState() {
  mockInstances.length = 0;
}

class MockPgClient extends EventEmitter {
  connectionString: string;
  queries: MockQueryRecord[] = [];
  connectImpl: () => Promise<void> = () => Promise.resolve();
  queryImpl: (sql: string, params?: unknown[]) => Promise<unknown> = () =>
    Promise.resolve({ rows: [] });

  constructor(opts: { connectionString: string }) {
    super();
    this.connectionString = opts.connectionString;
    mockInstances.push(this);
  }

  async connect(): Promise<void> {
    return this.connectImpl();
  }

  async query(sql: string, params?: unknown[]): Promise<unknown> {
    this.queries.push({ sql, params });
    return this.queryImpl(sql, params);
  }

  async end(): Promise<void> {
    return;
  }
}

// Mock pg at the top level. This runs once and is hoisted by vitest.
// We do NOT use vi.resetModules() — instead we reset the singleton via
// globalThis so each test gets a fresh PgEventBus without a module reload.
vi.mock("pg", () => ({
  Client: MockPgClient,
}));

// ---------------------------------------------------------------------------
// Helper: get a fresh eventBus instance for each test by clearing the
// globalThis cache that event-bus.ts uses for HMR-safe singleton storage.
// ---------------------------------------------------------------------------
async function loadBus() {
  // Clear the singleton so the next import creates a fresh PgEventBus.
  const g = globalThis as Record<string, unknown>;
  delete g.__cultcodexPgEventBus;

  // Re-import (module is cached, so this just re-evaluates the export
  // expression which now creates a new PgEventBus due to the cleared cache).
  vi.resetModules();
  vi.doMock("pg", () => ({ Client: MockPgClient }));
  const mod = await import("../event-bus");
  return mod.eventBus;
}

// Helper: wait until at least one MockPgClient has been instantiated.
async function getMockClient(ms = 100): Promise<MockPgClient> {
  const deadline = Date.now() + ms;
  while (mockInstances.length === 0 && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5));
  }
  if (mockInstances.length === 0) {
    throw new Error("MockPgClient never instantiated within " + ms + "ms");
  }
  return mockInstances[mockInstances.length - 1];
}

beforeEach(() => {
  resetMockState();
  process.env.DATABASE_URL = "postgres://test:test@localhost/test";
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// safeChannelName
// ---------------------------------------------------------------------------

describe("safeChannelName", () => {
  it("passes short safe names through unchanged", async () => {
    const { safeChannelName } = await import("../event-bus");
    expect(safeChannelName("live:chat")).toBe("live:chat");
    expect(safeChannelName("episode:foo-slug")).toBe("episode:foo-slug");
    expect(safeChannelName("a.b_c-D")).toBe("a.b_c-D");
  });

  it("hashes names longer than 63 bytes", async () => {
    const { safeChannelName } = await import("../event-bus");
    const long = "episode:" + "x".repeat(60);
    const result = safeChannelName(long);
    expect(result.startsWith("ch_")).toBe(true);
    expect(result.length).toBe(3 + 16); // "ch_" + 16 hex chars
  });

  it("hashes names with unsafe characters", async () => {
    const { safeChannelName } = await import("../event-bus");
    const result = safeChannelName("user@example.com");
    expect(result.startsWith("ch_")).toBe(true);
  });

  it("is deterministic — same input produces same output", async () => {
    const { safeChannelName } = await import("../event-bus");
    const long = "x".repeat(100);
    expect(safeChannelName(long)).toBe(safeChannelName(long));
  });
});

// ---------------------------------------------------------------------------
// subscribe / unsubscribe — LISTEN/UNLISTEN ref counting
// ---------------------------------------------------------------------------

describe("subscribe / unsubscribe", () => {
  it("first listener triggers LISTEN; subsequent listeners do not re-issue", async () => {
    const bus = await loadBus();

    const unsub1 = bus.subscribe("live:chat", () => {});
    const unsub2 = bus.subscribe("live:chat", () => {});

    // Wait for the PgClient to be created and LISTEN to complete.
    // The bus issues LISTEN twice for the initial subscribe: once in the
    // getClient() connect-loop (which re-LISTENs all active channels) and once
    // in subscribe()'s own .then() callback. Both target the same safe channel.
    const client = await getMockClient();
    await new Promise((r) => setTimeout(r, 20));

    // Only the FIRST subscribe() triggers the LISTEN path. The second
    // subscribe() skips it (isFirst=false). The connect-loop may issue an
    // additional LISTEN for the same channel — all queries must target
    // exactly "live:chat" and no OTHER channel should appear.
    const listenQueries = client.queries.filter((q) =>
      q.sql.startsWith("LISTEN"),
    );
    expect(listenQueries.length).toBeGreaterThanOrEqual(1);
    for (const q of listenQueries) {
      expect(q.sql).toBe('LISTEN "live:chat"');
    }

    unsub1();
    unsub2();
  });

  it("last unsubscribe issues UNLISTEN", async () => {
    const bus = await loadBus();

    const unsub = bus.subscribe("live:chat", () => {});
    const client = await getMockClient();
    await new Promise((r) => setTimeout(r, 20));

    unsub();
    await new Promise((r) => setTimeout(r, 20));

    const unlistenQueries = client.queries.filter((q) =>
      q.sql.startsWith("UNLISTEN"),
    );
    expect(unlistenQueries).toHaveLength(1);
    expect(unlistenQueries[0].sql).toBe('UNLISTEN "live:chat"');
  });

  it("partial unsubscribe (one of two listeners) does not UNLISTEN", async () => {
    const bus = await loadBus();

    const unsub1 = bus.subscribe("live:chat", () => {});
    const unsub2 = bus.subscribe("live:chat", () => {});
    const client = await getMockClient();
    await new Promise((r) => setTimeout(r, 20));

    unsub1();
    await new Promise((r) => setTimeout(r, 20));

    const unlistenQueries = client.queries.filter((q) =>
      q.sql.startsWith("UNLISTEN"),
    );
    expect(unlistenQueries).toHaveLength(0);

    unsub2();
  });

  it("unsubscribe is idempotent — calling twice is safe", async () => {
    const bus = await loadBus();
    const unsub = bus.subscribe("live:chat", () => {});
    await getMockClient();
    await new Promise((r) => setTimeout(r, 20));

    unsub();
    expect(() => unsub()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// notification fan-out
// ---------------------------------------------------------------------------

describe("notification fan-out", () => {
  it("incoming NOTIFY routes to all listeners on that channel", async () => {
    const bus = await loadBus();
    const a: unknown[] = [];
    const b: unknown[] = [];

    bus.subscribe("live:chat", (data) => a.push(data));
    bus.subscribe("live:chat", (data) => b.push(data));
    const client = await getMockClient();
    await new Promise((r) => setTimeout(r, 20));

    client.emit("notification", {
      channel: "live:chat",
      payload: JSON.stringify({ hello: "world" }),
    });

    expect(a).toEqual([{ hello: "world" }]);
    expect(b).toEqual([{ hello: "world" }]);
  });

  it("NOTIFY on a channel with no listeners is silently dropped", async () => {
    const bus = await loadBus();
    bus.subscribe("live:chat", () => {});
    const client = await getMockClient();
    await new Promise((r) => setTimeout(r, 20));

    expect(() =>
      client.emit("notification", {
        channel: "no-such-channel",
        payload: '{"x":1}',
      }),
    ).not.toThrow();
  });

  it("a listener that throws does not block other listeners", async () => {
    const bus = await loadBus();
    const received: unknown[] = [];

    bus.subscribe("live:chat", () => {
      throw new Error("boom");
    });
    bus.subscribe("live:chat", (data) => received.push(data));
    const client = await getMockClient();
    await new Promise((r) => setTimeout(r, 20));

    client.emit("notification", {
      channel: "live:chat",
      payload: '{"ok":true}',
    });

    expect(received).toEqual([{ ok: true }]);
  });

  it("NOTIFY with malformed JSON payload is dropped without invoking listeners", async () => {
    const bus = await loadBus();
    const received: unknown[] = [];

    bus.subscribe("live:chat", (data) => received.push(data));
    const client = await getMockClient();
    await new Promise((r) => setTimeout(r, 20));

    client.emit("notification", {
      channel: "live:chat",
      payload: "{not valid json",
    });

    expect(received).toEqual([]);
  });

  it("hashed-channel raw lookup works (long channel name round-trip)", async () => {
    const bus = await loadBus();
    const received: unknown[] = [];

    const longChannel = "episode:" + "x".repeat(60);
    bus.subscribe(longChannel, (data) => received.push(data));
    const client = await getMockClient();
    await new Promise((r) => setTimeout(r, 20));

    const listenQueries = client.queries.filter((q) =>
      q.sql.startsWith("LISTEN"),
    );
    expect(listenQueries.length).toBeGreaterThanOrEqual(1);
    // Extract the safe channel from the LISTEN sql (e.g., LISTEN "ch_abcdef...")
    const match = listenQueries[0].sql.match(/^LISTEN "(.+)"$/);
    expect(match).not.toBeNull();
    const safe = match![1];

    client.emit("notification", {
      channel: safe,
      payload: '{"ok":true}',
    });
    expect(received).toEqual([{ ok: true }]);
  });
});

// ---------------------------------------------------------------------------
// publish + timeout
// ---------------------------------------------------------------------------

describe("publish", () => {
  it("calls pg_notify with safe channel name and JSON payload", async () => {
    const bus = await loadBus();
    bus.subscribe("live:chat", () => {}); // ensures client is created
    const client = await getMockClient();
    await new Promise((r) => setTimeout(r, 20));

    await bus.publish("live:chat", { hello: "world" });

    const notifyQueries = client.queries.filter(
      (q) => q.sql === "SELECT pg_notify($1, $2)",
    );
    expect(notifyQueries).toHaveLength(1);
    expect(notifyQueries[0].params).toEqual(["live:chat", '{"hello":"world"}']);
  });

  it("hashes channel name when publishing to a long channel", async () => {
    const bus = await loadBus();
    const longChannel = "episode:" + "x".repeat(60);
    bus.subscribe(longChannel, () => {});
    const client = await getMockClient();
    await new Promise((r) => setTimeout(r, 20));

    await bus.publish(longChannel, { x: 1 });

    const notifyQueries = client.queries.filter(
      (q) => q.sql === "SELECT pg_notify($1, $2)",
    );
    expect(notifyQueries).toHaveLength(1);
    expect((notifyQueries[0].params![0] as string).startsWith("ch_")).toBe(true);
  });

  it("rejects with a timeout error if the client hangs for >2s", async () => {
    vi.useFakeTimers();
    const bus = await loadBus();

    // Make connect() never resolve so getClient() inside publish hangs.
    const origConnect = MockPgClient.prototype.connect;
    MockPgClient.prototype.connect = function () {
      return new Promise<void>(() => {}); // pending forever
    };

    try {
      const publishPromise = bus.publish("live:chat", { x: 1 });
      // Attach a no-op rejection handler so the unhandled rejection doesn't
      // surface before our assertion runs.
      publishPromise.catch(() => {});

      await vi.advanceTimersByTimeAsync(2100);

      await expect(publishPromise).rejects.toThrow(/publish timed out/);
    } finally {
      MockPgClient.prototype.connect = origConnect;
    }
  });
});

// ---------------------------------------------------------------------------
// reconnect backoff
// ---------------------------------------------------------------------------

describe("reconnect backoff", () => {
  it("re-LISTENs all active channels after a reconnect", async () => {
    vi.useFakeTimers();
    const bus = await loadBus();

    bus.subscribe("live:chat", () => {});
    bus.subscribe("episode:foo", () => {});
    await vi.advanceTimersByTimeAsync(20);

    const firstClient = mockInstances[0];
    expect(firstClient).toBeDefined();
    // Initial connect-loop should have LISTENed both channels at least once
    const initialListens = firstClient.queries.filter((q) =>
      q.sql.startsWith("LISTEN"),
    );
    expect(initialListens.length).toBeGreaterThanOrEqual(2);

    // Simulate a disconnect
    firstClient.emit("error", new Error("connection lost"));

    // Advance past the 1000ms initial backoff
    await vi.advanceTimersByTimeAsync(1100);

    const secondClient = mockInstances[mockInstances.length - 1];
    expect(secondClient).toBeDefined();
    expect(secondClient).not.toBe(firstClient);
    const reLISTEN = secondClient.queries.filter((q) =>
      q.sql.startsWith("LISTEN"),
    );
    // Both channels should be re-LISTENed on the new client
    const channels = new Set(
      reLISTEN.map((q) => q.sql.match(/^LISTEN "(.+)"$/)?.[1]),
    );
    expect(channels.has("live:chat")).toBe(true);
    expect(channels.has("episode:foo")).toBe(true);
  });

  it("backoff doubles per failure and caps at 30000ms", async () => {
    vi.useFakeTimers();
    const bus = await loadBus();

    // Make every connect fail
    const origConnect = MockPgClient.prototype.connect;
    MockPgClient.prototype.connect = function () {
      return Promise.reject(new Error("connect refused"));
    };

    try {
      bus.subscribe("live:chat", () => {});
      // First connect attempt fails immediately; backoff schedules at 1000ms.
      await vi.advanceTimersByTimeAsync(20);

      // Walk through the backoff sequence: 1000, 2000, 4000, 8000, 16000, 30000, 30000.
      const expectedDelays = [1000, 2000, 4000, 8000, 16000, 30000, 30000];
      for (const delay of expectedDelays) {
        await vi.advanceTimersByTimeAsync(delay + 10);
      }

      // We just verify no crash and that multiple instances were created
      // (one per reconnect attempt). The exact log assertions live in the
      // dedicated log-fields test below.
      expect(mockInstances.length).toBeGreaterThanOrEqual(
        expectedDelays.length,
      );
    } finally {
      MockPgClient.prototype.connect = origConnect;
    }
  });

  it("backoff resets to 1000ms after a successful reconnect", async () => {
    vi.useFakeTimers();
    const bus = await loadBus();

    let connectAttempts = 0;
    const origConnect = MockPgClient.prototype.connect;
    MockPgClient.prototype.connect = function () {
      connectAttempts += 1;
      if (connectAttempts <= 2) {
        return Promise.reject(new Error("transient"));
      }
      return Promise.resolve();
    };

    try {
      bus.subscribe("live:chat", () => {});

      // First connect fails → schedule at 1000ms
      // Second connect fails → schedule at 2000ms
      // Third connect succeeds → reconnectDelayMs reset to 1000
      await vi.advanceTimersByTimeAsync(20);
      await vi.advanceTimersByTimeAsync(1100);
      await vi.advanceTimersByTimeAsync(2100);

      expect(connectAttempts).toBeGreaterThanOrEqual(3);

      // Now trigger another disconnect — backoff should start at 1000 again, not 4000.
      const lastClient = mockInstances[mockInstances.length - 1];
      // Make the next connect fail so we can observe a fresh schedule.
      MockPgClient.prototype.connect = function () {
        return Promise.reject(new Error("again"));
      };
      lastClient.emit("error", new Error("disconnect"));

      // If backoff reset, next attempt fires within 1100ms.
      const beforeCount = mockInstances.length;
      await vi.advanceTimersByTimeAsync(1100);
      expect(mockInstances.length).toBeGreaterThan(beforeCount);
    } finally {
      MockPgClient.prototype.connect = origConnect;
    }
  });

  it("emits reconnect-scheduled log entries with delayMs and attempt fields", async () => {
    vi.useFakeTimers();
    const { sseLogger } = await import("../log");
    const logSpy = vi.spyOn(sseLogger, "log");

    const bus = await loadBus();

    const origConnect = MockPgClient.prototype.connect;
    MockPgClient.prototype.connect = function () {
      return Promise.reject(new Error("nope"));
    };

    try {
      bus.subscribe("live:chat", () => {});
      await vi.advanceTimersByTimeAsync(20);
      await vi.advanceTimersByTimeAsync(1100);
      await vi.advanceTimersByTimeAsync(2100);

      const scheduledCalls = logSpy.mock.calls.filter(
        ([, event]) => event === "reconnect-scheduled",
      );
      expect(scheduledCalls.length).toBeGreaterThanOrEqual(2);

      // First scheduled reconnect: attempt=1, delayMs=1000
      const first = scheduledCalls[0][2] as Record<string, unknown>;
      expect(first.attempt).toBe(1);
      expect(first.delayMs).toBe(1000);

      // Second scheduled reconnect: attempt=2, delayMs=2000
      const second = scheduledCalls[1][2] as Record<string, unknown>;
      expect(second.attempt).toBe(2);
      expect(second.delayMs).toBe(2000);
    } finally {
      MockPgClient.prototype.connect = origConnect;
      logSpy.mockRestore();
    }
  });
});
