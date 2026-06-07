/**
 * In-memory fixed-window rate limiter.
 *
 * Scope is per-process: adequate for the current single-instance Railway
 * deploy and serves as a cheap guard against runaway/abusive traffic to the
 * paid AI endpoints (Anthropic, OpenAI, ElevenLabs). If the app scales to
 * multiple instances, swap the Map for a Redis/Upstash store — the call
 * sites only depend on the `rateLimit()` signature.
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
  const fwd = req.headers.get("x-forwarded-for");
  const ip =
    fwd?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return `ip:${ip}`;
}
