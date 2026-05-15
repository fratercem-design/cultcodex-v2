import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const DELAY_MS = 1200;
const INNERTUBE_URL = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";
const ANDROID_VERSION = "20.10.38";
const ANDROID_UA = `com.google.android.youtube/${ANDROID_VERSION} (Linux; U; Android 14)`;

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
  reason?: string;
}

interface TimedEvent {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: Array<{ utf8?: string }>;
}

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
}

async function fetchCaptionTracks(videoId: string): Promise<CaptionTrack[] | null> {
  const res = await fetch(INNERTUBE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": ANDROID_UA,
    },
    body: JSON.stringify({
      context: {
        client: { clientName: "ANDROID", clientVersion: ANDROID_VERSION },
      },
      videoId,
    }),
  });

  if (!res.ok) return null;

  const data = await res.json() as {
    captions?: {
      playerCaptionsTracklistRenderer?: {
        captionTracks?: CaptionTrack[];
      };
    };
  };

  const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  return Array.isArray(tracks) && tracks.length > 0 ? tracks : null;
}

async function fetchSegmentsFromTrack(
  track: CaptionTrack
): Promise<Array<{ text: string; startMs: number; durationMs: number }> | null> {
  const url = `${track.baseUrl}&fmt=json3`;
  const res = await fetch(url, { headers: { "User-Agent": ANDROID_UA } });
  if (!res.ok) return null;

  const data = await res.json() as { events?: TimedEvent[] };
  if (!data.events) return null;

  const segments: Array<{ text: string; startMs: number; durationMs: number }> = [];
  for (const event of data.events) {
    if (!event.segs) continue;
    const text = event.segs.map((s) => s.utf8 ?? "").join("").replace(/\n/g, " ").trim();
    if (!text || text === " ") continue;
    segments.push({
      text,
      startMs: event.tStartMs ?? 0,
      durationMs: event.dDurationMs ?? 5000,
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
    orderBy: { airDate: "asc" },
  });

  const pending = episodes.filter((ep) => !hasTranscript.has(ep.id)).slice(0, limit);
  const totalPending = episodes.filter((ep) => !hasTranscript.has(ep.id)).length;

  const results: TranscriptResult[] = [];

  for (let i = 0; i < pending.length; i++) {
    const ep = pending[i];
    const videoId = ep.youtubeVideoId!;

    try {
      // Innertube API only — no web scraping, no consent page exposure
      const tracks = await fetchCaptionTracks(videoId);

      if (!tracks) {
        results.push({ episodeId: ep.id, slug: ep.slug, videoId, status: "no_transcript", reason: "no_captions" });
      } else {
        // Prefer ASR (auto-generated) English, then any English, then first track
        const track =
          tracks.find((t) => t.languageCode === "en" && t.kind === "asr") ||
          tracks.find((t) => t.languageCode === "en") ||
          tracks.find((t) => t.languageCode?.startsWith("en")) ||
          tracks[0];

        const rawSegments = await fetchSegmentsFromTrack(track);

        if (!rawSegments) {
          results.push({ episodeId: ep.id, slug: ep.slug, videoId, status: "no_transcript", reason: "empty_track" });
        } else {
          await prisma.transcriptSegment.createMany({
            data: rawSegments.map((seg) => {
              const startSeconds = Math.round(seg.startMs / 1000);
              const endSeconds = Math.round((seg.startMs + seg.durationMs) / 1000);
              const text = seg.text.replace(/\[.*?\]/g, "").trim();
              return { episodeId: ep.id, startSeconds, endSeconds, text, searchText: text.toLowerCase() };
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
  };

  return NextResponse.json({ ok: true, summary, results });
}
