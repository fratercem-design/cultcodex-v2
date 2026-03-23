import { prisma } from "@/lib/db";
import type { Prisma, ContentStatus } from "@/generated/prisma/client";

export function buildSeriesInclude() {
  return {
    _count: { select: { episodes: true } },
  } satisfies Prisma.SeriesInclude;
}

export type SeriesWithCount = Prisma.SeriesGetPayload<{
  include: ReturnType<typeof buildSeriesInclude>;
}>;

export async function getSeries() {
  return prisma.series.findMany({
    include: buildSeriesInclude(),
    orderBy: { sortOrder: "asc" },
  });
}

export async function getSeriesBySlug(slug: string) {
  return prisma.series.findUnique({
    where: { slug },
    include: buildSeriesInclude(),
  });
}

export async function getSeriesEpisodes(seriesId: string, options?: {
  take?: number;
  skip?: number;
  status?: ContentStatus;
}) {
  const { take = 24, skip = 0, status } = options ?? {};

  return prisma.episode.findMany({
    where: { seriesId, status },
    orderBy: { episodeNumber: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      episodeNumber: true,
      airDate: true,
      summaryShort: true,
      thumbnailUrl: true,
      status: true,
      guests: { include: { person: true } },
      topics: { include: { topic: true } },
    },
    take,
    skip,
  });
}

export async function getSeriesEpisodeCount(seriesId: string, status?: ContentStatus) {
  return prisma.episode.count({
    where: { seriesId, status },
  });
}
