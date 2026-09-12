import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import {
  CREDIT_BUNDLE_SLUGS,
  getCreditBundle,
  resolveCreditBundlePriceId,
} from "@/lib/credit-bundles";

/**
 * POST /api/stripe/credits-checkout
 *
 * Body: `{ bundle: "spark" | "surge" | "flood" }`
 *
 * One-time (mode: "payment") Checkout for a Signal Credit bundle. The webhook
 * grants the credits on `checkout.session.completed` from the metadata this
 * route stamps — the client never tells the server how many credits it paid
 * for. Same shape as /api/stripe/checkout: 401 without a session, 400 for an
 * unknown bundle, a logged 500 with a request id when the price isn't
 * configured, and no silent fallback on a payment path.
 */
const bodySchema = z.object({
  bundle: z.enum(CREDIT_BUNDLE_SLUGS),
});

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = bodySchema.safeParse(json ?? {});
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

    const bundle = getCreditBundle(parsed.data.bundle)!;
    const priceId = resolveCreditBundlePriceId(bundle.slug);
    if (!priceId) {
      // Which env var is missing is deployment detail — log it, don't return it.
      console.error(`[credits-checkout ${requestId}] price not configured`, { bundle: bundle.slug });
      return NextResponse.json(
        { error: "Credit purchases are temporarily unavailable", requestId },
        { status: 500 }
      );
    }

    const codexUser = await prisma.codexUser.findUnique({
      where: { id: user.id },
      select: { email: true, stripeCustomerId: true },
    });
    if (!codexUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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

    const baseUrl = process.env.NEXTAUTH_URL || "https://cultcodex.me";
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/cards/packs?credits=granted`,
      cancel_url: `${baseUrl}/cards/packs`,
      // Everything the webhook needs to grant without a second lookup. The
      // webhook cross-checks `credits` against the bundle table, so a value
      // edited in transit can't inflate the grant.
      metadata: {
        kind: "credits",
        codexUserId: user.id,
        bundle: bundle.slug,
        credits: String(bundle.credits),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Stack traces stay in the server log; the client gets an id to quote.
    console.error(`[credits-checkout ${requestId}] Stripe error:`, err);
    return NextResponse.json(
      { error: "Failed to create checkout session", requestId },
      { status: 500 }
    );
  }
}
