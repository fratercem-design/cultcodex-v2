/**
 * Show current enrichment state: total episodes, enriched count,
 * remaining unenriched count, count of episodes with transcript text,
 * and how many enrichment JSON files exist on disk vs imported.
 */
import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";
import * as fs from "node:fs";
import * as path from "node:path";

(async () => {
  const p = getPrisma();
  const total = await p.episode.count();
  const enriched = await p.episode.count({ where: { summaryLong: { not: null } } });
  const unenriched = await p.episode.count({ where: { summaryLong: null } });
  const unenrichedWithTranscript = await p.episode.count({
    where: {
      summaryLong: null,
      segments: { some: {} },
    },
  });
  const unenrichedNoTranscript = await p.episode.count({
    where: {
      summaryLong: null,
      segments: { none: {} },
    },
  });

  const enrichDir = path.join(__dirname, "enrich", "data");
  const files = fs.existsSync(enrichDir) ? fs.readdirSync(enrichDir).filter((f) => f.endsWith(".json")) : [];

  // Cross-check: how many enrich files correspond to episodes still missing summaryLong
  const allEpisodes = await p.episode.findMany({ select: { slug: true, summaryLong: true } });
  const slugMap = new Map(allEpisodes.map((e) => [e.slug, e.summaryLong]));
  let filesForUnenriched = 0;
  let filesForMissingEpisode = 0;
  for (const f of files) {
    const slug = f.replace(/\.json$/, "");
    if (!slugMap.has(slug)) {
      filesForMissingEpisode++;
    } else if (slugMap.get(slug) === null) {
      filesForUnenriched++;
    }
  }

  console.log("=== Episode enrichment ===");
  console.log(`  total:                       ${total}`);
  console.log(`  enriched (summaryLong set):  ${enriched}`);
  console.log(`  unenriched:                  ${unenriched}`);
  console.log(`    with transcript:           ${unenrichedWithTranscript}`);
  console.log(`    without transcript:        ${unenrichedNoTranscript}`);
  console.log(`\n=== Enrichment JSON files on disk: ${files.length} ===`);
  console.log(`  for unenriched episodes:     ${filesForUnenriched}`);
  console.log(`  for episodes not in DB:      ${filesForMissingEpisode}`);

  await disconnect();
})();
