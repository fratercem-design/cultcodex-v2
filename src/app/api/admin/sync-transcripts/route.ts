import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const DELAY_MS = 3000;
const SUPADATA_BASE = "https://api.supadata.ai/v1";

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

async function fetchTranscriptSupadata(
  videoId: string,
  apiKey: string
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

  // Async job — poll up to 12 times (1 min) at 5s intervals
  if ("jobId" in data) {
    for (let attempt = 0; attempt < 12; attempt++) {
      await sleep(5000);
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

  const body = await req.json().catch(() => ({})) as { limit?: number; retry?: boolean };
  const limit = Math.min(Math.max(1, body.limit ?? 10), 50);
  const retry = body.retry === true;

  const episodesWithTranscripts = await prisma.transcriptSegment.groupBy({
    by: ["episodeId"],
    _count: { id: true },
  });
  const hasTranscript = new Set(episodesWithTranscripts.map((e) => e.episodeId));

  // "no_captions" sentinel = previously confirmed unavailable.
  // retry: true ignores the sentinel so we can re-try with mode: "generate".
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

  for (let i = 0; i < pending.length; i++) {
    const ep = pending[i];
    const videoId = ep.youtubeVideoId!;

    try {
      const { chunks, reason, rateLimited: hit429 } = await fetchTranscriptSupadata(videoId, supadataKey);

      if (hit429) {
        // Plan limit exceeded — stop immediately, don't burn more quota
        rateLimited = true;
        results.push({ episodeId: ep.id, slug: ep.slug, videoId, status: "error", error: "Supadata plan limit exceeded", reason });
        break;
      }

      if (!chunks) {
        // 404 = confirmed no captions on YouTube; mark so we never retry
        if (reason.startsWith("supadata_404")) {
          await prisma.episode.update({
            where: { id: ep.id },
            data: { transcriptRaw: "no_captions" },
          });
        }
        results.push({ episodeId: ep.id, slug: ep.slug, videoId, status: "no_transcript", reason });
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
    remaining: totalPending - results.length,
    ...(rateLimited ? { rateLimited: true } : {}),
  };

  if (rateLimited) {
    return NextResponse.json({ ok: false, error: "Supadata plan limit exceeded. Upgrade your plan or wait for the quota to reset.", summary, results }, { status: 429 });
  }

  return NextResponse.json({ ok: true, summary, results });
}
