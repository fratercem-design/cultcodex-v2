// scripts/enrich/enrich-episodes.ts
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { getPrisma, disconnect } from "../ingest/lib";
import { enrichEpisode, buildTranscriptText } from "./lib";
import { YouTubeRawSchema } from "../scrape/types";

const DATA_DIR = path.join(__dirname, "data");
const TRANSCRIPTS_DIR = path.join(
  __dirname,
  "..",
  "scrape",
  "data",
  "transcripts"
);
const RAW_PATH = path.join(__dirname, "..", "scrape", "data", "youtube-raw.json");
const LOG_PATH = path.join(__dirname, "enrich-progress.log");

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
}

function parseArgs(): { batch: number; force: boolean } {
  const args = process.argv.slice(2);
  let batch = parseInt(process.env.ENRICHMENT_BATCH_SIZE ?? "10", 10);
  let force = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--batch" && args[i + 1]) {
      batch = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === "--force") {
      force = true;
    }
  }

  return { batch, force };
}

async function main() {
  const { batch, force } = parseArgs();
  const prisma = getPrisma();

  // Load YouTube raw data for metadata
  const rawJson = JSON.parse(fs.readFileSync(RAW_PATH, "utf-8"));
  const raw = YouTubeRawSchema.parse(rawJson);
  const videos = raw.videos;

  // Find episodes needing enrichment (summaryLong is null or empty)
  const episodesNeedingEnrichment = await prisma.episode.findMany({
    where: {
      OR: [{ summaryLong: null }, { summaryLong: "" }],
    },
    select: {
      slug: true,
      youtubeVideoId: true,
      episodeNumber: true,
      title: true,
    },
    orderBy: { episodeNumber: "asc" },
  });

  log(`Found ${episodesNeedingEnrichment.length} episodes needing enrichment`);

  // Filter to those with transcripts and not already enriched
  const candidates = episodesNeedingEnrichment.filter((ep) => {
    if (!ep.youtubeVideoId) return false;
    const transcriptPath = path.join(
      TRANSCRIPTS_DIR,
      `${ep.youtubeVideoId}.json`
    );
    if (!fs.existsSync(transcriptPath)) return false;
    if (!force) {
      const enrichedPath = path.join(DATA_DIR, `${ep.slug}.json`);
      if (fs.existsSync(enrichedPath)) return false;
    }
    return true;
  });

  log(`${candidates.length} candidates with transcripts (batch size: ${batch})`);

  const toProcess = candidates.slice(0, batch);
  let success = 0;
  let failures = 0;

  for (const ep of toProcess) {
    try {
      const transcriptPath = path.join(
        TRANSCRIPTS_DIR,
        `${ep.youtubeVideoId}.json`
      );
      const segments = JSON.parse(fs.readFileSync(transcriptPath, "utf-8"));
      const transcriptText = buildTranscriptText(segments);

      // Truncate very long transcripts to ~100k tokens (~400k chars)
      const MAX_CHARS = 400_000;
      const truncatedTranscript = transcriptText.length > MAX_CHARS
        ? transcriptText.slice(0, MAX_CHARS) + "\n\n[TRANSCRIPT TRUNCATED — original was " + transcriptText.length + " chars]"
        : transcriptText;

      const video = videos.find((v) => v.videoId === ep.youtubeVideoId);
      const description = video?.description ?? "";
      const airDate = video?.publishedAt?.split("T")[0] ?? "";

      const epLabel = ep.episodeNumber != null ? `EP.${ep.episodeNumber}` : ep.slug;
      log(`Enriching ${epLabel}: ${ep.title}`);

      const result = await enrichEpisode({
        title: ep.title,
        episodeNumber: ep.episodeNumber ?? 0,
        airDate,
        description,
        transcript: truncatedTranscript,
      });

      const outPath = path.join(DATA_DIR, `${ep.slug}.json`);
      fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
      log(
        `  Saved ${ep.slug}.json (${result.guests.length} guests, ${result.quotes.length} quotes, ${result.lore.length} lore)`
      );
      success++;

      // Rate limit: wait 65s to stay under 50k input tokens/min (Haiku)
      await new Promise((resolve) => setTimeout(resolve, 65000));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`  FAILED ${ep.slug}: ${msg}`);
      failures++;
      // Wait 60s after rate limit errors before retrying
      if (msg.includes('429')) {
        log('  Rate limited — waiting 60s...');
        await new Promise((resolve) => setTimeout(resolve, 60000));
      }
    }
  }

  log(
    `Done: ${success} enriched, ${failures} failed, ${candidates.length - toProcess.length} remaining`
  );
  await disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  disconnect();
  process.exit(1);
});
