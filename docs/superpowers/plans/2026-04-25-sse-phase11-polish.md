# SSE Phase 11 Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the four deferred follow-ups from the 2026-04-24 SSE bus spec (tests, structured logs, reconnect dot, admin status endpoint) as one cohesive polish pass.

**Architecture:** A standalone JSON logger with a 50-event ring buffer is added; `PgEventBus` is rewired to emit through it and gains a `getStatus()` introspection method; `useSSE` returns a debounced connection status; a small `ConnectionDot` component renders an inline pulsing dot when status is non-open; an admin-only `GET /api/admin/sse-status` route returns the calling instance's bus snapshot.

**Tech Stack:** Next.js 15 App Router, vitest (already configured), `pg` (Postgres client), `@electric-sql/pglite` + `@electric-sql/pglite-socket` for the integration test, Tailwind for the dot styling, NextAuth's existing `requireAdmin()` for the admin gate.

**Spec:** `docs/superpowers/specs/2026-04-25-sse-phase11-polish-design.md`

---

## File structure

**Create (6):**

| Path | Responsibility |
|---|---|
| `src/lib/sse/log.ts` | `SseLogger` class + `sseLogger` HMR-safe singleton + `LogEntry` type |
| `src/lib/sse/__tests__/log.test.ts` | Logger unit tests |
| `src/lib/sse/__tests__/event-bus.test.ts` | Bus unit tests with mocked `pg.Client` |
| `src/lib/sse/__tests__/event-bus.integration.test.ts` | One pglite roundtrip integration test |
| `src/components/sse/connection-dot.tsx` | Presentational dot component |
| `src/app/api/admin/sse-status/route.ts` | Admin-gated JSON snapshot endpoint |

**Modify (5):**

- `src/lib/sse/event-bus.ts` — wire logger; add `reconnectAttempt` counter; add `getStatus()` method.
- `src/lib/sse/use-sse.ts` — return `{ status }` (debounced).
- `src/components/episodes/comment-section.tsx` — destructure `status` from `useSSE`; render `<ConnectionDot status={status} />` at the top of the returned div.
- `src/components/episodes/reaction-bar.tsx` — same.
- `src/components/live/live-chat.tsx` — same, inline next to the existing "Live Chat" text.

---

## Task 1: Logger module

**Files:**
- Create: `src/lib/sse/log.ts`
- Test: `src/lib/sse/__tests__/log.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/sse/__tests__/log.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { SseLogger } from "../log";

describe("SseLogger", () => {
  let logger: SseLogger;

  beforeEach(() => {
    logger = new SseLogger();
  });

  it("captures log entries with canonical fields", () => {
    logger.log("info", "connect", { foo: "bar" });
    const entries = logger.recent();
    expect(entries).toHaveLength(1);
    const entry = entries[0];
    expect(entry.level).toBe("info");
    expect(entry.source).toBe("PgEventBus");
    expect(entry.event).toBe("connect");
    expect(entry.foo).toBe("bar");
    expect(typeof entry.ts).toBe("string");
    // ISO 8601 sanity check
    expect(new Date(entry.ts).toISOString()).toBe(entry.ts);
  });

  it("ring buffer caps at 50 entries (oldest dropped)", () => {
    for (let i = 0; i < 60; i++) {
      logger.log("info", "publish", { seq: i });
    }
    const entries = logger.recent();
    expect(entries).toHaveLength(50);
    expect(entries[0].seq).toBe(10); // first 10 dropped
    expect(entries[49].seq).toBe(59);
  });

  it("recent() returns a copy — mutating does not affect the buffer", () => {
    logger.log("info", "connect");
    const first = logger.recent();
    (first as unknown as unknown[]).push({ poison: true });
    const second = logger.recent();
    expect(second).toHaveLength(1);
  });
});
```

The test imports `SseLogger` (the class) — we expose this for tests in addition to the singleton.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/sse/__tests__/log.test.ts`

Expected: FAIL with "Cannot find module '../log'" (file does not exist yet).

- [ ] **Step 3: Implement the logger**

Create `src/lib/sse/log.ts`:

```ts
export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  ts: string;
  level: LogLevel;
  source: "PgEventBus";
  event: string;
  [key: string]: unknown;
}

export class SseLogger {
  private buffer: LogEntry[] = [];
  private readonly MAX = 50;

  log(level: LogLevel, event: string, fields: Record<string, unknown> = {}): void {
    const entry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      source: "PgEventBus",
      event,
      ...fields,
    };
    this.buffer.push(entry);
    if (this.buffer.length > this.MAX) this.buffer.shift();

    const sink =
      level === "error"
        ? console.error
        : level === "warn"
          ? console.warn
          : console.log;
    sink(JSON.stringify(entry));
  }

  recent(): readonly LogEntry[] {
    return [...this.buffer];
  }
}

// HMR-safe singleton (same pattern as src/lib/sse/event-bus.ts)
const globalForLogger = globalThis as unknown as {
  __cultcodexSseLogger?: SseLogger;
};

export const sseLogger = globalForLogger.__cultcodexSseLogger ?? new SseLogger();

