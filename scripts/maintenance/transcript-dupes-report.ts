// scripts/maintenance/transcript-dupes-report.ts
// READ-ONLY. Counts TranscriptSegment rows that share the natural key
// (episodeId, startSeconds, endSeconds, text) — i.e. rows the dedupe would remove.
//
//   npx tsx scripts/maintenance/transcript-dupes-report.ts [--top N]
import { getPrisma, disconnect } from "../ingest/lib";

type Summary = {
  affected_episodes: bigint;
  dup_groups: bigint;
  surplus_rows: bigint;
  total_rows: bigint;
};

type TopRow = {
  slug: string;
  episodeNumber: number | null;
  total_rows: bigint;
  distinct_rows: bigint;
  surplus_rows: bigint;
};

async function main() {
  const topIdx = process.argv.indexOf("--top");
  const top = topIdx >= 0 ? parseInt(process.argv[topIdx + 1] || "10", 10) : 10;
  const prisma = getPrisma();

  const [summary] = await prisma.$queryRaw<Summary[]>`
    WITH g AS (
      SELECT "episodeId", "startSeconds", "endSeconds", "text", COUNT(*) AS n
      FROM "TranscriptSegment"
      GROUP BY 1, 2, 3, 4
      HAVING COUNT(*) > 1
    )
    SELECT
      (SELECT COUNT(DISTINCT "episodeId") FROM g)      AS affected_episodes,
      (SELECT COUNT(*) FROM g)                          AS dup_groups,
      (SELECT COALESCE(SUM(n - 1), 0) FROM g)           AS surplus_rows,
      (SELECT COUNT(*) FROM "TranscriptSegment")        AS total_rows
  `;

  console.log("TranscriptSegment duplicate report");
  console.log(`  total rows:         ${summary.total_rows}`);
  console.log(`  affected episodes:  ${summary.affected_episodes}`);
  console.log(`  duplicate groups:   ${summary.dup_groups}`);
  console.log(`  surplus rows:       ${summary.surplus_rows}  (rows a dedupe would delete)`);

  const rows = await prisma.$queryRaw<TopRow[]>`
    SELECT e.slug, e."episodeNumber",
           COUNT(*)                                                             AS total_rows,
           COUNT(DISTINCT (s."startSeconds", s."endSeconds", s."text"))         AS distinct_rows,
           COUNT(*) - COUNT(DISTINCT (s."startSeconds", s."endSeconds", s."text")) AS surplus_rows
    FROM "TranscriptSegment" s
    JOIN "Episode" e ON e.id = s."episodeId"
    GROUP BY e.id, e.slug, e."episodeNumber"
    HAVING COUNT(*) > COUNT(DISTINCT (s."startSeconds", s."endSeconds", s."text"))
    ORDER BY surplus_rows DESC
    LIMIT ${top}
  `;

  if (rows.length) {
    console.log(`\nTop ${rows.length} episodes by surplus:`);
    for (const r of rows) {
      const ep = r.episodeNumber != null ? `EP.${r.episodeNumber}` : "—";
      console.log(`  ${String(r.surplus_rows).padStart(6)} surplus / ${String(r.total_rows).padStart(6)} rows  ${ep.padEnd(8)} ${r.slug}`);
    }
  }
  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
