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

async function fetchCountsFromDB(): Promise<SiteCounts> {
  // Run all counts in parallel; hours come from a single aggregating SQL query
  // so no episode rows are transferred across the wire.
  const [
    episodes,
    segments,
    people,
    topics,
    lore,
    quotes,
    transcribedEpisodes,
    hoursResult,
  ] = await Promise.all([
    prisma.episode.count(),
    prisma.transcriptSegment.count(),
    prisma.person.count(),
    prisma.topic.count(),
    prisma.loreEntry.count(),
    prisma.quote.count(),
    // "transcribed" = has at least one TranscriptSegment row
    prisma.episode.count({ where: { segments: { some: {} } } }),
    // Compute total hours entirely in Postgres.
    // Handles both "HH:MM:SS" and "MM:SS" formats; nulls/malformed rows → 0.
    prisma.$queryRaw<[{ hours: number }]>`
      SELECT COALESCE(SUM(
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
      ), 0) / 3600 AS hours
      FROM "Episode"
    `,
  ]);

  const totalHours = Number(hoursResult[0]?.hours ?? 0);
  const transcribedPct =
    episodes > 0 ? Math.round((transcribedEpisodes / episodes) * 100) : 0;

  return {
    episodes,
    segments,
    people,
    topics,
    lore,
    quotes,
    totalHours,
    transcribedEpisodes,
    transcribedPct,
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

// ─── Formatting helpers ───────────────────────────────────────────────────────

/** Format a number with locale commas: 2600 → "2,600" */
export function fmt(n: number): string {
  return n.toLocaleString();
}

/** Format with a trailing plus: 2600 → "2,600+" */
export function fmtPlus(n: number): string {
  return `${n.toLocaleString()}+`;
}

/** Format as a percentage string: 58 → "58%" */
export function fmtPct(n: number): string {
  return `${n}%`;
}

// ─── Kept helpers (unchanged) ─────────────────────────────────────────────────
// These are used by individual hub pages and don't need to move.

export async function getEpisodeAggregates() {
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
    earliestDate: earliest?.airDate ?? null,
    latestDate: latest?.airDate ?? null,
    totalGuests: guestCount,
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
