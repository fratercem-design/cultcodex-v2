import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export type TopicHeat = "popular" | "active" | "niche";

export type TopicCardData = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  episodeCount: number;
  personCount: number;
  loreCount: number;
  totalConnections: number;
  heat: TopicHeat;
};

/** Fetch all topics with connection counts bucketed into heat tiers. */
export async function getTopicsWithHeat(): Promise<{
  popular: TopicCardData[];
  active: TopicCardData[];
  niche: TopicCardData[];
}> {
  const rows = await prisma.topic.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      _count: { select: { episodes: true, people: true, lore: true } },
    },
    orderBy: { episodes: { _count: "desc" } },
  });

  const popular: TopicCardData[] = [];
  const active: TopicCardData[] = [];
  const niche: TopicCardData[] = [];

  for (const r of rows) {
    const total = r._count.episodes + r._count.people + r._count.lore;
    const heat: TopicHeat =
      total >= 20 ? "popular" : total >= 5 ? "active" : "niche";
    const card: TopicCardData = {
      id: r.id,
      title: r.title,
      slug: r.slug,
      description: r.description,
      episodeCount: r._count.episodes,
      personCount: r._count.people,
      loreCount: r._count.lore,
      totalConnections: total,
      heat,
    };
    if (heat === "popular") popular.push(card);
    else if (heat === "active") active.push(card);
    else niche.push(card);
  }

  return { popular, active, niche };
}

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
