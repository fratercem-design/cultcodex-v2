import { z } from "zod/v4";
import type Stripe from "stripe";
import { KIT_PLANS, type KitPlan } from "./sample-kit";

/** Promotion code shown on /kit. Create it in the Stripe dashboard ($10 off, max 10 redemptions). */
export const KIT_FOUNDER_CODE = "FOUNDING";

// Stripe caps metadata values at 500 characters.
const MAX_URL_LENGTH = 500;

const orderSchema = z.object({
  plan: z.enum(KIT_PLANS.map((p) => p.id) as [KitPlan["id"], ...KitPlan["id"][]]),
  email: z.email().max(254),
  replayUrl: z
    .url({ protocol: /^https?$/ })
    .max(MAX_URL_LENGTH),
});

export interface KitOrder {
  plan: KitPlan;
  email: string;
  replayUrl: string;
}

export function parseKitOrder(body: unknown): { ok: true; order: KitOrder } | { ok: false; error: string } {
  const raw = (body ?? {}) as Record<string, unknown>;
  const result = orderSchema.safeParse({
    plan: raw.plan,
    email: typeof raw.email === "string" ? raw.email.trim().toLowerCase() : raw.email,
    replayUrl: typeof raw.replayUrl === "string" ? raw.replayUrl.trim() : raw.replayUrl,
  });
  if (!result.success) {
    const field = result.error.issues[0]?.path[0];
    const error =
      field === "email"
        ? "Enter a valid email so we can send your kit."
        : field === "replayUrl"
          ? "Paste the full link to your replay (starting with https://)."
          : "Pick a plan.";
    return { ok: false, error };
  }
  const plan = KIT_PLANS.find((p) => p.id === result.data.plan)!;
  return { ok: true, order: { plan, email: result.data.email, replayUrl: result.data.replayUrl } };
}

/**
 * Checkout Session params for a kit order. Prices are inline (price_data), so
 * nothing has to be created in the Stripe dashboard first.
 *
 * Never pass `customer` here. The shared webhook updates CodexUser tiers by
 * stripeCustomerId on every subscription event; a kit subscription must stay on
 * its own fresh Stripe customer so it can't touch a member's Initiate+/Oracle tier.
 */
export function buildKitSessionParams(order: KitOrder, baseUrl: string): Stripe.Checkout.SessionCreateParams {
  const { plan, email, replayUrl } = order;
  const metadata = { kind: "kit", kitPlan: plan.id, replayUrl };
  const recurring = plan.interval === "month";

  return {
    mode: recurring ? "subscription" : "payment",
    customer_email: email,
    allow_promotion_codes: true,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: plan.priceCents,
          product_data: {
            name: `Transmission Kit: ${plan.name}`,
            description: plan.tagline,
          },
          ...(recurring ? { recurring: { interval: "month" as const } } : {}),
        },
      },
    ],
    metadata,
    ...(recurring ? { subscription_data: { metadata } } : {}),
    success_url: `${baseUrl}/kit/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/kit#pricing`,
  };
}
