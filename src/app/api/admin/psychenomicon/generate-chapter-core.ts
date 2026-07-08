/**
 * Core Psychenomicon chapter generation logic.
 * Shared by both the single-episode route and the batch route
 * to avoid self-referencing HTTP fetches that fail on Railway.
 */
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import { bedrockModelId } from "@/lib/anthropic";

function getOpenRouterClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");
  const baseURL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
  return new OpenAI({ apiKey, baseURL, defaultHeaders: { "HTTP-Referer": "https://cultcodex.me" } });
}

// Generate via AWS Bedrock as fallback when OpenRouter is unavailable.
async function generateViaBedrock(systemPrompt: string, userPrompt: string): Promise<string> {
  const client = new AnthropicBedrock({ awsRegion: process.env.AWS_REGION ?? "us-east-1" });
  const modelPreference = [
    process.env.PSYCHENOMICON_FALLBACK_MODEL,
    "claude-opus-4-8",
    "claude-sonnet-4-6",
  ].filter(Boolean) as string[];

  let lastErr: unknown;
  for (const m of modelPreference) {
    try {
      // Inside the try: bedrockModelId now throws on non-Anthropic input, and a
      // bad PSYCHENOMICON_FALLBACK_MODEL must fall through to the next tier,
      // not kill the whole ladder.
      const model = bedrockModelId(m);
      console.log(`[psychenomicon] Bedrock fallback — trying: ${model}`);
      const completion = await client.messages.create({
        model,
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      const block = completion.content.find((b) => b.type === "text");
      return block?.type === "text" ? block.text.trim() : "";
    } catch (e) {
      console.error(`[psychenomicon] Bedrock ${model} failed:`, e instanceof Error ? e.message : e);
      lastErr = e;
    }
  }
  throw lastErr;
}

// Bluesminds (the OpenRouter-compatible proxy) intermittently returns 5xx /
// rate / credit errors. When it does, degrade gracefully to Bedrock rather
// than failing the whole generation.
function isBluesmindsUnavailable(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (typeof status === "number" && (status === 402 || status === 429 || status >= 500)) return true;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes("502") || msg.includes("503") || msg.includes("504") ||
    msg.includes("429") || msg.includes("insufficient_quota") ||
    msg.includes("credit balance") || msg.includes("overloaded") ||
    msg.includes("econnreset") || msg.includes("etimedout") || msg.includes("timeout")
  );
}

const SYSTEM_PROMPT = `You are the Archivist of the Psychenomicon.

Your task is to transform chronological conversation transcripts into an evolving mythological narrative system.

CRITICAL — HOST IDENTITY: The host is Psyche (also known as Trix). Psyche is MALE. Use he/him/his pronouns for Psyche at all times. Never use she/her for Psyche.

Rules:
1. Base 70% of the content strictly on factual transcript events.
2. Add 30% interpretive and symbolic narrative (psychological, spiritual, archetypal).
3. Do NOT fabricate events that contradict the transcript.
4. Reframe events with symbolic meaning, but underlying reality must remain intact.
5. Tone: mystical but grounded. Avoid excessive fantasy language. Write as if documenting a living system.
6. Reference previous chapters and entity histories when relevant.
7. Track archetypes as evolving — if someone was "Performer" before and shifts, note the shift.

Each chapter must contain:
- canonText: What actually happened. Factual. Grounded. Key moments, who said what, real dynamics.
- interpretationText: Behavioral meaning. Psychological forces. Pattern continuation. Power dynamics.
- mythicText: Spiritual symbolism. Archetypal framing. Short, controlled — never overdone. Max 2-3 paragraphs.
- emergingSignals: 3-5 short strings describing what patterns are strengthening or what might emerge next.
- archetypes: Who appeared, what archetype they embodied in this chapter, why it matters.
- entities: Full entity data for each significant person — current archetype, trait scores, behavior patterns, any archetype shift from previous appearance.
- threads: Narrative threads active, emerging, or resolved in this chapter.

You must respond with valid JSON only. No prose before or after. No markdown.`;

function buildContinuityContext(
  previousChapters: Array<{ chapterNumber: number; title: string; emergingSignals: string[] }>,
  entities: Array<{ name: string; primaryArchetype: string | null; status: string; behaviorPatterns: string[] }>,
  activeThreads: Array<{ title: string; description: string | null; status: string }>
): string {
  const parts: string[] = [];
  if (previousChapters.length > 0) {
    parts.push("=== PREVIOUS CHAPTERS (most recent last) ===");
    previousChapters.forEach((c) => {
      parts.push(`Chapter ${c.chapterNumber}: "${c.title}"`);
      if (c.emergingSignals.length > 0) {
        parts.push(`  Emerging signals: ${c.emergingSignals.join(" | ")}`);
      }
    });
  }
  if (entities.length > 0) {
    parts.push("\n=== KNOWN ENTITIES ===");
    entities.forEach((e) => {
      parts.push(`- ${e.name} [${e.primaryArchetype ?? "unknown archetype"}] status: ${e.status}`);
      if (e.behaviorPatterns.length > 0) {
        parts.push(`  Patterns: ${e.behaviorPatterns.slice(0, 3).join(", ")}`);
      }
    });
  }
  if (activeThreads.length > 0) {
    parts.push("\n=== ACTIVE NARRATIVE THREADS ===");
    activeThreads.forEach((t) => {
      parts.push(`- [${t.status.toUpperCase()}] "${t.title}": ${t.description ?? ""}`);
    });
  }
  return parts.join("\n");
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60);
}

