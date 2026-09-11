import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// The credits branch of the Stripe webhook. Signature verification is
// stubbed (constructEvent returns whatever event the test hands it); what's
// under test is the grant call, the metadata cross-check, and the
// release-dedup-row-then-500 path that lets Stripe retry a failed grant.

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  eventCreate: vi.fn(),
  eventDelete: vi.fn(),
  grant: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ webhooks: { constructEvent: mocks.constructEvent } }),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    stripeWebhookEvent: { create: mocks.eventCreate, delete: mocks.eventDelete },
    codexUser: { updateMany: mocks.updateMany, findFirst: vi.fn() },
    clapHolder: { upsert: vi.fn() },
    clapToken: { create: vi.fn() },
    bookPurchase: { upsert: vi.fn() },
  },
}));
vi.mock("@/lib/queries/credit-purchases", () => ({ grantPurchasedCredits: mocks.grant }));
vi.mock("@/lib/notifications", () => ({
  sendInitiateWelcomeEmail: vi.fn(),
  sendOracleWelcomeEmail: vi.fn(),
}));

import { POST } from "./route";

function creditsEvent(overrides: Partial<Record<string, string>> = {}, id = "evt_1") {
  return {
    id,
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_1",
        mode: "payment",
        amount_total: 699,
        metadata: {
          kind: "credits",
          codexUserId: "user_1",
          bundle: "surge",
          credits: "800",
          ...overrides,
        },
      },
    },
  };
}

function deliver(): Promise<Response> {
  const req = new NextRequest("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": "t=1,v1=stub" },
    body: "{}",
  });
  return POST(req);
}

describe("webhook: Signal Credit bundle grant", () => {
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    mocks.eventCreate.mockResolvedValue({});
    mocks.eventDelete.mockResolvedValue({});
    mocks.grant.mockResolvedValue({ granted: true, credits: 800, balance: 800 });
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("grants the bundle's credits keyed on the session id", async () => {
    mocks.constructEvent.mockReturnValue(creditsEvent());

    const res = await deliver();

    expect(res.status).toBe(200);
    expect(mocks.grant).toHaveBeenCalledTimes(1);
    expect(mocks.grant).toHaveBeenCalledWith({
      userId: "user_1",
      bundle: "surge",
      credits: 800,
      stripeSessionId: "cs_test_1",
      amountCents: 699,
    });
    expect(mocks.eventDelete).not.toHaveBeenCalled();
  });

  it("uses the bundle table's credit count, never the metadata's, and refuses a mismatch", async () => {
    mocks.constructEvent.mockReturnValue(creditsEvent({ credits: "80000" }));

    const res = await deliver();

    expect(res.status).toBe(200); // acknowledged — a retry would carry the same bad metadata
    expect(mocks.grant).not.toHaveBeenCalled();
  });

  it("refuses an unknown bundle", async () => {
    mocks.constructEvent.mockReturnValue(creditsEvent({ bundle: "mega" }));
    const res = await deliver();
    expect(res.status).toBe(200);
    expect(mocks.grant).not.toHaveBeenCalled();
  });

  it("acknowledges a retry after a committed grant without granting again", async () => {
    mocks.constructEvent.mockReturnValue(creditsEvent());
    mocks.grant.mockResolvedValue({ granted: false, reason: "already_granted" });

    const res = await deliver();

    expect(res.status).toBe(200);
    expect(mocks.grant).toHaveBeenCalledTimes(1);
  });

  it("releases the dedup row and returns 500 when the grant fails, so Stripe retries", async () => {
    mocks.constructEvent.mockReturnValue(creditsEvent());
    mocks.grant.mockRejectedValue(new Error("db down"));

    const res = await deliver();

    expect(res.status).toBe(500);
    expect(mocks.eventDelete).toHaveBeenCalledWith({ where: { id: "evt_1" } });
  });

  it("skips a duplicate event id entirely (event-level dedup still first)", async () => {
    mocks.constructEvent.mockReturnValue(creditsEvent());
    const dup = Object.assign(new Error("dup"), { code: "P2002" });
    // Make it look like Prisma's known-request error for the instanceof check.
    const { Prisma } = await import("@/generated/prisma/client");
    Object.setPrototypeOf(dup, Prisma.PrismaClientKnownRequestError.prototype);
    mocks.eventCreate.mockRejectedValue(dup);

    const res = await deliver();
    const json = (await res.json()) as { duplicate?: boolean };

    expect(res.status).toBe(200);
    expect(json.duplicate).toBe(true);
    expect(mocks.grant).not.toHaveBeenCalled();
  });
});
