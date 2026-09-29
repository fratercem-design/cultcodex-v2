/**
 * Codex catalog — the source of truth for seasonal cards. Client-safe: no DB.
 *
 * Producing a new season: add `season-N.ts` exporting a SeasonDef, append it to
 * SEASONS, and deploy. `ensureCodexCatalog()` (codex.ts) upserts the cards and
 * packs on first use, and the Codex page switches to it once `startsAt` passes.
 * Older seasons stay collectible from Trials and secrets; only the current
 * season's packs are sold.
 */
import type { Rarity } from "@/generated/prisma/client";
import { RARITY_ORDER } from "@/lib/cards/rarity";
import type { CodexCardDef, ObtainMethod, SeasonDef } from "./types";
import { SEASON_1 } from "./season-1";

export const SEASONS: SeasonDef[] = [SEASON_1];

export function currentSeason(now: Date = new Date()): SeasonDef {
  const started = SEASONS.filter((s) => new Date(s.startsAt) <= now);
  return started[started.length - 1] ?? SEASONS[0];
}

export function seasonDaysLeft(season: SeasonDef, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((new Date(season.endsAt).getTime() - now.getTime()) / 86_400_000));
}

export function getSeason(n: number): SeasonDef | undefined {
  return SEASONS.find((s) => s.number === n);
}

const BY_SLUG = new Map<string, { def: CodexCardDef; season: SeasonDef; no: number }>();
for (const season of SEASONS) {
  season.cards.forEach((def, i) => BY_SLUG.set(def.slug, { def, season, no: i + 1 }));
}

export function catalogEntry(slug: string) {
  return BY_SLUG.get(slug);
}

/** Small deterministic hash so stats and art are stable per slug. */
export function hashSlug(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stats scale with rarity; the slug hash spreads them so no two cards match. */
export function codexStats(def: Pick<CodexCardDef, "slug" | "rarity">): [number, number, number] {
  const base = 18 + RARITY_ORDER[def.rarity] * 10;
  const h = hashSlug(def.slug);
  const spread = (shift: number) => ((h >>> shift) & 0xff) % 22;
  const clamp = (n: number) => Math.max(1, Math.min(99, n));
  return [clamp(base + spread(0)), clamp(base + spread(8)), clamp(base + spread(16))];
}

const PACK_HINT: Record<Rarity, string> = {
  STATIC:       "Common in any Season pack.",
  SIGNAL:       "Turns up often in Season packs.",
  TRANSMISSION: "Found in roughly one pack in three.",
  ANOMALY:      "Rare. A Reliquary Box always holds one Anomaly or better.",
  ORACLE:       "Very rare. Keep tearing.",
  LEGENDARY:    "Legendary. Maybe one pack in a hundred.",
  MYTHIC:       "Mythic. Few will ever hold it.",
  FORBIDDEN:    "Forbidden. Numbered, and almost never seen.",
};

export function clueFor(def: CodexCardDef): string {
  return def.clue ?? PACK_HINT[def.rarity];
}

export const OBTAIN_LABEL: Record<ObtainMethod, string> = {
  pack:   "PACK",
  quest:  "TRIAL",
  secret: "SECRET",
  signup: "INITIATION",
};
