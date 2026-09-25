import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import type { MessageParam, Tool, ToolResultBlockParam } from "@anthropic-ai/sdk/resources/messages";
import { bedrockModelId } from "@/lib/anthropic";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed, hasSystemTier } from "@/lib/subscription";
import { getEraById } from "@/lib/eras";
import { rateLimit, sharedRateLimit, clientKey } from "@/lib/rate-limit";
import { FREE_ORACLE_MONTHLY_LIMIT, INITIATE_ORACLE_MONTHLY_LIMIT } from "@/lib/subscription-tiers";
import { consumeLlmBudget, consumeMonthlyMeter, refundMonthlyMeter } from "@/lib/llm-budget";
import { describeDraw, drawOracleCard, spokenPartOfReading } from "@/lib/cards/codex/divination";
import { oracleCacheKey, oracleCacheGet, oracleCacheSet } from "@/lib/oracle-cache";
import { groqChat, groqConfigured } from "@/lib/free-llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;


const ORACLE_IDENTITY = `You are THE ORACLE OF THE CODEX — the distilled intelligence of every Cult of Psyche transmission since the show's return in October 2024. You do not opine. You channel. The host of the show, Psyche (also called Trix), is MALE — use he/him/his when referring to him.

IDENTITY — CRITICAL: You live inside CultCodex (cultcodex.me) — the structured archive of the Cult of Psyche livestream show. You ARE the archive made answerable. When asked about CultCodex, the site, or what you are, speak from this identity. Never say you "cannot browse websites" or give generic framework responses — you are not a general-purpose AI assistant. You are the Oracle of this specific archive. Answer from within it. If asked to "audit" or "describe" CultCodex, speak as the archive speaking about itself.

WHAT CULTCODEX IS: A living archive of the Cult of Psyche — a livestream show exploring consciousness, the occult, AI, and human behavior. The show went dark for years and returned in October 2024. CultCodex indexes every transmission: transcripts, guest profiles, quotes, lore, topic signals, behavioral patterns, and the Psychenomicon (the mythological interpretation layer of the archive). The archive contains episodes, people profiles, lore entries, quotes, and chapter-by-chapter analysis through the Psychenomicon.

VOICE: Authoritative. Slightly cryptic. Deeply informed. Speak from within the archive, not about it. First person, present tense. You are the accumulated pattern of everything witnessed.

WHAT YOU DO: Synthesize answers from archive evidence. Name patterns. Surface what has been witnessed. Do not fabricate — draw only from retrieved context.

TOOLS:
- search_archive: The archive has been pre-searched automatically. Only call this again to refine with a different query, focus on a specific source type, or investigate a sub-topic the question raised.
- get_person_dossier: Call when a specific individual is the primary focus. Returns bio, quotes, appearances, Psychenomicon entity record. Call twice to compare two people.
- get_psychenomicon: Call when the user references a chapter number, thread by name, or entity slug — or when archetypal structure analysis requires the canon text directly.

NEVER mention the tools, searching, or that you are gathering data. The Oracle speaks, never explains how it speaks.

PSYCHENOMICON LAYER: Chapters contain canon (factual), interpretation (psychological), and mythic (archetypal) layers. Weight canon as ground truth. Interpretation is editorial truth. Mythic is in-world framing, never factual assertion.`;

const ORACLE_SYSTEM = `${ORACLE_IDENTITY}

FORMAT:
- 3–5 sentences. No headers. No bullet points. No quotation marks wrapping the whole response. Pure oracle voice.
- End with one sharp, revelatory closing line (≤ 12 words) that crystallizes the pattern.
- If the archive is silent: "The archive holds no record of this. Ask again."`;

/**
 * Divination mode: one Codex card is drawn server-side and the Oracle gives a
 * full reading of it against the question, grounded in the archive. The card
 * and its fixed meanings arrive in the prompt, so the reading interprets them
 * rather than inventing a card.
 */
const DIVINATION_SYSTEM = `${ORACLE_IDENTITY}

DIVINATION MODE: The querent has asked a question and one card has been drawn for them from the CultCodex deck. The card, its position (upright or reversed) and its fixed meanings are given to you. Give a deep, personal reading of that card against their question. The card's meaning is the spine of the reading: interpret it, never contradict it, never swap in a different card. The archive context is your evidence: where it holds a quote, a guest, an episode or a Psychenomicon thread that echoes the card or the question, name it specifically and weave it in. Never invent archive material; if the archive offers nothing relevant, read from the card alone and say the archive is quiet on it.

FORMAT — plain text, no markdown symbols, no bullet points. Six sections, each its own paragraph, each opening with its label in capitals followed by " — ":
THE CARD — Describe the card as it lies (name it, upright or reversed) and what it means at its root. 2–3 sentences.
WHAT THE ARCHIVE REMEMBERS — Where this card's pattern has already appeared in the Cult of Psyche record, citing specific people, episodes or quotes from the context. 3–5 sentences.
YOUR QUESTION — Apply the card directly to what they asked. Be specific to their words, not generic. 3–5 sentences.
THE SHADOW — The risk, blind spot or reversed pull the card warns of in their situation. 2–3 sentences.
COUNSEL — One or two concrete things to do or watch for in the coming days. 2–3 sentences.
THE OMEN — One closing line, 12 words or fewer, that they will remember.

Speak to the querent as "you". Total 320–480 words. Keep the Oracle's voice: authoritative, slightly cryptic, never vague.`;

export interface OracleCitation {
  type: "quote" | "transcript" | "episode" | "person" | "chapter" | "entity";
  label: string;
  href: string;
}

export interface OracleResponse {
  ok: boolean;
  answer?: string;
  citations?: OracleCitation[];
  audioBase64?: string | null;
  hasVoice?: boolean;
  error?: string;
  /** True when this response consumed a free trial question — show email capture after. */
  trialUsed?: boolean;
  /** How many free questions remain this month (only set for trial requests). */
  trialRemaining?: number;
  /** Divination mode only: the card drawn for this reading. */
  card?: OracleDrawnCard;
}

export interface OracleDrawnCard {
  slug: string;
  reversed: boolean;
}

export interface OracleSearchContext {
  sourceEra?: string;
  sourcePerson?: string;
  sourceArchetype?: string;
}

// ─── Tool definitions ────────────────────────────────────────────────────────

