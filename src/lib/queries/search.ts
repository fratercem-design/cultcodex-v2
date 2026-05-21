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

export interface SearchResultTopic {
  id: string;
  title: string;
  slug: string;
  description: string | null;
}

export interface SearchResultQuote {
  id: string;
  text: string;
  speakerName: string | null;
  episodeTitle: string | null;
  episodeSlug: string | null;
}

export interface SearchResultTranscript {
  id: string;
  text: string;
  speakerLabel: string | null;
  startSeconds: number;
  episodeTitle: string;
  episodeSlug: string;
  episodeNumber: number | null;
}

export interface SearchFilters {
  entityTypes?: string[];   // which entity types to search
  contentType?: string;     // filter episodes by contentType
  seriesSlug?: string;      // filter episodes by series
  hasTranscript?: boolean;  // filter episodes with/without transcripts
  dateFrom?: string;        // ISO date string
  dateTo?: string;          // ISO date string
}

export interface GlobalSearchResults {
  query: string;
  episodes: SearchResultEpisode[];
  people: SearchResultPerson[];
  lore: SearchResultLore[];
  topics: SearchResultTopic[];
  quotes: SearchResultQuote[];
  transcripts: SearchResultTranscript[];
  totalCount: number;
  /** Total matches per entity type (may exceed SEARCH_LIMIT). */
  episodeTotalCount: number;
  peopleTotalCount: number;
  loreTotalCount: number;
  topicsTotalCount: number;
  quotesTotalCount: number;
  transcriptsTotalCount: number;
}

// ── Global search ───────────────────────────────────────────────────

const SEARCH_LIMIT = 20;

export async function globalSearch(
  rawQuery: string,
  filters?: SearchFilters,
): Promise<GlobalSearchResults> {
  const query = rawQuery.trim();

  if (query.length === 0) {
    return {
      query,
      episodes: [],
      people: [],
      lore: [],
      topics: [],
      quotes: [],
      transcripts: [],
      totalCount: 0,
      episodeTotalCount: 0,
      peopleTotalCount: 0,
      loreTotalCount: 0,
      topicsTotalCount: 0,
      quotesTotalCount: 0,
      transcriptsTotalCount: 0,
    };
  }

  const types = filters?.entityTypes;
  const shouldSearch = (t: string) => !types || types.length === 0 || types.includes(t);

  const [episodes, people, lore, topics, quotes, transcripts, episodeTotalCount, peopleTotalCount, loreTotalCount, topicsTotalCount, quotesTotalCount, transcriptsTotalCount] =
    await Promise.all([
      shouldSearch("episodes") ? searchEpisodes(query, filters) : Promise.resolve([] as SearchResultEpisode[]),
      shouldSearch("people") ? searchPeople(query) : Promise.resolve([] as SearchResultPerson[]),
      shouldSearch("lore") ? searchLore(query) : Promise.resolve([] as SearchResultLore[]),
      shouldSearch("topics") ? searchTopics(query) : Promise.resolve([] as SearchResultTopic[]),
      shouldSearch("quotes") ? searchQuotes(query) : Promise.resolve([] as SearchResultQuote[]),
      shouldSearch("transcripts") ? searchTranscripts(query) : Promise.resolve([] as SearchResultTranscript[]),
      shouldSearch("episodes") ? countEpisodes(query, filters) : Promise.resolve(0),
      shouldSearch("people") ? countPeople(query) : Promise.resolve(0),
      shouldSearch("lore") ? countLore(query) : Promise.resolve(0),
      shouldSearch("topics") ? countTopics(query) : Promise.resolve(0),
      shouldSearch("quotes") ? countQuotes(query) : Promise.resolve(0),
      shouldSearch("transcripts") ? countTranscripts(query) : Promise.resolve(0),
    ]);

  return {
    query,
    episodes,
    people,
    lore,
    topics,
    quotes,
    transcripts,
    totalCount: episodeTotalCount + peopleTotalCount + loreTotalCount + topicsTotalCount + quotesTotalCount + transcriptsTotalCount,
    episodeTotalCount,
    peopleTotalCount,
    loreTotalCount,
    topicsTotalCount,
    quotesTotalCount,
    transcriptsTotalCount,
  };
}

// ── Per-entity search ───────────────────────────────────────────────
// Prisma `contains` + `mode: "insensitive"` maps to ILIKE %value%

