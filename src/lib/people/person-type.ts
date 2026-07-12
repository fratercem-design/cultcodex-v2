import type { PersonType } from "@/generated/prisma/client";

/**
 * Single source of truth for person-type presentation.
 * Canonical color code: host = gold, recurring = purple, guest = cyan,
 * mentioned = muted. Every surface (badges, sigils, dots, graph, admin)
 * derives from these maps — do not define local personType→color literals.
 *
 * Note: this theme aliases `accent-green` to the gold hex (#C8392E), so
 * "green" is NOT a distinct color here — guests use cyan for contrast
 * against gold hosts. Matches the relationship graph's existing palette.
 */

export const PERSON_TYPE_LABEL: Record<PersonType, string> = {
  host: "Host",
  recurring: "Recurring",
  guest: "Guest",
  mentioned: "Mentioned",
};

/** StatusBadge variant per person type. */
export const PERSON_TYPE_BADGE: Record<PersonType, "gold" | "purple" | "cyan" | "muted"> = {
  host: "gold",
  recurring: "purple",
  guest: "cyan",
  mentioned: "muted",
};

/** Text/stroke tint class (sigils, icons). */
export const PERSON_TYPE_TINT: Record<PersonType, string> = {
  host: "text-accent-gold",
  recurring: "text-accent-purple",
  guest: "text-accent-cyan",
  mentioned: "text-text-muted",
};

/** Small indicator-dot background class (chips, strips). */
export const PERSON_TYPE_DOT: Record<PersonType, string> = {
  host: "bg-accent-gold/60",
  recurring: "bg-accent-purple/60",
  guest: "bg-accent-cyan/40",
  mentioned: "bg-text-muted/30",
};

/** Raw hex per type for canvas/SVG surfaces (relationship graph). */
export const PERSON_TYPE_HEX: Record<PersonType, string> = {
  host: "#C8392E",
  recurring: "#4A2D6E",
  guest: "#62E4C8",
  mentioned: "#475569",
};
