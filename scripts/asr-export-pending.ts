import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { getPrisma, disconnect } from "./ingest/lib";

/**
 * Export episodes that are:
 *   - published
 *   - have a youtubeVideoId
 *   - have NO transcript segments in the DB
 *
 * By default excludes episodes that already have summaryLong (title-only enriched).
 * Pass --include-enriched to also export those (useful for re-transcribing episodes
 * that were enriched from metadata alone and still need a real transcript).
 *
 * Writes `scripts/asr-pending.json` in the format the downstream
 * Python scripts (asr-download-audio.py, asr-transcribe.py) expect:
 *   [{ ytId, ep, slug, title }, ...]
 *
 * Usage:
 *   npx tsx scripts/asr-export-pending.ts
 *   npx tsx scripts/asr-export-pending.ts --limit 25
 *   npx tsx scripts/asr-export-pending.ts --include-enriched
 */
async function main() {
  const p = getPrisma();

  const limitIdx = process.argv.indexOf("--limit");
  const limit =
    limitIdx !== -1 ? parseInt(process.argv[limitIdx + 1] ?? "0", 10) : undefined;

  const includeEnriched = process.argv.includes("--include-enriched");

  const eps = await p.episode.findMany({
    where: {
      status: "published",
      youtubeVideoId: { not: null },
      segments: { none: {} },
      ...(includeEnriched ? {} : { OR: [{ summaryLong: null }, { summaryLong: "" }] }),
    },
    select: {
      slug: true,
      title: true,
      episodeNumber: true,
      youtubeVideoId: true,
      airDate: true,
    },
    orderBy: { episodeNumber: "asc" },
    ...(limit ? { take: limit } : {}),
  });

  const out = eps.map((e) => ({
    ytId: e.youtubeVideoId,
    ep: e.episodeNumber ?? 0,
    slug: e.slug,
    title: e.title,
    airDate: e.airDate ? e.airDate.toISOString().slice(0, 10) : null,
  }));

  const outPath = path.join(__dirname, "asr-pending.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

  console.log(`Wrote ${out.length} pending episodes to ${outPath}${includeEnriched ? " (including pre-enriched)" : ""}`);
  if (out.length > 0) {
    console.log(`  First: EP.${out[0].ep} ${out[0].title?.slice(0, 50)}`);
    console.log(`  Last:  EP.${out[out.length - 1].ep} ${out[out.length - 1].title?.slice(0, 50)}`);
  }

  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
