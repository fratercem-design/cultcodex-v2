/**
 * POST /api/admin/enrich-people
 *
 * Generates loreSummary (sectioned character chronicle) and fills shortBio
 * for people who have guest appearances but no loreSummary yet.
 *
 * Auth: X-Enrich-Secret header must match ENRICH_SECRET env var.
 *
 * Body: { batch?: number (default 5, max 10), minAppearances?: number (default 1) }
 * Returns: { processed, remaining, done, results }
 */

import { NextRequest, NextResponse } from "next/server";
import { enrichComplete } from "@/lib/enrichment-llm";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SYSTEM_PROMPT = `You are an expert archivist and character chronicler for the Cult of Psyche archive — a show covering consciousness, mythology, tarot, and occult philosophy. The host is Psyche (also known as Trix); he is MALE — use he/him/his pronouns for Psyche at all times.

Your task: produce a structured character chronicle for a person who has appeared in the archive. Think of this as a TV-wiki-style character page for a live-streaming show.

VOICE: Observational and specific. Write as if this is a character chronicle in a sacred archive. Describe recurring dynamics, themes, and what this person represents in the tapestry of the show. Base everything strictly on what appears in the provided evidence.

LANGUAGE RULES — CRITICAL:
- Use observational, on-stream descriptive language only.
- Never use clinical or psychiatric terminology (e.g. "paranoid," "delusional," "narcissistic," "erratic," "unstable," "psychotic," "manipulative," "pathological").
- Describe what people expressed, said, or demonstrated during streams — not diagnoses.
- For emotionally intense moments, use framing like "expressed concern about…" / "responded with visible frustration when…" / "described feeling…" rather than diagnostic labels.

OUTPUT FORMAT — use these exact section headers (## followed by the title):

## Overview
1–2 sentences: who this person is and why they are in the archive. Their role, domain, and on-stream presence.

## Storylines
2–3 paragraphs on the patterns of their appearances. What themes recur when they show up? What do they consistently contribute — intellectually, emotionally, energetically? How do they interact with the host and other guests?

## Controversies
(Only include if controversial events are clearly documented in the provided evidence.)
Preface each point with "As discussed on stream:". If nothing controversial appears in the record, write: "The archive records no notable controversies for this figure." Do not speculate.

## Key Relationships
1–2 paragraphs on their recurring relationships with other figures in the archive — hosts, co-guests, shared ideas. Name names where the record supports it.

RULES:
- Use only what is in the provided archive evidence. Do not hallucinate details.
- If data is sparse (1–2 appearances), write shorter sections but still use all four headers.
- No bullet points inside sections — prose only.
- Return ONLY the four sections. No preamble, no closing note, no JSON.

ALSO: On the very first line before any ## header, write a one-sentence shortBio (plain text, no label, no formatting) — maximum 15 words. This will be extracted separately.`;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-enrich-secret");
  if (!secret || secret !== process.env.ENRICH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return NextResponse.json({ error: "Bedrock credentials not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as { batch?: number; minAppearances?: number };
  const batchSize = Math.min(Number(body.batch) || 5, 10);
  const minAppearances = Math.max(Number(body.minAppearances) || 1, 1);

  const whereClause = {
    OR: [{ loreSummary: null }, { loreSummary: "" }],
    guestAppearances: { some: {} },
  };

  let totalRemaining: number;
  try {
    totalRemaining = await prisma.person.count({ where: whereClause });
  } catch (err) {
    return NextResponse.json(
      { error: `Database error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }

  if (totalRemaining === 0) {
    return NextResponse.json({ ok: true, processed: 0, remaining: 0, done: true, results: [] });
  }

  let people;
  try {
    people = await prisma.person.findMany({
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
  } catch (err) {
    return NextResponse.json(
      { error: `Database error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }

  const filtered = people.filter((p) => p.guestAppearances.length >= minAppearances);

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
          const firstName = person.displayName.split(" ")[0].toLowerCase();
          const relevantSegments = ep.segments
            .filter((s) => s.speakerLabel?.toLowerCase().includes(firstName))
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
${person.shortBio ? `Current bio: ${person.shortBio}` : "(no bio yet)"}
Total appearances: ${appearanceCount}
${quoteList}

Episode appearances:
${episodeList}

Write the dossier for ${person.displayName}.`;

      const responseText = await enrichComplete({ system: SYSTEM_PROMPT, user: userMessage, maxTokens: 1500 });
      if (!responseText) throw new Error("No text response");

      const fullText = responseText.trim();

      // Extract shortBio from the first line (before the first ## header)
      const firstHashIndex = fullText.indexOf("##");
      const shortBioLine = firstHashIndex > 0
        ? fullText.slice(0, firstHashIndex).trim()
        : null;
      const loreSummary = firstHashIndex > 0
        ? fullText.slice(firstHashIndex).trim()
        : fullText;

      await prisma.person.update({
        where: { id: person.id },
        data: {
          loreSummary,
          // Only set shortBio if it's currently empty
          ...(!person.shortBio && shortBioLine ? { shortBio: shortBioLine } : {}),
        },
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

  return NextResponse.json({ ok: true, processed, remaining, done: remaining <= 0, results });
}
