import type { Rarity, CardType } from "@/generated/prisma/client";

export const RARITY_LABEL: Record<Rarity, string> = {
  STATIC:       "STATIC",
  SIGNAL:       "SIGNAL",
  TRANSMISSION: "TRANSMISSION",
  ANOMALY:      "ANOMALY",
  ORACLE:       "ORACLE",
  LEGENDARY:    "LEGENDARY",
  MYTHIC:       "MYTHIC",
  FORBIDDEN:    "FORBIDDEN",
};

export const RARITY_ORDER: Record<Rarity, number> = {
  STATIC:       0,
  SIGNAL:       1,
  TRANSMISSION: 2,
  ANOMALY:      3,
  ORACLE:       4,
  LEGENDARY:    5,
  MYTHIC:       6,
  FORBIDDEN:    7,
};

/** CSS color and glow-shadow for each rarity tier */
export const RARITY_STYLE: Record<Rarity, { color: string; glow: string; borderOpacity: number; aura?: string }> = {
  STATIC:       { color: "var(--term-fg-dim)",  glow: "none",                                                           borderOpacity: 0.4 },
  SIGNAL:       { color: "var(--neon)",          glow: "var(--glow-neon)",                                               borderOpacity: 0.7 },
  TRANSMISSION: { color: "var(--neon-4)",        glow: "var(--glow-amber)",                                              borderOpacity: 0.8 },
  ANOMALY:      { color: "var(--neon-3)",        glow: "var(--glow-magenta)",                                            borderOpacity: 0.9 },
  ORACLE:       { color: "var(--neon-5)",        glow: "0 0 8px rgba(255,56,96,0.7), 0 0 24px rgba(255,56,96,0.35)",    borderOpacity: 1.0 },
  LEGENDARY:    { color: "#FFD700",              glow: "0 0 12px rgba(255,215,0,0.8), 0 0 36px rgba(255,215,0,0.4)",    borderOpacity: 1.0, aura: "legendary" },
  MYTHIC:       { color: "#E040FB",              glow: "0 0 16px rgba(224,64,251,0.9), 0 0 48px rgba(224,64,251,0.5)",  borderOpacity: 1.0, aura: "mythic" },
  FORBIDDEN:    { color: "#FF1744",              glow: "0 0 20px rgba(255,23,68,1.0), 0 0 60px rgba(255,23,68,0.6)",    borderOpacity: 1.0, aura: "forbidden" },
};

export const CARD_TYPE_GLYPH: Record<CardType, string> = {
  VOICE:        "◐",
  TRANSMISSION: "▦",
  LORE:         "▲",
  SIGNAL:       "◈",
  ORACLE:       "◉",
  CIPHER:       "✦",
  RELIC:        "⧬",
  ENTITY:       "ψ",
  PROPHECY:     "⟁",
  MEMBER:       "◎",
  GLITCH:       "▓",
  MAHAVIDYA:    "ॐ",
  AVATAR:       "♆",
  INCIDENT:     "⚠",
};

export const CARD_TYPE_LABEL: Record<CardType, string> = {
  VOICE:        "VOICE",
  TRANSMISSION: "TRANSMISSION",
  LORE:         "LORE",
  SIGNAL:       "SIGNAL",
  ORACLE:       "ORACLE",
  CIPHER:       "CIPHER",
  RELIC:        "RELIC",
  ENTITY:       "ENTITY",
  PROPHECY:     "PROPHECY",
  MEMBER:       "MEMBER",
  GLITCH:       "GLITCH",
  MAHAVIDYA:    "MAHAVIDYA",
  AVATAR:       "AVATAR",
  INCIDENT:     "INCIDENT",
};

export const CARD_TYPE_COLOR: Record<CardType, string> = {
  VOICE:        "var(--neon)",
  TRANSMISSION: "var(--neon-4)",
  LORE:         "var(--neon-3)",
  SIGNAL:       "#4DD0E1",
  ORACLE:       "var(--neon-5)",
  CIPHER:       "#69F0AE",
  RELIC:        "#FFD700",
  ENTITY:       "#CE93D8",
  PROPHECY:     "#FF80AB",
  MEMBER:       "#80DEEA",
  GLITCH:       "#FF6D00",
  MAHAVIDYA:    "#FF9800",
  AVATAR:       "#B39DDB",
  INCIDENT:     "#EF5350",
};

