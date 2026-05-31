import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import type { ArchiveStats } from "@/types";

export interface ArchiveCounts {
  episodes: number;
  topics: number;
  people: number;
  transcribedEpisodes: number;
}

/**
 * Canonical archive stats — single source of truth for ALL counts site-wide.
 * Every surface that shows episode/person/topic counts must call this function.
 * DO NOT create a second stats function or run independent prisma.*.count()
 * calls for display purposes — multiple cache keys diverge and show different
 * numbers on different pages.
 */
export const getArchiveStats = unstable_cache(
  async (): Promise<ArchiveStats> => {
  const [
    episodes,
    people,
    loreEntries,
    quotes,
    series,
    topics,
    segments,
    transcribedEpisodes,
    comments,
    reactions,
    durationData,
  ] = await Promise.all([
    prisma.episode.count(),
    prisma.person.count(),
    prisma.loreEntry.count(),
    prisma.quote.count(),
    prisma.series.count(),
    prisma.topic.count(),
    prisma.transcriptSegment.count(),
    prisma.episode.count({ where: { segments: { some: {} } } }),
    prisma.codexComment.count(),
    prisma.episodeReaction.count(),
    prisma.episode.findMany({
      where: { duration: { not: null } },
      select: { duration: true },
    }),
  ]);

  let totalSeconds = 0;
  for (const ep of durationData) {
    if (ep.duration) {
      const parts = ep.duration.split(":").map(Number);
      if (parts.length === 3) {
        totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        totalSeconds += parts[0] * 60 + parts[1];
      }
    }
  }
  const totalHours = Math.round(totalSeconds / 3600);

  return {
    episodes,
    people,
    loreEntries,
    quotes,
    series,
    topics,
    segments,
    totalHours,
    comments,
    reactions,
    transcribedEpisodes,
  };
  },
  ["archive-stats"],
  { revalidate: 600, tags: ["archive-stats"] }
);

/**
 * Subset of getArchiveStats for the terminal chrome (sidebar, statusbar).
 * Derives from getArchiveStats so sidebar and page counts are always in sync.
 */
export async function getArchiveCounts(): Promise<ArchiveCounts> {
  const stats = await getArchiveStats();
  return {
    episodes: stats.episodes,
    topics: stats.topics,
    people: stats.people,
    transcribedEpisodes: stats.transcribedEpisodes,
  };
}

/**
 * Cached member count (active subscribers + admins). Separate from archive
 * stats so subscription churn is reflected within 5 minutes without busting
 * the full archive-stats cache.
 */
export const getMemberCount = unstable_cache(
  async (): Promise<number> => {
    return prisma.codexUser.count({
      where: { OR: [{ role: "admin" }, { subscriptionStatus: "active" }] },
    });
  },
  ["member-count"],
  { revalidate: 300, tags: ["member-count"] }
);

export async function getEpisodeAggregates() {
  const [total, earliest, latest, guestCount] = await Promise.all([
    prisma.episode.count(),
    prisma.episode.findFirst({
      where: { airDate: { not: null } },
      orderBy: { airDate: "asc" },
      select: { airDate: true },
    }),
    prisma.episode.findFirst({
      where: { airDate: { not: null } },
      orderBy: { airDate: "desc" },
      select: { airDate: true },
    }),
    prisma.episodeGuest.count(),
  ]);

  return {
    total,
    earliestDate: earliest?.airDate ?? null,
    latestDate: latest?.airDate ?? null,
    totalGuests: guestCount,
  };
}

export async function getPeopleAggregates() {
  const [total, hosts, recurring, guests] = await Promise.all([
    prisma.person.count(),
    prisma.person.count({ where: { personType: "host" } }),
    prisma.person.count({ where: { personType: "recurring" } }),
    prisma.person.count({ where: { personType: "guest" } }),
  ]);

  return { total, hosts, recurring, guests };
}

export async function getLoreAggregates() {
  const [total, canonical, speculative, communityMyth] = await Promise.all([
    prisma.loreEntry.count(),
    prisma.loreEntry.count({ where: { canonStatus: "canonical" } }),
    prisma.loreEntry.count({ where: { canonStatus: "speculative" } }),
    prisma.loreEntry.count({ where: { canonStatus: "community_myth" } }),
  ]);

  return { total, canonical, speculative, communityMyth };
}

export async function getTopicAggregates() {
  const [total, linkedEpisodes] = await Promise.all([
    prisma.topic.count(),
    prisma.episodeTopic.count(),
  ]);

  return { total, linkedEpisodes };
}

export async function getSeriesAggregates() {
  const [total, totalEpisodes] = await Promise.all([
    prisma.series.count(),
    prisma.episode.count({ where: { seriesId: { not: null } } }),
  ]);

  return { total, totalEpisodes };
}

/** Most recent updatedAt across core archive tables */
export async function getArchiveLastUpdated(): Promise<Date | null> {
  const [ep, person, quote, topic, lore] = await Promise.all([
    prisma.episode.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    prisma.person.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    prisma.quote.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    prisma.topic.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    prisma.loreEntry.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
  ]);

  const dates = [ep?.updatedAt, person?.updatedAt, quote?.updatedAt, topic?.updatedAt, lore?.updatedAt]
    .filter((d): d is Date => d != null);

  if (dates.length === 0) return null;
  return dates.reduce((latest, d) => (d > latest ? d : latest));
}
