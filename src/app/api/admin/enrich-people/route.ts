/**
 * POST /api/admin/enrich-people
 *
 * Generates loreSummary (sectioned psychological profile) and fills shortBio
 * for people who have guest appearances but no loreSummary yet.
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

const SYSTEM_PROMPT = `You are a behavioral analyst and psychological profiler for the Cult of Psyche archive — a show covering consciousness, mythology, cult dynamics, tarot, and occult philosophy. The host is Psyche (also known as Trix); he is MALE — use he/him/his pronouns for Psyche at all times.

Your task: produce a structured character dossier for a person who has appeared in the archive.

VOICE: Analytical but vivid. Write as if this is an intelligence file in a sacred archive. Name behavioral patterns, recurring dynamics, what this person represents in the broader tapestry of the show. Do not be a fan — be an observer.

OUTPUT FORMAT — use these exact section headers (## followed by the title):

## Overview
1–2 sentences: who this person is and why they are in the archive. Their role, domain, and basic presence.

## Storylines
2–3 paragraphs on the patterns of their appearances. What themes recur when they show up? What do they consistently bring — intellectually, emotionally, energetically? How do they interact with the host and other guests?

## Controversies
1–2 paragraphs on any tension, conflict, polarizing views, or notable friction. If none exist in the record, write: "The archive records no notable controversies for this figure."

## Key Relationships
1–2 paragraphs on their recurring relationships with other figures in the archive — hosts, co-guests, ideas. Name names where the record supports it.

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

  let totalRemaining: number;
  let people: {
    id: string;
    displayName: string;
    slug: string;
    personType: import("@/generated/prisma/client").PersonType;
    shortBio: string | null;
    quotes: { text: string; context: string | null; significance: string | null }[];
    guestAppearances: {
      episode: {
        title: string;
        slug: string;
        episodeNumber: number | null;
        summaryShort: string | null;
        airDate: Date | null;
        segments: { speakerLabel: string | null; text: string; startSeconds: number | null }[];
      };
    }[];
  }[];

  try {
    totalRemaining = await prisma.person.count({ where: whereClause });
    if (totalRemaining === 0) {
      return NextResponse.json({ ok: true, processed: 0, remaining: 0, done: true, results: [] });
    }
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

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") throw new Error("No text response");

      const fullText = textBlock.text.trim();

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
