import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { notifyTranscriptReady } from "@/lib/notifications";
import { YoutubeTranscript } from "youtube-transcript";

export const runtime = "nodejs";
// Vercel serverless function limit. 300s requires Pro, or Hobby with Fluid Compute
// enabled; on classic Hobby the ceiling is 60s and this value does NOT raise it.
// Exceeding whatever the real limit is kills the function and returns a 504
// FUNCTION_INVOCATION_TIMEOUT *HTML* page — which is what made the admin panel say
// "Network error." Do not trust this number; ROUTE_BUDGET_MS is the real guard.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const DELAY_MS = 2000; // 2s between requests — polite to YouTube's caption endpoint.
const SUPADATA_BASE = "https://api.supadata.ai/v1";

// Wall-clock budget for the whole request. We stop *starting* new episodes past this
// and return partial results as JSON, rather than letting Vercel kill the function
// mid-flight and hand the browser a non-JSON 504 page.
//
// Defaults to 45s: safe even on classic Hobby (60s ceiling), leaving headroom for the
// final DB writes and serialization. That's conservative — it means fewer episodes per
// click, and the caller just clicks again. If this project is on Pro or has Fluid
// Compute enabled, raise it via SYNC_TRANSCRIPTS_BUDGET_MS (e.g. 240000) to do more
// per request. Setting it above the plan's real limit reintroduces the 504.
const ROUTE_BUDGET_MS = (() => {
  const raw = Number(process.env.SYNC_TRANSCRIPTS_BUDGET_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 45_000;
})();

// Supadata async jobs used to poll 12x5s (60s) — a single slow episode could eat a
// fifth of the entire budget. Capped, and deadline-aware on top of that.
const SUPADATA_POLL_ATTEMPTS = 6;
const SUPADATA_POLL_INTERVAL_MS = 5000;

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
  method?: string;
}

interface SupadataChunk {
  text: string;
  offset: number;
  duration: number;
  lang: string;
}

interface SupadataTranscript {
  content: SupadataChunk[] | string;
  lang: string;
  availableLangs?: string[];
}

interface SupadataJobId {
  jobId: string;
}

async function fetchTranscriptYT(
  videoId: string
): Promise<{ chunks: SupadataChunk[] | null; reason: string }> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
    if (!segments || segments.length === 0) return { chunks: null, reason: "yt_empty" };
    const chunks: SupadataChunk[] = segments.map((s) => ({
      text: s.text,
      offset: s.offset,   // already milliseconds from InnerTube path
      duration: s.duration,
      lang: s.lang ?? "en",
    }));
    return { chunks, reason: "youtube-transcript" };
  } catch {
    return { chunks: null, reason: "yt_no_captions" };
  }
}

async function fetchTranscriptSupadata(
  videoId: string,
  apiKey: string,
  deadlineAt: number
): Promise<{ chunks: SupadataChunk[] | null; reason: string; rateLimited?: boolean }> {
  // Try YouTube-specific GET endpoint first (works for both native captions and ASR)
  const params = new URLSearchParams({ videoId, lang: "en" });
  let res = await fetch(`${SUPADATA_BASE}/youtube/transcript?${params}`, {
    headers: { "x-api-key": apiKey },
  });

  // Fall back to general POST endpoint
  if (!res.ok && res.status === 404) {
    res = await fetch(`${SUPADATA_BASE}/transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${videoId}`, lang: "en" }),
    });
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) {
      return { chunks: null, reason: `supadata_429: ${body.slice(0, 200)}`, rateLimited: true };
    }
    return { chunks: null, reason: `supadata_${res.status}: ${body.slice(0, 200)}` };
  }

  const data = (await res.json()) as SupadataTranscript | SupadataJobId;

  // Async job — poll at a fixed interval, bounded by both an attempt cap and the
  // caller's wall-clock deadline (whichever comes first).
  if ("jobId" in data) {
    for (let attempt = 0; attempt < SUPADATA_POLL_ATTEMPTS; attempt++) {
      if (Date.now() + SUPADATA_POLL_INTERVAL_MS > deadlineAt) {
        return { chunks: null, reason: "supadata_job_deadline" };
      }
      await sleep(SUPADATA_POLL_INTERVAL_MS);
      const jobRes = await fetch(`${SUPADATA_BASE}/transcript/${data.jobId}`, {
        headers: { "x-api-key": apiKey },
      });
      if (!jobRes.ok) return { chunks: null, reason: `supadata_job_${jobRes.status}` };
      const jobData = (await jobRes.json()) as { status: string; result?: SupadataTranscript };
      if (jobData.status === "done" && jobData.result) {
        const content = jobData.result.content;
        if (typeof content === "string" || !Array.isArray(content) || content.length === 0) {
          return { chunks: null, reason: "supadata_empty_job" };
        }
        return { chunks: content, reason: "supadata_async" };
      }
      if (jobData.status === "failed" || jobData.status === "error") {
        return { chunks: null, reason: `supadata_job_${jobData.status}` };
      }
    }
    return { chunks: null, reason: "supadata_job_timeout" };
  }

  const content = (data as SupadataTranscript).content;
  if (typeof content === "string" || !Array.isArray(content) || content.length === 0) {
    return { chunks: null, reason: "supadata_empty" };
  }
  return { chunks: content, reason: "supadata" };
}

