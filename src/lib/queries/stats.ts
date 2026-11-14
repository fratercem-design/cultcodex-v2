import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

// ─── Single source of truth for all archive counts ────────────────────────────
//
// Replaces two drifting functions (getArchiveCounts + getArchiveStats):
//   - getArchiveCounts was fast/cached but partial (no hours, segments, lore, quotes)
//   - getArchiveStats was complete but uncached and expensive (fetched all duration
//     strings into Node to parse)
//
// getCounts() does everything in ONE round-trip. Hours are computed in Postgres
// via a CASE expression so no rows are transferred for parsing. The result is
// cached for 5 minutes under the "archive-counts" tag.
//
// Consumers: root layout (sidebar badges + statusbar), homepage, premium page,
// and any future page that needs archive stats. Add revalidateTag("archive-counts")
// wherever new episodes or transcripts are written to the DB.

export interface SiteCounts {
  // Core archive sizes
  episodes: number;
  segments: number;
  people: number;
  topics: number;
  lore: number;
  quotes: number;
  // Derived
  totalHours: number;
  transcribedEpisodes: number;
  transcribedPct: number; // 0-100, rounded integer
}

// Back-compat alias used by TerminalSidebar's imported type.
// The sidebar reads episodes / topics / people / transcribedEpisodes — all
// present on SiteCounts — so the alias is structurally compatible.
export type ArchiveCounts = SiteCounts;

interface CountsRow {
  episodes: number;
  segments: number;
  people: number;
  topics: number;
  lore: number;
  quotes: number;
  transcribed: number;
  hours: number;
}

async function fetchCountsFromDB(): Promise<SiteCounts> {
  // ONE query on ONE connection. This used to be eight queries under
  // Promise.all, which took every connection in the five-connection pool at
  // once, including an exact count(*) over TranscriptSegment (millions of rows
  // carrying embeddings). Whenever that revalidation failed, the next request
  // started it again. On 2026-11-11 and 2026-11-14 production logged a run of
  // "timeout exceeded when trying to connect" errors on this key while
  // /episodes took 15 s and episode pages returned 500.
  //
  // The segment total is the planner's estimate (pg_class.reltuples, kept
  // current by autovacuum); it is shown rounded and does not need to be exact.
  // Hours are computed in Postgres from "HH:MM:SS" / "MM:SS" durations.
  const [row] = await prisma.$queryRaw<[CountsRow]>`
    SELECT
      (SELECT count(*) FROM "Episode")::int                                     AS episodes,
      (SELECT GREATEST(reltuples, 0)::bigint FROM pg_class
         WHERE oid = '"TranscriptSegment"'::regclass)::int                      AS segments,
      (SELECT count(*) FROM "Person")::int                                      AS people,
      (SELECT count(*) FROM "Topic")::int                                       AS topics,
      (SELECT count(*) FROM "LoreEntry")::int                                   AS lore,
      (SELECT count(*) FROM "Quote")::int                                       AS quotes,
      (SELECT count(*) FROM "Episode" e
         WHERE EXISTS (SELECT 1 FROM "TranscriptSegment" t WHERE t."episodeId" = e.id))::int AS transcribed,
      (SELECT COALESCE(SUM(
         CASE
           WHEN duration ~ '^\\d+:\\d{2}:\\d{2}$' THEN
             split_part(duration,':',1)::int * 3600 +
             split_part(duration,':',2)::int * 60  +
             split_part(duration,':',3)::int
           WHEN duration ~ '^\\d+:\\d{2}$' THEN
             split_part(duration,':',1)::int * 60 +
             split_part(duration,':',2)::int
           ELSE 0
         END
       ), 0) / 3600 FROM "Episode")::float8                                     AS hours
  `;

  const episodes = Number(row?.episodes ?? 0);
  const transcribedEpisodes = Number(row?.transcribed ?? 0);
  return {
    episodes,
    segments: Number(row?.segments ?? 0),
    people: Number(row?.people ?? 0),
    topics: Number(row?.topics ?? 0),
    lore: Number(row?.lore ?? 0),
    quotes: Number(row?.quotes ?? 0),
    totalHours: Number(row?.hours ?? 0),
    transcribedEpisodes,
    transcribedPct: episodes > 0 ? Math.round((transcribedEpisodes / episodes) * 100) : 0,
  };
}

/**
 * Cached archive counts — single source of truth for all stat displays.
 *
 * Cache key:  "archive-counts-v2"  (bumped from v1 to bust the old partial shape)
 * Tag:        "archive-counts"
 * Revalidate: 300 s (5 min) — call revalidateTag("archive-counts") on ingest
 *             to bust immediately when new episodes arrive.
 */
export const getCounts = unstable_cache(
  fetchCountsFromDB,
  ["archive-counts-v2"],
  { revalidate: 300, tags: ["archive-counts"] }
);

/**
 * getCounts() for display: null when the archive can't be read.
 *
 * A failed query and an archive reporting zero episodes are treated the same.
 * The archive is never empty in production, so zero means the app is reading
 * an unreachable or wrong database — and showing "0 episodes" as the archive's
 * size is worse than saying it is unavailable (2026-09-25 audit).
 */
