import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export function buildTopicInclude() {
  return {
    episodes: { include: { episode: true } },
    people: { include: { person: true } },
    lore: { include: { loreEntry: true } },
  } satisfies Prisma.TopicInclude;
}

export function buildTopicCountInclude() {
  return {
    _count: { select: { episodes: true, people: true, lore: true } },
  } satisfies Prisma.TopicInclude;
}

export async function getTopics(options?: {
  take?: number;
  skip?: number;
}) {
  const { take = 50, skip = 0 } = options ?? {};

  return prisma.topic.findMany({
    include: buildTopicCountInclude(),
    orderBy: { title: "asc" },
    take,
    skip,
  });
}

export async function getTopicCount() {
  return prisma.topic.count();
}

export async function getTopicBySlug(slug: string) {
  return prisma.topic.findUnique({
    where: { slug },
    include: buildTopicInclude(),
  });
}

// Find topics that most frequently share episodes with this topic.
// Used for "rabbit hole" discovery on topic pages.
export async function getRelatedTopics(topicId: string, limit = 8) {
  const episodeLinks = await prisma.episodeTopic.findMany({
    where: { topicId },
    select: { episodeId: true },
  });
  if (episodeLinks.length === 0) return [];

  const episodeIds = episodeLinks.map((e) => e.episodeId);

  const grouped = await prisma.episodeTopic.groupBy({
    by: ["topicId"],
    where: {
      episodeId: { in: episodeIds },
      topicId: { not: topicId },
    },
    _count: { topicId: true },
    orderBy: { _count: { topicId: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) return [];

  const relatedIds = grouped.map((g) => g.topicId);
  const topics = await prisma.topic.findMany({
    where: { id: { in: relatedIds } },
    select: { id: true, title: true, slug: true, description: true },
  });

  // Preserve sort order from groupBy result
  return relatedIds
    .map((id) => topics.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => !!t);
}
