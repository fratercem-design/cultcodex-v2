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
  reason?: string;
}

const CHROME_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

function parseTimedEvents(timedData: { events?: Array<{ segs?: Array<{ utf8: string }>; tStartMs?: number; dDurationMs?: number }> }): TranscriptSegmentRaw[] {
  const segments: TranscriptSegmentRaw[] = [];
  for (const event of timedData.events ?? []) {
    if (!event.segs) continue;
    const text = event.segs.map((s) => s.utf8 ?? "").join("").replace(/\n/g, " ").trim();
    if (!text || text === " ") continue;
    segments.push({
      text,
      start: (event.tStartMs ?? 0) / 1000,
      duration: (event.dDurationMs ?? 5000) / 1000,
    });
  }
  return segments;
}

// Returns segments and a reason string for diagnostics.
async function fetchTranscriptInnertube(videoId: string): Promise<{ segments: TranscriptSegmentRaw[] | null; reason: string }> {
  // Step 1: get the transcript track URL from the video page
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers: CHROME_HEADERS });

  if (!pageRes.ok) return { segments: null, reason: `page_${pageRes.status}` };
  const html = await pageRes.text();

  // Try broad regex first, then tighter fallback
  const match = html.match(/"captionTracks":(\[[\s\S]*?\](?=[,}]))/);
  if (!match) {
    // Try direct timedtext API as fallback (works for some videos without parsing page)
    return tryDirectTimedtext(videoId, html);
  }

  let tracks: Array<{ baseUrl: string; languageCode: string; kind?: string }>;
  try {
    tracks = JSON.parse(match[1]);
  } catch {
    return tryDirectTimedtext(videoId, html);
  }

  if (!tracks || tracks.length === 0) return tryDirectTimedtext(videoId, html);

  // Prefer auto-generated English, then any English, then first available
  const track =
    tracks.find((t) => t.languageCode === "en" && t.kind === "asr") ||
    tracks.find((t) => t.languageCode === "en") ||
    tracks.find((t) => t.languageCode?.startsWith("en")) ||
    tracks[0];

  if (!track?.baseUrl) return { segments: null, reason: "no_baseUrl" };

  // Step 2: fetch the timed text as JSON3
  const timedRes = await fetch(`${track.baseUrl}&fmt=json3`, { headers: { "User-Agent": CHROME_HEADERS["User-Agent"] } });
  if (!timedRes.ok) return { segments: null, reason: `timed_${timedRes.status}` };

  const timedData = await timedRes.json() as { events?: Array<{ segs?: Array<{ utf8: string }>; tStartMs?: number; dDurationMs?: number }> };
  if (!timedData.events) return { segments: null, reason: "no_events" };

  const segments = parseTimedEvents(timedData);
  return { segments: segments.length > 0 ? segments : null, reason: segments.length > 0 ? "ok" : "empty_segments" };
}

async function tryDirectTimedtext(videoId: string, html: string): Promise<{ segments: TranscriptSegmentRaw[] | null; reason: string }> {
  // Diagnose why page parse failed
  const hasPlayerResponse = html.includes("playerResponse") || html.includes("ytInitialPlayerResponse");
  const hasCaptionTracks = html.includes("captionTracks");
  const isConsentPage = html.includes("consent.youtube.com") || html.includes("CONSENT");
  const diagReason = isConsentPage ? "consent_page" : !hasPlayerResponse ? "no_player_response" : hasCaptionTracks ? "caption_tracks_parse_failed" : "no_caption_tracks";

  // Try direct timedtext API — works for some videos
  for (const lang of ["en", "en-US"]) {
    const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": CHROME_HEADERS["User-Agent"] } });
      if (!res.ok) continue;
      const data = await res.json() as { events?: Array<{ segs?: Array<{ utf8: string }>; tStartMs?: number; dDurationMs?: number }> };
      if (!data.events) continue;
      const segments = parseTimedEvents(data);
      if (segments.length > 0) return { segments, reason: "direct_timedtext" };
    } catch { continue; }
  }

  return { segments: null, reason: diagReason };
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
    where: {
      youtubeVideoId: { not: null },
      status: "published",
      // Skip live-stream episodes — YouTube live streams rarely have auto-captions
      slug: { not: { contains: "-live-" } },
    },
    select: { id: true, slug: true, youtubeVideoId: true },
    orderBy: { airDate: "asc" },
  });

  const pending = episodes.filter((ep) => !hasTranscript.has(ep.id)).slice(0, limit);
  const totalPending = episodes.filter((ep) => !hasTranscript.has(ep.id)).length;

  const results: TranscriptResult[] = [];

  for (let i = 0; i < pending.length; i++) {
    const ep = pending[i];
    const videoId = ep.youtubeVideoId!;

    try {
      const { segments: rawSegments, reason } = await fetchTranscriptInnertube(videoId);

      if (!rawSegments || rawSegments.length === 0) {
        results.push({ episodeId: ep.id, slug: ep.slug, videoId, status: "no_transcript", reason });
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
