import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, sharedRateLimit, clientKey } from "@/lib/rate-limit";
import { consumeLlmBudget } from "@/lib/llm-budget";
import { findClips, TARGET_CLIPS } from "@/lib/stream-alchemist/analyze-local";
import { analyzeWithClaude, claudeConfigured } from "@/lib/stream-alchemist/analyze-claude";
import { lockClips } from "@/lib/stream-alchemist/pricing";
import { parseTranscript } from "@/lib/stream-alchemist/transcript";
import type { AnalysisResult, Clip } from "@/lib/stream-alchemist/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MIN_CHARS = 300;
// ~3 hours of speech. Longer inputs are rejected rather than silently cut.
const MAX_CHARS = 200_000;
const AI_PER_CALLER_PER_DAY = 5;
const AI_DAILY_CAP = Number(process.env.STREAM_ALCHEMIST_DAILY_AI_CAP ?? 100);

// Identical transcripts (the demo, retries) reuse an earlier AI result
// instead of paying for it again. Per-process; that's enough for a demo.
const aiCache = new Map<string, Clip[]>();
const AI_CACHE_MAX = 100;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const transcript = typeof body?.transcript === "string" ? body.transcript : "";

  if (transcript.trim().length < MIN_CHARS) {
    return json({ error: "Paste a longer transcript: a few minutes of talk at least." }, 400);
  }
  if (transcript.length > MAX_CHARS) {
    return json(
      { error: `That transcript is ${transcript.length.toLocaleString()} characters. The limit is ${MAX_CHARS.toLocaleString()} (about 3 hours). Split it and run each part.` },
      413,
    );
  }

  const caller = clientKey(req);
  const burst = rateLimit(`stream-alchemist:${caller}`, { limit: 20, windowMs: 60_000 });
  if (!burst.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429, headers: { "Retry-After": String(burst.retryAfterSec) } },
    );
  }

  const parsed = parseTranscript(transcript);
  let mode: AnalysisResult["mode"] = "demo";
  let clips: Clip[] | null = null;
  let notice: string | undefined;

  if (claudeConfigured()) {
    const key = createHash("sha256").update(transcript).digest("hex");
    const cached = aiCache.get(key);
    if (cached) {
      clips = cached;
      mode = "ai";
    } else {
      const perCaller = await sharedRateLimit("stream-alchemist-ai", caller, {
        limit: AI_PER_CALLER_PER_DAY,
        windowMs: 24 * 60 * 60 * 1000,
      });
      const budget = perCaller.ok ? await consumeLlmBudget("stream-alchemist", AI_DAILY_CAP) : null;
      if (perCaller.ok && budget?.ok) {
        try {
          clips = await analyzeWithClaude(parsed, TARGET_CLIPS);
          mode = "ai";
          if (aiCache.size >= AI_CACHE_MAX) aiCache.delete(aiCache.keys().next().value!);
          aiCache.set(key, clips);
        } catch (err) {
          console.error("[stream-alchemist] AI analysis failed, using local engine:", err);
          notice = "The AI engine didn't answer, so these clips come from the built-in engine.";
        }
      } else {
        notice = "Today's AI analyses are used up, so these clips come from the built-in engine.";
      }
    }
  }

  if (!clips?.length) clips = findClips(parsed, TARGET_CLIPS);
  if (!clips.length) {
    return json({ error: "Couldn't find any clip-length moments. Paste at least a few minutes of transcript." }, 422);
  }

  const result: AnalysisResult = {
    mode,
    hasTimestamps: parsed.hasTimestamps,
    ...lockClips(clips),
    ...(notice ? { notice } : {}),
  };
  return json(result);
}
