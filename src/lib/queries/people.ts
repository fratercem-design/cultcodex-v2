import { prisma } from "@/lib/db";
import type { Prisma, PersonType } from "@/generated/prisma/client";

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
