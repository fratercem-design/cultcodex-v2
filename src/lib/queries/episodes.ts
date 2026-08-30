import { prisma } from "@/lib/db";
import { cleanTitle } from "@/lib/format/text";
import { fixThumbnailUrl } from "@/lib/format/thumbnail";
import { getEraById } from "@/lib/eras";
import type { Prisma, ContentStatus, ContentType, PersonType } from "@/generated/prisma/client";

// Type for episode with all relations loaded
export type EpisodeWithRelations = Prisma.EpisodeGetPayload<{
  include: ReturnType<typeof buildEpisodeInclude>;
}>;

export function buildEpisodeInclude() {
  return {
    series: true,
    guests: { include: { person: true } },
    mentionedPeople: { include: { person: true } },
    loreEntries: { include: { loreEntry: true } },
    topics: { include: { topic: true } },
    quotes: { include: { speaker: true } },
    segments: { orderBy: { startSeconds: "asc" as const } },
  } satisfies Prisma.EpisodeInclude;
}

export interface EpisodeCardData {
  id: string;
  title: string;
  slug: string;
  episodeNumber: number | null;
  airDate: Date | null;
  summaryShort: string | null;
  thumbnailUrl: string | null;
  status: ContentStatus;
  hasVideo: boolean;
  segmentCount: number;
  /** True when the episode has an AI-generated long summary */
  hasSummary: boolean;
  /** True when an admin has manually verified the AI summary */
  isHumanReviewed: boolean;
  humanReviewedAt: Date | null;
  guestNames: string[];
  topicNames: string[];
}

export function formatEpisodeForCard(episode: EpisodeWithRelations): EpisodeCardData {
  return {
    id: episode.id,
    title: cleanTitle(episode.title),
    slug: episode.slug,
    episodeNumber: episode.episodeNumber,
    airDate: episode.airDate,
    summaryShort: episode.summaryShort,
    thumbnailUrl: fixThumbnailUrl(episode.thumbnailUrl),
    status: episode.status,
    hasVideo: !!(episode.youtubeVideoId || episode.rumbleVideoId),
    segmentCount: episode.segments.length,
    hasSummary: !!(
      (episode.summaryFacts && episode.summaryFacts.length > 0) ||
      (episode.summaryLong && episode.summaryLong.length > 0)
    ),
    isHumanReviewed: episode.isHumanReviewed,
    humanReviewedAt: episode.humanReviewedAt,
    guestNames: episode.guests
      .filter((g) => g.person.personType !== "host")
      .map((g) => g.person.displayName),
    topicNames: episode.topics.map((t) => t.topic.title),
  };
}

function buildEraWhere(eraId?: string): Prisma.EpisodeWhereInput {
  if (!eraId) return {};
  const era = getEraById(eraId);
  if (!era) return {};
  return {
    airDate: {
      gte: new Date(era.dateStart),
      ...(era.dateEnd !== null ? { lte: new Date(`${era.dateEnd}T23:59:59.999Z`) } : {}),
    },
  };
}

/** Guest info needed by card/hero surfaces (GuestGrid). */
export interface EpisodeCardGuest {
  displayName: string;
  slug: string;
  avatarUrl: string | null;
  personType: PersonType;
}

export type EpisodeCardWithGuests = EpisodeCardData & { guests: EpisodeCardGuest[] };

// List views only need card fields — NOT the full relations. buildEpisodeInclude()
// loads every transcript segment (~1.7k rows/episode), plus quotes, lore and
// mentions per row, so a 20-episode list pulled ~30k+ rows (profiled: 2s+ vs the
// ~90ms DB round-trip baseline). This select fetches counts and names instead.
const EPISODE_CARD_LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  episodeNumber: true,
  airDate: true,
  summaryShort: true,
  thumbnailUrl: true,
  status: true,
  youtubeVideoId: true,
  rumbleVideoId: true,
  summaryFacts: true,
  summaryLong: true, // only length-tested for hasSummary; still far cheaper than segments
  isHumanReviewed: true,
  humanReviewedAt: true,
  guests: {
    select: {
      person: { select: { displayName: true, slug: true, avatarUrl: true, personType: true } },
    },
  },
  topics: { select: { topic: { select: { title: true } } } },
  _count: { select: { segments: true } },
} satisfies Prisma.EpisodeSelect;

/**
 * Lean episode list for card surfaces (/episodes, homepage). Same filtering and
 * ordering semantics as getEpisodes, but selects only what cards render.
 * Use getEpisodes/getEpisodeBySlug when the full relations are actually needed.
 */
/** Episodes where the person appeared as a guest or was mentioned. Mirrors the
 *  union the person page shows, so /episodes?person=<slug> is the full,
 *  paginated view behind that page's capped appearance list. */
/** Episodes linked to a topic — the paginated view behind a topic page's
 *  capped episode list. */
