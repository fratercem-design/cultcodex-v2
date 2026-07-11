import { prisma } from "@/lib/db";
import { NOISE_PERSON_SLUGS } from "@/lib/people/noise-slugs";
import type { Prisma, PersonType } from "@/generated/prisma/client";

const EPISODE_CARD_SELECT = {
  id: true,
  slug: true,
  title: true,
  episodeNumber: true,
  airDate: true,
  summaryShort: true,
  thumbnailUrl: true,
} satisfies Prisma.EpisodeSelect;

export function buildPersonInclude() {
  return {
    firstAppearanceEpisode: { select: { airDate: true } },
    guestAppearances: {
      select: { episode: { select: EPISODE_CARD_SELECT } },
      orderBy: { episode: { airDate: "desc" } },
    },
    mentions: {
      select: { episode: { select: EPISODE_CARD_SELECT } },
      orderBy: { episode: { airDate: "desc" } },
      take: 200,
    },
    topics: { include: { topic: true } },
    loreConnections: { include: { loreEntry: true } },
    quotes: {
      select: {
        id: true,
        text: true,
        timestampSeconds: true,
        episode: { select: { id: true } },
      },
    },
  } satisfies Prisma.PersonInclude;
}

/** Build a Prisma where-clause that returns only "profiled" people.
 *  Hosts and recurring are always included; guests only if they have a bio or lore summary.
 *  `mentioned` type is intentionally excluded — they appear in getSpecialMentions(). */
function profiledWhere(type?: PersonType): Prisma.PersonWhereInput {
  const notNoise = { slug: { notIn: [...NOISE_PERSON_SLUGS] } };
  if (type === "host" || type === "recurring") return { personType: type, ...notNoise };
  if (type === "guest") {
    return {
      personType: "guest",
      OR: [{ shortBio: { not: null } }, { loreSummary: { not: null } }],
      ...notNoise,
    };
  }
  // No type filter → hosts + recurring + profiled guests
  return {
    AND: [
      notNoise,
      {
        OR: [
          { personType: "host" },
          { personType: "recurring" },
          {
            personType: "guest",
            OR: [{ shortBio: { not: null } }, { loreSummary: { not: null } }],
          },
        ],
      },
    ],
  };
}

export async function getPeople(options?: {
  type?: PersonType;
  take?: number;
  skip?: number;
}) {
  const { type, take = 50, skip = 0 } = options ?? {};

  return prisma.person.findMany({
    where: profiledWhere(type),
    include: buildPersonInclude(),
    orderBy: { displayName: "asc" },
    take,
    skip,
  });
}

export async function getPersonCount(type?: PersonType) {
  return prisma.person.count({ where: profiledWhere(type) });
}

/** Compact data for the Special Mentions strip — celebrities, one-offs, name-drops. */
export async function getSpecialMentions() {
  return prisma.person.findMany({
    where: {
      slug: { notIn: [...NOISE_PERSON_SLUGS] },
      OR: [
        { personType: "mentioned" },
        { personType: "guest", shortBio: null, loreSummary: null },
      ],
    },
    select: {
      id: true,
      displayName: true,
      slug: true,
      personType: true,
      _count: { select: { guestAppearances: true, mentions: true } },
    },
    orderBy: { displayName: "asc" },
  }).catch(() => []);
}

export async function getPersonBySlug(slug: string) {
  return prisma.person.findUnique({
    where: { slug },
    include: buildPersonInclude(),
  });
}

export async function getCoAppearances(personId: string, limit = 6) {
  // Get episode IDs where this person appears as a guest (cap at 100 most recent)
  const appearances = await prisma.episodeGuest.findMany({
    where: { personId },
    select: { episodeId: true },
    take: 100,
    orderBy: { episode: { airDate: "desc" } },
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
