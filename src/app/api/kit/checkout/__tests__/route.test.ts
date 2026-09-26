import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("@/lib/rate-limit", () => ({
  clientKey: () => "ip:test",
  rateLimit: () => ({ ok: true, retryAfterSec: 0 }),
  sharedRateLimit: async () => ({ ok: true, retryAfterSec: 0 }),
}));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ checkout: { sessions: { create: m.create } } }),
}));

import { POST } from "../route";

const post = (body: unknown) =>
  POST(new Request("https://cultcodex.me/api/kit/checkout", { method: "POST", body: JSON.stringify(body) }));

describe("POST /api/kit/checkout", () => {
  beforeEach(() => {
    m.create.mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the Stripe Checkout URL for a valid order", async () => {
    m.create.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_test_1" });
    const res = await post({ plan: "monthly", email: "a@b.co", replayUrl: "https://youtu.be/x" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://checkout.stripe.com/c/pay/cs_test_1" });
    expect(m.create).toHaveBeenCalledWith(expect.objectContaining({ mode: "subscription", customer_email: "a@b.co" }));
  });

  it("rejects a bad order without calling Stripe", async () => {
    const res = await post({ plan: "single", email: "nope", replayUrl: "https://youtu.be/x" });
    expect(res.status).toBe(400);
    expect(m.create).not.toHaveBeenCalled();
  });

  it("returns a friendly 500 when Stripe fails", async () => {
    m.create.mockRejectedValue(new Error("stripe down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await post({ plan: "single", email: "a@b.co", replayUrl: "https://youtu.be/x" });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Could not start checkout. Try again." });
  });
});
