import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

/**
 * Fetch YouTube publish dates for episodes missing airDate.
 * Uses the YouTube Data API v3 videos endpoint (batch of 50 IDs per request).
 */

const API_KEY = process.env.YOUTUBE_API_KEY;
if (!API_KEY) {
  console.error("YOUTUBE_API_KEY not set");
  process.exit(1);
}

const BATCH_SIZE = 50; // YouTube API allows up to 50 IDs per request

interface YTSnippet {
  publishedAt: string;
  title: string;
}

interface YTVideoItem {
  id: string;
  snippet: YTSnippet;
}

interface YTResponse {
  items: YTVideoItem[];
}

async function fetchVideoBatch(videoIds: string[]): Promise<Map<string, Date>> {
  const ids = videoIds.join(",");
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ids}&key=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API error ${res.status}: ${text}`);
  }

  const data: YTResponse = await res.json();
  const dateMap = new Map<string, Date>();

  for (const item of data.items) {
    dateMap.set(item.id, new Date(item.snippet.publishedAt));
  }

  return dateMap;
}

async function main() {
  const p = getPrisma();

  // Get all episodes with null airDate that have a YouTube ID
  const episodes = await p.episode.findMany({
    where: { airDate: null, youtubeVideoId: { not: null } },
    select: { id: true, slug: true, youtubeVideoId: true, title: true },
    orderBy: { episodeNumber: "asc" },
  });

  console.log(`Found ${episodes.length} episodes with null airDate and YouTube IDs\n`);

  if (episodes.length === 0) {
    console.log("Nothing to do.");
    await disconnect();
    return;
  }

  let updated = 0;
  let failed = 0;
  let notFound = 0;

  // Process in batches of 50
  for (let i = 0; i < episodes.length; i += BATCH_SIZE) {
    const batch = episodes.slice(i, i + BATCH_SIZE);
    const videoIds = batch.map((e) => e.youtubeVideoId!);

    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: fetching ${batch.length} videos...`);

    try {
      const dateMap = await fetchVideoBatch(videoIds);

      for (const ep of batch) {
        const publishDate = dateMap.get(ep.youtubeVideoId!);
        if (publishDate) {
          await p.episode.update({
            where: { id: ep.id },
            data: { airDate: publishDate },
          });
          updated++;
        } else {
          notFound++;
          console.log(`  Not found: ${ep.youtubeVideoId} — ${ep.title?.slice(0, 50)}`);
        }
      }

      console.log(`  Updated ${dateMap.size} / ${batch.length}`);
    } catch (err) {
      console.error(`  Batch failed:`, err instanceof Error ? err.message : err);
      failed += batch.length;
    }

    // Small delay between batches to be polite
    if (i + BATCH_SIZE < episodes.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log(`\nDone: ${updated} updated, ${notFound} not found on YouTube, ${failed} failed`);
  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
