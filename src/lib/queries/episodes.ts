import { prisma } from "@/lib/db";
import type { Prisma, ContentStatus } from "@/generated/prisma/client";

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
  status: ContentStatus;
  guestNames: string[];
  topicNames: string[];
}

export function formatEpisodeForCard(episode: EpisodeWithRelations): EpisodeCardData {
  return {
    id: episode.id,
    title: episode.title,
    slug: episode.slug,
    episodeNumber: episode.episodeNumber,
    airDate: episode.airDate,
    summaryShort: episode.summaryShort,
    status: episode.status,
    guestNames: episode.guests.map((g) => g.person.displayName),
    topicNames: episode.topics.map((t) => t.topic.title),
  };
}

export async function getEpisodes(options?: {
  status?: ContentStatus;
  take?: number;
  skip?: number;
  orderBy?: "airDate" | "episodeNumber";
  order?: "asc" | "desc";
}) {
  const {
    status = "published",
    take = 20,
    skip = 0,
    orderBy = "episodeNumber",
    order = "desc",
  } = options ?? {};

  return prisma.episode.findMany({
    where: { status },
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
