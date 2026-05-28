/**
 * POST /api/admin/nightmares
 *
 * Server-side transcript import for @PsychesNightmares videos.
 * Auth: X-Enrich-Secret header must match ENRICH_SECRET env var.
 *
 * Body modes:
 *
 * mode: "upsert-episodes"
 *   videos: VideoRow[]  — upserts episode records from channel data
 *
 * mode: "fetch-transcript"
 *   videoId: string     — fetches + saves transcript segments (via youtube-transcript lib)
 *
 * mode: "import-segments"
 *   videoId: string     — saves pre-fetched segments (from yt-dlp in CI) to DB
 *   segments: Array<{ offset: number; duration: number; text: string }>
 *
 * mode: "status"
 *   — returns count of nightmares episodes with/without transcripts
 */

import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { prisma } from "@/lib/db";
import { ContentStatus } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ENRICH_SECRET = process.env.ENRICH_SECRET ?? "";

function checkAuth(req: NextRequest): boolean {
  const secret = req.headers.get("x-enrich-secret") ?? "";
  return ENRICH_SECRET.length > 0 && secret === ENRICH_SECRET;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function parseDurationToIso(raw: string | null): string | null {
  if (!raw) return null;
  const parts = raw.split(":").map(Number);
  const secs = parts.length === 3
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : parts.length === 2
    ? parts[0] * 60 + parts[1]
    : parts[0];
  if (!secs) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `PT${h ? h + "H" : ""}${m ? m + "M" : ""}${s || (!h && !m) ? s + "S" : ""}`;
}

interface VideoRow {
  videoId: string;
  title: string;
  description?: string;
  publishedAt: string;
  duration?: string | null;
  thumbnailUrl?: string | null;
}

async function upsertEpisodes(videos: VideoRow[]) {
  // Find max episode number to continue from
  const maxEp = await prisma.episode.aggregate({ _max: { episodeNumber: true } });
  let nextNum = (maxEp._max.episodeNumber ?? 0) + 1;

  // Get existing videoIds to avoid re-numbering
  const existingVids = await prisma.episode.findMany({
    where: { youtubeVideoId: { in: videos.map((v) => v.videoId) } },
    select: { youtubeVideoId: true },
  });
  const existingSet = new Set(existingVids.map((e) => e.youtubeVideoId));

  const results: Array<{ videoId: string; status: "created" | "exists" | "error"; episodeNumber?: number; error?: string }> = [];

  for (const video of videos) {
    if (existingSet.has(video.videoId)) {
      results.push({ videoId: video.videoId, status: "exists" });
      continue;
    }

    try {
      const slug = slugify(video.title);
      const epNum = nextNum++;
      const summaryShort = video.description
        ? video.description.replace(/https?:\/\/\S+/g, "").replace(/support the stream:?\s*/gi, "").trim().slice(0, 400) || null
        : null;

      await prisma.episode.create({
        data: {
          title: video.title,
          slug,
          episodeNumber: epNum,
          airDate: new Date(video.publishedAt),
          duration: parseDurationToIso(video.duration ?? null),
          youtubeVideoId: video.videoId,
          thumbnailUrl: video.thumbnailUrl ?? null,
          summaryShort,
          searchText: [video.title, summaryShort].filter(Boolean).join(" ").toLowerCase(),
          status: ContentStatus.published,
          contentType: "livestream",
        },
      });
      results.push({ videoId: video.videoId, status: "created", episodeNumber: epNum });
    } catch (err) {
      results.push({ videoId: video.videoId, status: "error", error: String(err).slice(0, 100) });
    }
  }

  return results;
}

async function fetchTranscriptForVideo(videoId: string) {
  // Look up episode
  const episode = await prisma.episode.findFirst({
    where: { youtubeVideoId: videoId },
    select: { id: true, slug: true },
  });
  if (!episode) return { ok: false, error: "episode_not_found" };

  // Skip if already has segments
  const existing = await prisma.transcriptSegment.count({ where: { episodeId: episode.id } });
  if (existing > 0) return { ok: true, skipped: true, segments: existing };

  // Fetch from YouTube
  const raw = await YoutubeTranscript.fetchTranscript(videoId);
  if (!raw || raw.length === 0) return { ok: false, error: "empty_transcript" };

  // Batch insert segments
  const segmentData = raw.map((seg) => ({
    episodeId: episode.id,
    startSeconds: Math.round((seg.offset ?? 0) / 1000),
    endSeconds: Math.round(((seg.offset ?? 0) + (seg.duration ?? 5000)) / 1000),
    text: seg.text.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim(),
    searchText: seg.text.toLowerCase().trim(),
  }));

  await prisma.transcriptSegment.createMany({ data: segmentData, skipDuplicates: true });

  // Update episode transcriptRaw
  const rawText = raw.map((s) => s.text).join(" ");
  await prisma.episode.update({
    where: { id: episode.id },
    data: { transcriptRaw: rawText },
  });

  return { ok: true, segments: segmentData.length, episodeSlug: episode.slug };
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { mode?: string; videos?: VideoRow[]; videoId?: string };
  const { mode = "status" } = body;

  if (mode === "status") {
    const [total, withTranscripts] = await Promise.all([
      prisma.episode.count({ where: { contentType: "livestream" } }),
      prisma.episode.count({
        where: { contentType: "livestream", segments: { some: {} } },
      }),
    ]);
    const missingRaw = await prisma.episode.findMany({
      where: { contentType: "livestream", segments: { none: {} }, youtubeVideoId: { not: null } },
      select: { youtubeVideoId: true, title: true, episodeNumber: true },
      orderBy: { airDate: "asc" },
      take: 250,
    });
    const missing = missingRaw.map((e) => ({ videoId: e.youtubeVideoId!, title: e.title, episodeNumber: e.episodeNumber }));
    return NextResponse.json({ total, withTranscripts, withoutTranscripts: total - withTranscripts, missing });
  }

  if (mode === "upsert-episodes") {
    const { videos } = body;
    if (!videos?.length) return NextResponse.json({ error: "videos required" }, { status: 400 });
    const results = await upsertEpisodes(videos);
    const created = results.filter((r) => r.status === "created").length;
    const skipped = results.filter((r) => r.status === "exists").length;
    const errors = results.filter((r) => r.status === "error").length;
    return NextResponse.json({ created, skipped, errors, results });
  }

  if (mode === "fetch-transcript") {
    const { videoId } = body;
    if (!videoId) return NextResponse.json({ error: "videoId required" }, { status: 400 });
    try {
      const result = await fetchTranscriptForVideo(videoId);
      return NextResponse.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ ok: false, error: msg.slice(0, 200) });
    }
  }

  if (mode === "import-segments") {
    const { videoId, segments } = body as {
      videoId?: string;
      segments?: Array<{ offset: number; duration: number; text: string }>;
    };
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
