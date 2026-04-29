// Fetch transcripts for all @PsychesNightmares videos.
// Reads youtube-raw-psychesnightmares.json, fetches captions for each video,
// and saves them to the shared transcripts/ directory (by videoId).
// Run after: _fetch-psychesnightmares.ts (to produce the raw JSON)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { fetchTranscript } from "youtube-transcript";

const SCRAPE_DIR = join(__dirname, "data");
const RAW_FILE = join(SCRAPE_DIR, "youtube-raw-psychesnightmares.json");
const TRANSCRIPT_DIR = join(SCRAPE_DIR, "transcripts");
const DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!existsSync(RAW_FILE)) {
    console.error(
      "youtube-raw-psychesnightmares.json not found. Run: npx tsx scripts/_fetch-psychesnightmares.ts"
    );
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(RAW_FILE, "utf-8")) as {
    totalVideos: number;
    videos: Array<{ videoId: string; title: string }>;
  };

  console.log(`Found ${raw.totalVideos} @PsychesNightmares videos`);

  if (!existsSync(TRANSCRIPT_DIR)) mkdirSync(TRANSCRIPT_DIR, { recursive: true });

  let fetched = 0;
  let skipped = 0;
  let failed = 0;
  const failures: string[] = [];

  for (let i = 0; i < raw.videos.length; i++) {
    const video = raw.videos[i];
    const outFile = join(TRANSCRIPT_DIR, `${video.videoId}.json`);

    if (existsSync(outFile)) {
      skipped++;
      continue;
    }

    console.log(
      `[${i + 1}/${raw.videos.length}] Fetching: ${video.title.slice(0, 60)}...`
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
      failures.push(`${video.videoId} (${video.title.slice(0, 40)}): ${msg}`);
      failed++;
      console.warn(`  FAILED: ${msg}`);
    }

    if (i < raw.videos.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\nDone!`);
  console.log(`  Fetched:  ${fetched}`);
  console.log(`  Skipped:  ${skipped} (already exist)`);
  console.log(`  Failed:   ${failed}`);

  if (failures.length > 0) {
    const logPath = join(SCRAPE_DIR, "transcript-failures-nightmares.log");
    writeFileSync(logPath, failures.join("\n"));
    console.log(`\nFailure details → ${logPath}`);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
