import { prisma } from "@/lib/db";
import type { ContentStatus } from "@/generated/prisma/client";

// ── Result types ────────────────────────────────────────────────────

export interface SearchResultEpisode {
  id: string;
  title: string;
  slug: string;
  episodeNumber: number | null;
  airDate: Date | null;
  summaryShort: string | null;
  status: ContentStatus;
}

export interface SearchResultPerson {
  id: string;
  displayName: string;
  slug: string;
  shortBio: string | null;
  personType: string;
}

export interface SearchResultLore {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  category: string | null;
  canonStatus: string;
}

export interface GlobalSearchResults {
  query: string;
  episodes: SearchResultEpisode[];
  people: SearchResultPerson[];
  lore: SearchResultLore[];
  totalCount: number;
  /** Total matches per entity type (may exceed SEARCH_LIMIT). */
  episodeTotalCount: number;
  peopleTotalCount: number;
  loreTotalCount: number;
}

// ── Global search ───────────────────────────────────────────────────

const SEARCH_LIMIT = 20;

export async function globalSearch(
  rawQuery: string,
): Promise<GlobalSearchResults> {
  const query = rawQuery.trim();

  if (query.length === 0) {
    return {
      query,
      episodes: [],
      people: [],
      lore: [],
      totalCount: 0,
      episodeTotalCount: 0,
      peopleTotalCount: 0,
      loreTotalCount: 0,
    };
  }

  const [episodes, people, lore, episodeTotalCount, peopleTotalCount, loreTotalCount] =
    await Promise.all([
      searchEpisodes(query),
      searchPeople(query),
      searchLore(query),
      countEpisodes(query),
      countPeople(query),
      countLore(query),
    ]);

  return {
    query,
    episodes,
    people,
    lore,
    totalCount: episodeTotalCount + peopleTotalCount + loreTotalCount,
    episodeTotalCount,
    peopleTotalCount,
    loreTotalCount,
  };
}

// ── Per-entity search ───────────────────────────────────────────────
// Prisma `contains` + `mode: "insensitive"` maps to ILIKE %value%

async function searchEpisodes(query: string): Promise<SearchResultEpisode[]> {
  return prisma.episode.findMany({
    where: episodeWhere(query),
    select: {
      id: true, title: true, slug: true, episodeNumber: true,
      airDate: true, summaryShort: true, status: true,
    },
    orderBy: { episodeNumber: "desc" },
    take: SEARCH_LIMIT,
  });
}

async function searchPeople(query: string): Promise<SearchResultPerson[]> {
  return prisma.person.findMany({
    where: personWhere(query),
    select: {
      id: true, displayName: true, slug: true, shortBio: true, personType: true,
    },
    orderBy: { displayName: "asc" },
    take: SEARCH_LIMIT,
  });
}

async function searchLore(query: string): Promise<SearchResultLore[]> {
  return prisma.loreEntry.findMany({
    where: loreWhere(query),
    select: {
      id: true, title: true, slug: true, summary: true,
      category: true, canonStatus: true,
    },
    orderBy: { title: "asc" },
    take: SEARCH_LIMIT,
  });
}

// ── Count helpers (run in parallel with search) ────────────────────

function episodeWhere(query: string) {
  return {
    status: "published" as const,
    OR: [
      { title: { contains: query, mode: "insensitive" as const } },
      { slug: { contains: query, mode: "insensitive" as const } },
      { summaryShort: { contains: query, mode: "insensitive" as const } },
      { searchText: { contains: query, mode: "insensitive" as const } },
    ],
  };
}

function personWhere(query: string) {
  return {
    OR: [
      { displayName: { contains: query, mode: "insensitive" as const } },
      { slug: { contains: query, mode: "insensitive" as const } },
      { shortBio: { contains: query, mode: "insensitive" as const } },
      { searchText: { contains: query, mode: "insensitive" as const } },
    ],
  };
}

function loreWhere(query: string) {
  return {
    OR: [
      { title: { contains: query, mode: "insensitive" as const } },
      { slug: { contains: query, mode: "insensitive" as const } },
      { summary: { contains: query, mode: "insensitive" as const } },
      { searchText: { contains: query, mode: "insensitive" as const } },
    ],
  };
}

async function countEpisodes(query: string): Promise<number> {
  return prisma.episode.count({ where: episodeWhere(query) });
}

async function countPeople(query: string): Promise<number> {
  return prisma.person.count({ where: personWhere(query) });
}

async function countLore(query: string): Promise<number> {
  return prisma.loreEntry.count({ where: loreWhere(query) });
}
