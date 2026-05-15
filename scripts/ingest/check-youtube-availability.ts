// scripts/ingest/check-youtube-availability.ts
// Checks YouTube thumbnail URLs to identify privatized/deleted videos in the DB
import { getPrisma, disconnect } from "./lib";

async function checkThumbnail(videoId: string): Promise<boolean> {
  try {
    const url = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    // YouTube returns 200 for all thumbnails, but private/deleted videos
    // get a tiny default placeholder (120 bytes). We check content-length.
    const contentLength = parseInt(res.headers.get("content-length") || "0", 10);
    // Default "no thumbnail" placeholder is very small (< 1KB)
    return contentLength > 1000;
  } catch {
    return false;
  }
}

async function main() {
  const prisma = getPrisma();

  const episodes = await prisma.episode.findMany({
    where: { youtubeVideoId: { not: null } },
    select: { id: true, episodeNumber: true, title: true, youtubeVideoId: true },
    orderBy: { episodeNumber: "asc" },
  });

  console.log(`Checking ${episodes.length} episodes with YouTube IDs...\n`);

  const unavailable: typeof episodes = [];
  const batchSize = 20;

  for (let i = 0; i < episodes.length; i += batchSize) {
    const batch = episodes.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (ep) => {
        const available = await checkThumbnail(ep.youtubeVideoId!);
        return { ep, available };
      })
    );

    for (const { ep, available } of results) {
      if (!available) {
        unavailable.push(ep);
        console.log(`  ✗ EP.${ep.episodeNumber}: ${ep.title} (${ep.youtubeVideoId})`);
      }
    }

    // Progress
    const checked = Math.min(i + batchSize, episodes.length);
    if (checked % 200 === 0 || checked === episodes.length) {
      console.log(`  ... checked ${checked}/${episodes.length}`);
    }
  }

  console.log(`\n=== RESULTS ===`);
  console.log(`Total checked: ${episodes.length}`);
  console.log(`Available: ${episodes.length - unavailable.length}`);
  console.log(`Unavailable/Private: ${unavailable.length}`);

  if (unavailable.length > 0) {
    console.log(`\nUnavailable video IDs:`);
    for (const ep of unavailable) {
      console.log(`  EP.${ep.episodeNumber} | ${ep.youtubeVideoId} | ${ep.title}`);
    }
  }

  await disconnect();
}

main();
