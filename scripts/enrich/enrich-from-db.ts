/**
 * Enrich unenriched episodes directly from DB data.
 * - Episodes WITH transcript segments: full enrichment using segment text
 * - Episodes WITHOUT transcripts: lightweight enrichment from title + summaryShort
 *
 * Writes JSON files to data/ directory, then import with import-enriched.ts
 *
 * Usage: ENRICHMENT_MODEL=claude-3-haiku-20240307 npx tsx scripts/enrich/enrich-from-db.ts
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { getPrisma, disconnect } from "../ingest/lib";
import { enrichEpisode, SYSTEM_PROMPT } from "./lib";

const DATA_DIR = path.join(__dirname, "data");
const CONCURRENCY = 3;
const DELAY_MS = 500; // delay between batches to respect rate limits

async function main() {
  const p = getPrisma();

  // Find all unenriched episodes
  const episodes = await p.episode.findMany({
    where: { OR: [{ summaryLong: null }, { summaryLong: "" }] },
    select: {
      id: true,
      title: true,
      slug: true,
      episodeNumber: true,
      airDate: true,
      summaryShort: true,
      segments: {
        select: { text: true, startSeconds: true, speakerLabel: true },
        orderBy: { startSeconds: "asc" },
      },
    },
    orderBy: { episodeNumber: "asc" },
  });

  console.log(`Found ${episodes.length} unenriched episodes`);

  // Ensure data dir
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  // Skip already-enriched files
  const existing = new Set(
    fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""))
  );

  let todo = episodes.filter((e) => !existing.has(e.slug));
  console.log(`Skipping ${episodes.length - todo.length} already on disk, ${todo.length} to process\n`);

  // Optional --limit N for staged runs / smoke tests
  const limitIdx = process.argv.indexOf("--limit");
  if (limitIdx !== -1) {
    const n = parseInt(process.argv[limitIdx + 1] ?? "0", 10);
    if (n > 0) {
      console.log(`(--limit ${n} active — processing first ${n})\n`);
      todo = todo.slice(0, n);
    }
  }

  let done = 0;
  let failed = 0;
  const withTx = todo.filter((e) => e.segments.length > 0);
  const noTx = todo.filter((e) => e.segments.length === 0);
  console.log(`With transcript: ${withTx.length}, Without: ${noTx.length}\n`);

  // Process in concurrent batches
  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    const batch = todo.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (ep) => {
        const hasTranscript = ep.segments.length > 0;

        // Build transcript text from DB segments
        let transcript = "";
        if (hasTranscript) {
          transcript = ep.segments
            .map((s) => {
              const mins = Math.floor(s.startSeconds / 60);
              const secs = s.startSeconds % 60;
              const ts = `${mins}:${String(secs).padStart(2, "0")}`;
              const speaker = s.speakerLabel ? `${s.speakerLabel}: ` : "";
              return `[${ts}] ${speaker}${s.text}`;
            })
            .join("\n");

          // Truncate to ~12000 chars to stay within token limits
          if (transcript.length > 12000) {
            transcript = transcript.slice(0, 12000) + "\n[...transcript truncated...]";
          }
        }

        const airDateStr = ep.airDate
          ? ep.airDate.toISOString().slice(0, 10)
          : "unknown";

        const result = await enrichEpisode({
          title: ep.title,
          episodeNumber: ep.episodeNumber ?? 0,
          airDate: airDateStr,
          description: ep.summaryShort ?? "",
          transcript: transcript || "(No transcript available — enrich from title and description only)",
        });

        // Write to disk
        const outPath = path.join(DATA_DIR, `${ep.slug}.json`);
        fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
        return ep.slug;
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") {
        done++;
        process.stdout.write(`\r  ${done}/${todo.length} enriched (${failed} failed)`);
      } else {
        failed++;
        console.error(`\n  Failed: ${r.reason?.message ?? r.reason}`);
      }
    }

    // Rate limit delay
    if (i + CONCURRENCY < todo.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\n\nDone: ${done} enriched, ${failed} failed`);
  console.log(`Run: npx tsx scripts/enrich/import-enriched.ts to import into DB`);

  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
