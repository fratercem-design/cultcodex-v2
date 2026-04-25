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
});
