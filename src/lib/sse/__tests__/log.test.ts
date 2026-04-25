import { describe, it, expect, beforeEach, vi } from "vitest";
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
    expect(new Date(entry.ts).toISOString()).toBe(entry.ts);
  });

  it("ring buffer caps at 50 entries (oldest dropped)", () => {
    for (let i = 0; i < 60; i++) {
      logger.log("info", "publish", { seq: i });
    }
    const entries = logger.recent();
    expect(entries).toHaveLength(50);
    expect(entries[0].seq).toBe(10);
    expect(entries[49].seq).toBe(59);
  });

  it("recent() returns a copy — mutating does not affect the buffer", () => {
    logger.log("info", "connect");
    const first = logger.recent();
    (first as unknown as unknown[]).push({ poison: true });
    const second = logger.recent();
    expect(second).toHaveLength(1);
  });

  it("routes log levels to the correct console method", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      logger.log("info", "connect");
      logger.log("warn", "client-end");
      logger.log("error", "client-error");

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);

      // Each call should pass a JSON string
      expect(typeof logSpy.mock.calls[0][0]).toBe("string");
      expect(JSON.parse(logSpy.mock.calls[0][0]).event).toBe("connect");
      expect(JSON.parse(warnSpy.mock.calls[0][0]).event).toBe("client-end");
      expect(JSON.parse(errorSpy.mock.calls[0][0]).event).toBe("client-error");
    } finally {
      logSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });
});
