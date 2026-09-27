/**
 * Finds, and optionally repairs, episodes whose transcript timestamps were
 * squashed by the caption units bug fixed in src/lib/transcript/caption-units.ts.
 *
 * youtube-transcript returns cue times in seconds for YouTube's classic
 * caption format but milliseconds for srv3. The admin sync routes always
 * divided by 1000, so a classic-format transcript was stored at
 * round(realSeconds / 1000): a 3-hour stream's segments all landed in its
 * first ~11 seconds. That rounding threw the real times away, so a repair has
 * to fetch the captions again.
 *
 * An episode is flagged when either holds:
 *   - "squashed": 50+ segments start in the first 30 seconds. Real speech
 *     gives about 10-15 caption cues there. This also catches episodes where
 *     squashed rows sit alongside a later, correct sync (`mixed`).
 *   - "ends early": the duration is known (5+ minutes) and the last segment
 *     ends before 5% of it, with at least 20 segments. Not necessarily this bug.
 *
 * REPORT by default; changes nothing.
 *
 *   npx tsx scripts/ops/squashed-transcripts.ts            # report
 *   npx tsx scripts/ops/squashed-transcripts.ts --apply    # repair
 *
 * From GitHub Actions (Run DB Script workflow), which cannot pass flags:
 *   script = ops/squashed-transcripts.ts         → report
 *   script = ops/squashed-transcripts-apply.ts   → repair
 *
 * The repair touches only plain "squashed" episodes that have a YouTube id.
 * "Mixed" episodes are skipped (their good rows may come from a Whisper run
 * that beats YouTube's captions) and so is "ends early". For each episode it:
 *   1. fetches the captions again: YouTube first, then Supadata when
 *      SUPADATA_API_KEY is set. A failed fetch leaves the episode untouched.
 *   2. refuses captions that would still be squashed.
 *   3. in one transaction: replaces the segments, refreshes transcriptRaw and
 *      searchText the way the admin sync does, and re-links the episode's
 *      quotes by finding each quote's opening words in the new transcript.
 *      A quote that can't be found loses its timestamp, since the old one
 *      was one of the squashed values.
 * Repaired episodes no longer match the query, so re-running is safe. New
 * segments have no embeddings until the admin embed job runs again.
 */
import { getPrisma, disconnect } from "../ingest/lib";
import { captionsToMs } from "@/lib/transcript/caption-units";
import { fetchFromSupadata, fetchFromYouTube, YouTubeImportError } from "@/lib/stream-alchemist/youtube-fetch";

/** Episodes repaired per run; re-run for more. Keeps a run inside the workflow's timeout. */
const MAX_PER_RUN = 40;
/** Pause between episodes, matching the admin sync's pace against YouTube. */
const DELAY_MS = 2000;

export const SQUASHED_TRANSCRIPTS_SQL = `
WITH stats AS (
  SELECT
    s."episodeId",
    count(*)::int                                          AS segments,
    count(*) FILTER (WHERE s."startSeconds" < 30)::int     AS early_segments,
    count(DISTINCT s."startSeconds")::int                  AS distinct_starts,
    max(s."endSeconds")::int                               AS last_end
  FROM "TranscriptSegment" s
  GROUP BY s."episodeId"
),
ep AS (
  SELECT
    e.id, e.slug, e.title, e."youtubeVideoId", e.duration,
    CASE
      WHEN e.duration ~ '^[0-9]+:[0-9]{1,2}:[0-9]{1,2}$'
        THEN split_part(e.duration, ':', 1)::int * 3600
           + split_part(e.duration, ':', 2)::int * 60
           + split_part(e.duration, ':', 3)::int
      WHEN e.duration ~ '^[0-9]+:[0-9]{1,2}$'
        THEN split_part(e.duration, ':', 1)::int * 60
           + split_part(e.duration, ':', 2)::int
    END AS duration_seconds
  FROM "Episode" e
)
SELECT
  CASE WHEN st.early_segments >= 50 THEN 'squashed' ELSE 'ends early' END AS reason,
  ep.id                 AS "episodeId",
  ep.slug,
  ep.title,
  ep."youtubeVideoId"   AS "youtubeVideoId",
  ep.duration,
  ep.duration_seconds   AS "durationSeconds",
  st.segments,
  st.early_segments     AS "earlySegments",
  st.distinct_starts    AS "distinctStarts",
  st.last_end           AS "lastEnd",
  (SELECT count(*)::int FROM "Quote" q WHERE q."episodeId" = ep.id) AS quotes,
  -- Squashed rows plus correctly-timed rows from a later sync or ASR run.
  (st.early_segments >= 50 AND st.last_end > 120) AS mixed
FROM stats st
JOIN ep ON ep.id = st."episodeId"
WHERE st.early_segments >= 50
   OR (st.segments >= 20 AND ep.duration_seconds >= 300 AND st.last_end < ep.duration_seconds * 0.05)
ORDER BY st.early_segments DESC, st.segments DESC
`;

