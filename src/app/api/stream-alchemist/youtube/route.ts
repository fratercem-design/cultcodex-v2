import { NextRequest, NextResponse } from "next/server";
import { rateLimit, sharedRateLimit, clientKey } from "@/lib/rate-limit";
import { consumeDailyBudget } from "@/lib/llm-budget";
import { captionsToTranscript, parseYouTubeId } from "@/lib/stream-alchemist/youtube";
import {
  fetchFromSupadata,
  fetchFromYouTube,
  supadataEnabled,
  YouTubeImportError,
} from "@/lib/stream-alchemist/youtube-fetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPADATA_PER_CALLER_PER_DAY = 10;
const SUPADATA_DAILY_CAP = Number(process.env.STREAM_ALCHEMIST_SUPADATA_DAILY_CAP ?? 50);

// The same video is often imported twice (retry, then analyze again).
// Per-process cache of finished transcripts keeps repeat requests off YouTube.
const cache = new Map<string, { transcript: string; source: string }>();
const CACHE_MAX = 100;

function remember(videoId: string, value: { transcript: string; source: string }) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
  cache.set(videoId, value);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const videoId = typeof body?.url === "string" ? parseYouTubeId(body.url) : null;
  if (!videoId) {
    return NextResponse.json({ error: "That doesn't look like a YouTube video link." }, { status: 400 });
  }

  const cached = cache.get(videoId);
  if (cached) return NextResponse.json({ videoId, ...cached });

  const caller = clientKey(req);
  const burst = rateLimit(`stream-alchemist-yt:${caller}`, { limit: 10, windowMs: 60_000 });
  if (!burst.ok) {
    return NextResponse.json(
      { error: "Too many imports. Try again in a minute." },
      { status: 429, headers: { "Retry-After": String(burst.retryAfterSec) } },
    );
  }

  const deadlineAt = Date.now() + 50_000;
  let chunks;
  let source = "youtube";
  try {
    chunks = await fetchFromYouTube(videoId);
  } catch (err) {
    const known = err instanceof YouTubeImportError ? err : new YouTubeImportError("Couldn't get captions from YouTube.", true);
    if (!known.retryable || !supadataEnabled()) {
      if (!(err instanceof YouTubeImportError)) console.error("[stream-alchemist] YouTube import failed:", err);
      return NextResponse.json({ error: `${known.message} ${FALLBACK_HINT}` }, { status: 422 });
    }
    // Paid fallback: capped per caller and site-wide.
    const perCaller = await sharedRateLimit("stream-alchemist-supadata", caller, {
      limit: SUPADATA_PER_CALLER_PER_DAY,
      windowMs: 24 * 60 * 60 * 1000,
    });
    const budget = perCaller.ok ? await consumeDailyBudget("stream-alchemist-supadata", SUPADATA_DAILY_CAP) : null;
    if (!perCaller.ok || !budget?.ok) {
      return NextResponse.json({ error: `${known.message} ${FALLBACK_HINT}` }, { status: 422 });
    }
    try {
      chunks = await fetchFromSupadata(videoId, deadlineAt);
      source = "supadata";
    } catch (fallbackErr) {
      if (!(fallbackErr instanceof YouTubeImportError)) console.error("[stream-alchemist] Supadata failed:", fallbackErr);
      const message = fallbackErr instanceof YouTubeImportError ? fallbackErr.message : known.message;
      return NextResponse.json({ error: `${message} ${FALLBACK_HINT}` }, { status: 422 });
    }
  }

  const transcript = captionsToTranscript(chunks);
  if (!transcript) {
    return NextResponse.json({ error: `This video's captions are empty. ${FALLBACK_HINT}` }, { status: 422 });
  }
  remember(videoId, { transcript, source });
  return NextResponse.json({ videoId, transcript, source });
}

const FALLBACK_HINT =
  "You can still download the captions file from YouTube Studio (Subtitles → ⋮ → Download .srt) and open it here.";
