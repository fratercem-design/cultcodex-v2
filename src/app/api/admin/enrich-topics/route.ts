/**
 * POST /api/admin/enrich-topics
 *
 * Temporary enrichment relay — generates AI descriptions for Topic records
 * using Claude Haiku, called from an external script via HTTPS.
 * Auth: X-Enrich-Secret header must match ENRICH_SECRET env var.
 *
 * Body (JSON):
 *   batch        number of topics to process (default 8)
 *   minEpisodes  skip topics with fewer linked episodes (default 2)
 *   anthropicKey Anthropic API key (can be passed here or set as env var)
 *
 * Returns:
 *   { processed, remaining, results: [{title, ok, error?}] }
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are an expert archivist for CultCodex.me — the living archive of the "Cult of Psyche" show. The show is hosted by Psyche (also called Trix): a spiritual teacher, tarot reader, occultist, and livestreamer. Psyche is MALE — use he/him/his pronouns for Psyche at all times. The show covers consciousness, mythology, tarot, astrology, esoteric philosophy, panelverse drama, and community lore.

You are writing short topic descriptions for the archive's knowledge graph. Each topic is a subject that appears across multiple episodes.

Write a description in two parts separated by a blank line:

Part 1 (1–2 sentences): A concise, factual definition of what this topic IS — as a neutral encyclopedia entry would describe it.

Part 2 (1–2 sentences, start with "In the Psycheverse:"): How Psyche engages with this topic on the show — the angle, recurring themes, or why it's significant in this universe. Be specific and interesting, not generic.

Rules:
- Total length: 3–5 sentences maximum
- Do not mention episode numbers or specific dates
- Use present tense
- Do not use filler phrases like "delves into" or "explores the intersection"
- Return ONLY the description text — no JSON, no headers, no extra commentary`;

function buildUserMessage(input: {
  title: string;
  episodeTitles: string[];
  loreTitles: string[];
  peopleNames: string[];
  sampleSummaries: string[];
}): string {
  const parts = [`Topic: "${input.title}"`];
  if (input.sampleSummaries.length > 0) {
    parts.push(`\nSample episode summaries:\n${input.sampleSummaries.slice(0, 5).map((s) => `- ${s}`).join("\n")}`);
  } else if (input.episodeTitles.length > 0) {
    parts.push(`\nEpisode titles:\n${input.episodeTitles.slice(0, 10).map((t) => `- ${t}`).join("\n")}`);
  }
  if (input.loreTitles.length > 0) parts.push(`\nRelated lore: ${input.loreTitles.slice(0, 5).join(", ")}`);
  if (input.peopleNames.length > 0) parts.push(`\nPeople: ${input.peopleNames.slice(0, 5).join(", ")}`);
  return parts.join("\n");
}

export async function POST(req: NextRequest) {
  // Auth check
  const secret = req.headers.get("x-enrich-secret");
  if (!secret || secret !== process.env.ENRICH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const batch: number = body.batch ?? 8;
  const minEpisodes: number = body.minEpisodes ?? 2;
  const apiKey: string = body.anthropicKey ?? process.env.ANTHROPIC_API_KEY ?? "";

  if (!apiKey) {
    return NextResponse.json({ error: "No Anthropic API key" }, { status: 400 });
  }

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

  const client = new Anthropic({ apiKey });
  const results: { title: string; ok: boolean; error?: string }[] = [];

  for (const topic of topicsWithContext) {
    try {
      const sampleSummaries = topic.episodes
        .map((e) => e.episode.summaryShort)
        .filter((s): s is string => !!s && s.length > 20);

      const msg = buildUserMessage({
        title: topic.title,
        episodeTitles: topic.episodes.map((e) => e.episode.title),
        loreTitles: topic.lore.map((l) => l.loreEntry.title),
        peopleNames: topic.people.map((p) => p.person.displayName),
        sampleSummaries,
      });

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: msg }],
      });

      const text = response.content.find((b) => b.type === "text");
      if (!text || text.type !== "text") throw new Error("No text response");

      await prisma.topic.update({ where: { id: topic.id }, data: { description: text.text.trim() } });
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
