/**
 * Finds episodes whose transcript timestamps were squashed by the caption
 * units bug fixed in src/lib/transcript/caption-units.ts.
 *
 * youtube-transcript returns cue times in seconds for YouTube's classic
 * caption format but milliseconds for srv3. The admin sync routes always
 * divided by 1000, so a classic-format transcript was stored at
 * round(realSeconds / 1000): a 3-hour stream's segments all landed in its
 * first ~11 seconds.
 *
 * An episode is flagged when either holds:
 *   - 50+ segments start in the first 30 seconds. Real speech gives about
 *     10-15 caption cues there. This also catches episodes where squashed rows
 *     sit alongside a later, correct sync (see `mixed`).
 *   - The duration is known (5+ minutes) and the last segment ends before 5%
 *     of it, with at least 20 segments.
 *
 * READ-ONLY. Prints a report; changes nothing.
 *
 *   npx tsx scripts/ops/squashed-transcripts.ts
 *
 * From GitHub Actions: Run DB Script workflow, script = ops/squashed-transcripts.ts
 */
import { getPrisma, disconnect } from "../ingest/lib";

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

function fmt(seconds: number | null): string {
  if (seconds === null) return "?";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

async function main() {
  const prisma = getPrisma();
  const rows = await prisma.$queryRawUnsafe<SquashedRow[]>(SQUASHED_TRANSCRIPTS_SQL);

  if (!rows.length) {
    console.log("No episodes with squashed transcript timestamps found.");
    return;
  }

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
  console.log(
    `\nTo repair an episode: delete its TranscriptSegment rows, then re-run the admin transcript sync, ` +
      `which now normalises caption units.` +
      (rows.length > squashed ? `\n- ${rows.length - squashed} flagged "ends early": the transcript stops long before the episode does. That's not this bug, and a re-sync may not change it.` : "") +
      (mixed ? `\n- ${mixed} flagged "mixed": squashed rows alongside correctly-timed ones. Deleting all segments and re-syncing still works, but check the good rows came from YouTube and not a one-off ASR run.` : "") +
      (quotes ? `\n- ${quotes} quote(s) belong to these episodes. Deleting a segment clears a quote's transcriptSegmentId (it isn't deleted), and quote timestampSeconds were derived from the squashed times, so they need fixing too.` : ""),
  );
  console.log(`\nSummary: ${squashed} squashed, ${rows.length - squashed} ending early, ${mixed} mixed, ${quotes} quotes affected.`);
}

if (process.argv[1]?.endsWith("squashed-transcripts.ts")) {
  main()
    .then(disconnect)
    .catch(async (e) => {
      console.error(e);
      await disconnect();
      process.exit(1);
    });
}