export interface SquashedRow {
  /** "squashed" is the units bug; "ends early" may just be captions that stop partway. */
  reason: "squashed" | "ends early";
  episodeId: string;
  slug: string;
  title: string;
  youtubeVideoId: string | null;
  duration: string | null;
  durationSeconds: number | null;
  segments: number;
  earlySegments: number;
  distinctStarts: number;
  lastEnd: number;
  quotes: number;
  mixed: boolean;
}

// ── Pure helpers (unit tested) ─────────────────────────────────────────────

export interface NewSegment {
  startSeconds: number;
  endSeconds: number;
  text: string;
}

/** Caption chunks (milliseconds) → segment rows, built the same way as the admin sync. */
export function toSegments(chunks: Array<{ text: string; offset: number; duration: number }>): NewSegment[] {
  return chunks.map((c) => ({
    startSeconds: Math.round(c.offset / 1000),
    endSeconds: Math.round((c.offset + c.duration) / 1000),
    text: c.text.replace(/\[.*?\]/g, "").trim(),
  }));
}

/** The same "squashed" test the report uses, applied to freshly fetched segments. */
export function looksSquashed(segments: NewSegment[]): boolean {
  return segments.filter((s) => s.startSeconds < 30).length >= 50;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Find the segment where a quote starts. Caption cues are a few seconds long
 * and quotes usually span several, so this searches the whole transcript
 * joined together for the quote's opening words (8, then 5) and maps the hit
 * back to its segment. Returns null for quotes too short to place reliably.
 */
export function locateQuote<T extends { text: string }>(quote: string, segments: T[]): T | null {
  const words = normalize(quote).split(" ").filter(Boolean);
  if (words.length < 3) return null;

  const starts: number[] = [];
  let joined = "";
  for (const seg of segments) {
    starts.push(joined.length);
    joined += `${normalize(seg.text)} `;
  }

  for (const n of [8, 5]) {
    const needle = words.slice(0, n).join(" ");
    const at = joined.indexOf(needle);
    if (at === -1) continue;
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= at) lo = mid;
      else hi = mid - 1;
    }
    return segments[lo];
  }
  return null;
}

// ── Report + repair ────────────────────────────────────────────────────────

