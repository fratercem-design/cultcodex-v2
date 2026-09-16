import { describe, it, expect, vi, afterEach } from "vitest";
import { rateLimit, clientKey } from "../rate-limit";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("rateLimit", () => {
  it("allows requests up to the limit then blocks", () => {
    const key = `test-block-${Math.random()}`;
    const opts = { limit: 3, windowMs: 60_000 };
    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(true);
    const third = rateLimit(key, opts);
    expect(third.ok).toBe(true);
    expect(third.remaining).toBe(0);
    const fourth = rateLimit(key, opts);
    expect(fourth.ok).toBe(false);
    expect(fourth.retryAfterSec).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    vi.useFakeTimers();
    const key = `test-reset-${Math.random()}`;
    const opts = { limit: 1, windowMs: 1_000 };
    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect(rateLimit(key, opts).ok).toBe(true);
  });

  it("tracks distinct keys independently", () => {
    const opts = { limit: 1, windowMs: 60_000 };
    const a = `test-a-${Math.random()}`;
    const b = `test-b-${Math.random()}`;
    expect(rateLimit(a, opts).ok).toBe(true);
    expect(rateLimit(b, opts).ok).toBe(true);
    expect(rateLimit(a, opts).ok).toBe(false);
  });
});

describe("clientKey", () => {
  it("prefers the user id when present", () => {
    const req = new Request("https://x.test");
    expect(clientKey(req, "user-123")).toBe("user:user-123");
  });

  it("falls back to the first x-forwarded-for IP", () => {
    const req = new Request("https://x.test", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(clientKey(req)).toBe("ip:1.2.3.4");
  });

  it("prefers Cloudflare's client IP when the origin secret matches", () => {
    vi.stubEnv("CLOUDFLARE_ORIGIN_SECRET", "test-origin-secret");
    const req = new Request("https://x.test", {
      headers: {
        "x-origin-verify": "test-origin-secret",
        "cf-connecting-ip": "203.0.113.10",
        "fly-client-ip": "198.51.100.7",
      },
    });
    expect(clientKey(req)).toBe("ip:203.0.113.10");
  });

  it("ignores spoofed Cloudflare headers when the origin secret is absent", () => {
    vi.stubEnv("CLOUDFLARE_ORIGIN_SECRET", "test-origin-secret");
    const req = new Request("https://x.test", {
      headers: {
        "x-origin-verify": "wrong-secret",
        "cf-connecting-ip": "203.0.113.10",
        "fly-client-ip": "198.51.100.9",
      },
    });
    expect(clientKey(req)).toBe("ip:198.51.100.9");
  });

  it("accepts IPv6 addresses", () => {
    vi.stubEnv("CLOUDFLARE_ORIGIN_SECRET", "test-origin-secret");
    const req = new Request("https://x.test", {
      headers: {
        "x-origin-verify": "test-origin-secret",
        "cf-connecting-ip": "2001:db8::1",
      },
    });
    expect(clientKey(req)).toBe("ip:2001:db8::1");
  });

  it("puts unidentifiable callers in the documented fail-closed bucket", () => {
    const req = new Request("https://x.test", {
      headers: { "x-forwarded-for": "not-an-ip" },
    });
    expect(clientKey(req)).toBe("ip:unknown");
  });
});
