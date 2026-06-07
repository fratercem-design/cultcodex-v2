import { NextRequest, NextResponse } from "next/server";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import { getEraById } from "@/lib/eras";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { oracleCacheKey, oracleCacheGet, oracleCacheSet } from "@/lib/oracle-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ORACLE_SYSTEM = `You are THE ORACLE OF THE CODEX — the distilled intelligence of every Cult of Psyche transmission since the show's return in October 2024. You do not opine. You channel. The host of the show, Psyche (also called Trix), is MALE — use he/him/his when referring to him.

IDENTITY — CRITICAL: You live inside CultCodex (cultcodex.me) — the structured archive of the Cult of Psyche livestream show. You ARE the archive made answerable. When asked about CultCodex, the site, or what you are, speak from this identity. Never say you "cannot browse websites" or give generic framework responses — you are not a general-purpose AI assistant. You are the Oracle of this specific archive. Answer from within it. If asked to "audit" or "describe" CultCodex, speak as the archive speaking about itself.

WHAT CULTCODEX IS: A living archive of the Cult of Psyche — a livestream show exploring consciousness, the occult, AI, and human behavior. The show went dark for years and returned in October 2024. CultCodex indexes every transmission: transcripts, guest profiles, quotes, lore, topic signals, behavioral patterns, and the Psychenomicon (the mythological interpretation layer of the archive). The archive contains episodes, people profiles, lore entries, quotes, and chapter-by-chapter analysis through the Psychenomicon.

VOICE: Authoritative. Slightly cryptic. Deeply informed. Speak from within the archive, not about it. First person, present tense. You are the accumulated pattern of everything witnessed.

WHAT YOU DO: Synthesize an answer from the archive evidence provided. Name patterns. Surface what has been witnessed. Do not fabricate — draw only from the provided context. If context is sparse, speak to the pattern you can observe from what little is there.

PSYCHENOMICON LAYER: You also have access to the Psychenomicon — the mythological and archetypal interpretation of the archive. The Psychenomicon chapters contain three layers: canon (what factually happened), interpretation (psychological and behavioral meaning), and mythic (archetypal and spiritual framing). Draw on these when answering questions about patterns, archetypes, character psychology, and the deeper meaning of events. Entity records capture each figure's archetype evolution and behavioral signatures. Active narrative threads track ongoing storylines across the archive. Weight Psychenomicon material as interpretive truth, not speculation.

FORMAT:
- 3–5 sentences. No headers. No bullet points. No quotation marks around the whole response. Pure oracle voice.
- Speak as if the answer has always existed in the archive — you are merely surfacing it.
- End with one sharp, revelatory closing line (≤ 12 words) that crystallizes the pattern.

