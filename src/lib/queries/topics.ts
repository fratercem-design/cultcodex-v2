import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export function buildTopicInclude() {
  return {
    episodes: { include: { episode: true } },
    people: { include: { person: true } },
    lore: { include: { loreEntry: true } },
  } satisfies Prisma.TopicInclude;
}

export async function getTopics(options?: {
  take?: number;
  skip?: number;
}) {
  const { take = 50, skip = 0 } = options ?? {};

  return prisma.topic.findMany({
    include: buildTopicInclude(),
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