export async function getCountsOrNull(): Promise<SiteCounts | null> {
  const counts = await getCounts().catch(() => null);
  return counts && counts.episodes > 0 ? counts : null;
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

/** Format a number with locale commas: 2600 → "2,600" */
export function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

/** Format with a trailing plus: 2600 → "2,600+" */
export function fmtPlus(n: number): string {
  return `${n.toLocaleString("en-US")}+`;
}

/**
 * Floor used for marketing copy when the live count is unavailable.
 * The Xata branch hibernates on low traffic and every getCounts() call site
 * falls back to `episodes: 0`, so copy must never interpolate the raw value —
 * "0+ episodes" is worse than a stale string. Bump this when the archive
 * comfortably clears the next thousand.
 */
export const EPISODE_COUNT_COPY_FLOOR = 3000;

/**
 * Episode count for user-facing copy, metadata, OG images and feeds.
 * Uses the exact live number — precision is the selling point for an archive —
 * and degrades to a conservative "3,000+" only when the DB is unreachable.
 */
export function fmtEpisodeCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return `${EPISODE_COUNT_COPY_FLOOR.toLocaleString()}+`;
  return n.toLocaleString();
}

/** Format as a percentage string: 58 → "58%" */
export function fmtPct(n: number): string {
  return `${n}%`;
}

// ─── Kept helpers (unchanged) ─────────────────────────────────────────────────
// These are used by individual hub pages and don't need to move.

// Cached like getCounts(): /episodes reads its query string, so it renders per
// request, and these four queries ran on every page view of the list.
// unstable_cache serializes its return value, so the dates travel as ISO strings.
async function fetchEpisodeAggregatesFromDB() {
  const [total, earliest, latest, guestCount] = await Promise.all([
    prisma.episode.count(),
    prisma.episode.findFirst({
      where: { airDate: { not: null } },
      orderBy: { airDate: "asc" },
      select: { airDate: true },
    }),
    prisma.episode.findFirst({
      where: { airDate: { not: null } },
      orderBy: { airDate: "desc" },
      select: { airDate: true },
    }),
    prisma.episodeGuest.count(),
  ]);

  return {
    total,
    earliestDate: earliest?.airDate?.toISOString() ?? null,
    latestDate: latest?.airDate?.toISOString() ?? null,
    totalGuests: guestCount,
  };
}

const getEpisodeAggregatesCached = unstable_cache(
  fetchEpisodeAggregatesFromDB,
  ["episode-aggregates"],
  { revalidate: 300, tags: ["archive-counts"] }
);

export async function getEpisodeAggregates() {
  const aggregates = await getEpisodeAggregatesCached();
  return {
    ...aggregates,
    earliestDate: aggregates.earliestDate ? new Date(aggregates.earliestDate) : null,
    latestDate: aggregates.latestDate ? new Date(aggregates.latestDate) : null,
  };
}

export async function getPeopleAggregates() {
  const [total, hosts, recurring, guests, mentioned] = await Promise.all([
    prisma.person.count(),
    prisma.person.count({ where: { personType: "host" } }),
    prisma.person.count({ where: { personType: "recurring" } }),
    prisma.person.count({ where: { personType: "guest" } }),
    prisma.person.count({ where: { personType: "mentioned" } }),
  ]);

  return { total, hosts, recurring, guests, mentioned };
}

export async function getLoreAggregates() {
  const [total, canonical, speculative, communityMyth] = await Promise.all([
    prisma.loreEntry.count(),
    prisma.loreEntry.count({ where: { canonStatus: "canonical" } }),
    prisma.loreEntry.count({ where: { canonStatus: "speculative" } }),
    prisma.loreEntry.count({ where: { canonStatus: "community_myth" } }),
  ]);

  return { total, canonical, speculative, communityMyth };
}

export async function getTopicAggregates() {
  const [total, linkedEpisodes] = await Promise.all([
    prisma.topic.count(),
    prisma.episodeTopic.count(),
  ]);

  return { total, linkedEpisodes };
}

export async function getSeriesAggregates() {
  const [total, totalEpisodes] = await Promise.all([
    prisma.series.count(),
    prisma.episode.count({ where: { seriesId: { not: null } } }),
  ]);

  return { total, totalEpisodes };
}

/**
 * Most recent updatedAt across core archive tables.
 *
 * None of Episode/Person/Quote/Topic/LoreEntry has an index on updatedAt, so this
 * is 5 full-table sorts on every call — cheap to cache, expensive to run per-request.
 * Cached like getCounts() above; same "archive-counts" tag so both refresh together
 * once ingestion wires up revalidateTag.
 *
 * unstable_cache serializes its return value, so Dates come back as ISO strings —
 * the cached fetcher returns a string, and the public function converts it back to
 * a Date for callers (episodes/people/topics/lore/quotes glance bars).
 */
async function fetchArchiveLastUpdatedFromDB(): Promise<string | null> {
  const [ep, person, quote, topic, lore] = await Promise.all([
    prisma.episode.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    prisma.person.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    prisma.quote.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    prisma.topic.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    prisma.loreEntry.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
  ]);

  const dates = [ep?.updatedAt, person?.updatedAt, quote?.updatedAt, topic?.updatedAt, lore?.updatedAt]
    .filter((d): d is Date => d != null);

  if (dates.length === 0) return null;
  return dates.reduce((latest, d) => (d > latest ? d : latest)).toISOString();
}

const getArchiveLastUpdatedCached = unstable_cache(
  fetchArchiveLastUpdatedFromDB,
  ["archive-last-updated"],
  { revalidate: 300, tags: ["archive-counts"] }
);

export async function getArchiveLastUpdated(): Promise<Date | null> {
  const iso = await getArchiveLastUpdatedCached();
  return iso ? new Date(iso) : null;
}
