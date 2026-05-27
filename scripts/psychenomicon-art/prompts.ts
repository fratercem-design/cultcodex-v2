// scripts/psychenomicon-art/prompts.ts
//
// Step 2: Build four cinematic image prompts from a ChapterAnalysis.
// One cover image + three scene images.
// Uses the VISUAL_DNA prefix and QUALITY_SUFFIX from visual-bible.ts.

import Anthropic from "@anthropic-ai/sdk";
import type { ChapterAnalysis, ChapterPrompts } from "./types";
import { VISUAL_DNA, QUALITY_SUFFIX, ENTITY_DESCRIPTORS } from "./visual-bible";

const PROMPT_SYSTEM = `You are a cinematic prompt engineer for a premium AI art book — the Psychenomicon visual companion.
Your task: write four image generation prompts for a chapter.

PROMPT ARCHITECTURE (use this structure for every prompt):
[Shot type + composition] + [Subject/action] + [Environment/atmosphere] + [Lighting] + [Texture/material] + [Color palette] + [Emotional resonance]

RULES:
1. Highly specific — every noun gets an adjective, every light source is named
2. Camera is always specified — "extreme close-up", "wide Dutch angle", "overhead god-shot", etc.
3. No generic AI art clichés — "beautiful", "stunning", "amazing" are banned
4. Avoid: "magical", "mystical glowing", "fantasy", "ethereal glow" — too vague
5. Allowed: "volumetric violet light rays", "bioluminescent fungi casting cold blue shadows", "tallow candlelight"
6. Textures must be material-specific: "cracked obsidian", "oxidized bronze", "water-stained vellum", "chrome plate"
7. Emotion through composition, not adjectives: "figure hunched beneath cathedral ceiling" not "sad figure"
8. Each of the four prompts must be visually distinct — no repeating the same shot or setting

Return ONLY a valid JSON object with no markdown, no explanation:
{
  "cover": "full prompt for cover art",
  "scene_01": "full prompt for scene 1",
  "scene_02": "full prompt for scene 2",
  "scene_03": "full prompt for scene 3"
}

Cover: symbolic/abstract, portrait orientation, mythological weight, serves as book-cover-quality frontispiece
Scene 01: an opening moment — threshold, arrival, first confrontation
Scene 02: the crisis point — transformation, revelation, confrontation at its peak
Scene 03: aftermath or reversal — the world changed, the figure different, something seen that cannot be unseen`;

export async function buildPrompts(
  client: Anthropic,
  analysis: ChapterAnalysis
): Promise<ChapterPrompts> {
  // Resolve entity descriptors — merge chapter-specific ones with the global bible
  const allDescriptors: Record<string, string> = {
    ...ENTITY_DESCRIPTORS,
    ...analysis.entityDescriptors,
  };

  const entityBlock =
    analysis.entities.length > 0
      ? analysis.entities
          .map((e) =>
            allDescriptors[e]
              ? `• ${e}: ${allDescriptors[e]}`
              : `• ${e}: (use visual context from chapter)`
          )
          .join("\n")
      : "(no named entities)";

  const briefing = `
CHAPTER: ${analysis.title}
THEMES: ${analysis.themes.join(", ")}
SYMBOLS: ${analysis.symbols.join(", ")}
PALETTE: ${analysis.palette.join(", ")}
MOOD: ${analysis.mood}
ATMOSPHERE: ${analysis.atmosphericNotes}
COMPOSITION HINTS: ${analysis.cameraDirections.join("; ")}
ENTITIES:
${entityBlock}

VISUAL DNA (prepend to every prompt):
${VISUAL_DNA}

QUALITY SUFFIX (append to every prompt):
${QUALITY_SUFFIX}
`.trim();

  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 3000,
    system: PROMPT_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Generate four cinematic image prompts for this chapter briefing:\n\n${briefing}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

  let parsed: ChapterPrompts;
  try {
    parsed = JSON.parse(cleaned) as ChapterPrompts;
  } catch {
    throw new Error(
      `Claude returned invalid JSON for prompts (chapter: ${analysis.slug}):\n${text.slice(0, 500)}`
    );
  }

  // Validate keys
  const required: Array<keyof ChapterPrompts> = ["cover", "scene_01", "scene_02", "scene_03"];
  for (const key of required) {
    if (!parsed[key] || typeof parsed[key] !== "string") {
      throw new Error(`Missing or invalid prompt key "${key}" for ${analysis.slug}`);
    }
  }

  return parsed;
}
