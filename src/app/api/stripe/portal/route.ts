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
      select: { stripeCustomerId: true },
    });

    if (!codexUser?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || "https://cultcodex.me";

    const session = await stripe.billingPortal.sessions.create({
      customer: codexUser.stripeCustomerId,
      return_url: `${baseUrl}/subscribe`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe portal error:", err);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
