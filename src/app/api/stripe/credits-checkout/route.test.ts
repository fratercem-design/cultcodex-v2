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
  prisma: { codexUser: { findUnique: mocks.findUnique, update: mocks.update } },
}));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    checkout: { sessions: { create: mocks.sessionsCreate } },
    customers: { create: mocks.customersCreate },
  }),
}));

import { POST } from "./route";

function request(body: unknown): Request {
  return new Request("http://localhost/api/stripe/credits-checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/stripe/credits-checkout", () => {
  beforeEach(() => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user_1" });
    mocks.findUnique.mockResolvedValue({ email: "i@example.com", stripeCustomerId: "cus_1" });
    mocks.sessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/x" });
    process.env.STRIPE_PRICE_CREDITS_SPARK_ID = "price_spark";
    process.env.STRIPE_PRICE_CREDITS_SURGE_ID = "price_surge";
    process.env.STRIPE_PRICE_CREDITS_FLOOD_ID = "price_flood";
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("returns 401 without a session", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const res = await POST(request({ bundle: "spark" }));
    expect(res.status).toBe(401);
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it("returns 400 for an unknown bundle and never reaches Stripe", async () => {
    const res = await POST(request({ bundle: "mega" }));
    expect(res.status).toBe(400);
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it("returns 400 for a missing bundle", async () => {
    const res = await POST(request({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await POST(request("{not json"));
    expect(res.status).toBe(400);
  });

  it("returns a logged 500 with a request id when the price is not configured", async () => {
    delete process.env.STRIPE_PRICE_CREDITS_FLOOD_ID;
    const res = await POST(request({ bundle: "flood" }));
    const json = (await res.json()) as { error: string; requestId?: string };
    expect(res.status).toBe(500);
    expect(json.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.stringify(json)).not.toContain("STRIPE_PRICE");
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it("creates a one-time payment session stamped with server-side metadata", async () => {
    const res = await POST(request({ bundle: "surge" }));
    const json = (await res.json()) as { url: string };

    expect(res.status).toBe(200);
    expect(json.url).toBe("https://checkout.stripe.com/c/pay/x");
    expect(mocks.sessionsCreate).toHaveBeenCalledTimes(1);
    const arg = mocks.sessionsCreate.mock.calls[0][0];
    expect(arg.mode).toBe("payment");
    expect(arg.customer).toBe("cus_1");
    expect(arg.line_items).toEqual([{ price: "price_surge", quantity: 1 }]);
    expect(arg.metadata).toEqual({
      kind: "credits",
      codexUserId: "user_1",
      bundle: "surge",
      credits: "800",
    });
    expect(arg.success_url).toContain("/cards/packs?credits=granted");
    expect(arg.cancel_url).toContain("/cards/packs");
  });

  it("creates a Stripe customer first when the user has none", async () => {
    mocks.findUnique.mockResolvedValue({ email: "new@example.com", stripeCustomerId: null });
    mocks.customersCreate.mockResolvedValue({ id: "cus_new" });

    const res = await POST(request({ bundle: "spark" }));

    expect(res.status).toBe(200);
    expect(mocks.customersCreate).toHaveBeenCalledWith({
      email: "new@example.com",
      metadata: { codexUserId: "user_1" },
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { stripeCustomerId: "cus_new" },
    });
    expect(mocks.sessionsCreate.mock.calls[0][0].customer).toBe("cus_new");
  });
});
