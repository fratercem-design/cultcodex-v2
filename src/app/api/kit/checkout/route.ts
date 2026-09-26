/**
 * POST /api/kit/checkout
 *
 * Body: { plan: "single" | "monthly" | "premium", email: string, replayUrl: string }
 *
 * Guest-friendly Stripe Checkout for a Transmission Kit. The replay link and
 * plan ride in session metadata; the order itself lives in Stripe (no DB row).
 */
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { rateLimit, sharedRateLimit, clientKey } from "@/lib/rate-limit";
import { parseKitOrder, buildKitSessionParams } from "@/lib/kit/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const callerKey = clientKey(req);
  const localRl = rateLimit(`kit-checkout:${callerKey}`, { limit: 5, windowMs: 60_000 });
  if (!localRl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(localRl.retryAfterSec) } });
  }
  const sharedRl = await sharedRateLimit("kit-checkout", callerKey, { limit: 5, windowMs: 60_000 });
  if (!sharedRl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(sharedRl.retryAfterSec) } });
  }

  const parsed = parseKitOrder(await req.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const baseUrl = process.env.NEXTAUTH_URL || "https://cultcodex.me";
    const session = await getStripe().checkout.sessions.create(buildKitSessionParams(parsed.order, baseUrl));
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[kit/checkout] error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Could not start checkout. Try again." }, { status: 500 });
  }
}
