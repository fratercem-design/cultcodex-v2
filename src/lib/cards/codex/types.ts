import type { CardType, Rarity } from "@/generated/prisma/client";

/**
 * How a Codex card enters a collection.
 *   pack   — drops from that season's purchasable packs
 *   quest  — granted when the viewer completes a Trial (see quests.ts)
 *   secret — granted by finding a hidden sigil somewhere on the site
 *   signup — only in the free Initiation Pack
 */
export type ObtainMethod = "pack" | "quest" | "secret" | "signup";

export type Motif =
  | "antenna" | "bars" | "candle" | "moth" | "ring" | "key" | "moon" | "eye"
  | "radio" | "spiral" | "wave" | "bird" | "mirror" | "hand" | "tower" | "serpent"
  | "hourglass" | "chalice" | "comet" | "lotus" | "door" | "eyes" | "skull" | "bell"
  | "mask" | "sun" | "book" | "pyramid" | "flame" | "heart" | "star" | "planet"
  | "tree" | "crown";

export type Palette =
  | "abyss" | "ember" | "violet" | "gold" | "blood" | "verdant" | "frost"
  | "rose" | "void" | "toxic" | "dusk" | "sea";

export interface ArtSpec {
  motif: Motif;
  palette: Palette;
}

export interface CodexCardDef {
  slug: string;
  title: string;
  subtitle: string;
  cardType: CardType;
  rarity: Rarity;
  obtain: ObtainMethod;
  flavour: string;
  abilities: string[];
  art: ArtSpec;
  /** Shown on the sealed card. Pack cards fall back to a rarity-based hint. */
  clue?: string;
  /** Trial id in quests.ts — required when obtain === "quest". */
  questId?: string;
  maxSupply?: number;
}

export interface PackDef {
  slug: string;
  name: string;
  description: string;
  cost: number;
  cardCount: number;
  sortOrder: number;
  artTheme: Palette;
  guaranteeRarity: Rarity;
  weights: {
    weightStatic: number;
    weightSignal: number;
    weightTransmission: number;
    weightAnomaly: number;
    weightOracle: number;
    weightLegendary: number;
    weightMythic: number;
    weightForbidden: number;
  };
}

export interface SeasonDef {
  number: number;
  /** Roman numeral used on card frames ("I", "II", …). */
  numeral: string;
  name: string;
  tagline: string;
  startsAt: string;
  endsAt: string;
  palette: Palette;
  cards: CodexCardDef[];
  packs: PackDef[];
}