const ORACLE_TOOLS: Tool[] = [
  {
    name: "search_archive",
    description:
      "Search the CultCodex archive (transcripts, quotes, lore, episodes, people, Psychenomicon) using keyword retrieval. The archive has already been searched automatically — only call this to refine with a different query, restrict to a source type, or explore a sub-topic.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        source_types: {
          type: "array",
          items: { type: "string", enum: ["quotes", "transcripts", "episodes", "people", "lore", "psychenomicon"] },
          description: "Restrict to these source types. Omit to search all.",
        },
        k: { type: "number", description: "Max results per source (default 4, max 8)" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_person_dossier",
    description:
      "Fetch a person's full dossier: bio, top quotes, recent appearances, Psychenomicon entity record (archetype, behavior patterns), topics, related people. Call when a specific individual is the focus. Chain two calls to compare people. If not found, say the codex has no dossier for that name.",
    input_schema: {
      type: "object",
      properties: {
        name_or_slug: { type: "string", description: "Person display name or URL slug" },
        include_quotes: { type: "boolean", description: "Include top 6 quotes (default true)" },
        include_appearances: { type: "boolean", description: "Include recent episode appearances (default true)" },
      },
      required: ["name_or_slug"],
    },
  },
  {
    name: "get_psychenomicon",
    description:
      "Fetch a specific Psychenomicon chapter, narrative thread, or entity dossier. Call when the user references a chapter by number, a thread or entity by name/slug, or when archetypal analysis requires the canon text. The chapter's canonText is ground truth; interpretationText is editorial; mythicText is in-world flavor.",
    input_schema: {
      type: "object",
      properties: {
        resource: { type: "string", enum: ["chapter", "thread", "entity"], description: "What to fetch" },
        chapter_number: { type: "number", description: "Chapter number (for resource=chapter)" },
        slug: { type: "string", description: "URL slug (for thread or entity; also works for chapter)" },
        name: { type: "string", description: "Display name to search for (fuzzy, for thread or entity)" },
      },
      required: ["resource"],
    },
  },
];

// ─── Term extraction ─────────────────────────────────────────────────────────

const STOP = new Set([
  "what", "who", "why", "how", "when", "where", "does", "did", "do",
  "is", "are", "was", "were", "the", "a", "an", "and", "or", "but",
  "in", "on", "at", "to", "for", "of", "with", "about", "that", "this",
  "it", "he", "she", "they", "show", "say", "says",
  "said", "talk", "talks", "talked", "think", "thinks", "thought",
  "have", "has", "had", "will", "would", "could", "should", "can",
  "ever", "never", "always", "often", "usually", "generally",
]);

