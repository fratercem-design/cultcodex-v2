import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

/** One-time purchasable books → their Stripe price env var. */
const BOOKS: Record<string, { priceEnvVar: string; title: string }> = {
  "psychenomicon-vol-1": {
    priceEnvVar: "STRIPE_PRICE_BOOK_VOL1_ID",
    title: "The Psychenomicon — Volume I",
  },
  "cult-masters-handbook": {
    priceEnvVar: "STRIPE_PRICE_BOOK_HANDBOOK_ID",
    title: "The Cult Master's Handbook",
  },
};

/**
 * POST /api/stripe/book-checkout  — body `{ sku }`
 * One-time (mode: "payment") Checkout for a book. The webhook grants a
 * BookPurchase entitlement on completion.
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const sku = typeof body?.sku === "string" ? body.sku : undefined;
    const book = sku ? BOOKS[sku] : undefined;
    if (!sku || !book) return NextResponse.json({ error: "Unknown book" }, { status: 400 });

    const owned = await prisma.bookPurchase
      .findUnique({ where: { userId_sku: { userId: user.id, sku } } })
      .catch(() => null);
    if (owned) return NextResponse.json({ owned: true });

    const priceId = process.env[book.priceEnvVar];
    if (!priceId) {
      return NextResponse.json({ error: `Price not configured (${book.priceEnvVar})` }, { status: 500 });
    }

    const codexUser = await prisma.codexUser.findUnique({
      where: { id: user.id },
      select: { email: true, stripeCustomerId: true },
    });
    if (!codexUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let customerId = codexUser.stripeCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: codexUser.email,
        metadata: { codexUserId: user.id },
      });
      customerId = customer.id;
      await prisma.codexUser.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const baseUrl = process.env.NEXTAUTH_URL || "https://cultcodex.me";
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/psychenomicon/book?purchased=1`,
      cancel_url: `${baseUrl}/psychenomicon/book`,
      metadata: { codexUserId: user.id, bookSku: sku },
      payment_intent_data: { metadata: { codexUserId: user.id, bookSku: sku } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Book checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
