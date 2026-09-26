import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { NOT_REMOVED_LORE } from "@/lib/lore/removed-lore";

/** Card-shaped episode fields — the only ones a topic page renders. The old
 *  `include: { episode: true }` pulled every column for every linked episode,
 *  which is most of why /topics/tarot-readings shipped ~1 MB of HTML
 *  (2026-08 audit). */
const TOPIC_EPISODE_SELECT = {
  id: true,
  slug: true,
  title: true,
  episodeNumber: true,
  airDate: true,
  summaryShort: true,
  thumbnailUrl: true,
} satisfies Prisma.EpisodeSelect;

/** Linked episodes rendered before deferring to /episodes?topic=<slug>. */
export const TOPIC_EPISODES_TAKE = 100;
/** Linked people/lore rendered as chips — full rows were being loaded for
 *  every link, only four/two fields of which are ever rendered. */
export const TOPIC_PEOPLE_TAKE = 60;
export const TOPIC_LORE_TAKE = 60;

export function buildTopicInclude() {
  return {
    _count: { select: { episodes: true, people: true, lore: true } },
    episodes: {
      select: { episode: { select: TOPIC_EPISODE_SELECT } },
      orderBy: { episode: { airDate: "desc" } },
      take: TOPIC_EPISODES_TAKE,
    },
    people: {
      select: {
        person: {
          select: { displayName: true, slug: true, avatarUrl: true, personType: true },
        },
      },
      take: TOPIC_PEOPLE_TAKE,
    },
    lore: {
      where: { loreEntry: NOT_REMOVED_LORE },
      select: { loreEntry: { select: { title: true, slug: true } } },
      take: TOPIC_LORE_TAKE,
    },
  } satisfies Prisma.TopicInclude;
}

export function buildTopicCountInclude() {
  return {
    _count: { select: { episodes: true, people: true, lore: true } },
  } satisfies Prisma.TopicInclude;
}

export type TopicSort = "episodes" | "az" | "za";

/**
 * Sorting happens in the database. It used to happen in the page, AFTER an
 * alphabetical page of 50 had been fetched — so "Most Connected" only
 * re-ordered the A-block ("AI", "AI-generated content"…) while "tarot
 * readings" (300+ episodes) sat on page 30 (2026-09 audit, TO-01).
 */
export async function getTopics(options?: {
  take?: number;
  skip?: number;
  sort?: TopicSort;
}) {
  const { take = 50, skip = 0, sort = "az" } = options ?? {};

  const orderBy: Prisma.TopicOrderByWithRelationInput[] =
    sort === "episodes"
      ? [{ episodes: { _count: "desc" } }, { title: "asc" }]
      : [{ title: sort === "za" ? "desc" : "asc" }];

  return prisma.topic.findMany({
    include: buildTopicCountInclude(),
    orderBy,
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
