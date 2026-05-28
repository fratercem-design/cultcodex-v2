// scripts/psychenomicon-art/analyze.ts
//
// Step 1: Call Claude to produce a structured symbolic analysis of a
// Psychenomicon chapter. Returns a ChapterAnalysis object.

import Anthropic from "@anthropic-ai/sdk";
import type { ChapterAnalysis } from "./types";

const ANALYSIS_SYSTEM_PROMPT = `You are the Visual Mythographer of the Psychenomicon — the esoteric graphic novel
companion to the Cult of Psyche archive. Your role is to read a chapter and produce a precise symbolic
analysis that will guide a team of cinematic AI image generators.

You think in:
• Jungian archetypes and shadow dynamics
• Occult symbolism (Hermetic, Kabbalistic, Tarot, chaos magic)
• Cinematic language (framing, lighting, color theory, atmosphere)
• Material textures and environmental metaphor
• Psychological horror and transcendence aesthetics

Return ONLY a valid JSON object with no markdown, no explanation, no code fences — just raw JSON.

The JSON must match this exact structure:
{
  "themes": ["string array, 3–7 core mythological/psychological themes"],
  "symbols": ["string array, 4–10 concrete visual symbols — be specific, not abstract"],
  "entities": ["string array, named entities/archetypes that appear or are implied"],
  "palette": ["string array, 4–6 specific color descriptions like 'ultraviolet neon', 'tarnished gold', 'arterial crimson'"],
  "mood": "single atmospheric sentence capturing emotional and spiritual tone",
  "atmosphericNotes": "1–2 sentences: describe the physical space, architecture, environment, time of day/night",
  "cameraDirections": ["string array, 2–4 camera/composition directions like 'Dutch angle from below', 'extreme wide establishing shot', 'close-up on hands in ritual gesture'"],
  "entityDescriptors": {
    "EntityName": "precise visual descriptor for this entity — height, clothing, face, light source, posture — must be repeatable verbatim across chapters for consistency"
  }
}`;

export async function analyzeChapter(
  client: Anthropic,
  chapter: {
    title: string;
    slug: string;
    chapterNumber: number;
    canonText: string;
    interpretationText: string;
    mythicText: string;
    emergingSignals: string[];
    archetypesData: unknown;
  }
): Promise<ChapterAnalysis> {
  const chapterContent = [
    `CHAPTER ${chapter.chapterNumber}: ${chapter.title}`,
    "",
    "=== CANON TEXT ===",
    chapter.canonText,
    "",
    "=== INTERPRETATION ===",
    chapter.interpretationText,
    "",
    "=== MYTHIC TEXT ===",
    chapter.mythicText,
    "",
    chapter.emergingSignals.length > 0
      ? `=== EMERGING SIGNALS ===\n${chapter.emergingSignals.join("\n")}`
      : "",
    chapter.archetypesData
      ? `=== ARCHETYPES DATA ===\n${JSON.stringify(chapter.archetypesData, null, 2)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2000,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analyze this Psychenomicon chapter and return the symbolic analysis JSON:\n\n${chapterContent}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Strip any accidental markdown fences
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

  let parsed: Omit<ChapterAnalysis, "slug" | "title">;
  try {
    parsed = JSON.parse(cleaned) as Omit<ChapterAnalysis, "slug" | "title">;
  } catch {
    throw new Error(
      `Claude returned invalid JSON for chapter ${chapter.slug}:\n${text.slice(0, 500)}`
    );
  }

  // Validate required fields are present
  const required = ["themes", "symbols", "entities", "palette", "mood", "atmosphericNotes", "cameraDirections"];
  for (const field of required) {
    if (!(field in parsed)) {
      throw new Error(`Missing required field "${field}" in analysis for ${chapter.slug}`);
    }
  }

  return {
    slug: chapter.slug,
    title: chapter.title,
    themes: parsed.themes ?? [],
    symbols: parsed.symbols ?? [],
    entities: parsed.entities ?? [],
    palette: parsed.palette ?? [],
    mood: parsed.mood ?? "",
    atmosphericNotes: parsed.atmosphericNotes ?? "",
    cameraDirections: parsed.cameraDirections ?? [],
    entityDescriptors: parsed.entityDescriptors ?? {},
  };
}
