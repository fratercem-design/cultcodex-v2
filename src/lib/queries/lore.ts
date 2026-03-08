import { prisma } from "@/lib/db";
import type { Prisma, CanonStatus } from "@/generated/prisma/client";

export function buildLoreInclude() {
  return {
    firstMentionEpisode: true,
    episodes: { include: { episode: true } },
    people: { include: { person: true } },
    topics: { include: { topic: true } },
  } satisfies Prisma.LoreEntryInclude;
}

export async function getLoreEntries(options?: {
  canon?: CanonStatus;
  category?: string;
  take?: number;
  skip?: number;
}) {
  const { canon, category, take = 50, skip = 0 } = options ?? {};

  return prisma.loreEntry.findMany({
    where: {
      ...(canon ? { canonStatus: canon } : {}),
      ...(category ? { category } : {}),
    },
    include: buildLoreInclude(),
    orderBy: { title: "asc" },
    take,
    skip,
  });
}

export async function getLoreBySlug(slug: string) {
  return prisma.loreEntry.findUnique({
    where: { slug },
    include: buildLoreInclude(),
  });
}
