export type RarityInfo = {
  label: string;
  color: string;
  glow: string;
  gem: string;
  tier: number;
  foil: string;
};

export const VAULT_RARITIES: Record<string, RarityInfo> = {
  ORACLE:       { label: "ORACLE",       color: "#34d6ff", glow: "#0a5d78", gem: "sapphire",  tier: 6, foil: "prism"  },
  LEGENDARY:    { label: "LEGENDARY",    color: "#f6c453", glow: "#6e4e0e", gem: "topaz",     tier: 7, foil: "gold"   },
  MYTHIC:       { label: "MYTHIC",       color: "#b27bff", glow: "#3a1f6b", gem: "amethyst",  tier: 8, foil: "prism"  },
  TRANSMISSION: { label: "TRANSMISSION", color: "#3ee895", glow: "#0c5436", gem: "emerald",   tier: 4, foil: "scan"   },
  ANOMALY:      { label: "ANOMALY",      color: "#ff4d8d", glow: "#6e1037", gem: "garnet",    tier: 5, foil: "glitch" },
  FORBIDDEN:    { label: "FORBIDDEN",    color: "#ff2e2e", glow: "#5e0808", gem: "obsidian",  tier: 9, foil: "redact" },
  SIGNAL:       { label: "SIGNAL",       color: "#ffab36", glow: "#6b3c06", gem: "amber",     tier: 3, foil: "scan"   },
  STATIC:       { label: "STATIC",       color: "#c7d0c8", glow: "#3a3f3a", gem: "quartz",    tier: 2, foil: "noise"  },
};

export type CardTypeInfo = {
  glyph: string;
  note: string;
};

export const VAULT_CARD_TYPES: Record<string, CardTypeInfo> = {
  MAHAVIDYA:    { glyph: "देवी", note: "Wisdom Goddess" },
  ENTITY:       { glyph: "◈",    note: "Emergent Being" },
  CIPHER:       { glyph: "⟁",    note: "Archetype" },
  LORE:         { glyph: "§",    note: "Lore" },
  GLITCH:       { glyph: "▚",    note: "Glitch" },
  PROPHECY:     { glyph: "☌",    note: "Prophecy" },
  INCIDENT:     { glyph: "✲",    note: "Incident" },
  RELIC:        { glyph: "✛",    note: "Relic" },
  AVATAR:       { glyph: "☥",    note: "Avatar" },
  MEMBER:       { glyph: "✦",    note: "Member" },
  SIGNAL:       { glyph: "((·))", note: "Signal" },
  VOICE:        { glyph: "◐",    note: "Voice" },
  TRANSMISSION: { glyph: "▦",    note: "Transmission" },
  ORACLE:       { glyph: "◉",    note: "Oracle" },
};

// Slugs with special rendering rules
export const CARD_SPECIALS: Record<string, string> = {
  "dead-chat":    "deadchat",
  "signal-eaten": "signaleaten",
};

/** Which deck a card belongs to — the collectible Signal Archive or the 80-card tarot. */
export type VaultDeck = "archive" | "arcana";

/** Arcana sub-groups, keyed by the slug code (`cop-<code>-…`), in deck order. */
export const ARCANA_GROUPS: Record<string, { label: string; glyph: string }> = {
  maj: { label: "MAJOR ARCANA", glyph: "☉" },
  sig: { label: "SIGNALS",      glyph: "((·))" },
  mir: { label: "MIRRORS",      glyph: "◐" },
  rel: { label: "RELICS",       glyph: "✛" },
  gli: { label: "GLITCHES",     glyph: "▚" },
};
export const ARCANA_GROUP_ORDER = Object.keys(ARCANA_GROUPS);

/** `cop-maj-00` → "maj"; anything unrecognised falls back to the majors group. */
export function arcanaGroupOf(slug: string): string {
  const code = slug.split("-")[1];
  return code && ARCANA_GROUPS[code] ? code : "maj";
}

export interface VaultCard {
  id: string;
  slug: string;
  num: string;
  deck: VaultDeck;
  /** ARCANA_GROUPS key — only set when deck === "arcana". */
  arcanaGroup?: string;
  cardType: string;
  rarity: string;
  title: string;
  subtitle: string | null;
  flavourText: string | null;
  statA: number;
  statB: number;
  statC: number;
  abilities: string[];
  maxSupply: number | null;
  personality: string | null;
  special?: string;
}

export const TYPE_ORDER = [
  "MAHAVIDYA", "ENTITY", "CIPHER", "AVATAR", "MEMBER",
  "SIGNAL", "GLITCH", "RELIC", "INCIDENT", "PROPHECY",
  "LORE", "VOICE", "TRANSMISSION", "ORACLE",
];

// Node and browsers ship different libm implementations, so Math.sin/cos can
// differ in the last ulp between server and client — enough to trip React
// hydration on every procedurally drawn coordinate. Rounding the trig output
// makes all downstream arithmetic (which IS deterministic) agree bit-for-bit.
export const sin = (a: number) => Math.round(Math.sin(a) * 1e6) / 1e6;
export const cos = (a: number) => Math.round(Math.cos(a) * 1e6) / 1e6;
