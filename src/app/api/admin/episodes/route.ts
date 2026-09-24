/**
 * POST /api/admin/episodes
 *
 * Transcript import for main @CultofPsyche channel episodes.
 * Auth: X-Enrich-Secret header must match ENRICH_SECRET env var.
 *
 * Body modes:
 *
 * mode: "status"
 *   contentType?: "original" | "livestream" | "short" | "clip"  (default: "original")
 *   — returns count of episodes with/without transcripts + missing list
 *
 * mode: "import-segments"
 *   videoId: string
 *   segments: Array<{ offset: number; duration: number; text: string }>
 *   — saves pre-fetched VTT segments (from yt-dlp in CI) to DB
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enrichSecretMatches } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function checkAuth(req: NextRequest): boolean {
  return enrichSecretMatches(req);
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    mode?: string;
    contentType?: string;
    videoId?: string;
    segments?: Array<{ offset: number; duration: number; text: string }>;
  };
  const { mode = "status", contentType = "original" } = body;

  if (mode === "status") {
    const where = { contentType: contentType as "original" | "livestream" | "short" | "clip" };
    const [total, withTranscripts] = await Promise.all([
      prisma.episode.count({ where }),
      prisma.episode.count({ where: { ...where, segments: { some: {} } } }),
    ]);
    const missingRaw = await prisma.episode.findMany({
      where: { ...where, segments: { none: {} }, youtubeVideoId: { not: null } },
      select: { youtubeVideoId: true, title: true, episodeNumber: true },
      orderBy: { airDate: "asc" },
      take: 500,
    });
    const missing = missingRaw.map((e) => ({
      videoId: e.youtubeVideoId!,
      title: e.title,
      episodeNumber: e.episodeNumber,
    }));
    return NextResponse.json({ total, withTranscripts, withoutTranscripts: total - withTranscripts, missing });
  }

  if (mode === "import-segments") {
    const { videoId, segments } = body;
    if (!videoId) return NextResponse.json({ error: "videoId required" }, { status: 400 });
    if (!segments?.length) return NextResponse.json({ error: "segments required" }, { status: 400 });

    const episode = await prisma.episode.findFirst({
      where: { youtubeVideoId: videoId },
      select: { id: true, slug: true },
    });
    if (!episode) return NextResponse.json({ ok: false, error: "episode_not_found" });

    const existing = await prisma.transcriptSegment.count({ where: { episodeId: episode.id } });
    if (existing > 0) return NextResponse.json({ ok: true, skipped: true, segments: existing });

    const segmentData = segments.map((seg) => ({
      episodeId: episode.id,
      startSeconds: Math.round((seg.offset ?? 0) / 1000),
      endSeconds: Math.round(((seg.offset ?? 0) + (seg.duration ?? 5000)) / 1000),
      text: seg.text.trim(),
      searchText: seg.text.toLowerCase().trim(),
    }));

    await prisma.transcriptSegment.createMany({ data: segmentData, skipDuplicates: true });

    const rawText = segments.map((s) => s.text).join(" ");
    await prisma.episode.update({
      where: { id: episode.id },
      data: { transcriptRaw: rawText },
    });

    return NextResponse.json({ ok: true, segments: segmentData.length, episodeSlug: episode.slug });
  }

  return NextResponse.json({ error: `Unknown mode: ${mode}` }, { status: 400 });
}
