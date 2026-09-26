import type Stripe from "stripe";
import { KIT_PLANS } from "./sample-kit";
import { sendKitOrderAdminEmail, sendKitOrderBuyerEmail, type KitOrderEmail } from "@/lib/notifications";

const DEFAULT_ADMIN_EMAIL = "psychetarotchannel@gmail.com";

/** Turns a completed kit Checkout Session into the order emails' fields, or null if it isn't a paid kit order. */
export function kitOrderFromSession(session: Stripe.Checkout.Session): KitOrderEmail | null {
  if (session.metadata?.kind !== "kit" || session.payment_status === "unpaid") return null;
  const plan = KIT_PLANS.find((p) => p.id === session.metadata?.kitPlan);
  const buyerEmail = session.customer_details?.email ?? session.customer_email;
  const replayUrl = session.metadata?.replayUrl;
  if (!plan || !buyerEmail || !replayUrl) return null;
  const cents = session.amount_total ?? plan.priceCents;
  return {
    buyerEmail,
    planName: plan.name,
    amount: `$${(cents / 100).toFixed(2)}`,
    replayUrl,
    stripeSessionId: session.id,
    recurring: plan.interval === "month",
  };
}

/**
 * Emails the owner and the buyer about a new kit order. The order is already
 * paid and visible in Stripe, so a failed email is logged, not retried: the
 * shared webhook has recorded the event and a 500 would not re-send anything.
 */
export async function handleKitCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (session.metadata?.kind !== "kit") return;
  const order = kitOrderFromSession(session);
  if (!order) {
    console.error("[kit] completed session missing order details:", session.id);
    return;
  }
  const adminEmail = process.env.KIT_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
  const results = await Promise.allSettled([
    sendKitOrderAdminEmail(order, adminEmail),
    sendKitOrderBuyerEmail(order, adminEmail),
  ]);
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[kit] ${i === 0 ? "admin" : "buyer"} email failed for ${session.id}:`, r.reason);
    }
  });
}
