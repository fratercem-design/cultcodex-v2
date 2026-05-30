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
 * Lightweight cached count query used by the terminal chrome (sidebar badges,
 * statusbar feed count, integrity meter). Revalidates every 10 minutes.
 * Kept separate from getArchiveStats() to avoid the expensive duration query
 * on every layout render.
 */
export const getArchiveCounts = unstable_cache(
  async (): Promise<ArchiveCounts> => {
    // Note: intentionally no try-catch here — let errors propagate so
    // unstable_cache does NOT cache the failed result. The caller (layout)
    // handles the error with a fallback.
    const [episodes, topics, people, transcribedEpisodes] = await Promise.all([
      prisma.episode.count(),
      prisma.topic.count(),
      prisma.person.count(),
      prisma.episode.count({ where: { segments: { some: {} } } }),
    ]);
    return { episodes, topics, people, transcribedEpisodes };
  },
  ["archive-counts"],
  { revalidate: 600, tags: ["archive-counts"] }
);

/**
 * Canonical archive stats — single source of truth for all counts site-wide.
 * Shared unstable_cache so every page that calls this gets the same snapshot.
 * DO NOT create a second stats function elsewhere.
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
    prisma.codexComment.count(),
    prisma.episodeReaction.count(),
    prisma.episode.findMany({
      where: { duration: { not: null } },
      select: { duration: true },
    }),
  ]);

  // Parse duration strings (format: "HH:MM:SS" or "MM:SS") into total hours
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
  };
  },
  ["archive-stats"],
  { revalidate: 300, tags: ["archive-stats"] }
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
