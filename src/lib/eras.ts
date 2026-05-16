// ── Era System ────────────────────────────────────────────────────────────────
// Edit ERAS below to match your actual episode numbering.
// episodeEnd: null = open-ended (current era).
// Only this file needs to change to update all era surfaces site-wide.

export type EraColor = "gold" | "violet" | "cyan" | "crimson" | "muted";

export interface Era {
  id: string;
  label: string;
  subtitle: string;
  description: string;
  episodeStart: number;
  episodeEnd: number | null;
  color: EraColor;
  sigil: string;
}

export const ERAS: readonly Era[] = [
  {
    id: "origin",
    label: "The First Signal",
    subtitle: "Where it began",
    description:
      "The archive opens. Raw transmission, unpolished, finding the frequency. Every archetype that would define the Cult was seeded here — the voice before it had an audience.",
    episodeStart: 1,
    episodeEnd: 100,
    color: "gold",
    sigil: "◈",
  },
  {
    id: "descent",
    label: "The Descent",
    subtitle: "Going underground",
    description:
      "The show finds its shadow. Consciousness, manipulation, the occult — the conversations get stranger and more honest. The audience starts paying attention. Something shifts.",
    episodeStart: 101,
    episodeEnd: 400,
    color: "violet",
    sigil: "↓",
  },
  {
    id: "expansion",
    label: "The Expansion",
    subtitle: "New voices, new vectors",
    description:
      "The circle widens. More guests, more chaos, more territory. The archive grows faster than any single thread can contain it. The community becomes part of the signal.",
    episodeStart: 401,
    episodeEnd: 900,
    color: "cyan",
    sigil: "◎",
  },
  {
    id: "dark-arc",
    label: "The Dark Arc",
    subtitle: "Peak intensity",
    description:
      "Everything is on the table. Nothing is sacred. Psychological pressure hits a peak and the transmissions start bleeding into each other. The most referenced era in the Psychenomicon.",
    episodeStart: 901,
    episodeEnd: 1400,
    color: "crimson",
    sigil: "⬡",
  },
  {
    id: "current",
    label: "The Current",
    subtitle: "Now. Ongoing.",
    description:
      "The signal doesn't stop. The current era is still being written — every new transmission adds to the archive in real time. Patterns from the first four eras resurface in new forms.",
    episodeStart: 1401,
    episodeEnd: null,
    color: "gold",
    sigil: "∞",
  },
] as const;

export function getEraForEpisode(episodeNumber: number | null): Era | null {
  if (episodeNumber === null) return null;
  return (
    ERAS.find(
      (era) =>
        episodeNumber >= era.episodeStart &&
        (era.episodeEnd === null || episodeNumber <= era.episodeEnd)
    ) ?? null
  );
}

export function getEraById(id: string): Era | null {
  return ERAS.find((era) => era.id === id) ?? null;
}
