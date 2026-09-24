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

/** How many related records a person page renders before "show more" territory.
 *  Psyche has ~2,900 appearances and thousands of quotes; loading them all
 *  serialized a 13 MB RSC payload into the HTML (2026-08 audit). Totals come
 *  from `_count` so the UI still shows true numbers next to a bounded list. */
export const PERSON_APPEARANCES_TAKE = 60;
export const PERSON_MENTIONS_TAKE = 60;
export const PERSON_QUOTES_TAKE = 50;

export function buildPersonInclude() {
  return {
    _count: {
      select: {
        guestAppearances: true,
        mentions: true,
        quotes: true,
        topics: true,
        loreConnections: true,
      },
    },
    firstAppearanceEpisode: { select: { airDate: true } },
    guestAppearances: {
      select: { episode: { select: EPISODE_CARD_SELECT } },
      orderBy: { episode: { airDate: "desc" } },
      take: PERSON_APPEARANCES_TAKE,
    },
    mentions: {
      select: { episode: { select: EPISODE_CARD_SELECT } },
      orderBy: { episode: { airDate: "desc" } },
      take: PERSON_MENTIONS_TAKE,
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
      take: PERSON_QUOTES_TAKE,
    },
  } satisfies Prisma.PersonInclude;
}

/** Build a Prisma where-clause that returns only "profiled" people.
 *  Hosts and recurring are always included; guests only if they have a bio or lore summary.
 *  `mentioned` type is intentionally excluded — they appear in getSpecialMentions(). */
/** Guests must have actually appeared (≥1 linked episode) or be lore-linked.
 *  A bio alone is NOT a signal — enrichment auto-writes shortBio for nearly
 *  every record, including 130 zero-appearance stubs (2026-07 people audit),
 *  so a bio-based gate admits the whole entity dump. */
const GUEST_ELIGIBLE: Prisma.PersonWhereInput = {
  personType: "guest",
  OR: [{ guestAppearances: { some: {} } }, { loreConnections: { some: {} } }],
};

function profiledWhere(type?: PersonType): Prisma.PersonWhereInput {
  const notNoise = { slug: { notIn: [...NOISE_PERSON_SLUGS] } };
  if (type === "host" || type === "recurring") return { personType: type, ...notNoise };
  if (type === "guest") {
    return { ...GUEST_ELIGIBLE, ...notNoise };
  }
  // No type filter → hosts + recurring + guests who appeared or carry lore
  return {
    AND: [
      notNoise,
      {
        OR: [
          { personType: "host" },
          { personType: "recurring" },
          GUEST_ELIGIBLE,
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

/**
 * Lean people list for the /people directory cards. buildPersonInclude() loads
 * EVERY guest appearance and up to 200 mentions — each with a full episode card
 * select — per person, when the directory only renders scalar fields plus
 * appearance/mention COUNTS. This select fetches exactly that.
 * Use getPeople/getPersonBySlug when full relations are actually needed.
 */
export type PeopleSort = "az" | "za" | "most" | "lore";

/** DB-level orderBy per sort mode. Sorting MUST happen here, not in page
 *  code — an in-memory sort after `take`/`skip` only reorders the current
 *  page of an alphabetically-fetched slice, which is how "Most Appearances"
 *  silently showed A→Z-paged results before. */
function peopleOrderBy(sort: PeopleSort): Prisma.PersonOrderByWithRelationInput[] {
  switch (sort) {
    case "za":
      return [{ displayName: "desc" }];
    case "most":
      return [
        { guestAppearances: { _count: "desc" } },
        { mentions: { _count: "desc" } },
        { displayName: "asc" },
      ];
    case "lore":
      return [{ loreConnections: { _count: "desc" } }, { displayName: "asc" }];
    default:
      return [{ displayName: "asc" }];
  }
}

export async function getPeopleCards(options?: {
  type?: PersonType;
  take?: number;
  skip?: number;
  sort?: PeopleSort;
}) {
  const { type, take = 50, skip = 0, sort = "most" } = options ?? {};

  return prisma.person.findMany({
    where: profiledWhere(type),
    select: {
      id: true,
      displayName: true,
      slug: true,
      shortBio: true,
      loreSummary: true,
      avatarUrl: true,
      personType: true,
      _count: { select: { guestAppearances: true, mentions: true, loreConnections: true } },
    },
    orderBy: peopleOrderBy(sort),
    take,
    skip,
  });
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

/** Air dates for every episode a person appears in or is mentioned in.
 *  Dates only — this feeds the era-presence chart and the true appearance
 *  total, so those stay accurate even though the rendered episode list is
 *  capped at PERSON_APPEARANCES_TAKE. Aggregated server-side; the rows
 *  themselves are never serialized into the page payload. */
export async function getPersonEpisodeDates(
  personId: string
): Promise<(Date | null)[]> {
  const rows = await prisma.episode.findMany({
    where: {
      OR: [
        { guests: { some: { personId } } },
        { mentionedPeople: { some: { personId } } },
      ],
    },
    select: { airDate: true },
  });
  // Undated episodes are kept so the total matches /episodes?person=<slug>;
  // era bucketing skips them.
  return rows.map((r) => r.airDate);
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
