import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

/**
 * In-memory fixed-window rate limiter.
 *
 * Scope is per-process. On Vercel each serverless instance has its own Map,
 * so this is only a local speed bump. Cost-bearing routes pair it with the
 * PostgreSQL-backed sharedRateLimit() below.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

export interface RateLimitOptions {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/**
 * Consume one unit against `key`. Returns whether the request is allowed
 * plus metadata for Retry-After / rate-limit headers.
 */
export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();

  // Opportunistic sweep of expired buckets so the Map can't grow unbounded.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + opts.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: opts.limit - 1, resetAt, retryAfterSec: 0 };
  }

  if (existing.count >= opts.limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: opts.limit - existing.count,
    resetAt: existing.resetAt,
    retryAfterSec: 0,
  };
}

/**
 * Derive a stable limiter key for a request. Prefers the authenticated user
 * id; falls back to the client IP from proxy headers.
 */
export function clientKey(req: Request, userId?: string | null): string {
  if (userId) return `user:${userId}`;
  // Vercel preserves its own copy even when another proxy in front of Vercel
  // rewrites x-forwarded-for. Prefer that platform-authored value, while
  // retaining the standard headers for local/self-hosted development.
  const fwd =
    req.headers.get("x-vercel-forwarded-for") ||
    req.headers.get("x-forwarded-for");
  const ip =
    fwd?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return `ip:${ip}`;
}

/**
 * Consume a fixed-window limit in PostgreSQL. Unlike `rateLimit`, this counter
 * is shared by every Vercel instance and survives cold starts. Caller keys are
 * hashed before storage so raw IP addresses are not retained in the table.
 * Store failures fail closed on the paid/cost-bearing routes that use this.
 */
export async function sharedRateLimit(
  namespace: string,
  key: string,
  opts: RateLimitOptions
): Promise<RateLimitResult> {
  const now = Date.now();
  const initialResetAt = new Date(now + opts.windowMs);
  const digest = createHash("sha256").update(key).digest("hex").slice(0, 32);
  const bucketKey = `${namespace}:${digest}`;

  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ count: number; resetAt: Date }>>(
      `WITH expired AS (
         DELETE FROM "RateLimitBucket"
         WHERE "resetAt" < NOW() - INTERVAL '1 day'
       )
       INSERT INTO "RateLimitBucket"("key", "count", "resetAt", "updatedAt")
       VALUES($1, 1, $2, NOW())
       ON CONFLICT("key") DO UPDATE SET
         "count" = CASE
           WHEN "RateLimitBucket"."resetAt" <= NOW() THEN 1
           ELSE "RateLimitBucket"."count" + 1
         END,
         "resetAt" = CASE
           WHEN "RateLimitBucket"."resetAt" <= NOW() THEN $2
           ELSE "RateLimitBucket"."resetAt"
         END,
         "updatedAt" = NOW()
       RETURNING "count", "resetAt"`,
      bucketKey,
      initialResetAt
    );
    const count = Number(rows[0]?.count ?? opts.limit + 1);
    const resetAt = rows[0]?.resetAt?.getTime?.() ?? initialResetAt.getTime();
    const ok = count <= opts.limit;
    return {
      ok,
      remaining: ok ? Math.max(0, opts.limit - count) : 0,
      resetAt,
      retryAfterSec: ok ? 0 : Math.max(1, Math.ceil((resetAt - now) / 1000)),
    };
  } catch {
    return {
      ok: false,
      remaining: 0,
      resetAt: initialResetAt.getTime(),
      retryAfterSec: Math.max(1, Math.ceil(opts.windowMs / 1000)),
    };
  }
}
