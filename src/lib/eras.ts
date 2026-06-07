// ── Era System ────────────────────────────────────────────────────────────────
// Eras are defined by date ranges derived from key channel events.
// Edit the dates below to match your actual channel history.
// dateEnd: null = open-ended (current era).
// All era surfaces derive from this file — change here, change everywhere.

export type EraColor = "gold" | "violet" | "cyan" | "crimson" | "muted";

export interface Era {
  id: string;
  label: string;
  subtitle: string;
  description: string;
  dateStart: string;       // ISO date string, inclusive (YYYY-MM-DD)
  dateEnd: string | null;  // ISO date string, inclusive; null = current era
  color: EraColor;
  sigil: string;
}

// ── Edit these dates to match your actual channel history ─────────────────────
export const ERAS: readonly Era[] = [
  {
    id: "return",
    label: "The Return",
    subtitle: "Back after years away",
    description:
      "After years off the air, the signal comes back. The format is familiar but the frequency has shifted — livestream panels, open conversations, the cult reassembling in real time.",
    dateStart: "2024-07-01",
    dateEnd:   "2024-09-30",
    color: "gold",
    sigil: "◈",
  },
  {
    id: "current",
    label: "The Current",
    subtitle: "Live. Ongoing.",
    description:
      "The live era. October 2024 to now — unscripted panels, rotating guests, the full chaos of the stream format. Every transmission enters the archive in real time. The mythology is still being written.",
    dateStart: "2024-10-01",
    dateEnd:   null,
    color: "cyan",
    sigil: "∞",
  },
] as const;

export function getEraForEpisode(airDate: Date | null): Era | null {
  if (!airDate) return null;
  const d = airDate.toISOString().slice(0, 10); // "YYYY-MM-DD"
  return (
    ERAS.find(
      (era) =>
        d >= era.dateStart &&
        (era.dateEnd === null || d <= era.dateEnd)
    ) ?? null
  );
}

export function getEraById(id: string): Era | null {
  return ERAS.find((era) => era.id === id) ?? null;
}
