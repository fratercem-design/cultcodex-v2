import { prisma } from "@/lib/db";
import type { Prisma, PersonType } from "@/generated/prisma/client";

/** Lean card data — no heavy nested relations. */
export type PersonCard = {
  id: string;
  displayName: string;
  slug: string;
  shortBio: string | null;
  avatarUrl: string | null;
  personType: PersonType;
  appearanceCount: number;
};

/** Fetch top N people per type, ordered by appearance count descending. */
export async function getPeopleByType(
  type: PersonType,
  limit = 8,
): Promise<PersonCard[]> {
  const rows = await prisma.person.findMany({
    where: { personType: type },
    select: {
      id: true,
      displayName: true,
      slug: true,
      shortBio: true,
      avatarUrl: true,
      personType: true,
      _count: { select: { guestAppearances: true, mentions: true } },
    },
    orderBy: { guestAppearances: { _count: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({
    ...r,
    appearanceCount: r._count.guestAppearances + r._count.mentions,
  }));
}

/** Counts per personType for section headers. */
export async function getPeopleTypeCounts(): Promise<Record<PersonType, number>> {
  const groups = await prisma.person.groupBy({
    by: ["personType"],
    _count: { _all: true },
  });
  return groups.reduce(
    (acc, g) => ({ ...acc, [g.personType]: g._count._all }),
    {} as Record<PersonType, number>,
  );
}

export function buildPersonInclude() {
  return {
    firstAppearanceEpisode: true,
    guestAppearances: { include: { episode: true } },
    mentions: { include: { episode: true } },
    topics: { include: { topic: true } },
    loreConnections: { include: { loreEntry: true } },
    quotes: { include: { episode: true } },
  } satisfies Prisma.PersonInclude;
}

export async function getPeople(options?: {
  type?: PersonType;
  take?: number;
  skip?: number;
  letter?: string;
}) {
  const { type, take = 50, skip = 0, letter } = options ?? {};

  const where: Prisma.PersonWhereInput = {};
  if (type) where.personType = type;
  if (letter) {
    if (letter === "#") {
      // Non-letter starters: anything not A-Z
      where.NOT = { displayName: { gte: "A", lt: "[" } };
    } else {
      where.displayName = {
        startsWith: letter,
        mode: "insensitive",
      };
    }
  }

  return prisma.person.findMany({
    where,
    include: buildPersonInclude(),
    orderBy: { displayName: "asc" },
    take,
    skip,
  });
}

export async function getPersonCount(type?: PersonType, letter?: string) {
  const where: Prisma.PersonWhereInput = {};
  if (type) where.personType = type;
  if (letter) {
    if (letter === "#") {
      where.NOT = { displayName: { gte: "A", lt: "[" } };
    } else {
      where.displayName = {
        startsWith: letter,
        mode: "insensitive",
      };
    }
  }
  return prisma.person.count({ where });
}

export async function getPersonBySlug(slug: string) {
  return prisma.person.findUnique({
    where: { slug },
    include: buildPersonInclude(),
  });
}

export async function getCoAppearances(personId: string, limit = 6) {
  // Get all episode IDs where this person appears as a guest
  const appearances = await prisma.episodeGuest.findMany({
    where: { personId },
    select: { episodeId: true },
  });

  const episodeIds = appearances.map((a) => a.episodeId);

  if (episodeIds.length < 2) return [];

  // Find other people who appear in those same episodes
  const coGuests = await prisma.episodeGuest.findMany({
    where: {
      episodeId: { in: episodeIds },
      personId: { not: personId },
    },
    select: {
      personId: true,
      person: {
        select: {
          id: true,
          displayName: true,
          slug: true,
          avatarUrl: true,
        },
      },
    },
  });

  // Count shared appearances per person
  const counts = new Map<string, { person: typeof coGuests[0]["person"]; count: number }>();
  for (const g of coGuests) {
    const existing = counts.get(g.personId);
    if (existing) {
      existing.count++;
    } else {
      counts.set(g.personId, { person: g.person, count: 1 });
    }
  }

  // Sort by count descending, take top N
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((entry) => ({
      ...entry.person,
      sharedEpisodes: entry.count,
    }));
}
