import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { resolvePriceId, type TierSlug, type BillingInterval } from "@/lib/subscription-tiers";

/**
 * POST /api/stripe/checkout
 *
 * Body: `{ tier?: "access" | "system" }`
 *
 * Resolves a Stripe price id from env (tier-specific) or falls back to
 * the legacy STRIPE_PRICE_ID for backwards compatibility with /subscribe.
 * Creates a Checkout Session and returns the hosted-checkout URL.
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse optional tier + billing interval from body. POST with no body is
    // still valid for back-compat with /subscribe's existing client.
    let tier: TierSlug | undefined;
    let interval: BillingInterval = "month";
    try {
      const body = await req.json().catch(() => null);
      if (body && (body.tier === "access" || body.tier === "system")) {
        tier = body.tier;
      }
      if (body && body.interval === "year") {
        interval = "year";
      }
    } catch {
      /* no body — fall through to legacy path */
    }

    const codexUser = await prisma.codexUser.findUnique({
      where: { id: user.id },
      select: { email: true, stripeCustomerId: true },
    });
    if (!codexUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get or create Stripe customer
    let customerId = codexUser.stripeCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: codexUser.email,
        metadata: { codexUserId: user.id },
      });
      customerId = customer.id;
      await prisma.codexUser.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Resolve price id: tier first (from the two-tier config), then
    // legacy STRIPE_PRICE_ID (used by the old /subscribe flow).
    const priceId = tier
      ? resolvePriceId(tier, interval)
      : process.env.STRIPE_PRICE_ID ?? null;
    if (!priceId) {
      return NextResponse.json(
        {
          error: tier
            ? `Stripe price not configured for tier "${tier}" (${interval}). Set the corresponding env var.`
            : "Stripe price not configured",
        },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || "https://cultcodex.me";
    const successPath = tier === "system"
      ? "/welcome/oracle"
      : tier === "access"
      ? "/welcome/initiate"
      : "/episodes?subscribed=true";
    const cancelPath = tier ? "/premium" : "/subscribe";

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}${successPath}`,
      cancel_url: `${baseUrl}${cancelPath}`,
      // Stamp the tier into metadata so the webhook can record it on
      // the user without needing to re-read the price row from Stripe.
      metadata: { codexUserId: user.id, ...(tier ? { tier, interval } : {}) },
      subscription_data: tier
        ? { metadata: { codexUserId: user.id, tier, interval } }
        : { metadata: { codexUserId: user.id } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
