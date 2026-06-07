import "dotenv/config";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { getPrisma, disconnect } from "./ingest/lib";

const AUDIO_DIR = path.join(__dirname, "scrape", "data", "audio");
const DELAY_MS = 2000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  const prisma = getPrisma();

  // Find all episodes marked no_captions with no transcript segments
  const episodes = await prisma.episode.findMany({
    where: {
      transcriptRaw: "no_captions",
      youtubeVideoId: { not: null },
      segments: { none: {} },
    },
    select: { id: true, slug: true, episodeNumber: true, title: true, youtubeVideoId: true },
    orderBy: { episodeNumber: "asc" },
  });

  console.log(`Found ${episodes.length} no_captions episodes to attempt.\n`);

  let downloaded = 0;
  let failed = 0;

  for (let i = 0; i < episodes.length; i++) {
    const ep = episodes[i];
    const ytId = ep.youtubeVideoId!;
    const mp3 = path.join(AUDIO_DIR, `${ytId}.mp3`);
    const label = `EP.${String(ep.episodeNumber ?? "?").padStart(3, "0")} [${ytId}] ${ep.title.slice(0, 50)}`;

    if (fs.existsSync(mp3)) {
      console.log(`[${i + 1}/${episodes.length}] ${label} — already downloaded`);
      downloaded++;
      continue;
    }

    process.stdout.write(`[${i + 1}/${episodes.length}] ${label} ... `);

    try {
      execSync(
        `python3 -m yt_dlp -x --audio-format mp3 --audio-quality 5 --cookies-from-browser firefox -o "${mp3.replace(/\\/g, "/")}" "https://www.youtube.com/watch?v=${ytId}" --quiet --no-warnings`,
        { timeout: 120000 }
      );
      console.log("✓ downloaded");
      downloaded++;
    } catch {
      console.log("✗ unavailable");
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDownloaded: ${downloaded} | Failed/unavailable: ${failed}`);
  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
