import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Called client-side when the YouTube embed fires an unavailability error.
// No auth required — only marks episodes as unavailable, a safe one-way flag.
export async function POST(req: NextRequest) {
  const rl = rateLimit(`report-unavail:${clientKey(req)}`, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const { videoId } = await req.json().catch(() => ({})) as { videoId?: string };
  if (!videoId || typeof videoId !== "string" || !/^[a-zA-Z0-9_-]{8,12}$/.test(videoId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Only update episodes that are currently published (don't touch already-unavailable ones)
  await prisma.episode.updateMany({
    where: { youtubeVideoId: videoId, status: "published" },
    data: { status: "unavailable" },
  });

  return NextResponse.json({ ok: true });
}
