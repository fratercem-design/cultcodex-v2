/**
 * POST /api/claps/checkout
 *
 * Body: { nickname: string, quantity?: number, coupon?: string }
 *
 * Creates a Stripe Checkout Session for clap tokens (#cultofpsyche).
 * Guest-friendly: no login required — the nickname rides in session
 * metadata and the webhook grants tokens to that nickname on payment.
 *
 * Pricing: $20 per token; coupon "panel" drops it to $10. Uses inline
 * price_data (no pre-created Stripe Price needed).
 */
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { rateLimit, sharedRateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRICE_CENTS = 2000;
const COUPON_PRICE_CENTS = 1000;
const COUPON_CODE = "panel";
const MAX_QUANTITY = 20;

export async function POST(req: Request) {
  const callerKey = clientKey(req);
  const localRl = rateLimit(`claps-checkout:${callerKey}`, { limit: 5, windowMs: 60_000 });
  if (!localRl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(localRl.retryAfterSec) } });
  }
  const sharedRl = await sharedRateLimit("claps-checkout", callerKey, { limit: 5, windowMs: 60_000 });
  if (!sharedRl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(sharedRl.retryAfterSec) } });
  }

  try {
    const body = await req.json().catch(() => null);
    const nickname = typeof body?.nickname === "string" ? body.nickname.trim() : "";
    const quantity = Math.min(Math.max(Math.floor(Number(body?.quantity) || 1), 1), MAX_QUANTITY);
    const coupon = typeof body?.coupon === "string" ? body.coupon.trim().toLowerCase() : "";

    if (!nickname || nickname.length < 2 || nickname.length > 32) {
      return NextResponse.json(
        { error: "Pick a nickname between 2 and 32 characters." },
        { status: 400 }
      );
    }
    // Keep the board printable: letters, numbers, spaces, and light punctuation.
    if (!/^[\p{L}\p{N} ._\-'&!]+$/u.test(nickname)) {
      return NextResponse.json(
        { error: "Nickname can use letters, numbers, spaces, and . _ - ' & !" },
        { status: 400 }
      );
    }

    const couponApplied = coupon === COUPON_CODE;
    const unitCents = couponApplied ? COUPON_PRICE_CENTS : PRICE_CENTS;
    const baseUrl = process.env.NEXTAUTH_URL || "https://cultcodex.me";

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity,
          price_data: {
            currency: "usd",
            unit_amount: unitCents,
            product_data: {
              name: "Clap Token — #cultofpsyche",
              description: `24-hour clap spotlight + 1 token vested forever to "${nickname}"`,
            },
          },
        },
      ],
      metadata: {
        clapNickname: nickname,
        clapQuantity: String(quantity),
        clapCoupon: couponApplied ? COUPON_CODE : "",
      },
      success_url: `${baseUrl}/claps?purchased=1&nick=${encodeURIComponent(nickname)}`,
      cancel_url: `${baseUrl}/claps?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[claps/checkout] error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not start checkout. Try again." }, { status: 500 });
  }
}
