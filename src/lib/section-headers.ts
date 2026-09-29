/**
 * Header art for PageHero, one image per section of the site.
 *
 * Source PNGs and the prompts that generated them live in art/site-headers/.
 * The served files are 2400px WebP in public/images/site/headers/. They are
 * composed for a very wide, short crop: the left third stays dark so the
 * title reads, and the detail sits center-right.
 */
const dir = "/images/site/headers";

export const SECTION_HEADERS = {
  /** The archive itself: codex, lexicon, collections. */
  codex: `${dir}/codex.webp`,
  /** Episodes, posts, eras, timeline, series, reports. */
  transmissions: `${dir}/transmissions.webp`,
  /** Lore, guide, mythic map, archetypes, psychenomicon. */
  lore: `${dir}/lore.webp`,
  /** People pages. */
  voices: `${dir}/voices.webp`,
  /** Search and transcripts. */
  search: `${dir}/search.webp`,
  /** Oracle. */
  oracle: `${dir}/oracle.webp`,
  /** The Salon (Oracle members only). */
  salon: `${dir}/salon.webp`,
  /** Joining, initiation, onboarding, shop. */
  initiation: `${dir}/initiation.webp`,
  /** Leaderboard, rank, quests. */
  trials: `${dir}/trials.webp`,
  /** Explore, topics, stats, graph. */
  constellation: `${dir}/constellation.webp`,
  /** Live, appearances, claps, media kit, YouTube. */
  broadcast: `${dir}/broadcast.webp`,
  /** Start here, about, sign in. */
  threshold: `${dir}/threshold.webp`,
  /** Policies, FAQ, contact, corrections. */
  colophon: `${dir}/colophon.webp`,
  /** The member's own space: settings, favorites. */
  sanctum: `${dir}/sanctum.webp`,
} as const;

export type SectionHeader = keyof typeof SECTION_HEADERS;
