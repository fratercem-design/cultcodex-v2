import { getPrisma, disconnect } from "./lib";
import { readFileSync } from "fs";

async function main() {
  const prisma = getPrisma();
  const ids = readFileSync("scripts/ingest/data/unavailable-yt-ids.txt", "utf-8")
    .trim().split("\n").filter(Boolean);

  console.log(`Looking up ${ids.length} unavailable video IDs...\n`);

  for (const videoId of ids) {
    const ep = await prisma.episode.findFirst({
      where: { youtubeVideoId: videoId },
      select: { id: true, episodeNumber: true, title: true, contentType: true, status: true, youtubeVideoId: true },
    });
    if (ep) {
      console.log(`EP.${ep.episodeNumber} | ${ep.contentType} | ${ep.title}`);
      console.log(`  https://www.youtube.com/watch?v=${ep.youtubeVideoId}`);
    } else {
      console.log(`NOT IN DB: ${videoId}`);
    }
  }

  await disconnect();
}

main();
