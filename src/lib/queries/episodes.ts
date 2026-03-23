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
    guestNames: episode.guests.map((g) => g.person.displayName),
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

  return prisma.episode.findMany({
    where: status ? { status } : undefined,
    include: buildEpisodeInclude(),
    orderBy: { [orderBy]: order },
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

  // First try explicit relations
  const explicit = await prisma.relatedEpisode.findMany({
    where: { OR: [{ episodeAId: episodeId }, { episodeBId: episodeId }] },
    include: {
      episodeA: { select: { id: true, title: true, slug: true, episodeNumber: true, airDate: true, summaryShort: true, status: true, contentType: true } },
      episodeB: { select: { id: true, title: true, slug: true, episodeNumber: true, airDate: true, summaryShort: true, status: true, contentType: true } },
    },
    take: limit,
  });

  const explicitEps = explicit.map((r) =>
    r.episodeAId === episodeId ? r.episodeB : r.episodeA
  );

  if (explicitEps.length >= limit) return explicitEps;

  // Fallback: same series
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    select: { seriesId: true, episodeNumber: true },
  });

  if (!episode?.seriesId) return explicitEps;

  const excludeIds = [episodeId, ...explicitEps.map((e) => e.id)];
  const sameSeries = await prisma.episode.findMany({
    where: {
      seriesId: episode.seriesId,
      id: { notIn: excludeIds },
    },
    select: { id: true, title: true, slug: true, episodeNumber: true, airDate: true, summaryShort: true, status: true, contentType: true },
    orderBy: { episodeNumber: "desc" },
    take: limit - explicitEps.length,
  });

  return [...explicitEps, ...sameSeries];
}
