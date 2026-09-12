// scripts/maintenance/dedupe-transcript-segments.ts
//
// Removes duplicate TranscriptSegment rows — rows sharing the natural key
// (episodeId, startSeconds, endSeconds, text). Keeps the lowest id in each
// group, re-points any Quote.transcriptSegmentId at the survivor, deletes the
// rest. One transaction per episode so an interrupted run leaves every episode
// either fully deduped or untouched, and can simply be re-run.
//
//   npx tsx scripts/maintenance/dedupe-transcript-segments.ts            # dry run (default)
//   npx tsx scripts/maintenance/dedupe-transcript-segments.ts --apply    # delete
//   npx tsx scripts/maintenance/dedupe-transcript-segments.ts --apply --episode <slug>
//
// Run this BEFORE deploying prisma/migrations/20260911000000_transcript_segment_natural_key,
// whose CREATE UNIQUE INDEX fails while duplicates exist.
import { getPrisma, disconnect } from "../ingest/lib";

type Summary = {
  total_rows: bigint;
  affected_episodes: bigint;
  dup_groups: bigint;
  surplus_rows: bigint;
};

type EpisodeRow = { episodeId: string; slug: string; surplus: bigint };

const SUMMARY_SQL = `
  WITH g AS (
    SELECT "episodeId", "startSeconds", "endSeconds", "text", COUNT(*) AS n
    FROM "TranscriptSegment"
    GROUP BY 1, 2, 3, 4
    HAVING COUNT(*) > 1
  )
  SELECT
    (SELECT COUNT(*) FROM "TranscriptSegment")   AS total_rows,
    (SELECT COUNT(DISTINCT "episodeId") FROM g)  AS affected_episodes,
    (SELECT COUNT(*) FROM g)                     AS dup_groups,
    (SELECT COALESCE(SUM(n - 1), 0) FROM g)      AS surplus_rows
`;

function printSummary(label: string, s: Summary) {
  console.log(`${label}`);
  console.log(`  total rows:        ${s.total_rows}`);
  console.log(`  affected episodes: ${s.affected_episodes}`);
  console.log(`  duplicate groups:  ${s.dup_groups}`);
  console.log(`  surplus rows:      ${s.surplus_rows}`);
}

async function main() {
  const apply = process.argv.includes("--apply");
  const epIdx = process.argv.indexOf("--episode");
  const onlySlug = epIdx >= 0 ? process.argv[epIdx + 1] : null;
  const prisma = getPrisma();

  const [before] = await prisma.$queryRawUnsafe<Summary[]>(SUMMARY_SQL);
  printSummary(`BEFORE${apply ? "" : " (dry run — nothing will be deleted)"}`, before);

  if (before.surplus_rows === 0n) {
    console.log("\nNo duplicates. Nothing to do.");
    await disconnect();
    return;
  }

  const episodes = await prisma.$queryRaw<EpisodeRow[]>`
    SELECT s."episodeId", e.slug,
           COUNT(*) - COUNT(DISTINCT (s."startSeconds", s."endSeconds", s."text")) AS surplus
    FROM "TranscriptSegment" s
    JOIN "Episode" e ON e.id = s."episodeId"
    WHERE ${onlySlug ?? null}::text IS NULL OR e.slug = ${onlySlug ?? null}
    GROUP BY s."episodeId", e.slug
    HAVING COUNT(*) > COUNT(DISTINCT (s."startSeconds", s."endSeconds", s."text"))
    ORDER BY surplus DESC
  `;
  console.log(`\n${episodes.length} episode(s) to process${onlySlug ? ` (filtered to ${onlySlug})` : ""}`);

  if (!apply) {
    for (const ep of episodes.slice(0, 20)) {
      console.log(`  would delete ${String(ep.surplus).padStart(6)} rows  ${ep.slug}`);
    }
    if (episodes.length > 20) console.log(`  … and ${episodes.length - 20} more`);
    console.log("\nDry run complete. Re-run with --apply to delete.");
    await disconnect();
    return;
  }

  let deleted = 0;
  let requoted = 0;
  for (let i = 0; i < episodes.length; i++) {
    const ep = episodes[i];
    const res = await prisma.$transaction(async (tx) => {
      // Survivor = lowest id per natural key within this episode.
      await tx.$executeRawUnsafe(`
        CREATE TEMP TABLE _ts_dupes ON COMMIT DROP AS
        SELECT id, keep_id FROM (
          SELECT id,
                 FIRST_VALUE(id) OVER (
                   PARTITION BY "startSeconds", "endSeconds", "text" ORDER BY id
                 ) AS keep_id
          FROM "TranscriptSegment"
          WHERE "episodeId" = $1
        ) t
        WHERE id <> keep_id`, ep.episodeId);

      const q = await tx.$executeRawUnsafe(`
        UPDATE "Quote" q SET "transcriptSegmentId" = d.keep_id
        FROM _ts_dupes d WHERE q."transcriptSegmentId" = d.id`);

      const d = await tx.$executeRawUnsafe(`
        DELETE FROM "TranscriptSegment" s USING _ts_dupes d WHERE s.id = d.id`);

      return { q, d };
    }, { timeout: 120_000 });

    deleted += res.d;
    requoted += res.q;
    console.log(`  [${i + 1}/${episodes.length}] -${res.d} rows${res.q ? ` (${res.q} quotes re-pointed)` : ""}  ${ep.slug}`);
  }

  console.log(`\nDeleted ${deleted} rows, re-pointed ${requoted} quotes.\n`);
  const [after] = await prisma.$queryRawUnsafe<Summary[]>(SUMMARY_SQL);
  printSummary("AFTER", after);
  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
