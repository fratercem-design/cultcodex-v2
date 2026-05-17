import type { Rarity, CardType } from "@/generated/prisma/client";

export const RARITY_LABEL: Record<Rarity, string> = {
  STATIC:       "STATIC",
  SIGNAL:       "SIGNAL",
  TRANSMISSION: "TRANSMISSION",
  ANOMALY:      "ANOMALY",
  ORACLE:       "ORACLE",
};

export const RARITY_ORDER: Record<Rarity, number> = {
  STATIC: 0, SIGNAL: 1, TRANSMISSION: 2, ANOMALY: 3, ORACLE: 4,
};

/** CSS color and glow-shadow for each rarity tier */
export const RARITY_STYLE: Record<Rarity, { color: string; glow: string; borderOpacity: number }> = {
  STATIC:       { color: "var(--term-fg-dim)",  glow: "none",                  borderOpacity: 0.4 },
  SIGNAL:       { color: "var(--neon)",          glow: "var(--glow-neon)",      borderOpacity: 0.7 },
  TRANSMISSION: { color: "var(--neon-4)",        glow: "var(--glow-amber)",     borderOpacity: 0.8 },
  ANOMALY:      { color: "var(--neon-3)",        glow: "var(--glow-magenta)",   borderOpacity: 0.9 },
  ORACLE:       { color: "var(--neon-5)",        glow: "0 0 8px rgba(255,56,96,0.7), 0 0 24px rgba(255,56,96,0.35)", borderOpacity: 1 },
};

export const CARD_TYPE_GLYPH: Record<CardType, string> = {
  VOICE:        "◐",
  TRANSMISSION: "▦",
  LORE:         "▲",
  SIGNAL:       "◈",
  ORACLE:       "◉",
  CIPHER:       "✦",
};

export const CARD_TYPE_LABEL: Record<CardType, string> = {
  VOICE:        "VOICE",
  TRANSMISSION: "TRANSMISSION",
  LORE:         "LORE",
  SIGNAL:       "SIGNAL",
  ORACLE:       "ORACLE",
  CIPHER:       "CIPHER",
};

/** Given pack rarity weights, return a random rarity. */
export function rollRarity(weights: {
  weightStatic: number;
  weightSignal: number;
  weightTransmission: number;
  weightAnomaly: number;
  weightOracle: number;
}): Rarity {
  const roll = Math.random() * 100;
  const { weightStatic, weightSignal, weightTransmission, weightAnomaly } = weights;
  if (roll < weightStatic) return "STATIC";
  if (roll < weightStatic + weightSignal) return "SIGNAL";
  if (roll < weightStatic + weightSignal + weightTransmission) return "TRANSMISSION";
  if (roll < weightStatic + weightSignal + weightTransmission + weightAnomaly) return "ANOMALY";
  return "ORACLE";
}

/** 5% foil chance on TRANSMISSION and above */
export function rollFoil(rarity: Rarity): boolean {
  if (RARITY_ORDER[rarity] < RARITY_ORDER.TRANSMISSION) return false;
  return Math.random() < 0.05;
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
    case "VOICE": {
      const appearances = data.appearanceCount ?? 1;
      const signalStrength = clamp((appearances / 50) * 90 + 9);
      const resonance = clamp((data.topicCount ?? 0) * 6 + (data.loreCount ?? 0) * 4);
      const clarity =
        data.personType === "host"      ? 99 :
        data.personType === "recurring" ? 82 :
        data.personType === "guest"     ? 60 : 35;
      return { statA: signalStrength, statB: resonance, statC: clarity };
    }
    case "TRANSMISSION": {
      const depth = clamp((data.segmentCount ?? 0) * 2 + 20);
      const reach = clamp((data.guestCount ?? 0) * 12 + (data.topicCount ?? 0) * 5);
      return { statA: 99, statB: reach, statC: depth };
    }
    case "LORE": {
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
};
