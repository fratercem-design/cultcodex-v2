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
    id: "origin",
    label: "The First Signal",
    subtitle: "Where it began",
    description:
      "The archive opens. Raw transmission, unpolished, finding the frequency. Every archetype that would define the Cult was seeded here — the voice before it had an audience.",
    dateStart: "2019-01-01",  // ← set to channel launch date
    dateEnd:   "2020-06-30",  // ← set to end of founding period
    color: "gold",
    sigil: "◈",
  },
  {
    id: "descent",
    label: "The Descent",
    subtitle: "Going underground",
    description:
      "The show finds its shadow. Consciousness, manipulation, the occult — conversations get stranger and more honest. The audience starts paying attention. Something shifts.",
    dateStart: "2020-07-01",  // ← set to start of second phase
    dateEnd:   "2022-03-31",  // ← set to end of second phase
    color: "violet",
    sigil: "↓",
  },
  {
    id: "dark-arc",
    label: "The Dark Arc",
    subtitle: "Peak intensity",
    description:
      "Everything is on the table. Nothing is sacred. Psychological pressure hits a peak and the transmissions start bleeding into each other. The most referenced era in the Psychenomicon.",
    dateStart: "2022-04-01",  // ← set to start of dark arc
    dateEnd:   "2023-12-31",  // ← set to end of dark arc
    color: "crimson",
    sigil: "⬡",
  },
  {
    id: "current",
    label: "The Current",
    subtitle: "Now. Ongoing.",
    description:
      "The signal doesn't stop. The current era is still being written — every new transmission adds to the archive in real time. Patterns from every prior era resurface in new forms.",
    dateStart: "2024-01-01",  // ← set to start of current era
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
