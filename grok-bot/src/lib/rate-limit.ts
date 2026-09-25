/**
 * Token bucket per key (usually a Discord user id). Each key gets
 * `perMinute` tokens that refill continuously.
 */
export class RateLimiter {
  private readonly buckets = new Map<string, { tokens: number; updatedAt: number }>();

  constructor(
    private readonly perMinute: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Consumes a token. Returns 0 if allowed, otherwise ms until the next token. */
  take(key: string, cost = 1): number {
    const now = this.now();
    const rate = this.perMinute / 60_000;
    const bucket = this.buckets.get(key) ?? { tokens: this.perMinute, updatedAt: now };
    bucket.tokens = Math.min(this.perMinute, bucket.tokens + (now - bucket.updatedAt) * rate);
    bucket.updatedAt = now;
    this.buckets.set(key, bucket);
    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return 0;
    }
    return Math.ceil((cost - bucket.tokens) / rate);
  }
}
