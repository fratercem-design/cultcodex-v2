/**
 * The Oracle's single-card draw. The deck is every Codex card with a meaning
 * (secret cards have none, so a reading can never reveal them).
 */
import { randomInt } from "crypto";
import { SEASONS } from "./catalog";
import { CARD_MEANINGS, type CardMeaning } from "./meanings";
import type { CodexCardDef, SeasonDef } from "./types";

/** Share of draws that land reversed. */
export const REVERSED_ODDS = 1 / 3;

export interface OracleDraw {
  def: CodexCardDef;
  season: SeasonDef;
  collectorNo: number;
  reversed: boolean;
  meaning: CardMeaning;
}

export function oracleDeck(): { def: CodexCardDef; season: SeasonDef; collectorNo: number }[] {
  return SEASONS.flatMap((season) =>
    season.cards
      .map((def, i) => ({ def, season, collectorNo: i + 1 }))
      .filter(({ def }) => def.obtain !== "secret" && CARD_MEANINGS[def.slug]),
  );
}

/** `rand` returns an integer in [0, n); defaults to crypto so draws can't be predicted. */
export function drawOracleCard(rand: (n: number) => number = randomInt): OracleDraw {
  const deck = oracleDeck();
  const pick = deck[rand(deck.length)];
  const reversed = rand(1000) < REVERSED_ODDS * 1000;
  return { ...pick, reversed, meaning: CARD_MEANINGS[pick.def.slug] };
}

/** The card as the Oracle sees it: everything it needs to read, nothing it would invent. */
export function describeDraw(draw: OracleDraw): string {
  const { def, meaning, reversed } = draw;
  return [
    `THE CARD DRAWN: ${def.title}${reversed ? " (REVERSED)" : " (UPRIGHT)"}`,
    `Codex Season ${draw.season.numeral}, no. ${draw.collectorNo} · ${def.rarity} ${def.cardType} · "${def.subtitle}"`,
    `Inscription: ${def.flavour}`,
    `Abilities: ${def.abilities.join(", ")}`,
    `Keywords: ${meaning.keywords.join(", ")}`,
    `Upright meaning: ${meaning.upright}`,
    `Reversed meaning: ${meaning.reversed}`,
    `Read it ${reversed ? "REVERSED" : "UPRIGHT"}.`,
  ].join("\n");
}

/**
 * Readings run 300–500 words; voicing all of it would add seconds of latency
 * and several times the TTS cost. Speak the card and the omen, the parts that
 * land when heard, and leave the rest on screen.
 */
export function spokenPartOfReading(reading: string): string {
  const parts = reading.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const pick = (label: string) => parts.find((p) => p.toUpperCase().startsWith(label));
  const spoken = [pick("THE CARD"), pick("THE OMEN")]
    .filter((p): p is string => !!p)
    .map((p) => p.replace(/^[A-Z' ]+\s[—-]\s*/, ""));
  return spoken.length ? spoken.join(" ") : reading.slice(0, 600);
}