function buildTopicWhere(topicSlug?: string): Prisma.EpisodeWhereInput {
  if (!topicSlug) return {};
  return { topics: { some: { topic: { slug: topicSlug } } } };
}

function buildPersonWhere(personSlug?: string): Prisma.EpisodeWhereInput {
  if (!personSlug) return {};
  return {
    OR: [
      { guests: { some: { person: { slug: personSlug } } } },
      { mentionedPeople: { some: { person: { slug: personSlug } } } },
    ],
  };
}

export async function getEpisodeCards(options?: {
  status?: ContentStatus;
  take?: number;
  skip?: number;
  orderBy?: "airDate" | "episodeNumber" | "title";
  order?: "asc" | "desc";
  eraId?: string;
  /** Restrict to episodes this person appeared in or was mentioned in. */
  personSlug?: string;
  /** Restrict to episodes linked to this topic. */
  topicSlug?: string;
}): Promise<EpisodeCardWithGuests[]> {
  const {
    status,
    take = 20,
    skip = 0,
    orderBy = "episodeNumber",
    order = "desc",
    eraId,
    personSlug,
    topicSlug,
  } = options ?? {};

  const orderByClause =
    orderBy === "airDate"
      ? [{ airDate: { sort: order, nulls: "last" as const } }, { episodeNumber: order }]
      : { [orderBy]: order };

  const where: Prisma.EpisodeWhereInput = {
    ...(status ? { status } : {}),
    ...buildEraWhere(eraId),
    ...buildPersonWhere(personSlug),
    ...buildTopicWhere(topicSlug),
  };

  const rows = await prisma.episode.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    select: EPISODE_CARD_LIST_SELECT,
    orderBy: orderByClause,
    take,
    skip,
  });

  return rows.map((episode) => ({
    id: episode.id,
    title: cleanTitle(episode.title),
    slug: episode.slug,
    episodeNumber: episode.episodeNumber,
    airDate: episode.airDate,
    summaryShort: episode.summaryShort,
    thumbnailUrl: fixThumbnailUrl(episode.thumbnailUrl),
    status: episode.status,
    hasVideo: !!(episode.youtubeVideoId || episode.rumbleVideoId),
    segmentCount: episode._count.segments,
    hasSummary: !!(
      (episode.summaryFacts && episode.summaryFacts.length > 0) ||
      (episode.summaryLong && episode.summaryLong.length > 0)
    ),
    isHumanReviewed: episode.isHumanReviewed,
    humanReviewedAt: episode.humanReviewedAt,
    guestNames: episode.guests
      .filter((g) => g.person.personType !== "host")
      .map((g) => g.person.displayName),
    topicNames: episode.topics.map((t) => t.topic.title),
    guests: episode.guests.map((g) => ({
      displayName: g.person.displayName,
      slug: g.person.slug,
      avatarUrl: g.person.avatarUrl,
      personType: g.person.personType,
    })),
  }));
}

export async function getEpisodes(options?: {
  status?: ContentStatus;
  take?: number;
  skip?: number;
  orderBy?: "airDate" | "episodeNumber" | "title";
  order?: "asc" | "desc";
  eraId?: string;
  /** Restrict to episodes this person appeared in or was mentioned in. */
  personSlug?: string;
  /** Restrict to episodes linked to this topic. */
  topicSlug?: string;
}) {
  const {
    status,
    take = 20,
    skip = 0,
    orderBy = "episodeNumber",
    order = "desc",
    eraId,
    personSlug,
    topicSlug,
  } = options ?? {};

  // When sorting by airDate, use episodeNumber as tiebreaker so null-airDate
  // episodes still sort reasonably instead of appearing in random order
  const orderByClause =
    orderBy === "airDate"
      ? [{ airDate: { sort: order, nulls: "last" as const } }, { episodeNumber: order }]
      : { [orderBy]: order };

  const where: Prisma.EpisodeWhereInput = {
    ...(status ? { status } : {}),
    ...buildEraWhere(eraId),
    ...buildPersonWhere(personSlug),
    ...buildTopicWhere(topicSlug),
  };

  return prisma.episode.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    include: buildEpisodeInclude(),
    orderBy: orderByClause,
    take,
    skip,
  });
}

export async function getEpisodeBySlug(slug: string) {
  return prisma.episode.findUnique({
    where: { slug },
    include: buildEpisodeInclude(),
  });
}

export async function getEpisodeCount(
  status?: ContentStatus,
  eraId?: string,
  personSlug?: string,
  topicSlug?: string
) {
  const where: Prisma.EpisodeWhereInput = {
    ...(status ? { status } : {}),
    ...buildEraWhere(eraId),
    ...buildPersonWhere(personSlug),
    ...buildTopicWhere(topicSlug),
  };
  return prisma.episode.count({
    where: Object.keys(where).length > 0 ? where : undefined,
  });
}