function fmt(seconds: number | null): string {
  if (seconds === null) return "?";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

function report(rows: SquashedRow[]) {
  console.log(`${rows.length} episode(s) flagged:\n`);
  console.table(
    rows.map((r) => ({
      reason: r.reason,
      slug: r.slug,
      duration: r.duration ?? "?",
      segments: r.segments,
      "in first 30s": r.earlySegments,
      "last ends at": fmt(r.lastEnd),
      quotes: r.quotes,
      mixed: r.mixed ? "yes" : "",
      youtube: r.youtubeVideoId ?? "",
    })),
  );

  const mixed = rows.filter((r) => r.mixed).length;
  const squashed = rows.filter((r) => r.reason === "squashed").length;
  const quotes = rows.reduce((n, r) => n + r.quotes, 0);
  const repairable = rows.filter((r) => r.reason === "squashed" && !r.mixed && r.youtubeVideoId).length;
  const noYouTube = rows.filter((r) => r.reason === "squashed" && !r.mixed && !r.youtubeVideoId).length;
  console.log(
    `\nThe apply step (ops/squashed-transcripts-apply.ts) re-fetches captions and repairs the ${repairable} plain "squashed" episode(s) with a YouTube id, ${MAX_PER_RUN} per run.` +
      (rows.length > squashed ? `\n- ${rows.length - squashed} flagged "ends early": the transcript stops long before the episode does. That's not this bug, and the apply step leaves them alone.` : "") +
      (noYouTube ? `\n- ${noYouTube} "squashed" episode(s) have no YouTube id, so their captions can't be fetched again; the apply step skips them.` : "") +
      (mixed ? `\n- ${mixed} flagged "mixed": squashed rows alongside correctly-timed ones. The apply step skips these; review them by hand.` : "") +
      (quotes ? `\n- ${quotes} quote(s) belong to these episodes. The apply step re-links them to the new segments and corrects their timestamps.` : ""),
  );
  console.log(`\nSummary: ${squashed} squashed, ${rows.length - squashed} ending early, ${mixed} mixed, ${quotes} quotes affected.`);
}

async function fetchCaptions(videoId: string) {
  try {
    return { chunks: captionsToMs(await fetchFromYouTube(videoId)), source: "youtube" };
  } catch (err) {
    if (err instanceof YouTubeImportError && err.retryable && process.env.SUPADATA_API_KEY) {
      return { chunks: await fetchFromSupadata(videoId, Date.now() + 60_000), source: "supadata" };
    }
    throw err;
  }
}

async function repair(rows: SquashedRow[]) {
  const prisma = getPrisma();
  const eligible = rows.filter((r) => r.reason === "squashed" && !r.mixed && r.youtubeVideoId);
  const targets = eligible.slice(0, MAX_PER_RUN);
  const results: Array<{ slug: string; outcome: string; detail: string }> = [];

  console.log(`\nRepairing ${targets.length} of ${eligible.length} eligible episode(s)` +
    (process.env.SUPADATA_API_KEY ? " (Supadata fallback on)." : " (YouTube only; SUPADATA_API_KEY not set)."));

  for (const [i, row] of targets.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, DELAY_MS));
    try {
      const { chunks, source } = await fetchCaptions(row.youtubeVideoId!);
      const segments = toSegments(chunks);
      if (!segments.length) {
        results.push({ slug: row.slug, outcome: "skipped", detail: "captions came back empty" });
        continue;
      }
      if (looksSquashed(segments)) {
        results.push({ slug: row.slug, outcome: "skipped", detail: `re-fetched ${source} captions still look squashed` });
        continue;
      }

      const quoteStats = await prisma.$transaction(
        async (tx) => {
          await tx.transcriptSegment.deleteMany({ where: { episodeId: row.episodeId } });
          await tx.transcriptSegment.createMany({
            data: segments.map((s) => ({ episodeId: row.episodeId, ...s, searchText: s.text.toLowerCase() })),
            skipDuplicates: true,
          });

          const rawText = chunks.map((c) => c.text).join(" ");
          await tx.episode.update({
            where: { id: row.episodeId },
            data: {
              transcriptRaw: rawText.slice(0, 200000),
              searchText: [row.slug, rawText].join(" ").toLowerCase().slice(0, 10000),
            },
            // Read back only the id: an update otherwise returns every column.
            select: { id: true },
          });

          const inserted = await tx.transcriptSegment.findMany({
            where: { episodeId: row.episodeId },
            select: { id: true, startSeconds: true, text: true },
            orderBy: [{ startSeconds: "asc" }, { endSeconds: "asc" }],
          });
          const quotes = await tx.quote.findMany({ where: { episodeId: row.episodeId }, select: { id: true, text: true } });
          let relinked = 0;
          for (const q of quotes) {
            const hit = locateQuote(q.text, inserted);
            if (hit) relinked++;
            await tx.quote.update({
              where: { id: q.id },
              data: { transcriptSegmentId: hit?.id ?? null, timestampSeconds: hit?.startSeconds ?? null },
              select: { id: true },
            });
          }
          return { total: quotes.length, relinked };
        },
        { timeout: 120_000 },
      );

      const last = segments.reduce((m, s) => Math.max(m, s.endSeconds), 0);
      results.push({
        slug: row.slug,
        outcome: "repaired",
        detail:
          `${segments.length} segments from ${source}, now ends at ${fmt(last)}` +
          (quoteStats.total ? `; quotes re-linked ${quoteStats.relinked}/${quoteStats.total}` : ""),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ slug: row.slug, outcome: "failed", detail: `${msg.slice(0, 160)} (left untouched)` });
    }
  }

  console.table(results);
  const count = (o: string) => results.filter((r) => r.outcome === o).length;
  console.log(
    `\nRepaired ${count("repaired")}, skipped ${count("skipped")}, failed ${count("failed")}` +
      (eligible.length > targets.length ? `; ${eligible.length - targets.length} more eligible, run again` : "") +
      `. Repaired episodes need the admin embed job re-run for semantic search.`,
  );
}

export async function run(apply: boolean) {
  const prisma = getPrisma();
  const rows = await prisma.$queryRawUnsafe<SquashedRow[]>(SQUASHED_TRANSCRIPTS_SQL);

  if (!rows.length) {
    console.log("No episodes with squashed transcript timestamps found.");
    return;
  }
  report(rows);
  if (apply) await repair(rows);
}

if (process.argv[1]?.endsWith("squashed-transcripts.ts")) {
  run(process.argv.includes("--apply"))
    .then(disconnect)
    .catch(async (e) => {
      console.error(e);
      await disconnect();
      process.exit(1);
    });
}
