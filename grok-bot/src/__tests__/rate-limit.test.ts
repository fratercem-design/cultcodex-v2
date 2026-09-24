import { describe, expect, it } from "vitest";
import { RateLimiter } from "../lib/rate-limit.js";

describe("RateLimiter", () => {
  it("allows a burst, then asks callers to wait, then refills", () => {
    let now = 0;
    const r = new RateLimiter(3, () => now);
    expect([r.take("u"), r.take("u"), r.take("u")]).toEqual([0, 0, 0]);
    expect(r.take("u")).toBe(20_000);
    expect(r.take("other")).toBe(0);
    now = 20_000;
    expect(r.take("u")).toBe(0);
  });
});
