/**
 * POST /api/admin/enrich-people
 *
 * Generates loreSummary (psychological/behavioral profile) for people
 * who have guest appearances but no loreSummary yet.
 *
 * Auth: X-Enrich-Secret header must match ENRICH_SECRET env var.
 *
 * Body: { batch?: number (default 5, max 10), minAppearances?: number (default 1) }
 * Returns: { processed, remaining, done, results }
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SYSTEM_PROMPT = `You are a behavioral analyst and psychological profiler for the Cult of Psyche archive — a podcast covering consciousness, mythology, cult dynamics, tarot, and occult philosophy.

Your task: given what the archive has recorded about a person (their quotes, episode appearances, and any context), write a rich loreSummary — a 2–4 paragraph character profile.

VOICE: Write as if this is a dossier entry in a sacred archive. Analytical but vivid. Name behavioral patterns, recurring themes in how they speak, their relationship to power or belief, what they represent in the broader tapestry of the show's universe.

FORMAT:
- 2–4 paragraphs. No headers. No bullet points. Plain prose.
- First paragraph: who they are and how they enter the archive.
- Middle: the patterns — what they bring, how they engage, what makes them notable.
- Final line: one crystallizing statement about their archival significance.
- If data is sparse (1–2 appearances, minimal quotes): still write from what is available. Acknowledge the limits of the record without being apologetic.

Return ONLY the profile text. No JSON, no markdown, no explanation.`;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-enrich-secret");
  if (!secret || secret !== process.env.ENRICH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  if (!apiKey) {
    return NextResponse.json({ error: "No Anthropic API key configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as { batch?: number; minAppearances?: number };
  const batchSize = Math.min(Number(body.batch) || 5, 10);
  const minAppearances = Math.max(Number(body.minAppearances) || 1, 1);

  const whereClause = {
    OR: [{ loreSummary: null }, { loreSummary: "" }],
    guestAppearances: { some: {} },
  };

  const totalRemaining = await prisma.person.count({ where: whereClause });

  if (totalRemaining === 0) {
    return NextResponse.json({ processed: 0, remaining: 0, done: true, results: [] });
  }

  const people = await prisma.person.findMany({
    where: whereClause,
    select: {
      id: true,
      displayName: true,
      slug: true,
      personType: true,
      shortBio: true,
      quotes: {
        select: { text: true, context: true, significance: true },
        take: 10,
      },
      guestAppearances: {
        select: {
          episode: {
            select: {
              title: true,
              slug: true,
              episodeNumber: true,
              summaryShort: true,
              airDate: true,
              segments: {
                where: { speakerLabel: { not: null } },
                select: { speakerLabel: true, text: true, startSeconds: true },
                take: 20,
              },
            },
          },
        },
        take: 10,
      },
    },
    orderBy: { displayName: "asc" },
    take: batchSize,
  });

  // Filter by actual appearance count after fetch
  const filtered = people.filter((p) => p.guestAppearances.length >= minAppearances);

  const client = new Anthropic({ apiKey });
  const results: { slug: string; name: string; ok: boolean; error?: string }[] = [];

  for (const person of filtered) {
    try {
      const appearanceCount = person.guestAppearances.length;
      const episodeList = person.guestAppearances
        .map((a) => {
          const ep = a.episode;
          const epLabel = ep.episodeNumber
            ? `EP.${String(ep.episodeNumber).padStart(3, "0")} — "${ep.title}"`
            : `"${ep.title}"`;
          const summary = ep.summaryShort ? `\n  Summary: ${ep.summaryShort}` : "";
          const relevantSegments = ep.segments
            .filter((s) => s.speakerLabel?.toLowerCase().includes(person.displayName.split(" ")[0].toLowerCase()))
            .slice(0, 5);
          const segmentText = relevantSegments.length > 0
            ? `\n  Transcript excerpts:\n` + relevantSegments.map((s) => `    "${s.text}"`).join("\n")
            : "";
          return `${epLabel}${summary}${segmentText}`;
        })
        .join("\n\n");

      const quoteList = person.quotes.length > 0
        ? "\nNotable quotes:\n" + person.quotes
            .map((q) => `- "${q.text}"${q.context ? ` (${q.context})` : ""}`)
            .join("\n")
        : "";

      const userMessage = `Person: ${person.displayName}
Type: ${person.personType}
${person.shortBio ? `Known as: ${person.shortBio}` : ""}
Total appearances: ${appearanceCount}
${quoteList}

Episode appearances:
${episodeList}

Write the archive profile for ${person.displayName}.`;

      const response = await client.messages.create({
        model: process.env.ENRICHMENT_MODEL ?? "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") throw new Error("No text response");

      const loreSummary = textBlock.text.trim();

      await prisma.person.update({
        where: { id: person.id },
        data: { loreSummary },
      });

      results.push({ slug: person.slug, name: person.displayName, ok: true });
    } catch (err) {
      results.push({
        slug: person.slug,
        name: person.displayName,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const processed = results.filter((r) => r.ok).length;
  const remaining = totalRemaining - processed;

  return NextResponse.json({ processed, remaining, done: remaining <= 0, results });
}
