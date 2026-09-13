/**
 * POST /api/search/semantic
 *
 * Multi-concept vector similarity search over transcript segments.
 * Subscription-gated — admin or active subscriber only.
 *
 * Body:
 *   concepts  Array<{ concept: string; threshold?: number }> (1–5 concepts)
 *   limit     number of results (default 20, max 50)
 *   eraId     optional era id to filter by air date range
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import { semanticSearch } from "@/lib/queries/semantic";
import { getEraById } from "@/lib/eras";
import { rateLimit, sharedRateLimit, clientKey } from "@/lib/rate-limit";
import { consumeLlmBudget } from "@/lib/llm-budget";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();
  const canAccess = user
    ? user.role === "admin" || (await isSubscribed(user.id))
    : false;

  if (!canAccess) {
    return NextResponse.json(
      { error: "Deep search requires an active subscription." },
      { status: 403 }
    );
  }

  // Each query embeds its concepts via OpenAI — throttle to bound cost.
  const callerKey = clientKey(req, user?.id);
  const rl = rateLimit(`semantic:${callerKey}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many searches. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }
  const sharedRl = await sharedRateLimit("semantic", callerKey, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!sharedRl.ok) {
    return NextResponse.json(
      { error: "Too many searches. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(sharedRl.retryAfterSec) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
  }

  const { concepts, limit, eraId } = body as Record<string, unknown>;

  if (!Array.isArray(concepts) || concepts.length === 0 || concepts.length > 5) {
    return NextResponse.json(
      { error: "concepts must be an array of 1–5 items." },
      { status: 400 }
    );
  }

  const parsedConcepts = concepts.map((c) => {
    if (typeof c !== "object" || !c || typeof (c as Record<string, unknown>).concept !== "string") {
      throw new Error("Each concept must be { concept: string; threshold?: number }");
    }
    const obj = c as Record<string, unknown>;
    return {
      concept: String(obj.concept).slice(0, 200),
      threshold: typeof obj.threshold === "number" ? Math.min(Math.max(obj.threshold, 0), 1) : 0.6,
    };
  });

  const parsedLimit = typeof limit === "number" ? Math.min(Math.max(Math.floor(limit), 1), 50) : 20;

  // Denial-of-wallet guard: each concept is an OpenAI embedding call. A per-IP
  // rate limit can't stop an IP-rotating attacker, so also charge the GLOBAL
  // daily cap (one unit per concept). AI_KILLSWITCH=1 disables instantly.
  const budget = await consumeLlmBudget(
    "semantic",
    Number(process.env.SEMANTIC_DAILY_CAP ?? "1000"),
    parsedConcepts.length,
  );
  if (!budget.ok) {
    const status = budget.reason === "store_error" ? 503 : 429;
    const error =
      budget.reason === "killswitch"
        ? "Deep search is temporarily disabled."
        : budget.reason === "store_error"
          ? "Deep search is temporarily unavailable. Please try again."
          : "Deep search is busy right now. Please try again later.";
    return NextResponse.json({ error }, { status });
  }

  let eraDateStart: Date | undefined;
  let eraDateEnd: Date | undefined;
  if (typeof eraId === "string" && eraId) {
    const era = getEraById(eraId);
    if (era) {
      eraDateStart = new Date(era.dateStart);
      eraDateEnd = era.dateEnd ? new Date(era.dateEnd) : undefined;
    }
  }

  try {
    const results = await semanticSearch(parsedConcepts, {
      limit: parsedLimit,
      eraDateStart,
      eraDateEnd,
    });
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[semantic-search] error:", err);
    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  }
}