export async function POST(req: NextRequest) {
  const deadlineAt = Date.now() + ROUTE_BUDGET_MS;

  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const supadataKey = process.env.SUPADATA_API_KEY;
  if (!supadataKey) {
    return NextResponse.json(
      { error: "SUPADATA_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({})) as { limit?: number; retry?: boolean; reset?: boolean };
  const limit = Math.min(Math.max(1, body.limit ?? 10), 100);
  const retry = body.retry === true;
  const reset = body.reset === true;

  // reset=true clears the "no_captions" sentinel so all previously-failed episodes
  // get another attempt (useful after adding a new transcript source).
  if (reset) {
    await prisma.episode.updateMany({
      where: { transcriptRaw: "no_captions" },
      data: { transcriptRaw: null },
    });
  }

  // No hardcoded skip list needed — the DB sentinel (transcriptRaw = "no_captions")
  // permanently excludes episodes confirmed as empty/age-restricted.
  // The WHERE clause below filters them out at query time.
  // (retry=true bypasses this so you can re-attempt previously-marked episodes.)

  const episodesWithTranscripts = await prisma.transcriptSegment.groupBy({
    by: ["episodeId"],
    _count: { id: true },
  });
  const hasTranscript = new Set(episodesWithTranscripts.map((e) => e.episodeId));

  // "no_captions" sentinel = previously confirmed unavailable (skip unless retry).
  const episodes = await prisma.episode.findMany({
    where: {
      youtubeVideoId: { not: null },
      status: "published",
      ...(retry ? {} : { transcriptRaw: { not: "no_captions" } }),
    },
    select: { id: true, slug: true, youtubeVideoId: true },
    orderBy: { airDate: "asc" },
  });

  const pending = episodes.filter((ep) => !hasTranscript.has(ep.id)).slice(0, limit);
  const totalPending = episodes.filter((ep) => !hasTranscript.has(ep.id)).length;

  const results: TranscriptResult[] = [];

  let rateLimited = false;
  let timedOut = false;
  // Episodes stamped with the "no_captions" sentinel drop out of the pending query
  // on future runs, so they count as resolved even though they produced no transcript.
  // A transient miss (deadline, job timeout) is *not* stamped and stays pending.
  let markedPermanent = 0;

  for (let i = 0; i < pending.length; i++) {
    // Stop before starting an episode we probably can't finish. Returning partial
    // results as JSON beats being killed mid-request — the caller reads `remaining`
    // and clicks again. Episodes not reached are simply left untouched.
    if (Date.now() >= deadlineAt) {
      timedOut = true;
      break;
    }

    const ep = pending[i];
    const videoId = ep.youtubeVideoId!;

    try {
      // Try YouTube's caption API first (free, fast, no quota)
      let { chunks, reason } = await fetchTranscriptYT(videoId);

      // Fall back to Supadata for age-restricted / ASR-only / harder videos
      if (!chunks) {
        const sup = await fetchTranscriptSupadata(videoId, supadataKey, deadlineAt);
        chunks = sup.chunks;
        reason = sup.reason;
        if (sup.rateLimited) {
          // Plan limit exceeded — stop immediately, don't burn more quota
          rateLimited = true;
          results.push({ episodeId: ep.id, slug: ep.slug, videoId, status: "error", error: "Supadata plan limit exceeded", reason });
          break;
        }
      }

      if (!chunks) {
        // Mark permanently unavailable episodes so we skip them on future runs.
        // 404 = no captions; 403 = age-restricted (can't fetch); empty = no transcript data.
        const permanent = reason.startsWith("supadata_404") || reason.startsWith("supadata_403") || reason.startsWith("supadata_empty") || reason === "yt_no_captions" || reason === "yt_empty";
        let markReason = reason;
        if (permanent) {
          try {
            await prisma.episode.update({
              where: { id: ep.id },
              data: { transcriptRaw: "no_captions" },
            });
            markedPermanent++;
            markReason = `${reason} [marked]`;
          } catch (dbErr) {
            const dbMsg = dbErr instanceof Error ? dbErr.message : String(dbErr);
            markReason = `${reason} [mark_failed: ${dbMsg.slice(0, 80)}]`;
          }
        }
        results.push({ episodeId: ep.id, slug: ep.slug, videoId, status: "no_transcript", reason: markReason });
      } else {
        await prisma.transcriptSegment.createMany({
          data: chunks.map((chunk) => {
            const startSeconds = Math.round(chunk.offset / 1000);
            const endSeconds = Math.round((chunk.offset + chunk.duration) / 1000);
            const text = chunk.text.replace(/\[.*?\]/g, "").trim();
            return { episodeId: ep.id, startSeconds, endSeconds, text, searchText: text.toLowerCase() };
          }),
          skipDuplicates: true,
        });

        const rawText = chunks.map((c) => c.text).join(" ");
        await prisma.episode.update({
          where: { id: ep.id },
          data: {
            transcriptRaw: rawText.slice(0, 200000),
            searchText: [ep.slug, rawText].join(" ").toLowerCase().slice(0, 10000),
          },
        });

        // Email anyone who requested a transcript-ready notice for this episode.
        // Never let a mail failure abort the sync run.
        await notifyTranscriptReady(ep.id).catch((err) =>
          console.error(`[sync-transcripts] notify failed for ${ep.slug}:`, err)
        );

        results.push({
          episodeId: ep.id,
          slug: ep.slug,
          videoId,
          status: "ok",
          segments: chunks.length,
          method: reason,
        });
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
    remaining:
      totalPending - results.filter((r) => r.status === "ok").length - markedPermanent,
    ...(rateLimited ? { rateLimited: true } : {}),
    ...(timedOut ? { timedOut: true } : {}),
  };

  if (rateLimited) {
    return NextResponse.json({ ok: false, error: "Supadata plan limit exceeded. Upgrade your plan or wait for the quota to reset.", summary, results }, { status: 429 });
  }

  return NextResponse.json({ ok: true, summary, results });
}
