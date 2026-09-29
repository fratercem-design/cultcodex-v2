import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// The Transmission Kit branch of the Stripe webhook: a paid kit session emails
// the owner and the buyer, and an email failure never fails the webhook.

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  eventCreate: vi.fn(),
  subRetrieve: vi.fn(),
  updateMany: vi.fn(),
  adminEmail: vi.fn(),
  buyerEmail: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mocks.constructEvent },
    subscriptions: { retrieve: mocks.subRetrieve },
  }),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    stripeWebhookEvent: { create: mocks.eventCreate, delete: vi.fn() },
    codexUser: { updateMany: mocks.updateMany, findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/queries/credit-purchases", () => ({ grantPurchasedCredits: vi.fn() }));
vi.mock("@/lib/notifications", () => ({
  sendInitiateWelcomeEmail: vi.fn(),
  sendOracleWelcomeEmail: vi.fn(),
  sendKitOrderAdminEmail: mocks.adminEmail,
  sendKitOrderBuyerEmail: mocks.buyerEmail,
}));

import { POST } from "./route";

function kitEvent(session: Record<string, unknown> = {}) {
  return {
    id: "evt_kit",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_kit",
        mode: "payment",
        payment_status: "paid",
        amount_total: 1900,
        customer_details: { email: "reader@example.com" },
        metadata: { kind: "kit", kitPlan: "single", replayUrl: "https://youtube.com/live/abc" },
        ...session,
      },
    },
  };
}

function deliver(): Promise<Response> {
  return POST(
    new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=stub" },
      body: "{}",
    }),
  );
}

const expectedOrder = {
  buyerEmail: "reader@example.com",
  planName: "Single Kit",
  amount: "$19.00",
  replayUrl: "https://youtube.com/live/abc",
  stripeSessionId: "cs_test_kit",
  recurring: false,
};

describe("webhook: Transmission Kit order", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    for (const f of Object.values(mocks)) f.mockReset();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    delete process.env.KIT_ADMIN_EMAIL;
    mocks.eventCreate.mockResolvedValue({});
    mocks.adminEmail.mockResolvedValue(undefined);
    mocks.buyerEmail.mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("emails the owner and the buyer for a paid one-time kit", async () => {
    mocks.constructEvent.mockReturnValue(kitEvent());
    const res = await deliver();
    expect(res.status).toBe(200);
    expect(mocks.adminEmail).toHaveBeenCalledWith(expectedOrder, "psychetarotchannel@gmail.com");
    expect(mocks.buyerEmail).toHaveBeenCalledWith(expectedOrder, "psychetarotchannel@gmail.com");
  });

  it("sends the owner copy to KIT_ADMIN_EMAIL when set", async () => {
    process.env.KIT_ADMIN_EMAIL = "orders@example.com";
    mocks.constructEvent.mockReturnValue(kitEvent());
    await deliver();
    expect(mocks.adminEmail).toHaveBeenCalledWith(expectedOrder, "orders@example.com");
  });

  it("still returns 200 when an email fails", async () => {
    mocks.adminEmail.mockRejectedValue(new Error("resend down"));
    mocks.constructEvent.mockReturnValue(kitEvent());
    const res = await deliver();
    expect(res.status).toBe(200);
    expect(mocks.buyerEmail).toHaveBeenCalled();
  });

  it("handles a monthly kit subscription without touching member tiers", async () => {
    mocks.subRetrieve.mockResolvedValue({ id: "sub_kit", status: "active", metadata: {}, items: { data: [] } });
    mocks.updateMany.mockResolvedValue({ count: 0 });
    mocks.constructEvent.mockReturnValue(
      kitEvent({
        mode: "subscription",
        customer: "cus_new_kit",
        subscription: "sub_kit",
        amount_total: 7900,
        metadata: { kind: "kit", kitPlan: "monthly", replayUrl: "https://youtube.com/live/abc" },
      }),
    );
    const res = await deliver();
    expect(res.status).toBe(200);
    // The shared subscription branch only ever matches this fresh kit customer.
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { stripeCustomerId: "cus_new_kit" } }));
    expect(mocks.adminEmail).toHaveBeenCalledWith(
      { ...expectedOrder, planName: "Weekly Live", amount: "$79.00", recurring: true },
      "psychetarotchannel@gmail.com",
    );
  });

  it("sends nothing for an unpaid session", async () => {
    mocks.constructEvent.mockReturnValue(kitEvent({ payment_status: "unpaid" }));
    await deliver();
    expect(mocks.adminEmail).not.toHaveBeenCalled();
    expect(mocks.buyerEmail).not.toHaveBeenCalled();
  });

  it("ignores sessions that aren't kit orders", async () => {
    mocks.constructEvent.mockReturnValue(kitEvent({ metadata: { clapNickname: "x" } }));
    await deliver();
    expect(mocks.adminEmail).not.toHaveBeenCalled();
  });
});
