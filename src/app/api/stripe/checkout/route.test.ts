import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  sessionsCreate: vi.fn(),
  customersCreate: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/db", () => ({
  prisma: {
    codexUser: { findUnique: mocks.findUnique, update: mocks.update },
  },
}));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    checkout: { sessions: { create: mocks.sessionsCreate } },
    customers: { create: mocks.customersCreate },
  }),
}));

import { POST } from "./route";

/** Build a POST Request. `undefined` body means "no body at all" (legacy client). */
function request(body?: unknown): Request {
  return new Request("http://localhost/api/stripe/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    ...(body === undefined
      ? {}
      : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  });
}

describe("POST /api/stripe/checkout", () => {
  beforeEach(() => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user_1" });
    mocks.findUnique.mockResolvedValue({
      email: "initiate@example.com",
      stripeCustomerId: "cus_existing",
    });
    mocks.sessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/test" });
    process.env.STRIPE_PRICE_ACCESS_ID = "price_access_month";
    process.env.STRIPE_PRICE_SYSTEM_ID = "price_system_month";
    process.env.STRIPE_PRICE_ACCESS_ANNUAL_ID = "price_access_year";
    process.env.STRIPE_PRICE_ID = "price_legacy";
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const res = await POST(request({ tier: "access" }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Not authenticated" });
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  // The regression this PR exists for: an unrecognized tier used to be ignored
  // and silently fell through to the legacy STRIPE_PRICE_ID, charging the wrong
  // amount. "initiate"/"oracle" are the tiers' *display* names, so they are a
  // realistic typo for a caller to make.
  it.each(["initiate", "oracle", "bogus", "", "ACCESS"])(
    "rejects unrecognized tier %j with 400 instead of falling back to the legacy price",
    async (tier) => {
      const res = await POST(request({ tier }));

      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toMatchObject({ error: expect.stringContaining("tier") });
      expect(mocks.sessionsCreate).not.toHaveBeenCalled();
    }
  );

  it("rejects a non-string tier with 400", async () => {
    const res = await POST(request({ tier: 42 }));

    expect(res.status).toBe(400);
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it("rejects an unrecognized interval with 400", async () => {
    const res = await POST(request({ tier: "access", interval: "weekly" }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining("interval"),
    });
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON with 400, not 500", async () => {
    const res = await POST(request("{ not json"));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid JSON body" });
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it("still accepts an absent body and uses the legacy price (back-compat)", async () => {
    const res = await POST(request());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      url: "https://checkout.stripe.com/c/pay/test",
    });
    expect(mocks.sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: "price_legacy", quantity: 1 }],
      })
    );
  });

  // /subscribe is now a 308 to /premium, so cancelling there would cost an extra hop.
  it("cancels to /premium on both the tier and the legacy path", async () => {
    await POST(request({ tier: "access" }));
    await POST(request());

    for (const call of mocks.sessionsCreate.mock.calls) {
      expect(call[0].cancel_url).toMatch(/\/premium$/);
    }
  });

  it("creates a session for the access tier and returns the hosted url", async () => {
    const res = await POST(request({ tier: "access" }));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { url: string };
    expect(body.url).toBe("https://checkout.stripe.com/c/pay/test");
    expect(mocks.sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_existing",
        mode: "subscription",
        line_items: [{ price: "price_access_month", quantity: 1 }],
        metadata: { codexUserId: "user_1", tier: "access", interval: "month" },
      })
    );
  });

  it("resolves the annual price when interval is year", async () => {
    const res = await POST(request({ tier: "access", interval: "year" }));

    expect(res.status).toBe(200);
    expect(mocks.sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: "price_access_year", quantity: 1 }],
      })
    );
  });

  it("returns 500 with a traceable requestId and no stack trace when Stripe throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.sessionsCreate.mockRejectedValue(new Error("stripe exploded: secret sk_test_abc"));

    const res = await POST(request({ tier: "access" }));

    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string; requestId: string };
    expect(body.error).toBe("Failed to create checkout session");
    expect(body.requestId).toMatch(/^[0-9a-f-]{36}$/);
    // The underlying message must not reach the client.
    expect(JSON.stringify(body)).not.toContain("sk_test_abc");
  });

  it("returns 500 without leaking which env var is missing when the price is unconfigured", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    delete process.env.STRIPE_PRICE_SYSTEM_ID;

    const res = await POST(request({ tier: "system" }));

    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string; requestId: string };
    expect(body.error).toBe("Checkout is temporarily unavailable");
    expect(JSON.stringify(body)).not.toContain("STRIPE_PRICE");
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });
});
