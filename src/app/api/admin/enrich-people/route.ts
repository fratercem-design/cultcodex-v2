/**
 * POST /api/admin/enrich-people
 *
 * Generates AI character profiles (loreSummary) for people with multiple appearances.
 * Runs on Vercel where DB is reachable. Processes one batch per call.
 *
 * Auth: admin session via requireAdmin().
 *
 * Body (JSON):
 *   batch           number of people to process (default 5, max 20)
 *   minAppearances  minimum guest appearances required (default 2)
 *   force           re-generate even if loreSummary already exists (default false)
 *
 * Returns:
 *   { ok, summary: { processed, ok, errors, remaining }, results: [...] }
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DELAY_MS = 600;
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

const SYSTEM_PROMPT = `You are an expert archivist for CultCodex.me — the living archive of the "Cult of Psyche" show. You write character profiles for the wiki/codex — think of this as a TV wiki page for a recurring character, but for a live-streaming show.

The show is hosted by "Psyche" (also called "Trix") on @CultofPsyche and @PsychesNightmares. Content includes tarot, consciousness exploration, occult topics, panel discussions, and live community events.

Write a structured character profile based on the data provided.

IMPORTANT: Write for an audience of show fans. Be specific about storylines and controversies only if they are clearly documented in the provided data — do not speculate or hallucinate.

Use these EXACT sections (## headers):

## Overview
2-3 sentences: who this person is, their role on the show, their energy. Include their relationship to the host and community.

## Storylines
Bullet points or short paragraphs describing main narrative arcs or recurring themes across their appearances. Reference specific episode topics if available. If no clear storylines, write "No major storylines identified yet."

## Controversies
(Only include if controversies are clearly documented in the data)
Describe contentious situations, feuds, callouts, or drama as discussed on-stream. Preface with "As discussed on stream:". OMIT this section entirely if nothing controversial.

## Key Relationships
Who this person frequently appears with, their dynamic with the host, notable bonds or rivalries.

Return ONLY the profile text — no JSON, no extra commentary.`;

interface ProfileResult {
  id: string;
  displayName: string;
  slug: string;
  appearances: number;
  status: "ok" | "error";
  error?: string;
}

export async function POST(req: NextRequest) {
  await requireAdmin();

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const batch = Math.min(Number(body.batch) || 5, 20);
  const minAppearances = Math.max(Number(body.minAppearances) || 2, 1);
  const force = Boolean(body.force);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }
  const model = process.env.ENRICHMENT_MODEL ?? "claude-haiku-4-5-20251001";
  const client = new Anthropic({ apiKey });

  // Count remaining before this batch
  const remaining = await prisma.person.count({
    where: {
      personType: { in: ["guest", "host", "recurring"] },
      guestAppearances: { some: {} },
      ...(force ? {} : {
        OR: [{ loreSummary: null }, { loreSummary: { equals: "" } }],
      }),
    },
  });

  const people = await prisma.person.findMany({
    where: {
      personType: { in: ["guest", "host", "recurring"] },
      ...(force ? {} : {
        OR: [{ loreSummary: null }, { loreSummary: { equals: "" } }],
      }),
    },
    include: {
      guestAppearances: {
        include: {
          episode: {
            select: { id: true, title: true, summaryShort: true },
          },
        },
      },
      quotes: { select: { text: true, context: true }, take: 10 },
    },
    orderBy: { guestAppearances: { _count: "desc" } },
  });

  const eligible = people
    .filter((p) => p.guestAppearances.length >= minAppearances)
    .slice(0, batch);

  const results: ProfileResult[] = [];

  for (const person of eligible) {
    try {
      // Top co-guests
      const coGuestCounts = new Map<string, number>();
      for (const g of person.guestAppearances) {
        const others = await prisma.episodeGuest.findMany({
          where: { episodeId: g.episode.id, personId: { not: person.id } },
          include: { person: { select: { displayName: true } } },
        });
        for (const o of others) {
          coGuestCounts.set(o.person.displayName, (coGuestCounts.get(o.person.displayName) ?? 0) + 1);
        }
      }
      const topCoGuests = Array.from(coGuestCounts.entries())
        .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name);

      const recentEpisodes = person.guestAppearances.slice(-10);
      const userMsg = [
        `Person: "${person.displayName}" (${person.personType})`,
        person.shortBio ? `Bio: ${person.shortBio}` : "",
        `Total appearances: ${person.guestAppearances.length}`,
        topCoGuests.length ? `Frequent co-guests: ${topCoGuests.join(", ")}` : "",
        "",
        `Recent episodes:`,
        ...recentEpisodes.map((g) =>
          `- ${g.episode.title}${g.episode.summaryShort ? `: ${g.episode.summaryShort}` : ""}`
        ),
        person.quotes.length
          ? `\nNotable quotes:\n${person.quotes.slice(0, 5).map((q) => `- "${q.text}"${q.context ? ` [${q.context}]` : ""}`).join("\n")}`
          : "",
      ].filter(Boolean).join("\n");

      const response = await client.messages.create({
        model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") throw new Error("No text in response");

      await prisma.person.update({
        where: { id: person.id },
        data: { loreSummary: textBlock.text.trim() },
      });

      results.push({ id: person.id, displayName: person.displayName, slug: person.slug, appearances: person.guestAppearances.length, status: "ok" });
    } catch (err: unknown) {
      results.push({
        id: person.id,
        displayName: person.displayName,
        slug: person.slug,
        appearances: person.guestAppearances.length,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
    await sleep(DELAY_MS);
  }

  const okCount = results.filter((r) => r.status === "ok").length;
  const errCount = results.filter((r) => r.status === "error").length;
  const afterRemaining = Math.max(0, remaining - okCount);

  return NextResponse.json({
    ok: true,
    summary: {
      processed: results.length,
      ok: okCount,
      errors: errCount,
      remaining: afterRemaining,
    },
    results,
  });
}
