import { prisma } from "@/lib/db";
import type { ArchiveStats } from "@/types";

export async function getArchiveStats(): Promise<ArchiveStats> {
  const [episodes, people, loreEntries, quotes, series, topics] =
    await Promise.all([
      prisma.episode.count({ where: { status: "published" } }),
      prisma.person.count(),
      prisma.loreEntry.count(),
      prisma.quote.count(),
      prisma.series.count(),
      prisma.topic.count(),
    ]);

  return { episodes, people, loreEntries, quotes, series, topics };
}

export async function getEpisodeAggregates() {
  const [total, earliest, latest, guestCount] = await Promise.all([
    prisma.episode.count({ where: { status: "published" } }),
    prisma.episode.findFirst({
      where: { status: "published", airDate: { not: null } },
      orderBy: { airDate: "asc" },
      select: { airDate: true },
    }),
    prisma.episode.findFirst({
      where: { status: "published", airDate: { not: null } },
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
    prisma.episode.count({ where: { seriesId: { not: null }, status: "published" } }),
  ]);

  return { total, totalEpisodes };
}