/** Given pack rarity weights, return a random rarity. */
export function rollRarity(weights: {
  weightStatic: number;
  weightSignal: number;
  weightTransmission: number;
  weightAnomaly: number;
  weightOracle: number;
  weightLegendary?: number;
  weightMythic?: number;
  weightForbidden?: number;
}): Rarity {
  const roll = Math.random() * 100;
  const {
    weightStatic,
    weightSignal,
    weightTransmission,
    weightAnomaly,
    weightOracle,
    weightLegendary = 0,
    weightMythic = 0,
    weightForbidden = 0,
  } = weights;

  let cursor = 0;
  cursor += weightForbidden;  if (roll < cursor) return "FORBIDDEN";
  cursor += weightMythic;     if (roll < cursor) return "MYTHIC";
  cursor += weightLegendary;  if (roll < cursor) return "LEGENDARY";
  cursor += weightOracle;     if (roll < cursor) return "ORACLE";
  cursor += weightAnomaly;    if (roll < cursor) return "ANOMALY";
  cursor += weightTransmission; if (roll < cursor) return "TRANSMISSION";
  cursor += weightSignal;     if (roll < cursor) return "SIGNAL";
  return "STATIC";
}

/** Foil chance scales with rarity */
export function rollFoil(rarity: Rarity): boolean {
  const foilChance: Record<Rarity, number> = {
    STATIC:       0,
    SIGNAL:       0,
    TRANSMISSION: 0.05,
    ANOMALY:      0.08,
    ORACLE:       0.12,
    LEGENDARY:    0.20,
    MYTHIC:       0.35,
    FORBIDDEN:    1.00,  // All forbidden cards are foil
  };
  return Math.random() < (foilChance[rarity] ?? 0);
}

/** Compute stat values from entity data. All stats clamped 1–99. */
export function computeStats(
  cardType: CardType,
  data: {
    appearanceCount?: number;
    personType?: string;
    canonStatus?: string;
    episodeCount?: number;
    topicCount?: number;
    loreCount?: number;
    guestCount?: number;
    segmentCount?: number;
  }
): { statA: number; statB: number; statC: number } {
  const clamp = (n: number) => Math.max(1, Math.min(99, Math.round(n)));

  switch (cardType) {
    case "VOICE":
    case "AVATAR":
    case "MEMBER": {
      const appearances = data.appearanceCount ?? 1;
      const signalStrength = clamp((appearances / 50) * 90 + 9);
      const resonance = clamp((data.topicCount ?? 0) * 6 + (data.loreCount ?? 0) * 4);
      const clarity =
        data.personType === "host"      ? 99 :
        data.personType === "recurring" ? 82 :
        data.personType === "guest"     ? 60 : 35;
      return { statA: signalStrength, statB: resonance, statC: clarity };
    }
    case "TRANSMISSION":
    case "INCIDENT": {
      const depth = clamp((data.segmentCount ?? 0) * 2 + 20);
      const reach = clamp((data.guestCount ?? 0) * 12 + (data.topicCount ?? 0) * 5);
      return { statA: 99, statB: reach, statC: depth };
    }
    case "LORE":
    case "RELIC": {
      const canon =
        data.canonStatus === "canonical"      ? 99 :
        data.canonStatus === "speculative"    ? 68 :
        data.canonStatus === "community_myth" ? 52 :
        data.canonStatus === "disputed"       ? 38 : 28;
      const depth = clamp((data.episodeCount ?? 0) * 8 + 20);
      const influence = clamp((data.loreCount ?? 0) * 10 + (data.topicCount ?? 0) * 5);
      return { statA: canon, statB: depth, statC: influence };
    }
    case "SIGNAL": {
      const reach = clamp((data.episodeCount ?? 0) * 3 + 20);
      const resonance = clamp((data.loreCount ?? 0) * 8 + (data.topicCount ?? 0) * 5);
      return { statA: reach, statB: resonance, statC: 70 };
    }
    default:
      return { statA: 77, statB: 77, statC: 77 };
  }
}

/** Map card type to readable stat labels */
export const STAT_LABELS: Record<CardType, [string, string, string]> = {
  VOICE:        ["SIGNAL STR", "RESONANCE",  "CLARITY"],
  TRANSMISSION: ["BROADCAST",  "REACH",      "DEPTH"],
  LORE:         ["CANON",      "DEPTH",      "INFLUENCE"],
  SIGNAL:       ["REACH",      "RESONANCE",  "CLARITY"],
  ORACLE:       ["CLARITY",    "WEIGHT",     "RESONANCE"],
  CIPHER:       ["POWER",      "SIGNAL",     "CLARITY"],
  RELIC:        ["POTENCY",    "AGE",        "CURSE"],
  ENTITY:       ["INFLUENCE",  "CHAOS",      "SHADOW"],
  PROPHECY:     ["CERTAINTY",  "WEIGHT",     "DREAD"],
  MEMBER:       ["LOYALTY",    "PRESENCE",   "SIGNAL"],
  GLITCH:       ["CORRUPTION", "SPREAD",     "ENTROPY"],
  MAHAVIDYA:    ["POWER",      "DEVOTION",   "TRANSFORMATION"],
  AVATAR:       ["CHARISMA",   "RITUAL",     "MADNESS"],
  INCIDENT:     ["IMPACT",     "CHAOS",      "MEMORY"],
};
