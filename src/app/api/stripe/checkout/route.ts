import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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
      const customer = await stripe.customers.create({
        email: codexUser.email,
        metadata: { codexUserId: user.id },
      });
      customerId = customer.id;
      await prisma.codexUser.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price not configured" },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || "https://cultcodex.me";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/episodes?subscribed=true`,
      cancel_url: `${baseUrl}/subscribe`,
      metadata: { codexUserId: user.id },
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
