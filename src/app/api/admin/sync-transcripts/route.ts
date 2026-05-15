import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const DELAY_MS = 1200;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface TranscriptSegmentRaw {
  text: string;
  start: number;
  duration: number;
}

interface TranscriptResult {
  episodeId: string;
  slug: string;
  videoId: string;
  status: "ok" | "no_transcript" | "error";
  segments?: number;
  error?: string;
}

// Fetch transcript via YouTube's innertube API with browser-like headers.
// Much more reliable from Vercel IPs than the youtube-transcript scraper.
async function fetchTranscriptInnertube(videoId: string): Promise<TranscriptSegmentRaw[] | null> {
  // Step 1: get the transcript track URL from the video page
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!pageRes.ok) return null;
  const html = await pageRes.text();

  // Extract the serialised player response
  const match = html.match(/"captionTracks":(\[.*?\])/);
  if (!match) return null;

  let tracks: Array<{ baseUrl: string; languageCode: string; kind?: string }>;
  try {
    tracks = JSON.parse(match[1]);
  } catch {
    return null;
  }

  if (!tracks || tracks.length === 0) return null;

  // Prefer auto-generated English, then any English, then first available
  const track =
    tracks.find((t) => t.languageCode === "en" && t.kind === "asr") ||
    tracks.find((t) => t.languageCode === "en") ||
    tracks.find((t) => t.languageCode?.startsWith("en")) ||
    tracks[0];

  if (!track?.baseUrl) return null;

  // Step 2: fetch the timed text as JSON3
  const timedRes = await fetch(`${track.baseUrl}&fmt=json3`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!timedRes.ok) return null;

  const timedData = await timedRes.json() as {
    events?: Array<{ segs?: Array<{ utf8: string }>; tStartMs?: number; dDurationMs?: number }>;
  };

  if (!timedData.events) return null;

  const segments: TranscriptSegmentRaw[] = [];
  for (const event of timedData.events) {
    if (!event.segs) continue;
    const text = event.segs.map((s) => s.utf8 ?? "").join("").replace(/\n/g, " ").trim();
    if (!text || text === " ") continue;
    segments.push({
      text,
      start: (event.tStartMs ?? 0) / 1000,
      duration: (event.dDurationMs ?? 5000) / 1000,
    });
  }

  return segments.length > 0 ? segments : null;
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as { limit?: number };
  const limit = Math.min(Math.max(1, body.limit ?? 20), 100);

  const episodesWithTranscripts = await prisma.transcriptSegment.groupBy({
    by: ["episodeId"],
    _count: { id: true },
  });
  const hasTranscript = new Set(episodesWithTranscripts.map((e) => e.episodeId));

  const episodes = await prisma.episode.findMany({
    where: { youtubeVideoId: { not: null }, status: "published" },
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
      const rawSegments = await fetchTranscriptInnertube(videoId);

      if (!rawSegments || rawSegments.length === 0) {
        results.push({ episodeId: ep.id, slug: ep.slug, videoId, status: "no_transcript" });
      } else {
        await prisma.transcriptSegment.createMany({
          data: rawSegments.map((seg) => {
            const start = Math.round(seg.start);
            const end = Math.round(seg.start + seg.duration);
            const text = seg.text.replace(/\[.*?\]/g, "").trim();
            return { episodeId: ep.id, startSeconds: start, endSeconds: end, text, searchText: text.toLowerCase() };
          }),
          skipDuplicates: true,
        });

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