interface GeneratedChapter {
  title: string;
  isMajorEvent?: boolean;
  canonText: string;
  interpretationText: string;
  mythicText: string;
  emergingSignals: string[];
  archetypes?: Array<{ name: string; archetype: string; significance: string }>;
  entities?: Array<{
    name: string;
    archetype: string;
    archetypeShift?: string | null;
    traits?: Record<string, number>;
    behaviorPatterns?: string[];
    notes?: string;
  }>;
  threads?: Array<{ title: string; description: string; status: string }>;
}

export type ChapterResult =
  | { ok: true; chapter: { id: string; chapterNumber: number; slug: string; title: string } }
  | { ok: false; status: number; error: string; raw?: string };

export async function generateChapterForEpisode(episodeId: string): Promise<ChapterResult> {
  // Check not already generated
  const existing = await prisma.psychenomiconChapter.findUnique({
    where: { episodeId },
    select: { id: true, chapterNumber: true },
  });
  if (existing) {
    return { ok: false, status: 409, error: "Chapter already exists for this episode" };
  }

  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    select: {
      id: true, title: true, airDate: true, episodeNumber: true,
      segments: {
        select: { startSeconds: true, speakerLabel: true, text: true },
        orderBy: { startSeconds: "asc" },
        take: 300,
      },
      transcriptRaw: true,
      guests: { include: { person: { select: { displayName: true, slug: true, personType: true } } } },
    },
  });

  if (!episode) return { ok: false, status: 404, error: "Episode not found" };
  if (episode.segments.length === 0 && !episode.transcriptRaw) {
    return { ok: false, status: 422, error: "No transcript available" };
  }

  const lastChapter = await prisma.psychenomiconChapter.findFirst({
    orderBy: { chapterNumber: "desc" },
    select: { chapterNumber: true },
  });
  const nextChapterNumber = (lastChapter?.chapterNumber ?? 0) + 1;

  const [previousChapters, entities, activeThreads] = await Promise.all([
    prisma.psychenomiconChapter.findMany({
      orderBy: { chapterNumber: "desc" }, take: 6,
      select: { chapterNumber: true, title: true, emergingSignals: true },
    }),
    prisma.psychenomiconEntity.findMany({
      select: { name: true, primaryArchetype: true, status: true, behaviorPatterns: true },
      orderBy: { updatedAt: "desc" }, take: 30,
    }),
    prisma.psychenomiconThread.findMany({
      where: { status: { in: ["active", "emerging"] } },
      select: { title: true, description: true, status: true }, take: 15,
    }),
  ]);

  const continuityContext = buildContinuityContext(previousChapters.reverse(), entities, activeThreads);

  let transcriptText: string;
  if (episode.segments.length > 0) {
    transcriptText = episode.segments
      .map((s) => (s.speakerLabel ? `${s.speakerLabel}: ${s.text}` : s.text))
      .join("\n").slice(0, 20000);
  } else {
    transcriptText = episode.transcriptRaw!.slice(0, 20000);
  }

  const guestList = episode.guests
    .filter((g) => g.person.personType !== "host")
    .map((g) => g.person.displayName).join(", ");

  const episodeRef = [
    episode.episodeNumber ? `EP.${String(episode.episodeNumber).padStart(3, "0")}` : "",
    episode.title,
    episode.airDate ? `(${new Date(episode.airDate).toLocaleDateString()})` : "",
    guestList ? `— Guests: ${guestList}` : "",
  ].filter(Boolean).join(" ");

  const userPrompt = `${continuityContext ? continuityContext + "\n\n" : ""}=== EPISODE TO CHRONICLE ===
Episode Reference: ${episodeRef}
Chapter Number: ${nextChapterNumber}

Transcript:
${transcriptText}

Generate Chapter ${nextChapterNumber} of the Psychenomicon. Output ONLY valid JSON with this exact shape:
{
  "title": "chapter title (evocative, not descriptive)",
  "isMajorEvent": false,
  "canonText": "factual account, 3-5 paragraphs",
  "interpretationText": "behavioral + psychological layer, 2-3 paragraphs",
  "mythicText": "symbolic/archetypal layer, 1-2 paragraphs — subtle, grounded",
  "emergingSignals": ["signal 1", "signal 2", "signal 3"],
  "archetypes": [{"name": "person name", "archetype": "The X", "significance": "why this archetype in this chapter"}],
  "entities": [{"name": "person name", "archetype": "The X", "archetypeShift": null, "traits": {"influence": 7, "volatility": 6, "manipulation": 4, "control": 5, "emotionalIntensity": 8}, "behaviorPatterns": ["pattern"], "notes": "how they evolved"}],
  "threads": [{"title": "thread title", "description": "what this thread tracks", "status": "active|emerging|resolved"}]
}`;

  const model = process.env.ENRICHMENT_MODEL ?? "gemini-3.5-flash";
  console.log(`[psychenomicon] CH.${nextChapterNumber} — model: ${model}`);

  let rawText: string;
  try {
    const completion = await getOpenRouterClient().chat.completions.create({
      model, max_tokens: 8000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });
    rawText = completion.choices[0]?.message?.content?.trim() ?? "";
  } catch (err) {
    if (!isBluesmindsUnavailable(err)) throw err;
    console.warn(`  ⚠ Bluesminds unavailable (${err instanceof Error ? err.message : err}) — falling back to AWS Bedrock`);
    rawText = await generateViaBedrock(SYSTEM_PROMPT, userPrompt);
  }

  let generated: GeneratedChapter;
  try {
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    generated = JSON.parse(cleaned) as GeneratedChapter;
  } catch {
    return { ok: false, status: 502, error: "Model returned invalid JSON", raw: rawText.slice(0, 2000) };
  }

  // Upsert entities
  const entityIds: string[] = [];
  for (const e of generated.entities ?? []) {
    const entitySlug = slugify(e.name);
    const existing = await prisma.psychenomiconEntity.findUnique({ where: { slug: entitySlug } });
    let archetypeHistory: Array<{ archetype: string; chapterNumber: number; reason: string }> = [];
    if (existing) archetypeHistory = (existing.archetypeHistory as typeof archetypeHistory) ?? [];
    if (e.archetype && existing?.primaryArchetype !== e.archetype) {
      archetypeHistory.push({ archetype: e.archetype, chapterNumber: nextChapterNumber, reason: e.notes ?? "" });
    }
    const entity = await prisma.psychenomiconEntity.upsert({
      where: { slug: entitySlug },
      create: { name: e.name, slug: entitySlug, primaryArchetype: e.archetype, archetypeHistory, radarData: e.traits ?? undefined, behaviorPatterns: e.behaviorPatterns ?? [] },
      update: { primaryArchetype: e.archetype, archetypeHistory, radarData: e.traits ?? undefined, behaviorPatterns: e.behaviorPatterns?.length ? e.behaviorPatterns : undefined, updatedAt: new Date() },
      select: { id: true },
    });
    entityIds.push(entity.id);
  }

  // Upsert threads
  const threadIds: string[] = [];
  for (const t of generated.threads ?? []) {
    const threadSlug = slugify(t.title);
    const thread = await prisma.psychenomiconThread.upsert({
      where: { slug: threadSlug },
      create: { title: t.title, slug: threadSlug, description: t.description, status: t.status },
      update: { status: t.status, description: t.description },
      select: { id: true },
    });
    threadIds.push(thread.id);
  }

  const baseSlug = `chapter-${String(nextChapterNumber).padStart(3, "0")}`;
  const chapter = await prisma.psychenomiconChapter.create({
    data: {
      chapterNumber: nextChapterNumber,
      title: generated.title,
      slug: baseSlug,
      episodeId,
      canonText: generated.canonText,
      interpretationText: generated.interpretationText,
      mythicText: generated.mythicText,
      emergingSignals: generated.emergingSignals ?? [],
      archetypesData: generated.archetypes?.length ? generated.archetypes : undefined,
      threadRefs: (generated.threads ?? []).map((t) => ({ title: t.title, slug: slugify(t.title) })),
      isMajorEvent: generated.isMajorEvent ?? false,
      entityAppearances: {
        create: entityIds.map((entityId, i) => ({
          entityId,
          archetypeAt: generated.entities?.[i]?.archetype,
          significance: generated.entities?.[i]?.notes,
        })),
      },
      threadChapters: { create: threadIds.map((threadId) => ({ threadId })) },
    },
    select: { id: true, chapterNumber: true, slug: true, title: true },
  });

  for (let i = 0; i < entityIds.length; i++) {
    const e = generated.entities?.[i];
    if (!e) continue;
    await prisma.archetypeEvent.create({
      data: {
        entityId: entityIds[i],
        chapterId: chapter.id,
        chapterNumber: nextChapterNumber,
        primaryArchetype: e.archetype,
        secondaryArchetypes: [],
        confidenceScore: 1.0,
        triggerEvent: e.archetypeShift ? `Archetype shift — previously: ${e.archetypeShift}` : (e.notes ?? null),
      },
    });
  }

  return { ok: true, chapter };
}
