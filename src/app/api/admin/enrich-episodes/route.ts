/**
 * POST /api/admin/enrich-episodes
 *
 * AI enrichment relay for unenriched episodes. Runs on Vercel where DB
 * is reachable. Processes one batch per call; loop externally until done.
 *
 * Auth: X-Enrich-Secret header must match ENRICH_SECRET env var.
 *
 * Body (JSON):
 *   batch        number of episodes to process (default 3)
 *   withTranscriptOnly  only process episodes that have transcript segments (default false)
 *
 * Returns:
 *   { processed, remaining, done, results: [{slug, title, ok, error?}] }
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ── Zod schemas (mirror of scripts/enrich/schemas.ts) ────────────────────────

const GuestSchema = z.object({
  name: z.string().min(1),
  personType: z.enum(["guest", "host", "mentioned", "recurring"]),
  shortBio: z.string().default(""),
});

const QuoteSchema = z.object({
  text: z.string().min(1),
  speaker: z.string().min(1),
  timestampSeconds: z.number().int().nullable(),
  context: z.string().default(""),
  significance: z.string().default(""),
});

const LoreSchema = z.object({
  title: z.string().min(1),
  summary: z.string().default(""),
  canonStatus: z
    .enum(["canonical", "speculative", "community_myth", "disputed", "humorous"])
    .default("speculative"),
  category: z.string().default("concept"),
});

const EnrichmentSchema = z.object({
  summaryShort: z.string().default(""),
  // Legacy — kept so old-format responses don't break parsing.
  summaryLong: z.string().optional().default(""),
  /** Transcript-grounded recap */
  summaryFacts: z.string().optional().default(""),
  /** Interpretive layer */
  summaryThemes: z.string().optional().default(""),
  cutOfPsyche: z.string().nullable().optional().default(""),
  guests: z.array(GuestSchema).default([]),
  quotes: z.array(QuoteSchema).default([]),
  lore: z.array(LoreSchema).default([]),
  topics: z.array(z.string()).default([]),
});

type EnrichmentResult = z.infer<typeof EnrichmentSchema>;

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert analyst for the "Cult of Psyche" podcast/livestream archive. This show features tarot readings, open panel discussions, consciousness exploration, mythology deep-dives, and occult topics. The host is known as "Psyche" or "Trix." Psyche is MALE — use he/him/his pronouns for Psyche at all times.

Your task: analyze the provided episode transcript and extract structured data. Be accurate — only extract what is genuinely present in the transcript. Do not hallucinate guests, quotes, or lore that aren't discussed.

Return a JSON object with this exact structure:
{
  "summaryShort": "1-2 sentence summary of the episode",
  "summaryFacts": "WHAT HAPPENED — 2-3 paragraphs, transcript-grounded. Cover who appeared, what was discussed, key events and exchanges, in the order they occurred. Embed [MM:SS] or [H:MM:SS] timestamps when referencing specific moments. Use only timestamps from the provided transcript. Aim for 3–6 timestamp references. Write like a TV recap — clear, specific, no interpretation.",
  "summaryThemes": "INTERPRETIVE LAYER — 1-2 paragraphs. Identify recurring patterns, thematic threads, and what this episode represents in the context of the show. Explicitly frame everything as interpretation: 'appears to', 'suggests', 'continues the pattern of'. Do NOT repeat facts from summaryFacts — only add the layer of meaning. Keep it grounded; avoid mythology (that belongs to the Psychenomicon).",
  "cutOfPsyche": "A characteristic or memorable quote/moment from this episode (verbatim from transcript if possible)",
  "guests": [
    {
      "name": "Display name of the person",
      "personType": "guest|host|mentioned|recurring",
      "shortBio": "Brief description based on what's known from the episode"
    }
  ],
  "quotes": [
    {
      "text": "Exact quote text from the transcript",
      "speaker": "Name of the speaker",
      "timestampSeconds": 1234,
      "context": "What was being discussed when this was said",
      "significance": "Why this quote is notable"
    }
  ],
  "lore": [
    {
      "title": "Name of the concept, myth, or recurring theme",
      "summary": "Brief explanation of this lore element",
      "canonStatus": "canonical|speculative|community_myth|disputed|humorous",
      "category": "cosmology|character|event|concept|ritual|prophecy|artifact|location"
    }
  ],
  "topics": ["topic1", "topic2"]
}