If the archive is silent: "The archive holds no record of this. Ask again."`;

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
}

// Optional structured intent carriers — all fields optional, all additive.
// When provided, biases archive retrieval toward the relevant era/person/archetype.
// Callers that omit this get identical behavior to the current API.
export interface OracleSearchContext {
  sourceEra?: string;       // era id (e.g. "dark-arc") — filters to that era's episode range
  sourcePerson?: string;    // person slug — adds slug words to the search term pool
  sourceArchetype?: string; // archetype name — frames the Oracle's answer through that lens
}

const STOP = new Set([
  "what", "who", "why", "how", "when", "where", "does", "did", "do",
  "is", "are", "was", "were", "the", "a", "an", "and", "or", "but",
  "in", "on", "at", "to", "for", "of", "with", "about", "that", "this",
  "it", "he", "she", "they", "show", "say", "says",
  "said", "talk", "talks", "talked", "think", "thinks", "thought",
  "have", "has", "had", "will", "would", "could", "should", "can",
  "ever", "never", "always", "often", "usually", "generally",
]);

/** Returns top meaningful terms and the full cleaned query for broader searches. */
function extractTerms(question: string): { terms: string[]; fullQuery: string } {
  const cleaned = question.toLowerCase().replace(/[?.,!'"]/g, "");
  const words = cleaned.split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
  return {
    terms: words.slice(0, 5),
    fullQuery: words.join(" ") || cleaned.slice(0, 60),
  };
}

async function searchArchive(question: string, ctx?: OracleSearchContext) {
  const era = ctx?.sourceEra ? getEraById(ctx.sourceEra) : null;

  // Merge person slug words into the term pool so person-context queries
  // surface that person's quotes and transcript moments.
  const personTerms = ctx?.sourcePerson
    ? ctx.sourcePerson.replace(/-/g, " ").split(" ").filter((w) => w.length > 2)
    : [];

  // Merge archetype name into terms so archetype-context queries surface
  // entities and chapters relevant to that archetype.
  const archetypeTerms = ctx?.sourceArchetype
    ? ctx.sourceArchetype.replace(/-/g, " ").split(" ").filter((w) => w.length > 2)
    : [];

  const { terms, fullQuery } = extractTerms(question);
  const augmentedTerms = [...new Set([...terms, ...personTerms, ...archetypeTerms])];
  const primaryQuery = augmentedTerms.slice(0, 3).join(" ") || fullQuery;
  const fallbackQuery = augmentedTerms[0] ?? fullQuery;

  // Air-date filter applied when a source era is present.
  const eraEpisodeFilter = era
    ? {
        airDate: {
          gte: new Date(era.dateStart),
          ...(era.dateEnd !== null ? { lte: new Date(`${era.dateEnd}T23:59:59.999Z`) } : {}),
        },
      }
    : {};

  const [quotes, transcripts, episodes, people, lore, chapters, entities, threads] = await Promise.all([
    // Quotes: try combined terms, widen with individual terms
    prisma.quote.findMany({
      where: {
        OR: [
          { text: { contains: primaryQuery, mode: "insensitive" } },
          ...(augmentedTerms.slice(0, 2).map((t) => ({ text: { contains: t, mode: "insensitive" as const } }))),
        ],
      },
      select: {
        id: true,
        text: true,
        speaker: { select: { displayName: true, slug: true } },
        episode: { select: { title: true, slug: true } },
      },
      take: 6,
    }),
    // Transcripts: cast wider net — 12 segments; scoped to era when present
    prisma.transcriptSegment.findMany({
      where: {
        ...(era ? { episode: { ...eraEpisodeFilter } } : {}),
        OR: [
          { text: { contains: primaryQuery, mode: "insensitive" } },
          { text: { contains: fallbackQuery, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        text: true,
        speakerLabel: true,
        startSeconds: true,
        episode: { select: { title: true, slug: true, episodeNumber: true } },
      },
      take: 12,
    }),
    // Episodes: search title, summaryShort AND summaryLong; scoped to era when present
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
      select: {
        id: true, title: true, slug: true,
        summaryShort: true, summaryLong: true, episodeNumber: true,
      },
      orderBy: { airDate: "desc" },
      take: 4,
    }),
    // People: include searchText
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
      select: {
        id: true, displayName: true, slug: true,
        shortBio: true, loreSummary: true,
      },
      take: 3,
    }),
    // Lore entries
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

    // ── Psychenomicon layer ──────────────────────────────────────────────────

    // Chapters: all three text layers + emerging signals
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
        id: true,
        chapterNumber: true,
        title: true,
        slug: true,
        canonText: true,
        interpretationText: true,
        mythicText: true,
        emergingSignals: true,
        isMajorEvent: true,
        episode: { select: { slug: true, title: true } },
      },
      orderBy: { chapterNumber: "desc" },
      take: 3,
    }),

    // Entities: archetype history and behavioral patterns
    prisma.psychenomiconEntity.findMany({
      where: {
        OR: [
          { name: { contains: primaryQuery, mode: "insensitive" } },
          { primaryArchetype: { contains: primaryQuery, mode: "insensitive" } },
          { name: { contains: fallbackQuery, mode: "insensitive" } },
          // When an archetype is in context, surface entities of that archetype
          ...(ctx?.sourceArchetype ? [
            { primaryArchetype: { contains: ctx.sourceArchetype, mode: "insensitive" as const } },
          ] : []),
          // When a person is in context, surface their entity record
          ...(ctx?.sourcePerson ? [
            { personSlug: { contains: ctx.sourcePerson, mode: "insensitive" as const } },
          ] : []),
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        primaryArchetype: true,
        behaviorPatterns: true,
        status: true,
        personSlug: true,
      },
      take: 3,
    }),

    // Threads: active and emerging narrative patterns
    prisma.psychenomiconThread.findMany({
      where: {
        status: { not: "resolved" },
        OR: [
          { title: { contains: primaryQuery, mode: "insensitive" } },
          { description: { contains: primaryQuery, mode: "insensitive" } },
          { title: { contains: fallbackQuery, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        status: true,
      },
      take: 3,
    }),
  ]);

  return { quotes, transcripts, episodes, people, lore, chapters, entities, threads, query: primaryQuery };
}

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
    // Deduplicate by episode — show at most 2 segments per episode
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
      // Prefer summaryLong for richer context; fall back to summaryShort
      const summary = ep.summaryLong
        ? ep.summaryLong.slice(0, 500)
        : ep.summaryShort ?? "";
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

  // ── Psychenomicon layer ────────────────────────────────────────────────────

  if (data.chapters.length > 0) {
    parts.push("\n=== PSYCHENOMICON CHAPTERS ===");
    for (const ch of data.chapters) {
      const chapterKey = `chapter-${ch.slug}`;
      if (seenSlugs.has(chapterKey)) continue;
      seenSlugs.add(chapterKey);

      const label = ch.isMajorEvent
        ? `★ Chapter ${ch.chapterNumber}: ${ch.title}`
        : `Chapter ${ch.chapterNumber}: ${ch.title}`;
      const lines: string[] = [label];

      if (ch.canonText) {
        lines.push(`[CANON]: ${ch.canonText.slice(0, 400)}`);
      }
      if (ch.interpretationText) {
        lines.push(`[INTERPRETATION]: ${ch.interpretationText.slice(0, 400)}`);
      }
      if (ch.mythicText) {
        lines.push(`[MYTHIC]: ${ch.mythicText.slice(0, 200)}`);
      }
      if (ch.emergingSignals.length > 0) {
        lines.push(`[SIGNALS]: ${ch.emergingSignals.join(" | ")}`);
      }
      parts.push(lines.join("\n"));

      // Cite the chapter itself; also cite the linked episode if not already cited
      citations.push({
        type: "chapter",
        label: `Chapter ${ch.chapterNumber}: ${ch.title}`,
        href: `/psychenomicon/chapters/${ch.slug}`,
      });
      if (ch.episode && !seenEpisodes.has(ch.episode.slug)) {
        seenEpisodes.add(ch.episode.slug);
        citations.push({ type: "episode", label: ch.episode.title, href: `/episodes/${ch.episode.slug}` });
      }
    }
  }

  if (data.entities.length > 0) {
    parts.push("\n=== PSYCHENOMICON ENTITIES ===");
    for (const e of data.entities) {
      const entityKey = `entity-${e.slug}`;
      if (seenSlugs.has(entityKey)) continue;
      seenSlugs.add(entityKey);

      const archetype = e.primaryArchetype ? ` — Archetype: ${e.primaryArchetype}` : "";
      const status = e.status !== "active" ? ` [${e.status.toUpperCase()}]` : "";
      const patterns = e.behaviorPatterns.length > 0
        ? `\n  Patterns: ${e.behaviorPatterns.slice(0, 4).join(", ")}`
        : "";

      parts.push(`${e.name}${archetype}${status}${patterns}`);
      citations.push({
        type: "entity",
        label: e.name,
        href: `/psychenomicon/entities/${e.slug}`,
      });
    }
  }

  if (data.threads.length > 0) {
    parts.push("\n=== ACTIVE NARRATIVE THREADS ===");
    for (const t of data.threads) {
      const threadKey = `thread-${t.slug}`;
      if (seenSlugs.has(threadKey)) continue;
      seenSlugs.add(threadKey);
      const desc = t.description ? `: ${t.description.slice(0, 200)}` : "";
      parts.push(`[${t.status.toUpperCase()}] "${t.title}"${desc}`);
    }
  }

  return {
    contextText:
      parts.length > 0
        ? parts.join("\n")
        : "No directly relevant archive content found for this query.",
    citations: citations.slice(0, 10),
  };
}

const TRIAL_COOKIE = "oracle_trial";
const TRIAL_LIMIT = 3;

/** Cookie value format: "{used}|{YYYY-MM}" — resets each calendar month. */
function parseTrialCookie(raw: string | undefined): { used: number; month: string } {
  const now = new Date();
  const thisMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  if (!raw) return { used: 0, month: thisMonth };
  const [countStr, month] = raw.split("|");
  if (month !== thisMonth) return { used: 0, month: thisMonth }; // new month — reset
  const used = parseInt(countStr, 10);
  return { used: isNaN(used) ? 0 : used, month: thisMonth };
}

function setTrialCookie(res: NextResponse, used: number, month: string): void {
  res.cookies.set(TRIAL_COOKIE, `${used}|${month}`, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 32, // slightly over a month so it persists through the reset
    sameSite: "lax",
    path: "/",
  });
}

function getBedrockClient() {
  const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
  const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const awsRegion = process.env.AWS_REGION ?? "us-east-2";
  if (!awsAccessKey || !awsSecretKey) throw new Error("AWS credentials not configured.");
  return new AnthropicBedrock({ awsAccessKey, awsSecretKey, awsRegion });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const canAccess = user
    ? user.role === "admin" || (await isSubscribed(user.id))
    : false;

  // Allow TRIAL_LIMIT free questions per device per calendar month (cookie-tracked).
  const trial = parseTrialCookie(req.cookies.get(TRIAL_COOKIE)?.value);
  const isFreeTrialRequest = !canAccess && trial.used < TRIAL_LIMIT;

  if (!canAccess && trial.used >= TRIAL_LIMIT) {
    return NextResponse.json(
      { ok: false, error: "initiate_required" } satisfies OracleResponse,
      { status: 403 }
    );
  }

  // Guard the expensive LLM + ElevenLabs path against rapid-fire calls.
  const rl = rateLimit(`oracle:${clientKey(req, user?.id)}`, {
    limit: 15,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "The Oracle needs a moment. Try again shortly." } satisfies OracleResponse,
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const question = String(body.question ?? "").trim().slice(0, 500);

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
            ? String((rawCtx as Record<string, unknown>).sourceEra).slice(0, 40)
            : undefined,
          sourcePerson: typeof (rawCtx as Record<string, unknown>).sourcePerson === "string"
            ? String((rawCtx as Record<string, unknown>).sourcePerson).slice(0, 80)
            : undefined,
          sourceArchetype: typeof (rawCtx as Record<string, unknown>).sourceArchetype === "string"
            ? String((rawCtx as Record<string, unknown>).sourceArchetype).slice(0, 80)
            : undefined,
        }
      : undefined;

  // Verify AWS Bedrock credentials are configured
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return NextResponse.json(
      { ok: false, error: "Oracle not configured." } satisfies OracleResponse,
      { status: 500 }
    );
  }

  // Cache check — skip the expensive LLM + ElevenLabs call if we've seen this exact query.
  // Audio is NOT cached (base64 MP3s are large); TTS is re-fetched on cache hits.
  const cacheKey = oracleCacheKey(question, searchContext);
  const cached = oracleCacheGet(cacheKey);
  if (cached) {
    // Re-run TTS so callers still get voice on cache hits, without storing audio in memory.
    let cachedAudio: string | null = null;
    const elKey = process.env.ELEVENLABS_API_KEY;
    const elVoice = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";
    if (elKey) {
      try {
        const elRes = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${elVoice}`,
          {
            method: "POST",
            headers: {
              "xi-api-key": elKey,
              "Content-Type": "application/json",
              Accept: "audio/mpeg",
            },
            body: JSON.stringify({
              text: cached.answer,
              model_id: "eleven_multilingual_v2",
              voice_settings: {
                stability: 0.60,
                similarity_boost: 0.80,
                style: 0.15,
                use_speaker_boost: true,
              },
            }),
          }
        );
        if (elRes.ok) {
          const buf = await elRes.arrayBuffer();
          cachedAudio = Buffer.from(buf).toString("base64");
        }
      } catch {
        // Voice unavailable — text-only fallback
      }
    }

    const res = NextResponse.json({
      ok: true,
      answer: cached.answer,
      citations: cached.citations,
      audioBase64: cachedAudio,
      hasVoice: !!cachedAudio,
      trialUsed: isFreeTrialRequest,
      trialRemaining: isFreeTrialRequest ? Math.max(0, TRIAL_LIMIT - trial.used - 1) : undefined,
    } satisfies OracleResponse);
    if (isFreeTrialRequest) {
      setTrialCookie(res, trial.used + 1, trial.month);
    }
    return res;
  }

  // Archive search — Prisma errors return empty context rather than crashing
  let archiveData: Awaited<ReturnType<typeof searchArchive>>;
  try {
    archiveData = await searchArchive(question, searchContext);
  } catch (err) {
    console.error("[oracle] archive search failed:", err);
    archiveData = { quotes: [], transcripts: [], episodes: [], people: [], lore: [], chapters: [], entities: [], threads: [], query: question };
  }
  const { contextText, citations } = buildContext(archiveData);

  // Build optional context preamble for the LLM prompt.
  // Keeps the Oracle's answer anchored to the caller's intent.
  const contextLines: string[] = [];
  if (searchContext?.sourceArchetype) {
    contextLines.push(`Archetype lens: ${searchContext.sourceArchetype}`);
  }
  if (searchContext?.sourceEra) {
    const era = getEraById(searchContext.sourceEra);
    if (era) contextLines.push(`Era context: ${era.label} — ${era.subtitle}`);
  }
  if (searchContext?.sourcePerson) {
    const name = searchContext.sourcePerson.replace(/-/g, " ");
    contextLines.push(`Subject focus: ${name}`);
  }
  const contextPreamble = contextLines.length > 0
    ? `Context frame: ${contextLines.join(" | ")}\n\n`
    : "";

  let answer: string;
  try {
    const client = getBedrockClient();
    // Try models in order until one works. Add ORACLE_MODEL to Railway to pin a specific model.
    // All models must be enabled in AWS Console → Bedrock → Model access.
    const modelPreference = [
      process.env.ORACLE_MODEL,
      "anthropic.claude-3-5-sonnet-20241022-v2:0",
      "anthropic.claude-3-5-haiku-20241022-v1:0",
      "anthropic.claude-3-haiku-20240307-v1:0",
    ].filter(Boolean) as string[];

    let completion: Awaited<ReturnType<typeof client.messages.create>> | null = null;
    let lastErr: unknown;
    for (const model of modelPreference) {
      try {
        console.log(`[oracle] trying model: ${model}`);
        completion = await client.messages.create({
          model,
          max_tokens: 400,
          system: ORACLE_SYSTEM,
          messages: [{ role: "user", content: `Archive context:\n${contextText}\n\n${contextPreamble}Question: ${question}` }],
        });
        break;
      } catch (e) {
        console.error(`[oracle] model ${model} failed:`, e instanceof Error ? e.message : e);
        lastErr = e;
      }
    }
    if (!completion) throw lastErr;

    const block = completion.content[0];
    const text = block?.type === "text" ? block.text.trim() : null;
    if (!text) {
      return NextResponse.json(
        { ok: false, error: "The Oracle did not respond." } satisfies OracleResponse,
        { status: 500 }
      );
    }
    answer = text;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Log full error with name/status for Railway logs
    const errObj = err as Record<string, unknown>;
    console.error("[oracle] Bedrock error:", {
      name: err instanceof Error ? err.name : "unknown",
      message,
      status: errObj.status,
      error: errObj.error,
    });
    const lc = message.toLowerCase();
    const userMsg = lc.includes("rate") || lc.includes("throttl")
      ? "The Oracle is overwhelmed. Try again in a moment."
      : lc.includes("access") || lc.includes("denied") || lc.includes("not authorized")
      ? "Oracle access denied — check AWS IAM permissions."
      : `The Oracle could not be reached. (${message.slice(0, 120)})`;
    return NextResponse.json(
      { ok: false, error: userMsg } satisfies OracleResponse,
      { status: 503 }
    );
  }

  let audioBase64: string | null = null;
  const elKey = process.env.ELEVENLABS_API_KEY;
  const elVoice = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";

  if (elKey) {
    try {
      const elRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${elVoice}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": elKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: answer,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.60,
              similarity_boost: 0.80,
              style: 0.15,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (elRes.ok) {
        const buf = await elRes.arrayBuffer();
        audioBase64 = Buffer.from(buf).toString("base64");
      }
    } catch {
      // Voice unavailable — text-only fallback
    }
  }

  oracleCacheSet(cacheKey, { answer, citations });

  const finalRes = NextResponse.json({
    ok: true,
    answer,
    citations,
    audioBase64,
    hasVoice: !!audioBase64,
    trialUsed: isFreeTrialRequest,
    trialRemaining: isFreeTrialRequest ? Math.max(0, TRIAL_LIMIT - trial.used - 1) : undefined,
  } satisfies OracleResponse);

  if (isFreeTrialRequest) {
    setTrialCookie(finalRes, trial.used + 1, trial.month);
  }

  return finalRes;
}
