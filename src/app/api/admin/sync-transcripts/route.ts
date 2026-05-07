/**
 * POST /api/admin/sync-transcripts
 *
 * Fetches YouTube auto-captions for episodes that have a youtubeVideoId
 * but no TranscriptSegment rows yet, then stores them in the DB.
 *
 * Body: { limit?: number }   — max episodes to process per call (default 20)
 *
 * Uses the `youtube-transcript` npm package (no API key needed).
 * Admin-only.
 *
 * Rate-limit: 1 second delay between each video to avoid throttling.
 */
import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface TranscriptResult {
  episodeId: string;
  slug: string;
  videoId: string;
  status: "ok" | "no_transcript" | "error";
  segments?: number;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as { limit?: number };
  const limit = Math.min(Math.max(1, body.limit ?? 20), 100);

  // Find episodes with a YouTube ID but no transcript segments
  const episodesWithTranscripts = await prisma.transcriptSegment.groupBy({
    by: ["episodeId"],
    _count: { id: true },
  });
  const hasTranscript = new Set(episodesWithTranscripts.map((e) => e.episodeId));

  const episodes = await prisma.episode.findMany({
    where: {
      youtubeVideoId: { not: null },
      status: "published",
    },
    select: { id: true, slug: true, youtubeVideoId: true },
    orderBy: { airDate: "desc" },
  });

  const pending = episodes.filter((ep) => !hasTranscript.has(ep.id)).slice(0, limit);
  const totalPending = episodes.filter((ep) => !hasTranscript.has(ep.id)).length;

  const results: TranscriptResult[] = [];

  for (let i = 0; i < pending.length; i++) {
    const ep = pending[i];
    const videoId = ep.youtubeVideoId!;

    try {
      const rawSegments = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });

      if (!rawSegments || rawSegments.length === 0) {
        results.push({ episodeId: ep.id, slug: ep.slug, videoId, status: "no_transcript" });
      } else {
        await prisma.transcriptSegment.createMany({
          data: rawSegments.map((seg) => {
            const start = Math.round((seg.offset ?? 0) / 1000);
            const end = seg.duration ? Math.round(((seg.offset ?? 0) + seg.duration) / 1000) : start + 5;
            const text = seg.text.replace(/\[.*?\]/g, "").trim();
            return {
              episodeId: ep.id,
              startSeconds: start,
              endSeconds: end,
              text,
              searchText: text.toLowerCase(),
            };
          }),
          skipDuplicates: true,
        });

        // Write raw transcript text to the episode for full-text search
        const rawText = rawSegments.map((s) => s.text).join(" ");
        await prisma.episode.update({
          where: { id: ep.id },
          data: {
            transcriptRaw: rawText.slice(0, 200000),
            searchText: [ep.slug, rawText].join(" ").toLowerCase().slice(0, 10000),
          },
        });

        results.push({ episodeId: ep.id, slug: ep.slug, videoId, status: "ok", segments: rawSegments.length });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ episodeId: ep.id, slug: ep.slug, videoId, status: "error", error: msg.slice(0, 200) });
    }

    if (i < pending.length - 1) await sleep(DELAY_MS);
  }

  const summary = {
    processed: results.length,
    ok: results.filter((r) => r.status === "ok").length,
    no_transcript: results.filter((r) => r.status === "no_transcript").length,
    errors: results.filter((r) => r.status === "error").length,
    remaining: totalPending - results.length,
  };

  return NextResponse.json({ ok: true, summary, results });
}