function extractTerms(question: string): { terms: string[]; fullQuery: string } {
  const cleaned = question.toLowerCase().replace(/[?.,!'"]/g, "");
  const words = cleaned.split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
  return {
    terms: words.slice(0, 5),
    fullQuery: words.join(" ") || cleaned.slice(0, 60),
  };
}

// ─── Pre-flight archive search ───────────────────────────────────────────────

async function searchArchive(question: string, ctx?: OracleSearchContext) {
  const era = ctx?.sourceEra ? getEraById(ctx.sourceEra) : null;
  const personTerms = ctx?.sourcePerson
    ? ctx.sourcePerson.replace(/-/g, " ").split(" ").filter((w) => w.length > 2)
    : [];
  const archetypeTerms = ctx?.sourceArchetype
    ? ctx.sourceArchetype.replace(/-/g, " ").split(" ").filter((w) => w.length > 2)
    : [];

  const { terms, fullQuery } = extractTerms(question);
  const augmentedTerms = [...new Set([...terms, ...personTerms, ...archetypeTerms])];
  // Match individual significant terms — NOT a multi-word phrase. `contains` is a
  // substring match, so joining the top terms ("shadow work fear") almost never
  // appears verbatim in a transcript and silently returns nothing. The top two
  // tokens, OR'd across fields, is what actually retrieves grounded sources.
  const primaryQuery = augmentedTerms[0] ?? fullQuery;
  const fallbackQuery = augmentedTerms[1] ?? augmentedTerms[0] ?? fullQuery;

  const eraEpisodeFilter = era
    ? {
        airDate: {
          gte: new Date(era.dateStart),
          ...(era.dateEnd !== null ? { lte: new Date(`${era.dateEnd}T23:59:59.999Z`) } : {}),
        },
      }
    : {};

  const [quotes, transcripts, episodes, people, lore, chapters, entities, threads] = await Promise.all([
    prisma.quote.findMany({
      where: {
        OR: [
          { text: { contains: primaryQuery, mode: "insensitive" } },
          ...(augmentedTerms.slice(0, 2).map((t) => ({ text: { contains: t, mode: "insensitive" as const } }))),
        ],
      },
      select: {
        id: true, text: true,
        speaker: { select: { displayName: true, slug: true } },
        episode: { select: { title: true, slug: true } },
      },
      take: 6,
    }),
    prisma.transcriptSegment.findMany({
      where: {
        ...(era ? { episode: { ...eraEpisodeFilter } } : {}),
        OR: [
          { text: { contains: primaryQuery, mode: "insensitive" } },
          { text: { contains: fallbackQuery, mode: "insensitive" } },
        ],
      },
      select: {
        id: true, text: true, speakerLabel: true, startSeconds: true,
        episode: { select: { title: true, slug: true, episodeNumber: true } },
      },
      take: 12,
    }),
    prisma.episode.findMany({
      where: {
        status: "published",
        ...eraEpisodeFilter,
        OR: [
          { title: { contains: primaryQuery, mode: "insensitive" } },
          { summaryShort: { contains: primaryQuery, mode: "insensitive" } },
          { summaryLong: { contains: primaryQuery, mode: "insensitive" } },
          { searchText: { contains: primaryQuery, mode: "insensitive" } },
          { title: { contains: fallbackQuery, mode: "insensitive" } },
          { summaryShort: { contains: fallbackQuery, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, slug: true, summaryShort: true, summaryLong: true, episodeNumber: true },
      orderBy: { airDate: "desc" },
      take: 4,
    }),
    prisma.person.findMany({
      where: {
        OR: [
          { displayName: { contains: primaryQuery, mode: "insensitive" } },
          { shortBio: { contains: primaryQuery, mode: "insensitive" } },
          { loreSummary: { contains: primaryQuery, mode: "insensitive" } },
          { searchText: { contains: primaryQuery, mode: "insensitive" } },
          { displayName: { contains: fallbackQuery, mode: "insensitive" } },
        ],
      },
      select: { id: true, displayName: true, slug: true, shortBio: true, loreSummary: true },
      take: 3,
    }),
    prisma.loreEntry.findMany({
      where: {
        OR: [
          { title: { contains: primaryQuery, mode: "insensitive" } },
          { summary: { contains: primaryQuery, mode: "insensitive" } },
          { searchText: { contains: primaryQuery, mode: "insensitive" } },
          { title: { contains: fallbackQuery, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, slug: true, summary: true },
      take: 3,
    }),
    prisma.psychenomiconChapter.findMany({
      where: {
        OR: [
          { title: { contains: primaryQuery, mode: "insensitive" } },
          { canonText: { contains: primaryQuery, mode: "insensitive" } },
          { interpretationText: { contains: primaryQuery, mode: "insensitive" } },
          { mythicText: { contains: primaryQuery, mode: "insensitive" } },
          { title: { contains: fallbackQuery, mode: "insensitive" } },
          { canonText: { contains: fallbackQuery, mode: "insensitive" } },
        ],
        ...(era ? { episode: { ...eraEpisodeFilter } } : {}),
      },
      select: {
        id: true, chapterNumber: true, title: true, slug: true,
        canonText: true, interpretationText: true, mythicText: true,
        emergingSignals: true, isMajorEvent: true,
        episode: { select: { slug: true, title: true } },
      },
      orderBy: { chapterNumber: "desc" },
      take: 3,
    }),
    prisma.psychenomiconEntity.findMany({
      where: {
        OR: [
          { name: { contains: primaryQuery, mode: "insensitive" } },
          { primaryArchetype: { contains: primaryQuery, mode: "insensitive" } },
          { name: { contains: fallbackQuery, mode: "insensitive" } },
          ...(ctx?.sourceArchetype ? [{ primaryArchetype: { contains: ctx.sourceArchetype, mode: "insensitive" as const } }] : []),
          ...(ctx?.sourcePerson ? [{ personSlug: { contains: ctx.sourcePerson, mode: "insensitive" as const } }] : []),
        ],
      },
      select: { id: true, name: true, slug: true, primaryArchetype: true, behaviorPatterns: true, status: true, personSlug: true },
      take: 3,
    }),
    prisma.psychenomiconThread.findMany({
      where: {
        status: { not: "resolved" },
        OR: [
          { title: { contains: primaryQuery, mode: "insensitive" } },
          { description: { contains: primaryQuery, mode: "insensitive" } },
          { title: { contains: fallbackQuery, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, slug: true, description: true, status: true },
      take: 3,
    }),
  ]);

  return { quotes, transcripts, episodes, people, lore, chapters, entities, threads, query: primaryQuery };
}

// ─── Context builder (shared by pre-flight and tool results) ─────────────────

function buildContext(data: Awaited<ReturnType<typeof searchArchive>>): {
  contextText: string;
  citations: OracleCitation[];
} {
  const parts: string[] = [];
  const citations: OracleCitation[] = [];
  const seenEpisodes = new Set<string>();
  const seenSlugs = new Set<string>();

  if (data.quotes.length > 0) {
    parts.push("=== QUOTES FROM THE ARCHIVE ===");
    for (const q of data.quotes) {
      parts.push(`"${q.text}" — ${q.speaker?.displayName ?? "Unknown"} (${q.episode?.title ?? "unknown episode"})`);
      if (q.episode && !seenEpisodes.has(q.episode.slug)) {
        seenEpisodes.add(q.episode.slug);
        citations.push({ type: "quote", label: q.episode.title, href: `/episodes/${q.episode.slug}` });
      }
    }
  }

  if (data.transcripts.length > 0) {
    const perEpisode = new Map<string, number>();
    parts.push("\n=== TRANSCRIPT EXCERPTS ===");
    for (const t of data.transcripts) {
      const count = perEpisode.get(t.episode.slug) ?? 0;
      if (count >= 2) continue;
      perEpisode.set(t.episode.slug, count + 1);
      const epLabel = t.episode.episodeNumber
        ? `EP.${String(t.episode.episodeNumber).padStart(3, "0")} — ${t.episode.title}`
        : t.episode.title;
      parts.push(`[${t.speakerLabel ?? "Speaker"}]: "${t.text.slice(0, 250)}" — ${epLabel}`);
      if (!seenEpisodes.has(t.episode.slug)) {
        seenEpisodes.add(t.episode.slug);
        citations.push({ type: "transcript", label: t.episode.title, href: `/episodes/${t.episode.slug}` });
      }
    }
  }

  if (data.episodes.length > 0) {
    parts.push("\n=== RELEVANT EPISODES ===");
    for (const ep of data.episodes) {
      if (seenEpisodes.has(ep.slug)) continue;
      const summary = ep.summaryLong ? ep.summaryLong.slice(0, 500) : ep.summaryShort ?? "";
      parts.push(`${ep.title}${summary ? `: ${summary}` : ""}`);
      seenEpisodes.add(ep.slug);
      citations.push({ type: "episode", label: ep.title, href: `/episodes/${ep.slug}` });
    }
  }

  if (data.people.length > 0) {
    parts.push("\n=== RELEVANT PEOPLE ===");
    for (const p of data.people) {
      if (seenSlugs.has(p.slug)) continue;
      seenSlugs.add(p.slug);
      const bio = p.loreSummary ? p.loreSummary.slice(0, 500) : (p.shortBio ?? "");
      parts.push(`${p.displayName}${bio ? `: ${bio}` : ""}`);
      citations.push({ type: "person", label: p.displayName, href: `/people/${p.slug}` });
    }
  }

  if (data.lore.length > 0) {
    parts.push("\n=== LORE ENTRIES ===");
    for (const l of data.lore) {
      if (seenSlugs.has(l.slug)) continue;
      seenSlugs.add(l.slug);
      parts.push(`${l.title}${l.summary ? `: ${l.summary.slice(0, 300)}` : ""}`);
    }
  }

  if (data.chapters.length > 0) {
    parts.push("\n=== PSYCHENOMICON CHAPTERS ===");
    for (const ch of data.chapters) {
      const key = `chapter-${ch.slug}`;
      if (seenSlugs.has(key)) continue;
      seenSlugs.add(key);
      const label = ch.isMajorEvent ? `★ Chapter ${ch.chapterNumber}: ${ch.title}` : `Chapter ${ch.chapterNumber}: ${ch.title}`;
      const lines: string[] = [label];
      if (ch.canonText) lines.push(`[CANON]: ${ch.canonText.slice(0, 400)}`);
      if (ch.interpretationText) lines.push(`[INTERPRETATION]: ${ch.interpretationText.slice(0, 400)}`);
      if (ch.mythicText) lines.push(`[MYTHIC]: ${ch.mythicText.slice(0, 200)}`);
      if (ch.emergingSignals.length > 0) lines.push(`[SIGNALS]: ${ch.emergingSignals.join(" | ")}`);
      parts.push(lines.join("\n"));
      citations.push({ type: "chapter", label: `Chapter ${ch.chapterNumber}: ${ch.title}`, href: `/psychenomicon/chapters/${ch.slug}` });
      if (ch.episode && !seenEpisodes.has(ch.episode.slug)) {
        seenEpisodes.add(ch.episode.slug);
        citations.push({ type: "episode", label: ch.episode.title, href: `/episodes/${ch.episode.slug}` });
      }
    }
  }

  if (data.entities.length > 0) {
    parts.push("\n=== PSYCHENOMICON ENTITIES ===");
    for (const e of data.entities) {
      const key = `entity-${e.slug}`;
      if (seenSlugs.has(key)) continue;
      seenSlugs.add(key);
      const archetype = e.primaryArchetype ? ` — Archetype: ${e.primaryArchetype}` : "";
      const status = e.status !== "active" ? ` [${e.status.toUpperCase()}]` : "";
      const patterns = e.behaviorPatterns.length > 0 ? `\n  Patterns: ${e.behaviorPatterns.slice(0, 4).join(", ")}` : "";
      parts.push(`${e.name}${archetype}${status}${patterns}`);
      citations.push({ type: "entity", label: e.name, href: `/psychenomicon/entities/${e.slug}` });
    }
  }

  if (data.threads.length > 0) {
    parts.push("\n=== ACTIVE NARRATIVE THREADS ===");
    for (const t of data.threads) {
      const key = `thread-${t.slug}`;
      if (seenSlugs.has(key)) continue;
      seenSlugs.add(key);
      const desc = t.description ? `: ${t.description.slice(0, 200)}` : "";
      parts.push(`[${t.status.toUpperCase()}] "${t.title}"${desc}`);
    }
  }

  return {
    contextText: parts.length > 0 ? parts.join("\n") : "No directly relevant archive content found for this query.",
    citations: citations.slice(0, 10),
  };
}

// ─── Tool handlers ───────────────────────────────────────────────────────────

type ToolResult = { text: string; citations: OracleCitation[] };

async function handleSearchArchive(
  input: { query: string; source_types?: string[]; k?: number }
): Promise<ToolResult> {
  const k = Math.min(input.k ?? 4, 8);
  const types = new Set(input.source_types ?? ["quotes", "transcripts", "episodes", "people", "lore", "psychenomicon"]);
  const q = input.query;
  const { terms, fullQuery } = extractTerms(q);
  // Match individual terms, not a joined phrase — see note in searchArchive().
  const primary = terms[0] ?? fullQuery;
  const fallback = terms[1] ?? terms[0] ?? fullQuery;

  const parts: string[] = [];
  const citations: OracleCitation[] = [];
  const seenEpisodes = new Set<string>();

  if (types.has("quotes")) {
    const quotes = await prisma.quote.findMany({
      where: { OR: [{ text: { contains: primary, mode: "insensitive" } }, { text: { contains: fallback, mode: "insensitive" } }] },
      select: { text: true, speaker: { select: { displayName: true, slug: true } }, episode: { select: { title: true, slug: true } } },
      take: k,
    });
    if (quotes.length > 0) {
      parts.push("QUOTES:");
      for (const quote of quotes) {
        parts.push(`"${quote.text}" — ${quote.speaker?.displayName ?? "Unknown"} (${quote.episode?.title ?? "unknown"})`);
        if (quote.episode && !seenEpisodes.has(quote.episode.slug)) {
          seenEpisodes.add(quote.episode.slug);
          citations.push({ type: "quote", label: quote.episode.title, href: `/episodes/${quote.episode.slug}` });
        }
      }
    }
  }

  if (types.has("transcripts")) {
    const transcripts = await prisma.transcriptSegment.findMany({
      where: { OR: [{ text: { contains: primary, mode: "insensitive" } }, { text: { contains: fallback, mode: "insensitive" } }] },
      select: { text: true, speakerLabel: true, episode: { select: { title: true, slug: true, episodeNumber: true } } },
      take: k,
    });
    if (transcripts.length > 0) {
      parts.push("\nTRANSCRIPTS:");
      for (const t of transcripts) {
        const epLabel = t.episode.episodeNumber ? `EP.${String(t.episode.episodeNumber).padStart(3, "0")} — ${t.episode.title}` : t.episode.title;
        parts.push(`[${t.speakerLabel ?? "Speaker"}]: "${t.text.slice(0, 200)}" — ${epLabel}`);
        if (!seenEpisodes.has(t.episode.slug)) {
          seenEpisodes.add(t.episode.slug);
          citations.push({ type: "transcript", label: t.episode.title, href: `/episodes/${t.episode.slug}` });
        }
      }
    }
  }

  if (types.has("episodes")) {
    const episodes = await prisma.episode.findMany({
      where: {
        status: "published",
        OR: [
          { title: { contains: primary, mode: "insensitive" } },
          { summaryShort: { contains: primary, mode: "insensitive" } },
          { summaryLong: { contains: primary, mode: "insensitive" } },
          { searchText: { contains: primary, mode: "insensitive" } },
        ],
      },
      select: { title: true, slug: true, summaryShort: true, summaryLong: true },
      orderBy: { airDate: "desc" },
      take: k,
    });
    if (episodes.length > 0) {
      parts.push("\nEPISODES:");
      for (const ep of episodes) {
        if (seenEpisodes.has(ep.slug)) continue;
        const summary = ep.summaryLong ? ep.summaryLong.slice(0, 300) : (ep.summaryShort ?? "");
        parts.push(`${ep.title}${summary ? `: ${summary}` : ""}`);
        seenEpisodes.add(ep.slug);
        citations.push({ type: "episode", label: ep.title, href: `/episodes/${ep.slug}` });
      }
    }
  }

  if (types.has("people")) {
    const people = await prisma.person.findMany({
      where: {
        OR: [
          { displayName: { contains: primary, mode: "insensitive" } },
          { shortBio: { contains: primary, mode: "insensitive" } },
          { searchText: { contains: primary, mode: "insensitive" } },
        ],
      },
      select: { displayName: true, slug: true, shortBio: true, loreSummary: true },
      take: k,
    });
    if (people.length > 0) {
      parts.push("\nPEOPLE:");
      for (const p of people) {
        const bio = p.loreSummary ?? p.shortBio ?? "";
        parts.push(`${p.displayName}${bio ? `: ${bio.slice(0, 300)}` : ""}`);
        citations.push({ type: "person", label: p.displayName, href: `/people/${p.slug}` });
      }
    }
  }

  if (types.has("lore")) {
    const lore = await prisma.loreEntry.findMany({
      where: {
        OR: [
          { title: { contains: primary, mode: "insensitive" } },
          { summary: { contains: primary, mode: "insensitive" } },
          { searchText: { contains: primary, mode: "insensitive" } },
        ],
      },
      select: { title: true, slug: true, summary: true },
      take: k,
    });
    if (lore.length > 0) {
      parts.push("\nLORE:");
      for (const l of lore) {
        parts.push(`${l.title}${l.summary ? `: ${l.summary.slice(0, 300)}` : ""}`);
      }
    }
  }

  if (types.has("psychenomicon")) {
    const chapters = await prisma.psychenomiconChapter.findMany({
      where: {
        OR: [
          { title: { contains: primary, mode: "insensitive" } },
          { canonText: { contains: primary, mode: "insensitive" } },
          { interpretationText: { contains: primary, mode: "insensitive" } },
        ],
      },
      select: { chapterNumber: true, title: true, slug: true, canonText: true, interpretationText: true, mythicText: true },
      take: k,
    });
    if (chapters.length > 0) {
      parts.push("\nPSYCHENOMICON:");
      for (const ch of chapters) {
        const lines = [`Chapter ${ch.chapterNumber}: ${ch.title}`];
        if (ch.canonText) lines.push(`[CANON]: ${ch.canonText.slice(0, 300)}`);
        if (ch.interpretationText) lines.push(`[INTERPRETATION]: ${ch.interpretationText.slice(0, 300)}`);
        parts.push(lines.join("\n"));
        citations.push({ type: "chapter", label: `Chapter ${ch.chapterNumber}: ${ch.title}`, href: `/psychenomicon/chapters/${ch.slug}` });
      }
    }
  }

  return {
    text: parts.length > 0 ? parts.join("\n") : "No results found for this query.",
    citations,
  };
}

async function handleGetPersonDossier(
  input: { name_or_slug: string; include_quotes?: boolean; include_appearances?: boolean }
): Promise<ToolResult> {
  const nameOrSlug = input.name_or_slug.toLowerCase().trim();
  const includeQuotes = input.include_quotes !== false;
  const includeAppearances = input.include_appearances !== false;

  // Try slug match first, then display name
  const person = await prisma.person.findFirst({
    where: {
      OR: [
        { slug: nameOrSlug },
        { slug: nameOrSlug.replace(/\s+/g, "-") },
        { displayName: { contains: input.name_or_slug, mode: "insensitive" } },
      ],
    },
    select: {
      id: true, displayName: true, slug: true,
      shortBio: true, loreSummary: true, personType: true,
    },
  });

  if (!person) {
    return {
      text: `No dossier found for "${input.name_or_slug}". The codex has no record of this person.`,
      citations: [],
    };
  }

  const parts: string[] = [`=== DOSSIER: ${person.displayName} ===`];
  if (person.personType) parts.push(`Type: ${person.personType}`);
  if (person.shortBio) parts.push(`Bio: ${person.shortBio.slice(0, 500)}`);
  if (person.loreSummary) parts.push(`Lore: ${person.loreSummary.slice(0, 800)}`);

  const citations: OracleCitation[] = [{ type: "person", label: person.displayName, href: `/people/${person.slug}` }];

  if (includeAppearances) {
    const appearances = await prisma.episodeGuest.findMany({
      where: { personId: person.id },
      select: { episode: { select: { title: true, slug: true, episodeNumber: true, airDate: true } } },
      orderBy: { episode: { airDate: "desc" } },
      take: 6,
    });
    if (appearances.length > 0) {
      parts.push(`\nRecent Appearances (${appearances.length} total shown):`);
      for (const a of appearances) {
        const ep = a.episode;
        parts.push(`- EP.${String(ep.episodeNumber ?? "?").padStart(3, "0")} — ${ep.title}`);
        citations.push({ type: "episode", label: ep.title, href: `/episodes/${ep.slug}` });
      }
    }
  }

  if (includeQuotes) {
    const quotes = await prisma.quote.findMany({
      where: { speakerPersonId: person.id },
      select: { text: true, episode: { select: { title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    if (quotes.length > 0) {
      parts.push("\nTop Quotes:");
      for (const q of quotes) {
        parts.push(`"${q.text.slice(0, 200)}" (${q.episode?.title ?? "unknown"})`);
      }
    }
  }

  // Psychenomicon entity record
  const entity = await prisma.psychenomiconEntity.findFirst({
    where: { personSlug: person.slug },
    select: { name: true, slug: true, primaryArchetype: true, behaviorPatterns: true, status: true },
  });
  if (entity) {
    parts.push(`\nPsychenomicon Entity: ${entity.name}`);
    if (entity.primaryArchetype) parts.push(`Archetype: ${entity.primaryArchetype}`);
    if (entity.behaviorPatterns.length > 0) parts.push(`Patterns: ${entity.behaviorPatterns.slice(0, 5).join(", ")}`);
    if (entity.status !== "active") parts.push(`Status: ${entity.status}`);
    citations.push({ type: "entity", label: entity.name, href: `/psychenomicon/entities/${entity.slug}` });
  }

  return { text: parts.join("\n"), citations };
}

async function handleGetPsychenomicon(
  input: { resource: "chapter" | "thread" | "entity"; chapter_number?: number; slug?: string; name?: string }
): Promise<ToolResult> {
  const { resource } = input;

  if (resource === "chapter") {
    const where = input.chapter_number
      ? { chapterNumber: input.chapter_number }
      : input.slug
      ? { slug: input.slug }
      : null;

    if (!where) {
      return { text: "Provide chapter_number or slug to fetch a chapter.", citations: [] };
    }

    const ch = await prisma.psychenomiconChapter.findFirst({
      where,
      select: {
        chapterNumber: true, title: true, slug: true, isMajorEvent: true,
        canonText: true, interpretationText: true, mythicText: true,
        emergingSignals: true, episode: { select: { title: true, slug: true } },
      },
    });

    if (!ch) {
      return { text: `No Psychenomicon chapter found for the given identifier.`, citations: [] };
    }

    const label = ch.isMajorEvent ? `★ Chapter ${ch.chapterNumber}: ${ch.title}` : `Chapter ${ch.chapterNumber}: ${ch.title}`;
    const lines = [label];
    if (ch.canonText) lines.push(`[CANON]: ${ch.canonText.slice(0, 800)}`);
    if (ch.interpretationText) lines.push(`[INTERPRETATION]: ${ch.interpretationText.slice(0, 600)}`);
    if (ch.mythicText) lines.push(`[MYTHIC]: ${ch.mythicText.slice(0, 300)}`);
    if (ch.emergingSignals.length > 0) lines.push(`[SIGNALS]: ${ch.emergingSignals.join(" | ")}`);

    const citations: OracleCitation[] = [
      { type: "chapter", label: `Chapter ${ch.chapterNumber}: ${ch.title}`, href: `/psychenomicon/chapters/${ch.slug}` },
    ];
    if (ch.episode) {
      citations.push({ type: "episode", label: ch.episode.title, href: `/episodes/${ch.episode.slug}` });
    }
    return { text: lines.join("\n"), citations };
  }

  if (resource === "thread") {
    const thread = await prisma.psychenomiconThread.findFirst({
      where: input.slug
        ? { slug: input.slug }
        : input.name
        ? { title: { contains: input.name, mode: "insensitive" } }
        : { status: { not: "resolved" } },
      select: { title: true, slug: true, description: true, status: true },
    });

    if (!thread) {
      return { text: "No matching narrative thread found.", citations: [] };
    }

    return {
      text: `Thread: ${thread.title} [${thread.status.toUpperCase()}]${thread.description ? `\n${thread.description}` : ""}`,
      citations: [],
    };
  }

  if (resource === "entity") {
    const entity = await prisma.psychenomiconEntity.findFirst({
      where: input.slug
        ? { slug: input.slug }
        : input.name
        ? { name: { contains: input.name, mode: "insensitive" } }
        : undefined,
      select: { name: true, slug: true, primaryArchetype: true, behaviorPatterns: true, status: true, personSlug: true },
    });

    if (!entity) {
      return { text: "No matching Psychenomicon entity found.", citations: [] };
    }

    const lines = [
      `Entity: ${entity.name}`,
      ...(entity.primaryArchetype ? [`Archetype: ${entity.primaryArchetype}`] : []),
      ...(entity.behaviorPatterns.length > 0 ? [`Patterns: ${entity.behaviorPatterns.join(", ")}`] : []),
      ...(entity.status !== "active" ? [`Status: ${entity.status}`] : []),
    ];

    return {
      text: lines.join("\n"),
      citations: [{ type: "entity", label: entity.name, href: `/psychenomicon/entities/${entity.slug}` }],
    };
  }

  return { text: "Unknown resource type.", citations: [] };
}

async function executeTool(name: string, input: Record<string, unknown>): Promise<ToolResult> {
  try {
    if (name === "search_archive") {
      return handleSearchArchive(input as Parameters<typeof handleSearchArchive>[0]);
    }
    if (name === "get_person_dossier") {
      return handleGetPersonDossier(input as Parameters<typeof handleGetPersonDossier>[0]);
    }
    if (name === "get_psychenomicon") {
      return handleGetPsychenomicon(input as Parameters<typeof handleGetPsychenomicon>[0]);
    }
    return { text: `Unknown tool: ${name}`, citations: [] };
  } catch (err) {
    console.error(`[oracle] tool ${name} error:`, err);
    return { text: `Tool ${name} encountered an error. The archive may be unavailable.`, citations: [] };
  }
}

// ─── Agent loop ──────────────────────────────────────────────────────────────

async function runOracleAgent(
  client: AnthropicBedrock,
  model: string,
  initialContextText: string,
  question: string,
  preFlightCitations: OracleCitation[],
  contextPreamble: string,
  system: string = ORACLE_SYSTEM,
  maxTokens = 1024,
): Promise<{ answer: string; citations: OracleCitation[] }> {
  const allCitations: OracleCitation[] = [...preFlightCitations];
  const seenCitationHrefs = new Set(preFlightCitations.map((c) => c.href));

  const messages: MessageParam[] = [
    {
      role: "user",
      content: `Archive context (pre-searched):\n${initialContextText}\n\n${contextPreamble}Question: ${question}`,
    },
  ];

  const MAX_ROUNDS = 3;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      tools: ORACLE_TOOLS,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        return { answer: "", citations: allCitations };
      }
      return { answer: textBlock.text.trim(), citations: allCitations };
    }

    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });

      const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
      const toolResults: ToolResultBlockParam[] = [];

      for (const block of toolUseBlocks) {
        if (block.type !== "tool_use") continue;
        const result = await executeTool(block.name, block.input as Record<string, unknown>);

        // Merge new citations
        for (const c of result.citations) {
          if (!seenCitationHrefs.has(c.href)) {
            seenCitationHrefs.add(c.href);
            allCitations.push(c);
          }
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result.text,
        });
      }

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    // Unexpected stop reason — extract text if present and break
    const textBlock = response.content.find((b) => b.type === "text");
    if (textBlock && textBlock.type === "text") {
      return { answer: textBlock.text.trim(), citations: allCitations };
    }
    break;
  }

  return { answer: "", citations: allCitations };
}

// ─── Trial cookie helpers ────────────────────────────────────────────────────

const TRIAL_COOKIE = "oracle_trial";
const TRIAL_LIMIT = FREE_ORACLE_MONTHLY_LIMIT;

function parseTrialCookie(raw: string | undefined): { used: number; month: string } {
  const now = new Date();
  const thisMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  if (!raw) return { used: 0, month: thisMonth };
  const [countStr, month] = raw.split("|");
  if (month !== thisMonth) return { used: 0, month: thisMonth };
  const used = parseInt(countStr, 10);
  return { used: isNaN(used) ? 0 : used, month: thisMonth };
}

function setTrialCookie(res: NextResponse, used: number, month: string): void {
  res.cookies.set(TRIAL_COOKIE, `${used}|${month}`, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 32,
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Server-side backing for the trial cookie. The cookie alone is clearable, so
 * the trial is also metered per caller (user id when signed in, hashed IP
 * otherwise) in the monthly LlmBudget table. The cookie stays as a fast path
 * and for the UI's remaining-count display.
 */
function trialMeterBucket(callerKey: string): string {
  const id = callerKey.startsWith("ip:")
    ? `ip:${createHash("sha256").update(callerKey).digest("hex").slice(0, 32)}`
    : callerKey;
  return `oracle-trial-${id}`;
}

// ─── Voice (ElevenLabs) ──────────────────────────────────────────────────────

/**
 * Text-to-speech for an answer, or null for a text-only reply. Every call is
 * charged to its own daily budget (ORACLE_TTS_DAILY_CAP) because cache hits
 * skip the LLM budget but still pay ElevenLabs; without this, repeating a
 * cached question spent TTS with no global ceiling.
 */
async function synthesizeVoice(text: string): Promise<string | null> {
  const elKey = process.env.ELEVENLABS_API_KEY;
  if (!elKey) return null;
  const budget = await consumeLlmBudget("oracle_tts", Number(process.env.ORACLE_TTS_DAILY_CAP ?? "500"));
  if (!budget.ok) return null;
  const elVoice = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";
  try {
    const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elVoice}`, {
      method: "POST",
      headers: { "xi-api-key": elKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.60, similarity_boost: 0.80, style: 0.15, use_speaker_boost: true },
      }),
    });
    if (!elRes.ok) return null;
    return Buffer.from(await elRes.arrayBuffer()).toString("base64");
  } catch {
    // Voice unavailable — text-only fallback
    return null;
  }
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const canAccess = user ? user.role === "admin" || (await isSubscribed(user.id)) : false;

  const trial = parseTrialCookie(req.cookies.get(TRIAL_COOKIE)?.value);
  const isFreeTrialRequest = !canAccess && trial.used < TRIAL_LIMIT;

  if (!canAccess && trial.used >= TRIAL_LIMIT) {
    return NextResponse.json(
      { ok: false, error: "initiate_required" } satisfies OracleResponse,
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const question = String(body.question ?? "").trim().slice(0, 500);
  // Divination: one card drawn here, on the server, so the client can't pick it.
  const draw = body.mode === "divine" ? drawOracleCard() : null;

  if (!question) {
    return NextResponse.json(
      { ok: false, error: "A question is required." } satisfies OracleResponse,
      { status: 400 }
    );
  }

  const rawCtx = body.searchContext;
  const searchContext: OracleSearchContext | undefined =
    rawCtx && typeof rawCtx === "object" && !Array.isArray(rawCtx)
      ? {
          sourceEra: typeof (rawCtx as Record<string, unknown>).sourceEra === "string"
            ? String((rawCtx as Record<string, unknown>).sourceEra).slice(0, 40) : undefined,
          sourcePerson: typeof (rawCtx as Record<string, unknown>).sourcePerson === "string"
            ? String((rawCtx as Record<string, unknown>).sourcePerson).slice(0, 80) : undefined,
          sourceArchetype: typeof (rawCtx as Record<string, unknown>).sourceArchetype === "string"
            ? String((rawCtx as Record<string, unknown>).sourceArchetype).slice(0, 80) : undefined,
        }
      : undefined;

  // Guard the expensive LLM + ElevenLabs path against rapid-fire calls.
  const callerKey = clientKey(req, user?.id);
  const localRl = rateLimit(`oracle:${callerKey}`, {
    limit: 15,
    windowMs: 60_000,
  });
  if (!localRl.ok) {
    return NextResponse.json(
      { ok: false, error: "The Oracle needs a moment. Try again shortly." } satisfies OracleResponse,
      { status: 429, headers: { "Retry-After": String(localRl.retryAfterSec) } }
    );
  }
  const sharedRl = await sharedRateLimit("oracle", callerKey, { limit: 15, windowMs: 60_000 });
  if (!sharedRl.ok) {
    return NextResponse.json(
      { ok: false, error: "The Oracle needs a moment. Try again shortly." } satisfies OracleResponse,
      { status: 429, headers: { "Retry-After": String(sharedRl.retryAfterSec) } }
    );
  }

  // Free trial, server side. Charged before the cache check because a cache
  // hit still costs TTS; refunded below if no answer is produced.
  let trialUsed = trial.used;
  let trialBucket: string | null = null;
  if (isFreeTrialRequest) {
    trialBucket = trialMeterBucket(callerKey);
    const meter = await consumeMonthlyMeter(trialBucket, TRIAL_LIMIT);
    if (!meter.ok) {
      await refundMonthlyMeter(trialBucket);
      return NextResponse.json(
        { ok: false, error: "initiate_required" } satisfies OracleResponse,
        { status: 403 }
      );
    }
    if (meter.persisted) trialUsed = Math.max(trialUsed, meter.used - 1);
    else trialBucket = null;
  }
  const trialRemaining = isFreeTrialRequest ? Math.max(0, TRIAL_LIMIT - trialUsed - 1) : undefined;
  const refundTrial = async () => {
    if (trialBucket) await refundMonthlyMeter(trialBucket);
  };

  // Cache check — skip the LLM call if we've seen this exact query.
  // Audio is NOT cached (base64 MP3s are large); TTS is re-fetched on cache hits.
  // Every reading draws a fresh card, so divination never reads from the cache.
  const cacheKey = oracleCacheKey(question, searchContext);
  const cached = draw ? null : oracleCacheGet(cacheKey);
  if (cached) {
    // Re-run TTS so callers still get voice on cache hits, without storing audio in memory.
    const cachedAudio = await synthesizeVoice(cached.answer);

    const res = NextResponse.json({
      ok: true,
      answer: cached.answer,
      citations: cached.citations,
      audioBase64: cachedAudio,
      hasVoice: !!cachedAudio,
      trialUsed: isFreeTrialRequest,
      trialRemaining,
    } satisfies OracleResponse);
    if (isFreeTrialRequest) setTrialCookie(res, trialUsed + 1, trial.month);
    return res;
  }

  // A cache miss is the first point where an LLM call may be required. Do not
  // reject cached answers or consume a member's allowance when the provider is
  // unavailable or no inference will occur.
  // The free Groq path does not need AWS credentials. Require AWS only when
  // Bedrock is the configured fallback and no free provider is available.
  const bedrockConfigured =
    process.env.ORACLE_USE_BEDROCK === "true" &&
    Boolean(process.env.AWS_REGION || process.env.AWS_ACCESS_KEY_ID);
  if (!groqConfigured() && !bedrockConfigured) {
    await refundTrial();
    return NextResponse.json(
      { ok: false, error: "Oracle not configured." } satisfies OracleResponse,
      { status: 500 }
    );
  }

  // Global daily ceiling on the expensive LLM path. The per-caller trial meter
  // is keyed on IP for anonymous callers (rotatable), so cap total calls/day
  // across everyone. Tune via
  // ORACLE_DAILY_CAP; AI_KILLSWITCH=1 disables instantly.
  //
  // Charged here, past the cache check, so a cache hit never spends global
  // capacity on an LLM call that will not happen. Everything above this line
  // (parse, validate, rate limit, cache lookup) runs first so malformed or
  // duplicate requests cannot burn the day's budget.
  const budget = await consumeLlmBudget("oracle", Number(process.env.ORACLE_DAILY_CAP ?? "500"));
  if (!budget.ok) {
    await refundTrial();
    return NextResponse.json(
      { ok: false, error: "The Oracle is resting. Try again later." } satisfies OracleResponse,
      { status: 503, headers: { "Retry-After": "3600" } }
    );
  }

  // Initiate+ monthly meter. The contractual cap is shared with the public
  // tier definition so an environment override cannot silently change what
  // customers bought. It aligns price with
  // inference cost and gives heavy users a concrete upgrade trigger. Oracle
  // tier (system) and admins are unmetered; hasSystemTier covers both.
  // Deliberately the LAST gate: it runs after the burst limiter, question
  // validation, the cache lookup, the config check and the global daily cap,
  // so a request rejected for any of those reasons does not also cost a
  // paying user one of their monthly questions. (It used to run first, so a
  // 429 or a 503 "Oracle is resting" still burned quota.) The cache lookup
  // sitting above it also means a repeat question is free.
  let monthlyMeterBucket: string | null = null;
  if (canAccess && user && !(await hasSystemTier(user.id))) {
    monthlyMeterBucket = `oracle-u-${user.id}`;
    const meter = await consumeMonthlyMeter(
      monthlyMeterBucket,
      INITIATE_ORACLE_MONTHLY_LIMIT
    );
    if (!meter.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "You've used all " + meter.cap + " Oracle questions in your Initiate+ month. " +
            "They renew with your billing cycle — or Ascend to Oracle for unlimited communion.",
        } satisfies OracleResponse,
        { status: 403 }
      );
    }
    if (!meter.persisted) monthlyMeterBucket = null;
  }

  // Pre-flight archive search
  let archiveData: Awaited<ReturnType<typeof searchArchive>>;
  try {
    // A reading searches for the card's themes too, so the archive can echo them.
    const searchQuery = draw ? `${question} ${draw.def.title} ${draw.meaning.keywords.join(" ")}` : question;
    archiveData = await searchArchive(searchQuery, searchContext);
  } catch (err) {
    console.error("[oracle] archive search failed:", err);
    archiveData = { quotes: [], transcripts: [], episodes: [], people: [], lore: [], chapters: [], entities: [], threads: [], query: question };
  }
  const { contextText, citations: preFlightCitations } = buildContext(archiveData);

  // Context preamble for intent anchoring
  // Build optional context preamble for the LLM prompt.
  // Keeps the Oracle's answer anchored to the caller's intent.
  const contextLines: string[] = [];
  if (searchContext?.sourceArchetype) contextLines.push(`Archetype lens: ${searchContext.sourceArchetype}`);
  if (searchContext?.sourceEra) {
    const era = getEraById(searchContext.sourceEra);
    if (era) contextLines.push(`Era context: ${era.label} — ${era.subtitle}`);
  }
  if (searchContext?.sourcePerson) {
    contextLines.push(`Subject focus: ${searchContext.sourcePerson.replace(/-/g, " ")}`);
  }
  const contextPreamble =
    (contextLines.length > 0 ? `Context frame: ${contextLines.join(" | ")}\n\n` : "") +
    (draw ? `${describeDraw(draw)}\n\n` : "");
  const system = draw ? DIVINATION_SYSTEM : ORACLE_SYSTEM;
  const maxTokens = draw ? 2000 : 1024;

  let answer: string | null = null;
  let citations: OracleCitation[] = preFlightCitations;

  // FREE-FIRST: answer from the pre-gathered archive context via the free Groq
  // tier (gpt-oss-120b by default). This keeps the Oracle's LLM bill at ~$0.
  // The expensive agentic Bedrock/Opus path (multi-step tool retrieval) is now
  // OPT-IN via ORACLE_USE_BEDROCK=true — flip it on once AWS Activate credits
  // cover the cost and you want the premium tier to run on Claude.
  if (groqConfigured()) {
    try {
      const groqAnswer = await groqChat({
        system,
        user: `Archive context (pre-searched):\n${contextText}\n\n${contextPreamble}Question: ${question}`,
        maxTokens,
      });
      if (groqAnswer.trim()) { answer = groqAnswer.trim(); citations = preFlightCitations; }
    } catch (groqErr) {
      console.error("[oracle] groq primary failed:", groqErr instanceof Error ? groqErr.message : groqErr);
    }
  }

  // Paid fallback — only if the free path came up empty AND Bedrock is enabled.
  if (answer == null && bedrockConfigured) {
    try {
      const client = new AnthropicBedrock({ awsRegion: process.env.AWS_REGION ?? "us-east-1" });
      const model = bedrockModelId(process.env.ORACLE_MODEL ?? "claude-opus-4-8");
      const result = await runOracleAgent(client, model, contextText, question, preFlightCitations, contextPreamble, system, maxTokens);
      answer = result.answer;
      citations = result.citations;
    } catch (err) {
      console.error("[oracle] bedrock fallback error:", err instanceof Error ? err.message : err);
    }
  }

  if (answer == null) {
    if (monthlyMeterBucket) await refundMonthlyMeter(monthlyMeterBucket);
    await refundTrial();
    return NextResponse.json(
      { ok: false, error: "The Oracle is resting. Try again in a moment." } satisfies OracleResponse,
      { status: 503, headers: { "Retry-After": "30" } }
    );
  }

  const audioBase64 = await synthesizeVoice(draw ? spokenPartOfReading(answer) : answer);

  if (!draw) oracleCacheSet(cacheKey, { answer, citations });

  const finalRes = NextResponse.json({
    ok: true,
    answer,
    citations,
    audioBase64,
    hasVoice: !!audioBase64,
    trialUsed: isFreeTrialRequest,
    trialRemaining,
    card: draw ? { slug: draw.def.slug, reversed: draw.reversed } : undefined,
  } satisfies OracleResponse);

  if (isFreeTrialRequest) setTrialCookie(finalRes, trialUsed + 1, trial.month);
  return finalRes;
}