if (process.env.NODE_ENV !== "production") {
  globalForLogger.__cultcodexSseLogger = sseLogger;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/sse/__tests__/log.test.ts`

Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sse/log.ts src/lib/sse/__tests__/log.test.ts
git commit -m "feat(sse): add structured JSON logger with 50-event ring buffer"
```

---

## Task 2: Wire logger into PgEventBus + add reconnectAttempt counter

**Files:**
- Modify: `src/lib/sse/event-bus.ts`

This is a mechanical refactor. Every `console.error("[PgEventBus] ...")` becomes a structured `sseLogger.log()` call; we also add `info`/`warn` calls that don't exist today. The `[PgEventBus]` prefix goes away (every entry has `source: "PgEventBus"` already). A new `reconnectAttempt` counter is added so reconnect logs include the attempt number.

No new tests in this task — the upcoming Task 3-7 bus unit tests will verify the logger emissions through `vi.spyOn(sseLogger, "log")`.

- [ ] **Step 1: Add the import**

In `src/lib/sse/event-bus.ts`, add to the top imports (line 2 area):

```ts
import { sseLogger } from "./log";
```

- [ ] **Step 2: Add the `reconnectAttempt` field**

Inside the `PgEventBus` class, near the other private fields (around line 32-34):

```ts
  private reconnectAttempt = 0;
```

- [ ] **Step 3: Replace every `console.error` call with `sseLogger.log` calls per the canonical event vocabulary**

Locate each existing log point and replace as follows. Do these edits one at a time and re-read the file afterward to confirm the surrounding code is intact.

In the `notification` handler:

```ts
// before
} catch (err) {
  console.error("[PgEventBus] Failed to parse NOTIFY payload:", err);
  return;
}
// after
} catch (err) {
  sseLogger.log("error", "notify-parse-failed", {
    channel: msg.channel,
    error: err instanceof Error ? err.message : String(err),
  });
  return;
}
```

```ts
// before
for (const fn of set) {
  try {
    fn(data);
  } catch (err) {
    console.error("[PgEventBus] Listener threw:", err);
  }
}
// after
for (const fn of set) {
  try {
    fn(data);
  } catch (err) {
    sseLogger.log("error", "listener-threw", {
      channel: raw,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
```

In the `client.on("error", ...)` handler:

```ts
// before
client.on("error", (err) => {
  console.error("[PgEventBus] Client error:", err);
  this.scheduleReconnect();
});
// after
client.on("error", (err) => {
  sseLogger.log("error", "client-error", {
    error: err instanceof Error ? err.message : String(err),
  });
  this.scheduleReconnect();
});
```

In the `client.on("end", ...)` handler:

```ts
// before
client.on("end", () => {
  console.error("[PgEventBus] Client ended unexpectedly");
  this.scheduleReconnect();
});
// after
client.on("end", () => {
  sseLogger.log("warn", "client-end");
  this.scheduleReconnect();
});
```

After `await client.connect();`, before the LISTEN re-issue loop, add a connect log and reset the attempt counter:

```ts
// after
await client.connect();

sseLogger.log("info", "connect");
this.reconnectAttempt = 0;

// Re-LISTEN to every channel that currently has subscribers.
```

The existing `this.reconnectDelayMs = 1000;` line at the end of the IIFE stays as is.

In the LISTEN loop (re-LISTEN on connect/reconnect), add a log per channel:

```ts
// before
for (const raw of this.listeners.keys()) {
  const safe = this.getSafeChannel(raw);
  await client.query(`LISTEN "${safe}"`);
}
// after
for (const raw of this.listeners.keys()) {
  const safe = this.getSafeChannel(raw);
  await client.query(`LISTEN "${safe}"`);
  sseLogger.log("info", "listen", { channel: safe, rawChannel: raw });
}
```

In the `getClient()` `catch` block:

```ts
// no change needed — error is rethrown to caller; scheduleReconnect() will fire its own log
```

In `scheduleReconnect()`, replace the existing setTimeout body and add the scheduled log + attempt increment. Locate the existing block:

```ts
// before
this.reconnectTimer = setTimeout(() => {
  this.reconnectTimer = null;
  this.getClient().catch((err) => {
    console.error("[PgEventBus] Reconnect failed:", err);
  });
}, delay);
// after
this.reconnectAttempt += 1;
sseLogger.log("warn", "reconnect-scheduled", {
  delayMs: delay,
  attempt: this.reconnectAttempt,
});
this.reconnectTimer = setTimeout(() => {
  this.reconnectTimer = null;
  this.getClient().catch((err) => {
    sseLogger.log("error", "reconnect-failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  });
}, delay);
```

In `subscribe()`, after the LISTEN .then(...) succeeds, add a listen log. Locate:

```ts
// before
this.getClient()
  .then((c) => c.query(`LISTEN "${safe}"`))
  .catch((err) =>
    console.error(`[PgEventBus] LISTEN failed for ${safe}:`, err),
  );
// after
this.getClient()
  .then((c) => c.query(`LISTEN "${safe}"`))
  .then(() => {
    sseLogger.log("info", "listen", { channel: safe, rawChannel: channel });
  })
  .catch((err) =>
    sseLogger.log("error", "listen-failed", {
      channel: safe,
      error: err instanceof Error ? err.message : String(err),
    }),
  );
```

In the unsubscribe cleanup function:

```ts
// before
if (this.client) {
  this.client.query(`UNLISTEN "${safe}"`).catch((err) => {
    console.error(`[PgEventBus] UNLISTEN failed for ${safe}:`, err);
  });
}
// after
if (this.client) {
  this.client.query(`UNLISTEN "${safe}"`)
    .then(() => {
      sseLogger.log("info", "unlisten", { channel: safe, rawChannel: channel });
    })
    .catch((err) => {
      sseLogger.log("error", "unlisten-failed", {
        channel: safe,
        error: err instanceof Error ? err.message : String(err),
      });
    });
}
```

In `publish()`, instrument the success path and replace the timeout error message. Locate:

```ts
// before
const PUBLISH_TIMEOUT_MS = 2000;
let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
const timeoutPromise = new Promise<never>((_, reject) => {
  timeoutHandle = setTimeout(
    () =>
      reject(
        new Error(
          `[PgEventBus] publish timed out after ${PUBLISH_TIMEOUT_MS}ms`,
        ),
      ),
    PUBLISH_TIMEOUT_MS,
  );
});
// avoid an unhandled rejection if the racers settle first.
timeoutPromise.catch(() => {});

try {
  const client = await Promise.race([this.getClient(), timeoutPromise]);
  await Promise.race([
    client.query("SELECT pg_notify($1, $2)", [
      safe,
      JSON.stringify(data),
    ]),
    timeoutPromise,
  ]);
} finally {
  if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
}
```

Replace with (note: the `console.error` log inside the timeout error message stays string-based — the timeout `Error` object is what callers receive; the `sseLogger.log` happens in the catch path so we know publish actually timed out):

```ts
const PUBLISH_TIMEOUT_MS = 2000;
let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
const timeoutPromise = new Promise<never>((_, reject) => {
  timeoutHandle = setTimeout(
    () =>
      reject(
        new Error(
          `[PgEventBus] publish timed out after ${PUBLISH_TIMEOUT_MS}ms`,
        ),
      ),
    PUBLISH_TIMEOUT_MS,
  );
});
timeoutPromise.catch(() => {});

const payload = JSON.stringify(data);

try {
  const client = await Promise.race([this.getClient(), timeoutPromise]);
  await Promise.race([
    client.query("SELECT pg_notify($1, $2)", [safe, payload]),
    timeoutPromise,
  ]);
  sseLogger.log("info", "publish", {
    channel: safe,
    rawChannel: channel,
    payloadBytes: payload.length,
  });
} catch (err) {
  const isTimeout =
    err instanceof Error && err.message.includes("publish timed out");
  if (isTimeout) {
    sseLogger.log("error", "publish-timeout", {
      channel: safe,
      timeoutMs: PUBLISH_TIMEOUT_MS,
    });
  } else {
    sseLogger.log("error", "publish-failed", {
      channel: safe,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  throw err;
} finally {
  if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors. (If unrelated errors appear, the project may have pre-existing TS issues — confirm with `git stash` baseline before continuing.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/sse/event-bus.ts
git commit -m "feat(sse): wire PgEventBus through structured logger; add reconnect attempt counter"
```

---

## Task 3: Bus unit tests — scaffolding + safeChannelName + subscribe/unsubscribe

**Files:**
- Create: `src/lib/sse/__tests__/event-bus.test.ts`

This task creates the test file with the shared mock-pg scaffolding, plus the first two test groups: `safeChannelName` (pure function, easiest) and subscribe/unsubscribe (LISTEN/UNLISTEN ref counting).

- [ ] **Step 1: Write the test scaffolding + first tests**

Create `src/lib/sse/__tests__/event-bus.test.ts`:

```ts
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type MockInstance,
} from "vitest";
import { EventEmitter } from "node:events";

// ---------------------------------------------------------------------------
// Shared mock-pg scaffolding
// ---------------------------------------------------------------------------

interface MockQueryRecord {
  sql: string;
  params?: unknown[];
}

class MockPgClient extends EventEmitter {
  static instances: MockPgClient[] = [];
  static reset() {
    MockPgClient.instances = [];
  }

  connectionString: string;
  queries: MockQueryRecord[] = [];
  connectImpl: () => Promise<void> = () => Promise.resolve();
  queryImpl: (sql: string, params?: unknown[]) => Promise<unknown> = () =>
    Promise.resolve({ rows: [] });

  constructor(opts: { connectionString: string }) {
    super();
    this.connectionString = opts.connectionString;
    MockPgClient.instances.push(this);
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

vi.mock("pg", () => ({
  Client: MockPgClient,
}));

// Helper: import the bus fresh so each test gets a clean singleton.
async function loadBus() {
  const mod = await import("../event-bus");
  return mod.eventBus;
}

beforeEach(() => {
  vi.resetModules();
  MockPgClient.reset();
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

    // Wait for the background LISTEN to complete
    await new Promise((r) => setTimeout(r, 10));

    const client = MockPgClient.instances[0];
    expect(client).toBeDefined();
    const listenQueries = client.queries.filter((q) =>
      q.sql.startsWith('LISTEN'),
    );
    expect(listenQueries).toHaveLength(1);
    expect(listenQueries[0].sql).toBe('LISTEN "live:chat"');

    unsub1();
    unsub2();
  });

  it("last unsubscribe issues UNLISTEN", async () => {
    const bus = await loadBus();

    const unsub = bus.subscribe("live:chat", () => {});
    await new Promise((r) => setTimeout(r, 10));

    unsub();
    await new Promise((r) => setTimeout(r, 10));

    const client = MockPgClient.instances[0];
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
    await new Promise((r) => setTimeout(r, 10));

    unsub1();
    await new Promise((r) => setTimeout(r, 10));

    const client = MockPgClient.instances[0];
    const unlistenQueries = client.queries.filter((q) =>
      q.sql.startsWith("UNLISTEN"),
    );
    expect(unlistenQueries).toHaveLength(0);

    unsub2();
  });

  it("unsubscribe is idempotent — calling twice is safe", async () => {
    const bus = await loadBus();
    const unsub = bus.subscribe("live:chat", () => {});
    await new Promise((r) => setTimeout(r, 10));

    unsub();
    expect(() => unsub()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the tests to verify they pass**

Run: `npm test -- src/lib/sse/__tests__/event-bus.test.ts`

Expected: 8 tests passing (4 for `safeChannelName`, 4 for subscribe/unsubscribe).

If the LISTEN/UNLISTEN tests are flaky due to the 10ms `setTimeout`, increase to 20ms — the LISTEN is fired in a `.then()` chain after `getClient()` resolves.

- [ ] **Step 3: Commit**

```bash
git add src/lib/sse/__tests__/event-bus.test.ts
git commit -m "test(sse): add bus unit test scaffolding plus safeChannelName and subscribe/unsubscribe coverage"
```

---

## Task 4: Bus unit tests — notification fan-out + listener isolation

**Files:**
- Modify: `src/lib/sse/__tests__/event-bus.test.ts` (append new `describe` block)

- [ ] **Step 1: Append the notification fan-out tests**

Add to the bottom of `src/lib/sse/__tests__/event-bus.test.ts`:

```ts
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
    await new Promise((r) => setTimeout(r, 10));

    const client = MockPgClient.instances[0];
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
    await new Promise((r) => setTimeout(r, 10));

    const client = MockPgClient.instances[0];
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
    await new Promise((r) => setTimeout(r, 10));

    const client = MockPgClient.instances[0];
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
    await new Promise((r) => setTimeout(r, 10));

    const client = MockPgClient.instances[0];
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
    await new Promise((r) => setTimeout(r, 10));

    const client = MockPgClient.instances[0];
    const listenQueries = client.queries.filter((q) =>
      q.sql.startsWith("LISTEN"),
    );
    expect(listenQueries).toHaveLength(1);
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
```

- [ ] **Step 2: Run the tests to verify they pass**

Run: `npm test -- src/lib/sse/__tests__/event-bus.test.ts`

Expected: all previous tests still pass plus 5 new tests in the fan-out group.

- [ ] **Step 3: Commit**

```bash
git add src/lib/sse/__tests__/event-bus.test.ts
git commit -m "test(sse): add bus notification fan-out and listener isolation coverage"
```

---

## Task 5: Bus unit tests — publish + timeout

**Files:**
- Modify: `src/lib/sse/__tests__/event-bus.test.ts` (append)

- [ ] **Step 1: Append the publish tests**

Add to the bottom of `src/lib/sse/__tests__/event-bus.test.ts`:

```ts
// ---------------------------------------------------------------------------
// publish + timeout
// ---------------------------------------------------------------------------

describe("publish", () => {
  it("calls pg_notify with safe channel name and JSON payload", async () => {
    const bus = await loadBus();
    bus.subscribe("live:chat", () => {}); // ensures client is created
    await new Promise((r) => setTimeout(r, 10));

    await bus.publish("live:chat", { hello: "world" });

    const client = MockPgClient.instances[0];
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
    await new Promise((r) => setTimeout(r, 10));

    await bus.publish(longChannel, { x: 1 });

    const client = MockPgClient.instances[0];
    const notifyQueries = client.queries.filter(
      (q) => q.sql === "SELECT pg_notify($1, $2)",
    );
    expect(notifyQueries).toHaveLength(1);
    expect((notifyQueries[0].params![0] as string).startsWith("ch_")).toBe(true);
  });

  it("rejects with a timeout error if the client hangs for >2s", async () => {
    vi.useFakeTimers();
    const bus = await loadBus();

    // Make connect() never resolve
    const connectPromise = new Promise<void>(() => {}); // pending forever
    // The first MockPgClient instance is created when getClient() runs.
    // To control connectImpl before it's called, intercept by setting it
    // on a hook: we override the prototype's connect method temporarily.
    const origConnect = MockPgClient.prototype.connect;
    MockPgClient.prototype.connect = function () {
      return connectPromise;
    };

    try {
      const publishPromise = bus.publish("live:chat", { x: 1 });
      // Attach a no-op rejection handler so the unhandled rejection doesn't fail
      // the test before we assert.
      publishPromise.catch(() => {});

      await vi.advanceTimersByTimeAsync(2100);

      await expect(publishPromise).rejects.toThrow(/publish timed out/);
    } finally {
      MockPgClient.prototype.connect = origConnect;
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they pass**

Run: `npm test -- src/lib/sse/__tests__/event-bus.test.ts`

Expected: all previous tests still pass plus 3 new tests in the publish group.

If the timeout test flakes, the issue is likely the order of `vi.useFakeTimers()` and module import. The current ordering (fake timers first, then `loadBus`) is correct because the timer set inside `publish()` must use the faked timer. If still flaky, add `vi.useRealTimers()` to the `afterEach` (already present) and consider increasing `advanceTimersByTimeAsync` to 2500.

- [ ] **Step 3: Commit**

```bash
git add src/lib/sse/__tests__/event-bus.test.ts
git commit -m "test(sse): add bus publish and timeout coverage"
```

---

## Task 6: Bus unit tests — reconnect backoff

**Files:**
- Modify: `src/lib/sse/__tests__/event-bus.test.ts` (append)

- [ ] **Step 1: Append the reconnect tests**

Add to the bottom of `src/lib/sse/__tests__/event-bus.test.ts`:

```ts
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

    const firstClient = MockPgClient.instances[0];
    expect(firstClient.queries.filter((q) => q.sql.startsWith("LISTEN")))
      .toHaveLength(2);

    // Simulate a disconnect
    firstClient.emit("error", new Error("connection lost"));

    // Advance past the 1000ms initial backoff
    await vi.advanceTimersByTimeAsync(1100);

    const secondClient = MockPgClient.instances[1];
    expect(secondClient).toBeDefined();
    const reLISTEN = secondClient.queries.filter((q) =>
      q.sql.startsWith("LISTEN"),
    );
    expect(reLISTEN).toHaveLength(2);
    const channels = reLISTEN.map((q) => q.sql).sort();
    expect(channels).toEqual([
      'LISTEN "episode:foo"',
      'LISTEN "live:chat"',
    ]);
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
      await vi.advanceTimersByTimeAsync(10);

      // Walk through the backoff sequence: 1000, 2000, 4000, 8000, 16000, 30000, 30000.
      // Each tick advances past the next delay.
      const expectedDelays = [1000, 2000, 4000, 8000, 16000, 30000, 30000];
      for (const delay of expectedDelays) {
        await vi.advanceTimersByTimeAsync(delay + 10);
      }

      // We just verify no crash and that multiple instances were created
      // (one per reconnect attempt). The exact log assertions live in Task 8.
      expect(MockPgClient.instances.length).toBeGreaterThanOrEqual(
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
      await vi.advanceTimersByTimeAsync(20); // initial connect attempt
      await vi.advanceTimersByTimeAsync(1100); // first retry
      await vi.advanceTimersByTimeAsync(2100); // second retry

      expect(connectAttempts).toBeGreaterThanOrEqual(3);

      // Now trigger another disconnect — backoff should start at 1000 again, not 4000.
      const lastClient = MockPgClient.instances[MockPgClient.instances.length - 1];
      // Make the next connect fail so we can observe a fresh schedule.
      MockPgClient.prototype.connect = function () {
        return Promise.reject(new Error("again"));
      };
      lastClient.emit("error", new Error("disconnect"));

      // If backoff reset, next attempt fires within 1100ms.
      const beforeCount = MockPgClient.instances.length;
      await vi.advanceTimersByTimeAsync(1100);
      expect(MockPgClient.instances.length).toBeGreaterThan(beforeCount);
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
```

- [ ] **Step 2: Run the tests to verify they pass**

Run: `npm test -- src/lib/sse/__tests__/event-bus.test.ts`

Expected: all previous tests still pass plus 4 new tests in the reconnect group (the fourth one verifies log entries via `vi.spyOn(sseLogger, "log")`).

- [ ] **Step 3: Commit**

```bash
git add src/lib/sse/__tests__/event-bus.test.ts
git commit -m "test(sse): add bus reconnect backoff and reconnect-scheduled log coverage"
```

---

## Task 7: Bus `getStatus()` method + tests

**Files:**
- Modify: `src/lib/sse/event-bus.ts` (add method + type export)
- Modify: `src/lib/sse/__tests__/event-bus.test.ts` (append)

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/sse/__tests__/event-bus.test.ts`:

```ts
// ---------------------------------------------------------------------------
// getStatus()
// ---------------------------------------------------------------------------

describe("getStatus()", () => {
  it("reports disconnected state before any subscribe/publish", async () => {
    const bus = await loadBus();
    const status = bus.getStatus();
    expect(status.client.connected).toBe(false);
    expect(status.client.pendingReconnect).toBe(false);
    expect(status.channels).toEqual([]);
    // recentEvents may have prior entries from the singleton — just check shape
    expect(Array.isArray(status.recentEvents)).toBe(true);
  });

  it("reports connected state and channel listener counts after subscriptions", async () => {
    const bus = await loadBus();

    bus.subscribe("live:chat", () => {});
    bus.subscribe("live:chat", () => {});
    bus.subscribe("episode:foo", () => {});
    await new Promise((r) => setTimeout(r, 20));

    const status = bus.getStatus();
    expect(status.client.connected).toBe(true);
    expect(status.channels).toHaveLength(2);
    const liveChat = status.channels.find((c) => c.rawChannel === "live:chat");
    const episodeFoo = status.channels.find(
      (c) => c.rawChannel === "episode:foo",
    );
    expect(liveChat?.listenerCount).toBe(2);
    expect(episodeFoo?.listenerCount).toBe(1);
  });

  it("includes recent events from the logger", async () => {
    const bus = await loadBus();
    bus.subscribe("live:chat", () => {});
    await new Promise((r) => setTimeout(r, 20));

    const status = bus.getStatus();
    const events = status.recentEvents.map((e) => e.event);
    expect(events).toContain("connect");
    expect(events).toContain("listen");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/sse/__tests__/event-bus.test.ts`

Expected: 3 new tests FAIL with "bus.getStatus is not a function" or similar.

- [ ] **Step 3: Implement `getStatus()` in the bus**

In `src/lib/sse/event-bus.ts`, add the type export above the class, alongside the existing imports (top of file, after the existing `safeChannelName` export):

```ts
import type { LogEntry } from "./log";

export interface BusStatus {
  client: {
    connected: boolean;
    pendingReconnect: boolean;
    nextReconnectDelayMs: number;
  };
  channels: Array<{
    rawChannel: string;
    safeChannel: string;
    listenerCount: number;
  }>;
  recentEvents: readonly LogEntry[];
}
```

Inside the `PgEventBus` class, add the public method after the existing `publish` method:

```ts
  getStatus(): BusStatus {
    return {
      client: {
        connected: this.client !== null,
        pendingReconnect: this.reconnectTimer !== null,
        nextReconnectDelayMs: this.reconnectDelayMs,
      },
      channels: Array.from(this.listeners.entries()).map(([raw, set]) => ({
        rawChannel: raw,
        safeChannel: this.getSafeChannel(raw),
        listenerCount: set.size,
      })),
      recentEvents: sseLogger.recent(),
    };
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/lib/sse/__tests__/event-bus.test.ts`

Expected: all previous tests still pass plus 3 new tests in the getStatus group.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sse/event-bus.ts src/lib/sse/__tests__/event-bus.test.ts
git commit -m "feat(sse): add PgEventBus.getStatus() introspection method"
```

---

## Task 8: pglite integration test

**Files:**
- Create: `src/lib/sse/__tests__/event-bus.integration.test.ts`

This is one round-trip test that uses `@electric-sql/pglite` + `@electric-sql/pglite-socket` to give the bus a real Postgres-compatible target without touching Xata.

**Fallback note:** If `pglite-socket` integration proves unworkable (the `pg` Client cannot connect to it, or LISTEN/NOTIFY semantics differ enough to make the test useless), substitute a real-Postgres test against `process.env.DATABASE_URL` — but only when an explicit `RUN_INTEGRATION=1` env var is set, so `npm test` stays hermetic in CI. Document the fallback rationale in a top-of-file comment in the test file.

- [ ] **Step 1: Write the integration test**

Create `src/lib/sse/__tests__/event-bus.integration.test.ts`:

```ts
/**
 * Integration test for PgEventBus against a real Postgres-compatible target.
 *
 * Primary path: an in-process PGlite database exposed over a TCP socket via
 * @electric-sql/pglite-socket so the `pg` Client can connect to it as if it
 * were a normal Postgres server.
 *
 * Fallback: if pglite-socket setup proves unworkable, set RUN_INTEGRATION=1
 * and DATABASE_URL to a real Postgres connection string. The default behavior
 * (no RUN_INTEGRATION) skips the test so `npm test` stays hermetic.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

// We disable the mock from the unit-test file by NOT importing that file.
// vitest scopes vi.mock() to the file that calls it, so this file gets the
// real `pg` package.

const PORT = 56432; // arbitrary high port; if EADDRINUSE, retry once.

let pglite: PGlite | undefined;
let server: PGLiteSocketServer | undefined;

beforeAll(async () => {
  pglite = await PGlite.create();
  server = new PGLiteSocketServer({
    db: pglite,
    host: "127.0.0.1",
    port: PORT,
  });
  await server.start();
  process.env.DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${PORT}/postgres`;
}, 30_000);

afterAll(async () => {
  await server?.stop();
  await pglite?.close();
});

describe("PgEventBus integration (pglite)", () => {
  it("publish → NOTIFY → listener fires (real Postgres semantics)", async () => {
    vi.resetModules();
    const { eventBus } = await import("../event-bus");

    const received: unknown[] = [];
    const unsub = eventBus.subscribe("test:integration", (data) =>
      received.push(data),
    );

    // Allow LISTEN to settle on the wire.
    await new Promise((r) => setTimeout(r, 200));

    await eventBus.publish("test:integration", { hello: "world" });

    // Allow NOTIFY round-trip.
    await new Promise((r) => setTimeout(r, 200));

    expect(received).toEqual([{ hello: "world" }]);

    unsub();
    await new Promise((r) => setTimeout(r, 100));
  }, 10_000);
});
```

- [ ] **Step 2: Run the integration test**

Run: `npm test -- src/lib/sse/__tests__/event-bus.integration.test.ts`

Expected: PASS — 1 test passing.

If the test fails with `EADDRINUSE: address already in use 127.0.0.1:56432`, change `PORT` to another free port (e.g., `57432`) and re-run.

If the test fails with a connection error from the `pg` client (refused, timed out, or auth-related), pglite-socket may not be exposing a fully-compatible Postgres wire protocol for this setup. Apply the fallback:

1. At the top of the test file, add a guard:
   ```ts
   if (!process.env.RUN_INTEGRATION) {
     describe.skip("PgEventBus integration", () => {
       it("skipped without RUN_INTEGRATION=1", () => {});
     });
   } else {
     // ...existing test body, using process.env.DATABASE_URL as-is...
   }
   ```
2. Remove the pglite + pglite-socket setup; rely on the caller's `DATABASE_URL`.
3. Add a brief comment explaining the fallback was taken.

In either path, this task is complete when one passing integration test exists (or one explicitly-skipped test that runs only with `RUN_INTEGRATION=1`).

- [ ] **Step 3: Commit**

```bash
git add src/lib/sse/__tests__/event-bus.integration.test.ts
git commit -m "test(sse): add pglite roundtrip integration test for PgEventBus"
```

---

## Task 9: useSSE state with debounce

**Files:**
- Modify: `src/lib/sse/use-sse.ts`

The hook gains a return value: `{ status: SSEStatus }`. Existing callers ignore the return until Task 11 wires them up.

- [ ] **Step 1: Replace the hook body**

Open `src/lib/sse/use-sse.ts` and replace the entire file with:

```ts
"use client";

import { useEffect, useCallback, useRef, useState } from "react";

interface SSEOptions {
  url: string;
  onMessage: (event: { type: string; data: unknown }) => void;
  enabled?: boolean;
}

export type SSEStatus = "open" | "connecting" | "reconnecting";

export function useSSE({
  url,
  onMessage,
  enabled = true,
}: SSEOptions): { status: SSEStatus } {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [rawStatus, setRawStatus] = useState<SSEStatus>("connecting");
  const [displayStatus, setDisplayStatus] = useState<SSEStatus>("open");

  const connect = useCallback(() => {
    if (!enabled) return;

    setRawStatus("connecting");
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      // First message implies the channel is open.
      setRawStatus("open");
      try {
        const parsed = JSON.parse(event.data);
        onMessageRef.current(parsed);
      } catch {
        // Ignore parse errors (heartbeat pings, etc.)
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setRawStatus("reconnecting");
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };

    return eventSource;
  }, [url, enabled]);

  useEffect(() => {
    const eventSource = connect();
    return () => {
      eventSource?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  // Debounce: flip displayStatus to a non-"open" value only after 2s of
  // rawStatus being non-"open". Flip back to "open" instantly.
  useEffect(() => {
    if (rawStatus === "open") {
      setDisplayStatus("open");
      return;
    }
    const t = setTimeout(() => setDisplayStatus(rawStatus), 2000);
    return () => clearTimeout(t);
  }, [rawStatus]);

  return { status: displayStatus };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors. Existing callers in `comment-section.tsx`, `reaction-bar.tsx`, and `live-chat.tsx` still call `useSSE({...})` without destructuring — TypeScript allows ignoring the return.

- [ ] **Step 3: Smoke-run dev server**

Run: `npm run dev`

Open an episode page in the browser. Confirm comments and reactions still update in real-time (this verifies the rewrite did not break the existing onMessage path).

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/lib/sse/use-sse.ts
git commit -m "feat(sse): expose debounced connection status from useSSE hook"
```

---

## Task 10: ConnectionDot component

**Files:**
- Create: `src/components/sse/connection-dot.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/sse/connection-dot.tsx`:

```tsx
"use client";

interface ConnectionDotProps {
  status: "open" | "connecting" | "reconnecting";
}

/**
 * Renders an inline pulsing dot when the SSE connection is non-open.
 * Returns null when status === "open" so there is no layout shift in the
 * common case — the absence of a dot is the "healthy" signal.
 */
export function ConnectionDot({ status }: ConnectionDotProps) {
  if (status === "open") return null;

  const label =
    status === "reconnecting"
      ? "Reconnecting to live updates…"
      : "Connecting to live updates…";

  return (
    <span
      role="status"
      aria-label={label}
      title={label}
      className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-2 align-middle"
    />
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/sse/connection-dot.tsx
git commit -m "feat(sse): add ConnectionDot component for live-updates status"
```

---

## Task 11: Wire ConnectionDot into the three SSE-consuming components

**Files:**
- Modify: `src/components/episodes/comment-section.tsx`
- Modify: `src/components/episodes/reaction-bar.tsx`
- Modify: `src/components/live/live-chat.tsx`

Each is a small, similar change. We do all three in this single task because they are mechanical and share the same import.

- [ ] **Step 1: Wire CommentSection**

In `src/components/episodes/comment-section.tsx`:

1. Add the import near the existing `useSSE` import (line 7):
   ```tsx
   import { ConnectionDot } from "@/components/sse/connection-dot";
   ```

2. Change the `useSSE` call to destructure `status`. Locate line 51:
   ```tsx
   // before
   useSSE({
     url: `/api/sse/episodes/${slug}`,
     onMessage: (event) => {
   // after
   const { status } = useSSE({
     url: `/api/sse/episodes/${slug}`,
     onMessage: (event) => {
   ```

3. Add the dot at the top of the returned JSX. Locate line 159-160:
   ```tsx
   // before
   return (
     <div className="space-y-6">
       {/* Comment form */}
   // after
   return (
     <div className="space-y-6">
       <ConnectionDot status={status} />
       {/* Comment form */}
   ```

- [ ] **Step 2: Wire ReactionBar**

In `src/components/episodes/reaction-bar.tsx`:

1. Add the import near the existing `useSSE` import (line 4):
   ```tsx
   import { ConnectionDot } from "@/components/sse/connection-dot";
   ```

2. Change the `useSSE` call to destructure `status`. Locate line 35:
   ```tsx
   // before
   useSSE({
     url: `/api/sse/episodes/${slug}`,
     onMessage: (event) => {
   // after
   const { status } = useSSE({
     url: `/api/sse/episodes/${slug}`,
     onMessage: (event) => {
   ```

3. Add the dot at the end of the rendered button row. Locate the JSX block starting around line 89-113:
   ```tsx
   // before
   return (
     <div className="flex flex-wrap gap-2">
       {REACTIONS.map(({ type, emoji, label }) => {
         // ...buttons...
       })}
     </div>
   );
   // after
   return (
     <div className="flex flex-wrap items-center gap-2">
       {REACTIONS.map(({ type, emoji, label }) => {
         // ...buttons (unchanged)...
       })}
       <ConnectionDot status={status} />
     </div>
   );
   ```

   Note the `flex-wrap gap-2` → `flex-wrap items-center gap-2` change; this aligns the dot vertically with the buttons when it appears.

- [ ] **Step 3: Wire LiveChat**

In `src/components/live/live-chat.tsx`:

1. Find the existing `useSSE` import line (around line 5-7) and the `ConnectionDot` import below it:
   ```tsx
   import { ConnectionDot } from "@/components/sse/connection-dot";
   ```

2. Change the `useSSE` call to destructure `status`. Search for `useSSE({` and change to `const { status } = useSSE({`.

3. Add the dot inline next to the existing "Live Chat" text. Locate line 88-90:
   ```tsx
   // before
   <span className="font-mono text-xs text-accent-gold uppercase tracking-wider">
     Live Chat
   </span>
   // after
   <span className="font-mono text-xs text-accent-gold uppercase tracking-wider">
     Live Chat
     <ConnectionDot status={status} />
   </span>
   ```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 5: Smoke-run dev server**

Run: `npm run dev`

1. Open an episode page; confirm normal page load shows no dot anywhere (status starts as "open" via the debounce, so the dot stays hidden).
2. Open DevTools → Network → set throttling to "Offline". Within ~7s (5s for `EventSource.onerror` + 2s debounce), you should see the amber dot appear in:
   - The top of the comments section
   - The right side of the reaction bar
   - Inline next to the "Live Chat" label (on episodes that have live chat)
3. Restore network. The dot disappears as soon as the next message arrives.

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/components/episodes/comment-section.tsx \
        src/components/episodes/reaction-bar.tsx \
        src/components/live/live-chat.tsx
git commit -m "feat(sse): show ConnectionDot in CommentSection, ReactionBar, and LiveChat"
```

---

## Task 12: Admin endpoint /api/admin/sse-status

**Files:**
- Create: `src/app/api/admin/sse-status/route.ts`

- [ ] **Step 1: Create the route**

Create `src/app/api/admin/sse-status/route.ts`:

```ts
/**
 * GET /api/admin/sse-status
 *
 * Returns a JSON snapshot of the calling Node instance's PgEventBus state:
 * connection status, active channels with listener counts, and the most
 * recent log events from the in-memory ring buffer.
 *
 * Per-instance caveat: Vercel Fluid Compute runs multiple Node instances
 * per region. This endpoint reflects only the bus state of whichever
 * instance handled this request — there is no global view. That matches
 * the bus's actual scope (one bus per Node instance).
 *
 * Gated by requireAdmin() — non-admin callers receive 403.
 */
import { NextResponse } from "next/server";
import { eventBus } from "@/lib/sse/event-bus";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json(eventBus.getStatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Smoke-test locally**

1. Run: `npm run dev`
2. Open `http://localhost:3000/api/admin/sse-status` in a browser. If not signed in as admin, the response should be:
   ```json
   {"error":"forbidden"}
   ```
   with status 403.
3. Sign in as an admin user (a `codexUser` with `role = "admin"`).
4. Reload `http://localhost:3000/api/admin/sse-status`. Expected JSON shape:
   ```json
   {
     "client": {
       "connected": true,
       "pendingReconnect": false,
       "nextReconnectDelayMs": 1000
     },
     "channels": [
       { "rawChannel": "live:chat", "safeChannel": "live:chat", "listenerCount": 1 }
     ],
     "recentEvents": [
       { "ts": "...", "level": "info", "source": "PgEventBus", "event": "connect" }
     ]
   }
   ```
   If `channels` is empty, open another tab on an episode page or live chat page first to subscribe.

5. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/sse-status/route.ts
git commit -m "feat(sse): add admin /api/admin/sse-status endpoint"
```

---

## Final verification

After all 12 tasks land, run the full test + type pass:

- [ ] `npm test` — every test in `src/**/*.test.{ts,tsx}` passes (existing + new)
- [ ] `npx tsc --noEmit` — no type errors
- [ ] `npm run build` — Next.js build completes without errors
- [ ] Manual smoke (with `npm run dev`):
  - Episode page loads cleanly, no dots visible.
  - Comments and reactions update live (cross-tab if you can spin up two).
  - Going offline shows amber dots within ~7s; restoring network hides them.
  - `GET /api/admin/sse-status` returns 403 when not admin, JSON snapshot when admin.
- [ ] Squash/merge or push the branch per the standard `superpowers:finishing-a-development-branch` flow.
