/**
 * POST /api/admin/enrich-topics
 *
 * Temporary enrichment relay — generates AI descriptions for Topic records
 * using Claude Haiku, called from an external script via HTTPS.
 * Auth: X-Enrich-Secret header must match ENRICH_SECRET env var.
 * The LLM provider key is read from server env only and is never accepted
 * from the request body.
 *
 * Body (JSON):
 *   batch        number of topics to process (default 8)
 *   minEpisodes  skip topics with fewer linked episodes (default 2)
 *
 * Returns:
 *   { processed, remaining, results: [{title, ok, error?}] }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrEnrichSecret } from "@/lib/admin-guard";
import { enrichComplete } from "@/lib/enrichment-llm";
import { prisma } from "@/lib/db";
import {
  TOPIC_ENRICHMENT_SYSTEM_PROMPT,
  buildTopicEnrichmentMessage,
} from "@/lib/prompts/topic-enrichment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Auth check
  const denied = await requireAdminOrEnrichSecret(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const batch: number = body.batch ?? 8;
  const minEpisodes: number = body.minEpisodes ?? 2;

  // Fetch topics needing descriptions (with enough episodes)
  const allPending = await prisma.topic.findMany({
    where: { OR: [{ description: null }, { description: "" }] },
    select: { id: true },
    orderBy: { title: "asc" },
  });

  // We need the episode count — filter in JS after fetching counts
  const pendingWithCounts = await prisma.topic.findMany({
    where: {
      id: { in: allPending.map((t) => t.id) },
      episodes: { some: {} },
    },
    select: {
      id: true,
      title: true,
      _count: { select: { episodes: true } },
    },
    orderBy: { title: "asc" },
  });

  const eligible = pendingWithCounts.filter((t) => t._count.episodes >= minEpisodes);
  const remaining = eligible.length;
  const toProcess = eligible.slice(0, batch);

  if (toProcess.length === 0) {
    return NextResponse.json({ processed: 0, remaining: 0, done: true, results: [] });
  }

  // Fetch full context for this batch
  const topicsWithContext = await prisma.topic.findMany({
    where: { id: { in: toProcess.map((t) => t.id) } },
    include: {
      episodes: { include: { episode: { select: { title: true, summaryShort: true } } }, take: 15 },
      lore: { include: { loreEntry: { select: { title: true } } }, take: 5 },
      people: { include: { person: { select: { displayName: true } } }, take: 5 },
    },
  });

  const results: { title: string; ok: boolean; error?: string }[] = [];

  for (const topic of topicsWithContext) {
    try {
      const sampleSummaries = topic.episodes
        .map((e) => e.episode.summaryShort)
        .filter((s): s is string => !!s && s.length > 20);

      const msg = buildTopicEnrichmentMessage({
        title: topic.title,
        episodeTitles: topic.episodes.map((e) => e.episode.title),
        loreTitles: topic.lore.map((l) => l.loreEntry.title),
        peopleNames: topic.people.map((p) => p.person.displayName),
        sampleSummaries,
      });

      const responseText = await enrichComplete({ system: TOPIC_ENRICHMENT_SYSTEM_PROMPT, user: msg, maxTokens: 300 });
      if (!responseText) throw new Error("No text response");

      await prisma.topic.update({ where: { id: topic.id }, data: { description: responseText.trim() } });
      results.push({ title: topic.title, ok: true });
    } catch (err) {
      results.push({ title: topic.title, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const processed = results.filter((r) => r.ok).length;
  return NextResponse.json({
    processed,
    remaining: remaining - processed,
    done: remaining - processed <= 0,
    results,
  });
}