Guidelines:
- For guests: include the host as personType "host". Panel participants are "guest". People discussed but not present are "mentioned".
- For quotes: extract the 3-5 most notable, interesting, or representative quotes. Include timestamp in seconds if identifiable.
- For summaryFacts: embed [MM:SS] or [H:MM:SS] timestamps for specific moments. Use only timestamps from the transcript. Omit timestamps if no transcript is available.
- For summaryThemes: frame everything as interpretation — use "appears to", "suggests", "continues the pattern of". Never assert facts; those go in summaryFacts.
- For lore: identify mythology references, recurring show concepts, tarot interpretations, or spiritual/occult ideas discussed.
- For topics: list the main subjects discussed (e.g., "tarot", "consciousness", "astrology", "Greek mythology").
- Return ONLY valid JSON. No markdown, no code fences, no explanation.

LANGUAGE RULES — CRITICAL:
- Use observational, on-stream descriptive language. Summaries describe what happened and was discussed on stream.
- Never use clinical or psychiatric terminology (e.g. "paranoid," "delusional," "narcissistic," "erratic," "unstable," "psychotic," "manipulative").
- Describe what people expressed or said — not diagnoses. E.g. "expressed suspicion about…" not "displayed paranoia about…"; "reacted with visible frustration" not "had an erratic episode."`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 80);
}

function buildTranscript(
  segments: Array<{ startSeconds: number; speakerLabel: string | null; text: string }>
): string {
  const lines = segments.map((s) => {
    const mins = Math.floor(s.startSeconds / 60);
    const secs = s.startSeconds % 60;
    const ts = `${mins}:${String(secs).padStart(2, "0")}`;
    const speaker = s.speakerLabel ? `${s.speakerLabel}: ` : "";
    return `[${ts}] ${speaker}${s.text}`;
  });
  const full = lines.join("\n");
  return full.length > 12000 ? full.slice(0, 12000) + "\n[...transcript truncated...]" : full;
}

async function importEnrichment(
  episodeId: string,
  data: EnrichmentResult
): Promise<void> {
  // Update episode summary fields.
  // New enrichments write summaryFacts + summaryThemes (split format).
  // summaryLong is only written when the model still returns it (legacy fallback).
  await prisma.episode.update({
    where: { id: episodeId },
    data: {
      summaryShort: data.summaryShort || undefined,
      // Always write summaryFacts so the episode is marked enriched even when
      // the AI returns nothing (e.g. short clips with no transcript content).
      summaryFacts: data.summaryFacts || "—",
      summaryThemes: data.summaryThemes || undefined,
      // Legacy: only preserved if model returned it and new fields are empty
      ...(data.summaryLong && !data.summaryFacts
        ? { summaryLong: data.summaryLong }
        : {}),
      cutOfPsyche: data.cutOfPsyche || undefined,
      // Clear the manual queue flag after successful enrichment
      enrichmentQueued: false,
    },
  });

  // Guests
  if (data.guests.length > 0) {
    await prisma.episodeGuest.deleteMany({ where: { episodeId } });
    for (const guest of data.guests) {
      const personSlug = slugify(guest.name);
      const person = await prisma.person.upsert({
        where: { slug: personSlug },
        create: {
          displayName: guest.name,
          slug: personSlug,
          personType: guest.personType as "guest" | "host" | "recurring",
          shortBio: guest.shortBio || null,
        },
        update: {
          personType: guest.personType as "guest" | "host" | "recurring",
          shortBio: guest.shortBio || undefined,
        },
        select: { id: true },
      });
      await prisma.episodeGuest.create({
        data: { episodeId, personId: person.id },
      });
    }
  }

  // Topics
  if (data.topics.length > 0) {
    await prisma.episodeTopic.deleteMany({ where: { episodeId } });
    for (const topicTitle of data.topics) {
      const topicSlug = slugify(topicTitle);
      const topic = await prisma.topic.upsert({
        where: { slug: topicSlug },
        create: { title: topicTitle, slug: topicSlug },
        update: {},
        select: { id: true },
      });
      await prisma.episodeTopic.create({ data: { episodeId, topicId: topic.id } });
    }
  }

  // Lore
  if (data.lore.length > 0) {
    await prisma.episodeLore.deleteMany({ where: { episodeId } });
    for (const lore of data.lore) {
      const loreSlug = slugify(lore.title);
      const loreEntry = await prisma.loreEntry.upsert({
        where: { slug: loreSlug },
        create: {
          title: lore.title,
          slug: loreSlug,
          summary: lore.summary,
          canonStatus: lore.canonStatus as "canonical" | "speculative" | "community_myth" | "disputed" | "humorous",
          category: lore.category,
        },
        update: {
          summary: lore.summary,
          canonStatus: lore.canonStatus as "canonical" | "speculative" | "community_myth" | "disputed" | "humorous",
          category: lore.category,
        },
        select: { id: true },
      });
      await prisma.episodeLore.create({ data: { episodeId, loreEntryId: loreEntry.id } });
    }
  }

  // Quotes
  if (data.quotes.length > 0) {
    await prisma.quote.deleteMany({ where: { episodeId } });
    for (const quote of data.quotes) {
      const speakerSlug = slugify(quote.speaker);
      const speaker = await prisma.person.findUnique({
        where: { slug: speakerSlug },
        select: { id: true },
      });
      await prisma.quote.create({
        data: {
          text: quote.text,
          speakerPersonId: speaker?.id ?? null,
          episodeId,
          timestampSeconds: quote.timestampSeconds,
          context: quote.context || null,
          significance: quote.significance || null,
        },
      });
    }
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-enrich-secret");
  if (!secret || secret !== process.env.ENRICH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  if (!apiKey) {
    return NextResponse.json({ error: "No Anthropic API key configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as {
    batch?: number;
    withTranscriptOnly?: boolean;
    queuedOnly?: boolean;
  };
  const batchSize: number = Math.min(body.batch ?? 3, 10);
  const withTranscriptOnly: boolean = body.withTranscriptOnly ?? false;
  const queuedOnly: boolean = body.queuedOnly ?? false;

  // Find episodes to enrich.
  // queuedOnly=true: process ONLY enrichmentQueued=true episodes (regardless of existing summaries — for re-enrichment)
  // default: unenriched episodes (no summaryShort, summaryFacts, OR summaryLong)
  const whereClause = queuedOnly
    ? {
        enrichmentQueued: true,
        ...(withTranscriptOnly ? { segments: { some: {} } } : {}),
      }
    : {
        AND: [
          { OR: [{ summaryShort: null }, { summaryShort: "" }] },
          { OR: [{ summaryFacts: null }, { summaryFacts: "" }] },
          { OR: [{ summaryLong: null }, { summaryLong: "" }] },
        ],
        ...(withTranscriptOnly ? { segments: { some: {} } } : {}),
      };

  const totalRemaining = await prisma.episode.count({ where: whereClause });

  if (totalRemaining === 0) {
    return NextResponse.json({ ok: true, processed: 0, remaining: 0, done: true, results: [] });
  }

  const episodes = await prisma.episode.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      slug: true,
      episodeNumber: true,
      airDate: true,
      summaryShort: true,
      segments: {
        select: { startSeconds: true, speakerLabel: true, text: true },
        orderBy: { startSeconds: "asc" },
      },
    },
    orderBy: { episodeNumber: "asc" },
    take: batchSize,
  });

  const client = new Anthropic({ apiKey });
  const results: { slug: string; title: string; ok: boolean; error?: string }[] = [];

  for (const ep of episodes) {
    try {
      const hasTranscript = ep.segments.length > 0;
      const transcript = hasTranscript
        ? buildTranscript(ep.segments)
        : "(No transcript available — enrich from title and description only)";

      const airDateStr = ep.airDate
        ? new Date(ep.airDate).toISOString().slice(0, 10)
        : "unknown";

      const userMessage = `Episode: "${ep.title}"
Episode ${ep.episodeNumber ?? "?"} — Aired ${airDateStr}

Description:
${ep.summaryShort ?? ""}

Transcript:
${transcript}`;

      const response = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 3000,
        thinking: { type: "adaptive" },
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") throw new Error("No text response");

      let jsonText = textBlock.text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      const parsed = EnrichmentSchema.parse(JSON.parse(jsonText));
      await importEnrichment(ep.id, parsed);
      results.push({ slug: ep.slug, title: ep.title, ok: true });
    } catch (err) {
      results.push({
        slug: ep.slug,
        title: ep.title,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const processed = results.filter((r) => r.ok).length;
  const remaining = totalRemaining - processed;

  return NextResponse.json({ ok: true, processed, remaining, done: remaining <= 0, results });
}
