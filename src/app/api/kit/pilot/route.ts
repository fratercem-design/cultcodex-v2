/**
 * POST /api/kit/pilot
 *
 * Body: { name, email, channelUrl, replayUrl?, note?, website? }
 *
 * Free-pilot request from /kit. Emails the owner (Reply-To the applicant);
 * nothing is stored. `website` is a honeypot: when filled, the request is
 * dropped but still answered with ok so bots learn nothing.
 */
import { NextResponse } from "next/server";
import { rateLimit, sharedRateLimit, clientKey } from "@/lib/rate-limit";
import { parsePilotRequest } from "@/lib/kit/pilot";
import { kitAdminEmail } from "@/lib/kit/fulfillment";
import { sendKitPilotRequestEmail } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const callerKey = clientKey(req);
  const localRl = rateLimit(`kit-pilot:${callerKey}`, { limit: 3, windowMs: 60 * 60_000 });
  if (!localRl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(localRl.retryAfterSec) } });
  }
  const sharedRl = await sharedRateLimit("kit-pilot", callerKey, { limit: 3, windowMs: 60 * 60_000 });
  if (!sharedRl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(sharedRl.retryAfterSec) } });
  }

  const parsed = parsePilotRequest(await req.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  if ("spam" in parsed) {
    return NextResponse.json({ ok: true });
  }

  try {
    await sendKitPilotRequestEmail(parsed.request, kitAdminEmail());
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[kit/pilot] email failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Couldn't send that. Email psychetarotchannel@gmail.com instead." },
      { status: 500 },
    );
  }
}
