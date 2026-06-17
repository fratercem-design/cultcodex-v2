import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { getTierByPriceId } from "@/lib/subscription-tiers";
import { sendInitiateWelcomeEmail, sendOracleWelcomeEmail } from "@/lib/notifications";
import type Stripe from "stripe";

/** Extract current_period_end from a subscription's first item */
function getPeriodEnd(subscription: Stripe.Subscription): Date {
  const item = subscription.items?.data?.[0];
  if (item?.current_period_end) {
    return new Date(item.current_period_end * 1000);
  }
  // Fallback: 30 days from now
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

/** Extract subscription ID from an invoice (v22 API: parent.subscription_details) */
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  // v22: subscription info is in parent.subscription_details
  const subDetails = invoice.parent?.subscription_details;
  if (subDetails?.subscription) {
    const sub = subDetails.subscription;
    return typeof sub === "string" ? sub : sub.id;
  }
  return null;
}

/**
 * Mark an event as processed and return true if it's new (should be handled),
 * or false if it's a duplicate (already processed — skip to avoid double side-effects).
 *
 * Stripe retries webhooks when it doesn't receive a 2xx within 30 seconds.
 * DB writes are idempotent (updateMany overwrites with the same data), but
 * sending a welcome email is not — this guard prevents the duplicate send.
 */
async function markEventProcessed(eventId: string, eventType: string): Promise<boolean> {
  try {
    await prisma.stripeWebhookEvent.create({
      data: { id: eventId, type: eventType },
    });
    return true; // new event — proceed
  } catch {
    // Unique constraint violation means we've seen this event before.
    // Any other DB error: log and continue (fail open so Stripe doesn't
    // keep retrying and backlogging legitimate events).
    return false; // duplicate — skip
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not set — cannot verify signatures");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency guard — return 200 immediately for duplicate deliveries.
  // Stripe marks a webhook as delivered on first 2xx; retries only happen
  // when the original delivery timed out or the connection dropped.
  const isNew = await markEventProcessed(event.id, event.type);
  if (!isNew) {
    console.log(`[webhook] Duplicate event ${event.id} (${event.type}) — skipping`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.customer && session.subscription) {
          const subId = typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
          const subscription = await getStripe().subscriptions.retrieve(subId, {
            expand: ["items.data.price"],
          });
          // Resolve tier from: checkout metadata → subscription metadata → price ID
          const tierFromMeta = session.metadata?.tier || subscription.metadata?.tier;
          const priceId = subscription.items?.data?.[0]?.price?.id;
          const tier = tierFromMeta || getTierByPriceId(priceId)?.slug || null;
          await prisma.codexUser.updateMany({
            where: { stripeCustomerId: session.customer as string },
            data: {
              subscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
              subscriptionTier: tier,
              currentPeriodEnd: getPeriodEnd(subscription),
            },
          });

          // Send tier-specific welcome email (fire-and-forget — don't block the webhook).
          // Safe to send here because markEventProcessed already deduplicated the event.
          if (tier === "access" || tier === "system") {
            const codexUser = await prisma.codexUser.findFirst({
              where: { stripeCustomerId: session.customer as string },
              select: { email: true, displayName: true },
            });
            if (codexUser?.email) {
              const sendFn = tier === "system" ? sendOracleWelcomeEmail : sendInitiateWelcomeEmail;
              sendFn({ recipientEmail: codexUser.email, recipientName: codexUser.displayName }).catch(
                (err) => console.error("[webhook] Welcome email failed:", err)
              );
            }
          }
        }

        // One-time book purchase → grant a BookPurchase entitlement.
        if (session.mode === "payment" && session.metadata?.bookSku && session.metadata?.codexUserId) {
          const sku = session.metadata.bookSku;
          const userId = session.metadata.codexUserId;
          await prisma.bookPurchase
            .upsert({
              where: { userId_sku: { userId, sku } },
              create: { userId, sku, stripeSessionId: session.id },
              update: { stripeSessionId: session.id },
            })
            .catch((err) => console.error("[webhook] book entitlement failed:", err));
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getInvoiceSubscriptionId(invoice);
        if (subscriptionId && invoice.customer) {
          // Expand price so we can resolve tier — same as checkout.session.completed.
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId, {
            expand: ["items.data.price"],
          });
          const priceId = subscription.items?.data?.[0]?.price?.id;
          const tier = subscription.metadata?.tier || getTierByPriceId(priceId)?.slug || null;
          await prisma.codexUser.updateMany({
            where: { stripeCustomerId: invoice.customer as string },
            data: {
              subscriptionStatus: "active",
              subscriptionTier: tier ?? undefined,
              currentPeriodEnd: getPeriodEnd(subscription),
            },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.customer) {
          await prisma.codexUser.updateMany({
            where: { stripeCustomerId: invoice.customer as string },
            data: { subscriptionStatus: "past_due" },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.customer) {
          await prisma.codexUser.updateMany({
            where: { stripeCustomerId: subscription.customer as string },
            data: {
              subscriptionStatus: "canceled",
              subscriptionId: null,
              subscriptionTier: null,
              currentPeriodEnd: null,
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.customer) {
          const priceId = subscription.items?.data?.[0]?.price?.id;
          const tier = subscription.metadata?.tier || getTierByPriceId(priceId)?.slug || null;
          await prisma.codexUser.updateMany({
            where: { stripeCustomerId: subscription.customer as string },
            data: {
              subscriptionStatus: subscription.status,
              subscriptionTier: tier ?? undefined,
              currentPeriodEnd: getPeriodEnd(subscription),
            },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
