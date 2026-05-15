import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface Segment {
  text: string;
  startMs: number;
  durationMs: number;
}

interface TranscriptResult {
  episodeId: string;
  slug: string;
  videoId: string;
  status: "ok" | "no_transcript" | "error";
  segments?: number;
  method?: string;
  error?: string;
  reason?: string;
}

// ── Supadata API ──────────────────────────────────────────────────────────────
// Sign up at supadata.ai — handles YouTube IP-blocking transparently.
// Set SUPADATA_API_KEY in Vercel env vars to enable this primary path.
async function fetchViaSupadata(videoId: string): Promise<Segment[] | null> {
  const key = process.env.SUPADATA_API_KEY;
  if (!key) return null;

  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&lang=en`,
    { headers: { "x-api-key": key } }
  );

  if (!res.ok) return null;

  const data = await res.json() as {
    content?: Array<{ text: string; offset: number; duration: number }>;
  };

  if (!data.content?.length) {
    // Try without language constraint (some videos have non-en auto-captions)
    const res2 = await fetch(
      `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}`,
      { headers: { "x-api-key": key } }
    );
    if (!res2.ok) return null;
    const data2 = await res2.json() as {
      content?: Array<{ text: string; offset: number; duration: number }>;
    };
    if (!data2.content?.length) return null;
    return data2.content.map((c) => ({ text: c.text, startMs: c.offset, durationMs: c.duration }));
  }

  return data.content.map((c) => ({ text: c.text, startMs: c.offset, durationMs: c.duration }));
}

// ── Innertube WEB client ──────────────────────────────────────────────────────
// Uses YouTube's public web key + WEB client — more reliable from datacenter
// IPs than the ANDROID client. Falls back to this when Supadata is not configured.
const YT_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const WEB_VERSION = "2.20240101.00.00";

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
}

interface TimedEvent {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: Array<{ utf8?: string }>;
}

async function fetchViaInnertube(videoId: string): Promise<{ segments: Segment[] | null; reason: string }> {
  const res = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${YT_KEY}&prettyPrint=false`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://www.youtube.com",
        "X-Youtube-Client-Name": "1",
        "X-Youtube-Client-Version": WEB_VERSION,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        videoId,
        context: {
          client: {
            clientName: "WEB",
            clientVersion: WEB_VERSION,
            hl: "en",
            gl: "US",
          },
        },
      }),
    }
  );

  if (!res.ok) return { segments: null, reason: `innertube_${res.status}` };

  const data = await res.json() as {
    captions?: {
      playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] };
    };
  };

  const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return { segments: null, reason: "no_caption_tracks" };
  }

  const track =
    tracks.find((t) => t.languageCode === "en" && t.kind === "asr") ||
    tracks.find((t) => t.languageCode === "en") ||
    tracks.find((t) => t.languageCode?.startsWith("en")) ||
    tracks[0];

  if (!track?.baseUrl) return { segments: null, reason: "no_baseUrl" };

  const timedRes = await fetch(`${track.baseUrl}&fmt=json3`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!timedRes.ok) return { segments: null, reason: `timed_${timedRes.status}` };

  const timedData = await timedRes.json() as { events?: TimedEvent[] };
  if (!timedData.events) return { segments: null, reason: "no_events" };

  const segments: Segment[] = [];
  for (const ev of timedData.events) {
    if (!ev.segs) continue;
    const text = ev.segs.map((s) => s.utf8 ?? "").join("").replace(/\n/g, " ").trim();
    if (!text || text === " ") continue;
    segments.push({ text, startMs: ev.tStartMs ?? 0, durationMs: ev.dDurationMs ?? 5000 });
  }

  return segments.length > 0
    ? { segments, reason: "ok" }
    : { segments: null, reason: "empty_events" };
}

// ── Persist segments to DB ────────────────────────────────────────────────────
async function saveSegments(episodeId: string, slug: string, segments: Segment[]) {
  await prisma.transcriptSegment.createMany({
    data: segments.map((seg) => {
      const startSeconds = Math.round(seg.startMs / 1000);
      const endSeconds = Math.round((seg.startMs + seg.durationMs) / 1000);
      const text = seg.text.replace(/\[.*?\]/g, "").trim();
      return { episodeId, startSeconds, endSeconds, text, searchText: text.toLowerCase() };
    }),
    skipDuplicates: true,
  });

  const rawText = segments.map((s) => s.text).join(" ");
  await prisma.episode.update({
    where: { id: episodeId },
    data: {
      transcriptRaw: rawText.slice(0, 200000),
      searchText: [slug, rawText].join(" ").toLowerCase().slice(0, 10000),
    },
  });
}

// ── Route ─────────────────────────────────────────────────────────────────────
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
    orderBy: { airDate: "asc" },
  });

  const pending = episodes.filter((ep) => !hasTranscript.has(ep.id)).slice(0, limit);
  const totalPending = episodes.filter((ep) => !hasTranscript.has(ep.id)).length;

  const usesSupadata = !!process.env.SUPADATA_API_KEY;
  const results: TranscriptResult[] = [];

  for (let i = 0; i < pending.length; i++) {
    const ep = pending[i];
    const videoId = ep.youtubeVideoId!;

    try {
      // Primary: Supadata (if configured) — bypasses IP blocking reliably
      if (usesSupadata) {
        const segments = await fetchViaSupadata(videoId);
        if (segments && segments.length > 0) {
          await saveSegments(ep.id, ep.slug, segments);
          results.push({ episodeId: ep.id, slug: ep.slug, videoId, status: "ok", segments: segments.length, method: "supadata" });
          if (i < pending.length - 1) await sleep(DELAY_MS);
          continue;
        }
      }

      // Fallback: Innertube WEB client
      const { segments: itSegments, reason } = await fetchViaInnertube(videoId);
      if (itSegments && itSegments.length > 0) {
        await saveSegments(ep.id, ep.slug, itSegments);
        results.push({ episodeId: ep.id, slug: ep.slug, videoId, status: "ok", segments: itSegments.length, method: "innertube_web" });
      } else {
        results.push({ episodeId: ep.id, slug: ep.slug, videoId, status: "no_transcript", reason, method: usesSupadata ? "supadata+innertube" : "innertube_web" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ episodeId: ep.id, slug: ep.slug, videoId, status: "error", error: msg.slice(0, 150) });
    }

    if (i < pending.length - 1) await sleep(DELAY_MS);
  }

  const summary = {
    processed: results.length,
    ok: results.filter((r) => r.status === "ok").length,
    no_transcript: results.filter((r) => r.status === "no_transcript").length,
    errors: results.filter((r) => r.status === "error").length,
    remaining: totalPending - results.length,
    method: usesSupadata ? "supadata_primary" : "innertube_web_only",
  };

  return NextResponse.json({ ok: true, summary, results });
}
