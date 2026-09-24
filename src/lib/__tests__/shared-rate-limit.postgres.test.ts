import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Pool } from "pg";

const databaseUrl = process.env.TEST_DATABASE_URL;
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRawUnsafe: async (sql: string, ...params: unknown[]) => {
      if (!pool) throw new Error("TEST_DATABASE_URL is not configured");
      const result = await pool.query(sql, params);
      return result.rows;
    },
  },
}));

import { sharedRateLimit } from "../rate-limit";

describe.runIf(Boolean(databaseUrl))("sharedRateLimit PostgreSQL integration", () => {
  beforeAll(async () => {
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS "RateLimitBucket" (
        "key" TEXT PRIMARY KEY,
        "count" INTEGER NOT NULL DEFAULT 0,
        "resetAt" TIMESTAMP(3) NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool!.query('CREATE INDEX IF NOT EXISTS "RateLimitBucket_resetAt_idx" ON "RateLimitBucket"("resetAt")');
    await pool!.query('TRUNCATE TABLE "RateLimitBucket"');
  });

  afterAll(async () => {
    await pool!.query('DROP TABLE IF EXISTS "RateLimitBucket"');
    await pool!.end();
  });

  it("atomically permits exactly the configured number under concurrency", async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        sharedRateLimit("concurrency", "ip:203.0.113.8", { limit: 7, windowMs: 60_000 })
      )
    );
    expect(results.filter((result) => result.ok)).toHaveLength(7);
    expect(results.filter((result) => !result.ok)).toHaveLength(13);
  });

  it("keeps namespaces independent", async () => {
    const a = await sharedRateLimit("namespace-a", "user:one", { limit: 1, windowMs: 60_000 });
    const b = await sharedRateLimit("namespace-b", "user:one", { limit: 1, windowMs: 60_000 });
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
  });

  it("resets an expired bucket and removes stale rows without retaining raw IPs", async () => {
    await pool!.query(
      'INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "updatedAt") VALUES ($1, 99, NOW() - INTERVAL \'2 days\', NOW())',
      ["stale-row"],
    );
    const first = await sharedRateLimit("rollover", "ip:198.51.100.22", { limit: 2, windowMs: 50 });
    expect(first.ok).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 75));
    const reset = await sharedRateLimit("rollover", "ip:198.51.100.22", { limit: 2, windowMs: 60_000 });
    expect(reset.ok).toBe(true);

    const stale = await pool!.query('SELECT 1 FROM "RateLimitBucket" WHERE "key" = $1', ["stale-row"]);
    expect(stale.rowCount).toBe(0);
    const rawIp = await pool!.query('SELECT 1 FROM "RateLimitBucket" WHERE "key" LIKE $1', ["%198.51.100.22%"]);
    expect(rawIp.rowCount).toBe(0);
  });
});
