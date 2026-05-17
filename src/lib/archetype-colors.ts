// Canonical archetype → hex color. Mirrors the colors used in the
// relationship-graph and era detail surfaces. Matching is substring-based
// because primaryArchetype can carry compound values like "Mirror/Gravity".

export const ARCHETYPE_HEX: Record<string, string> = {
  Mirror:    "#a78bfa",
  Gravity:   "#a78bfa",
  Siren:     "#f472b6",
  Chaos:     "#f87171",
  Echo:      "#fb923c",
  Flame:     "#fbbf24",
  Contested: "#6ee7b7",
  Fractured: "#94a3b8",
  Silent:    "#64748b",
  Seekers:   "#67e8f9",
  Loyalist:  "#818cf8",
};

const FALLBACK_HEX = "#475569";

export function archetypeHex(archetype: string | null): string {
  if (!archetype) return FALLBACK_HEX;
  for (const [key, hex] of Object.entries(ARCHETYPE_HEX)) {
    if (archetype.includes(key)) return hex;
  }
  return FALLBACK_HEX;
}
