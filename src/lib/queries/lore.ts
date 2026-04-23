import { prisma } from "@/lib/db";
import type { Prisma, CanonStatus } from "@/generated/prisma/client";

/** Lean card data for lore section displays. */
export type LoreCard = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  summary: string | null;
  canonStatus: CanonStatus;
  episodeCount: number;
  personCount: number;
};

/** Fetch top N lore entries per canonStatus, ordered by most-connected. */
export async function getLoreByCanon(
  canon: CanonStatus,
  limit = 8,
): Promise<LoreCard[]> {
  const rows = await prisma.loreEntry.findMany({
    where: { canonStatus: canon },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      summary: true,
      canonStatus: true,
      _count: { select: { episodes: true, people: true } },
    },
    orderBy: { episodes: { _count: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({
    ...r,
    episodeCount: r._count.episodes,
    personCount: r._count.people,
  }));
}

/** Counts per canonStatus for section headers. */
export async function getLoreCanonCounts(): Promise<Record<string, number>> {
  const groups = await prisma.loreEntry.groupBy({
    by: ["canonStatus"],
    _count: { _all: true },
  });
  return groups.reduce(
    (acc, g) => ({ ...acc, [g.canonStatus]: g._count._all }),
    {} as Record<string, number>,
  );
}

export function buildLoreInclude() {
  return {
    firstMentionEpisode: true,
    episodes: { include: { episode: true } },
    people: { include: { person: true } },
    topics: { include: { topic: true } },
    relatedFrom: { include: { loreB: true } },
    relatedTo: { include: { loreA: true } },
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

export async function getLoreCount(options?: {
  canon?: CanonStatus;
  category?: string;
}) {
  const { canon, category } = options ?? {};
  return prisma.loreEntry.count({
    where: {
      ...(canon ? { canonStatus: canon } : {}),
      ...(category ? { category } : {}),
    },
  });
}

export async function getLoreBySlug(slug: string) {
  return prisma.loreEntry.findUnique({
    where: { slug },
    include: buildLoreInclude(),
  });
}
