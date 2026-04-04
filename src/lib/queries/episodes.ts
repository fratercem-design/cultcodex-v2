import { prisma } from "@/lib/db";
import { cleanTitle } from "@/lib/format/text";
import type { Prisma, ContentStatus, ContentType } from "@/generated/prisma/client";

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
  segmentCount: number;
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
    thumbnailUrl: episode.thumbnailUrl,
    status: episode.status,
    segmentCount: episode.segments.length,
    guestNames: episode.guests
      .filter((g) => g.person.personType !== "host")
      .map((g) => g.person.displayName),
    topicNames: episode.topics.map((t) => t.topic.title),
  };
}

export async function getEpisodes(options?: {
  status?: ContentStatus;
  take?: number;
  skip?: number;
  orderBy?: "airDate" | "episodeNumber" | "title";
  order?: "asc" | "desc";
}) {
  const {
    status,
    take = 20,
    skip = 0,
    orderBy = "episodeNumber",
    order = "desc",
  } = options ?? {};

  // When sorting by airDate, use episodeNumber as tiebreaker so null-airDate
  // episodes still sort reasonably instead of appearing in random order
  const orderByClause =
    orderBy === "airDate"
      ? [{ airDate: { sort: order, nulls: "last" as const } }, { episodeNumber: order }]
      : { [orderBy]: order };

  return prisma.episode.findMany({
    where: status ? { status } : undefined,
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

export async function getEpisodeCount(status?: ContentStatus) {
  return prisma.episode.count({
    where: status ? { status } : undefined,
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
