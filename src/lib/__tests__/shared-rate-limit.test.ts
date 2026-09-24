import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ prisma: { $queryRawUnsafe: queryRaw } }));

import { sharedRateLimit } from "../rate-limit";

describe("sharedRateLimit", () => {
  beforeEach(() => queryRaw.mockReset());

  it("returns shared counter metadata without storing the raw caller key", async () => {
    queryRaw.mockResolvedValue([{ count: 2, resetAt: new Date(Date.now() + 30_000) }]);
    const result = await sharedRateLimit("oracle", "ip:203.0.113.42", { limit: 5, windowMs: 60_000 });

    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(3);
    expect(queryRaw.mock.calls[0][1]).not.toContain("203.0.113.42");
    expect(queryRaw.mock.calls[0][0]).toContain('DELETE FROM "RateLimitBucket"');
    expect(queryRaw.mock.calls[0][0]).toContain("INTERVAL '1 day'");
  });

  it("denies calls over the shared limit", async () => {
    queryRaw.mockResolvedValue([{ count: 6, resetAt: new Date(Date.now() + 30_000) }]);
    const result = await sharedRateLimit("oracle", "user:one", { limit: 5, windowMs: 60_000 });

    expect(result.ok).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSec).toBeGreaterThan(0);
  });

  it("fails closed when the shared store is unavailable", async () => {
    queryRaw.mockImplementationOnce(() => {
      throw new Error("database unavailable");
    });
    const result = await sharedRateLimit("oracle", "user:one", { limit: 5, windowMs: 60_000 });

    expect(result.ok).toBe(false);
    expect(result.retryAfterSec).toBe(60);
  });
});
