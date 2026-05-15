import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { fetchTranscript } from "youtube-transcript";
import type { YouTubeRaw } from "./types";

const DATA_DIR = join(__dirname, "data");
const RAW_FILE = join(DATA_DIR, "youtube-raw.json");
const TRANSCRIPT_DIR = join(DATA_DIR, "transcripts");

// Delay between requests to avoid rate limiting
const DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!existsSync(RAW_FILE)) {
    console.error(
      `youtube-raw.json not found. Run npm run scrape:youtube first.`
    );
    process.exit(1);
  }

  const raw: YouTubeRaw = JSON.parse(readFileSync(RAW_FILE, "utf-8"));
  console.log(`Found ${raw.totalVideos} videos to process`);

  if (!existsSync(TRANSCRIPT_DIR))
    mkdirSync(TRANSCRIPT_DIR, { recursive: true });

  let fetched = 0;
  let skipped = 0;
  let failed = 0;
  const failures: string[] = [];

  for (let i = 0; i < raw.videos.length; i++) {
    const video = raw.videos[i];
    const outFile = join(TRANSCRIPT_DIR, `${video.videoId}.json`);

    // Skip if already fetched
    if (existsSync(outFile)) {
      skipped++;
      continue;
    }

    console.log(
      `[${i + 1}/${raw.videos.length}] Fetching transcript: ${video.title.slice(0, 60)}...`
    );

    try {
      const segments = await fetchTranscript(video.videoId);

      const transcript = segments.map((seg) => ({
        offset: seg.offset,
        duration: seg.duration,
        text: seg.text,
      }));

      writeFileSync(outFile, JSON.stringify(transcript, null, 2));
      fetched++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      failures.push(
        `${video.videoId} (${video.title.slice(0, 40)}): ${msg}`
      );
      failed++;
    }

    // Rate limiting delay
    if (i < raw.videos.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\nDone!`);
  console.log(`  Fetched: ${fetched}`);
  console.log(`  Skipped (already exists): ${skipped}`);
  console.log(`  Failed: ${failed}`);

  if (failures.length > 0) {
    const failLog = join(DATA_DIR, "transcript-failures.log");
    writeFileSync(failLog, failures.join("\n"));
    console.log(`\nFailure details written to ${failLog}`);
  }
}

main().catch((e) => {
  console.error("Error:", e.message || e);
  process.exit(1);
});