export async function getRelatedEpisodes(episodeId: string, options?: {
  limit?: number;
}) {
  const { limit = 6 } = options ?? {};

  const episodeSelect = {
    id: true, title: true, slug: true, episodeNumber: true,
    airDate: true, summaryShort: true, status: true, contentType: true,
  } as const;

  // First try explicit relations
  const explicit = await prisma.relatedEpisode.findMany({
    where: { OR: [{ episodeAId: episodeId }, { episodeBId: episodeId }] },
    include: {
      episodeA: { select: episodeSelect },
      episodeB: { select: episodeSelect },
    },
    take: limit,
  });

  const explicitEps = explicit.map((r) =>
    r.episodeAId === episodeId ? r.episodeB : r.episodeA
  );

  if (explicitEps.length >= limit) return explicitEps;

  // Get this episode's topics, guests, and series for overlap scoring
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    select: {
      seriesId: true,
      episodeNumber: true,
      topics: { select: { topicId: true } },
      guests: { select: { personId: true } },
    },
  });

  if (!episode) return explicitEps;

  const topicIds = episode.topics.map((t) => t.topicId);
  const guestIds = episode.guests.map((g) => g.personId);
  const excludeIds = [episodeId, ...explicitEps.map((e) => e.id)];
  const remaining = limit - explicitEps.length;

  // Find episodes that share topics or guests, scored by overlap
  if (topicIds.length > 0 || guestIds.length > 0) {
    // Get episodes that share at least one topic
    const topicOverlaps = topicIds.length > 0
      ? await prisma.episodeTopic.findMany({
          where: {
            topicId: { in: topicIds },
            episodeId: { notIn: excludeIds },
          },
          select: { episodeId: true },
        })
      : [];

    // Get episodes that share at least one guest
    const guestOverlaps = guestIds.length > 0
      ? await prisma.episodeGuest.findMany({
          where: {
            personId: { in: guestIds },
            episodeId: { notIn: excludeIds },
          },
          select: { episodeId: true },
        })
      : [];

    // Score by overlap count (topics weight 1, guests weight 2)
    const scores = new Map<string, number>();
    for (const t of topicOverlaps) {
      scores.set(t.episodeId, (scores.get(t.episodeId) ?? 0) + 1);
    }
    for (const g of guestOverlaps) {
      scores.set(g.episodeId, (scores.get(g.episodeId) ?? 0) + 2);
    }

    // Bonus for same series
    if (episode.seriesId) {
      const sameSeriesIds = await prisma.episode.findMany({
        where: { seriesId: episode.seriesId, id: { notIn: excludeIds } },
        select: { id: true },
      });
      for (const s of sameSeriesIds) {
        scores.set(s.id, (scores.get(s.id) ?? 0) + 1);
      }
    }

    if (scores.size > 0) {
      // Sort by score desc, take top N
      const topIds = [...scores.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, remaining)
        .map(([id]) => id);

      const related = await prisma.episode.findMany({
        where: { id: { in: topIds } },
        select: episodeSelect,
      });

      // Re-sort by score
      const scoreMap = new Map(scores);
      related.sort((a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0));

      return [...explicitEps, ...related];
    }
  }

  // Final fallback: same series (nearest by episode number)
  if (episode.seriesId) {
    const sameSeries = await prisma.episode.findMany({
      where: {
        seriesId: episode.seriesId,
        id: { notIn: excludeIds },
      },
      select: episodeSelect,
      orderBy: { episodeNumber: "desc" },
      take: remaining,
    });
    return [...explicitEps, ...sameSeries];
  }

  return explicitEps;
}

export interface EraNeighborEpisode {
  slug: string;
  title: string;
  episodeNumber: number | null;
  airDate: Date | null;
  thumbnailUrl: string | null;
}

/**
 * Finds the previous and next published episodes within the same era,
 * by airDate. Returns null on either side if the current episode is at
 * the edge of the era's date range.
 */
export async function getEpisodeNeighborsInEra(options: {
  episodeId: string;
  airDate: Date;
  eraDateStart: Date;
  eraDateEnd: Date | null;
}): Promise<{ previous: EraNeighborEpisode | null; next: EraNeighborEpisode | null }> {
  const { episodeId, airDate, eraDateStart, eraDateEnd } = options;

  const eraUpperBound = eraDateEnd ?? new Date("9999-12-31");

  const selectShape = {
    slug: true,
    title: true,
    episodeNumber: true,
    airDate: true,
    thumbnailUrl: true,
  } as const;

  const [previous, next] = await Promise.all([
    prisma.episode.findFirst({
      where: {
        status: "published",
        id: { not: episodeId },
        airDate: { gte: eraDateStart, lt: airDate },
      },
      orderBy: { airDate: "desc" },
      select: selectShape,
    }),
    prisma.episode.findFirst({
      where: {
        status: "published",
        id: { not: episodeId },
        airDate: { gt: airDate, lte: eraUpperBound },
      },
      orderBy: { airDate: "asc" },
      select: selectShape,
    }),
  ]);

  return { previous, next };
}
