import { NextRequest, NextResponse } from "next/server";
import { rateLimit, sharedRateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Called client-side when the YouTube embed reports a player error. A public
// browser signal is useful telemetry, but it must never mutate canonical
// archive state: any visitor can manufacture this request. Confirmed status
// changes belong to the authenticated admin/transcript workflows.
export async function POST(req: NextRequest) {
  const callerKey = clientKey(req);
  const rl = rateLimit(`report-unavail:${callerKey}`, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const { videoId } = await req.json().catch(() => ({})) as { videoId?: string };
  if (!videoId || typeof videoId !== "string" || !/^[a-zA-Z0-9_-]{8,12}$/.test(videoId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const sharedRl = await sharedRateLimit("report-unavailable", callerKey, { limit: 20, windowMs: 60_000 });
  if (!sharedRl.ok) {
    return NextResponse.json({ ok: false }, { status: 429, headers: { "Retry-After": String(sharedRl.retryAfterSec) } });
  }

  console.warn(JSON.stringify({
    metric: "youtube_player_unavailable",
    event: "client_report",
    videoId,
  }));

  return NextResponse.json({ ok: true });
}
