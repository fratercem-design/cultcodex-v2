import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { resolvePriceId, type TierSlug, type BillingInterval } from "@/lib/subscription-tiers";

/**
 * POST /api/stripe/checkout
 *
 * Body: `{ tier?: "access" | "system", interval?: "month" | "year" }`
 *
 * An *absent* body is still valid — the legacy /subscribe client posts nothing
 * and gets the legacy STRIPE_PRICE_ID. But an *unrecognized* tier is now a 400
 * rather than being silently ignored: the previous code fell through to the
 * legacy price, so a typo'd tier (`"initiate"`, `"oracle"`) quietly charged the
 * wrong amount instead of failing. Silent fallback on a payment path is worse
 * than an error.
 */
const checkoutSchema = z.object({
  tier: z.enum(["access", "system"]).optional(),
  interval: z.enum(["month", "year"]).optional(),
});

export async function POST(req: Request) {
  // Correlates the client-visible failure with the Vercel log line. Generated
  // per request so a user reporting "checkout broke" can be traced exactly.
  const requestId = crypto.randomUUID();

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Read the body as text first so "no body at all" (the legacy client) can
    // be told apart from "body present but malformed JSON" (a real 400).
    const raw = (await req.text()).trim();
    let parsedJson: unknown = {};
    if (raw.length > 0) {
      try {
        parsedJson = JSON.parse(raw);
      } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }
    }
    // `null` is valid JSON but not a valid body shape; normalize it to {}.
    if (parsedJson === null) parsedJson = {};

    const parsed = checkoutSchema.safeParse(parsedJson);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: issue
            ? `Invalid ${issue.path.join(".") || "body"}: ${issue.message}`
            : "Invalid request body",
        },
        { status: 400 }
      );
    }

    const tier: TierSlug | undefined = parsed.data.tier;
    const interval: BillingInterval = parsed.data.interval ?? "month";

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
      // Which env var is missing is deployment detail — log it, don't return it.
      console.error(
        `[checkout ${requestId}] Stripe price not configured`,
        tier ? { tier, interval } : { legacy: true }
      );
      return NextResponse.json(
        { error: "Checkout is temporarily unavailable", requestId },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || "https://cultcodex.me";
    const successPath = tier === "system"
      ? "/welcome/oracle"
      : tier === "access"
      ? "/welcome/initiate"
      : "/episodes?subscribed=true";
    // Both paths cancel to /premium — /subscribe is now a 308 to it, so sending
    // Stripe there would just cost the user an extra hop.
    const cancelPath = "/premium";

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
    // Stack traces stay in the server log; the client gets an id to quote.
    console.error(`[checkout ${requestId}] Stripe checkout error:`, err);
    return NextResponse.json(
      { error: "Failed to create checkout session", requestId },
      { status: 500 }
    );
  }
}
