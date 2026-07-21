/**
 * AI-art backdrops for the game show (generated in Canva, exported to WebP).
 * Files live in public/images/gameshow/. Anything not listed falls back to the
 * bespoke SVG emblem.
 */

// Hero backdrop behind the page title (Canva slide 1 — arch + psi sigil).
export const HERO_ART: string | null = "/images/gameshow/hero.webp";

// Per-round backdrops (Canva slides mapped to round keys).
export const ROUND_ART: Record<string, string> = {
  "real-or-fake-lore": "/images/gameshow/rounds/real-or-fake-lore.webp",
  "prophecy-or-bogus": "/images/gameshow/rounds/prophecy-or-bogus.webp",
  "two-truths-lie": "/images/gameshow/rounds/two-truths-lie.webp",
  "did-psyche-say-it": "/images/gameshow/rounds/did-psyche-say-it.webp",
  "codex-cluedo": "/images/gameshow/rounds/codex-cluedo.webp",
  "troll-or-not": "/images/gameshow/rounds/troll-or-not.webp",
  "who-is-it": "/images/gameshow/rounds/who-is-it.webp",
  "general-trivia": "/images/gameshow/rounds/general-trivia.webp",
};

// Reveal-state backdrops (used by the question card on correct/wrong).
export const CORRECT_ART = "/images/gameshow/correct.webp";
export const WRONG_ART = "/images/gameshow/wrong.webp";
