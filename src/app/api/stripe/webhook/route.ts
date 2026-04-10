import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
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

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.customer && session.subscription) {
          const subId = typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subId);
          await prisma.codexUser.updateMany({
            where: { stripeCustomerId: session.customer as string },
            data: {
              subscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
              currentPeriodEnd: getPeriodEnd(subscription),
            },
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getInvoiceSubscriptionId(invoice);
        if (subscriptionId && invoice.customer) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await prisma.codexUser.updateMany({
            where: { stripeCustomerId: invoice.customer as string },
            data: {
              subscriptionStatus: "active",
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
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.customer) {
          await prisma.codexUser.updateMany({
            where: { stripeCustomerId: subscription.customer as string },
            data: {
              subscriptionStatus: subscription.status,
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
