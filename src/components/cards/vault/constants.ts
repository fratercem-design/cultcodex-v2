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

/** Which deck a card belongs to — the collectible Signal Archive or the 80-card tarot. */
export type VaultDeck = "archive" | "arcana";

export interface VaultCard {
  id: string;
  slug: string;
  num: string;
  deck: VaultDeck;
  /** Arcana sub-group — only set when deck === "arcana". */
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
