import type { Prisma } from "@/generated/prisma/client";

/**
 * Lore entries taken down after Alexandra Mayers' removal request (correction
 * C-30E02A): the ones making accusations about her or covering her health,
 * legal record, sexual history, past career, drinking or faith. Blocked in
 * code so the pages 404 and drop out of every listing, and so re-enrichment
 * creating a row with the same slug can't bring one back.
 */
export const REMOVED_LORE_SLUGS = [
  "alexandra-mayers-abduction",
  "alexandra-mayers-warrant-arizona-2023",
  "alien-abduction-theory",
  "archangel-raphael-as-divine-protector",
  "asmodeus-and-lilith-as-possession-claims",
  "church-of-jezebel",
  "content-strikes-and-flagging-campaigns",
  "doxing-and-family-harassment-pattern",
  "information-laundering",
  "ip2-community-drama",
  "monica-foster-alexandre-mayers",
  "pattern-recognition-as-spiritual-sight",
  "q-farms-documentation",
  "spiritual-trafficking-accusation",
  "superior-court-of-california-as-rhetorical-anchor",
  "the-alex-anomaly-alexander-mayers-situation",
  "the-donation-conflict",
  "the-five-drinks-dinner",
  "the-sperm-donor-dispute",
  "weagle-team",
] as const;

export function isRemovedLore(slug: string): boolean {
  return (REMOVED_LORE_SLUGS as readonly string[]).includes(slug);
}

/** Where-clause fragment excluding removed lore; spread or nest it into a LoreEntry filter. */
export const NOT_REMOVED_LORE = {
  slug: { notIn: [...REMOVED_LORE_SLUGS] },
} satisfies Prisma.LoreEntryWhereInput;