async function searchEpisodes(query: string, filters?: SearchFilters): Promise<SearchResultEpisode[]> {
  const select = { id: true, title: true, slug: true, episodeNumber: true, airDate: true, summaryShort: true, status: true } as const;
  const baseFilters = episodeBaseFilters(filters);

  // Tiered search: exact title → title contains → summary → broad searchText
  const [exactTitle, titleContains, summaryMatch, broadMatch] = await Promise.all([
    prisma.episode.findMany({
      where: { ...baseFilters, title: { equals: query, mode: "insensitive" } },
      select,
      take: SEARCH_LIMIT,
    }),
    prisma.episode.findMany({
      where: { ...baseFilters, title: { contains: query, mode: "insensitive" } },
      select,
      orderBy: { airDate: "desc" },
      take: SEARCH_LIMIT,
    }),
    prisma.episode.findMany({
      where: {
        ...baseFilters,
        OR: [
          { summaryShort: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
        ],
      },
      select,
      orderBy: { airDate: "desc" },
      take: SEARCH_LIMIT,
    }),
    prisma.episode.findMany({
      where: {
        ...baseFilters,
        searchText: { contains: query, mode: "insensitive" },
      },
      select,
      orderBy: { airDate: "desc" },
      take: SEARCH_LIMIT,
    }),
  ]);

  // Merge in priority order: exact title → title contains → summary → searchText
  const seen = new Set<string>();
  const results: SearchResultEpisode[] = [];
  for (const ep of [...exactTitle, ...titleContains, ...summaryMatch, ...broadMatch]) {
    if (!seen.has(ep.id)) { seen.add(ep.id); results.push(ep); }
    if (results.length >= SEARCH_LIMIT) break;
  }
  return results;
}

// Person type priority for search ranking (higher = shown first)
const PERSON_TYPE_PRIORITY: Record<string, number> = {
  host: 4,
  recurring: 3,
  guest: 2,
  mentioned: 1,
};

async function searchPeople(query: string): Promise<SearchResultPerson[]> {
  // Exact name matches first, then partial matches
  const [exact, partial] = await Promise.all([
    prisma.person.findMany({
      where: { displayName: { equals: query, mode: "insensitive" } },
      select: { id: true, displayName: true, slug: true, shortBio: true, personType: true },
      take: 5,
    }),
    prisma.person.findMany({
      where: personWhere(query),
      select: { id: true, displayName: true, slug: true, shortBio: true, personType: true },
      orderBy: { displayName: "asc" },
      take: SEARCH_LIMIT * 2, // Fetch extra to allow re-ranking
    }),
  ]);

  // Merge then re-rank: exact matches first, then by person type priority
  const seen = new Set<string>();
  const exactResults: SearchResultPerson[] = [];
  const partialResults: SearchResultPerson[] = [];

  for (const p of exact) {
    if (!seen.has(p.id)) { seen.add(p.id); exactResults.push(p); }
  }
  for (const p of partial) {
    if (!seen.has(p.id)) { seen.add(p.id); partialResults.push(p); }
  }

  // Sort partial results by person type priority (hosts first, mentioned last)
  partialResults.sort((a, b) =>
    (PERSON_TYPE_PRIORITY[b.personType] ?? 0) - (PERSON_TYPE_PRIORITY[a.personType] ?? 0)
  );

  return [...exactResults, ...partialResults].slice(0, SEARCH_LIMIT);
}

async function searchLore(query: string): Promise<SearchResultLore[]> {
  // Exact title matches first, then partial matches
  const [exact, partial] = await Promise.all([
    prisma.loreEntry.findMany({
      where: { title: { equals: query, mode: "insensitive" } },
      select: { id: true, title: true, slug: true, summary: true, category: true, canonStatus: true },
      take: 5,
    }),
    prisma.loreEntry.findMany({
      where: loreWhere(query),
      select: { id: true, title: true, slug: true, summary: true, category: true, canonStatus: true },
      orderBy: { title: "asc" },
      take: SEARCH_LIMIT,
    }),
  ]);
  const seen = new Set<string>();
  const results: SearchResultLore[] = [];
  for (const l of [...exact, ...partial]) {
    if (!seen.has(l.id)) { seen.add(l.id); results.push(l); }
    if (results.length >= SEARCH_LIMIT) break;
  }
  return results;
}

async function searchTopics(query: string): Promise<SearchResultTopic[]> {
  // Exact matches first, then partial
  const [exact, partial] = await Promise.all([
    prisma.topic.findMany({
      where: { title: { equals: query, mode: "insensitive" } },
      select: { id: true, title: true, slug: true, description: true },
      take: 5,
    }),
    prisma.topic.findMany({
      where: topicWhere(query),
      select: { id: true, title: true, slug: true, description: true },
      orderBy: { title: "asc" },
      take: SEARCH_LIMIT,
    }),
  ]);
  const seen = new Set<string>();
  const results: SearchResultTopic[] = [];
  for (const t of [...exact, ...partial]) {
    if (!seen.has(t.id)) { seen.add(t.id); results.push(t); }
    if (results.length >= SEARCH_LIMIT) break;
  }
  return results;
}

async function searchQuotes(query: string): Promise<SearchResultQuote[]> {
  const quotes = await prisma.quote.findMany({
    where: { text: { contains: query, mode: "insensitive" } },
    select: {
      id: true,
      text: true,
      speaker: { select: { displayName: true } },
      episode: { select: { title: true, slug: true } },
    },
    take: SEARCH_LIMIT,
  });
  return quotes.map((q) => ({
    id: q.id,
    text: q.text,
    speakerName: q.speaker?.displayName ?? null,
    episodeTitle: q.episode?.title ?? null,
    episodeSlug: q.episode?.slug ?? null,
  }));
}

// ── Where-clause helpers ────────────────────────────────────────────

/** Base filters without query text — used by tiered search and count */
function episodeBaseFilters(filters?: SearchFilters) {
  const where: Record<string, unknown> = {};

  if (filters?.contentType) {
    where.contentType = filters.contentType;
  }
  if (filters?.seriesSlug) {
    where.series = { slug: filters.seriesSlug };
  }
  if (filters?.hasTranscript === true) {
    where.segments = { some: {} };
  } else if (filters?.hasTranscript === false) {
    where.segments = { none: {} };
  }
  if (filters?.dateFrom || filters?.dateTo) {
    const airDateFilter: Record<string, Date> = {};
    if (filters.dateFrom) airDateFilter.gte = new Date(filters.dateFrom);
    if (filters.dateTo) airDateFilter.lte = new Date(filters.dateTo);
    where.airDate = airDateFilter;
  }

  return where;
}

/** Full episode where clause with text query — used by count */
function episodeWhere(query: string, filters?: SearchFilters) {
  return {
    ...episodeBaseFilters(filters),
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
      { altNames: { has: query } },
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

function topicWhere(query: string) {
  return {
    OR: [
      { title: { contains: query, mode: "insensitive" as const } },
      { description: { contains: query, mode: "insensitive" as const } },
    ],
  };
}

// ── Count helpers (run in parallel with search) ────────────────────

async function countEpisodes(query: string, filters?: SearchFilters): Promise<number> {
  return prisma.episode.count({ where: episodeWhere(query, filters) });
}

async function countPeople(query: string): Promise<number> {
  return prisma.person.count({ where: personWhere(query) });
}

async function countLore(query: string): Promise<number> {
  return prisma.loreEntry.count({ where: loreWhere(query) });
}

async function countTopics(query: string): Promise<number> {
  return prisma.topic.count({ where: topicWhere(query) });
}

async function countQuotes(query: string): Promise<number> {
  return prisma.quote.count({
    where: { text: { contains: query, mode: "insensitive" } },
  });
}

// ── Transcript search ──────────────────────────────────────────────
// Fetches a larger pool then deduplicated by episode — shows the best
// snippet per episode so results span multiple episodes rather than
// returning 20 lines from the same video.

async function searchTranscripts(query: string): Promise<SearchResultTranscript[]> {
  const segments = await prisma.transcriptSegment.findMany({
    where: { text: { contains: query, mode: "insensitive" } },
    select: {
      id: true,
      text: true,
      speakerLabel: true,
      startSeconds: true,
      episode: { select: { title: true, slug: true, episodeNumber: true, status: true } },
    },
    orderBy: { startSeconds: "asc" },
    take: SEARCH_LIMIT * 10, // wide pool to pick the best per episode
  });

  // Keep at most 2 results per episode (different positions), up to SEARCH_LIMIT total
  const perEpisode = new Map<string, number>();
  const results: SearchResultTranscript[] = [];
  for (const s of segments) {
    const count = perEpisode.get(s.episode.slug) ?? 0;
    if (count >= 2) continue;
    perEpisode.set(s.episode.slug, count + 1);
    results.push({
      id: s.id,
      text: s.text,
      speakerLabel: s.speakerLabel,
      startSeconds: s.startSeconds,
      episodeTitle: s.episode.title,
      episodeSlug: s.episode.slug,
      episodeNumber: s.episode.episodeNumber,
    });
    if (results.length >= SEARCH_LIMIT) break;
  }
  return results;
}

async function countTranscripts(query: string): Promise<number> {
  return prisma.transcriptSegment.count({
    where: {
      text: { contains: query, mode: "insensitive" },
    },
  });
}
