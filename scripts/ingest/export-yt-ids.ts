import { getPrisma, disconnect } from "./lib";
import { writeFileSync } from "fs";

async function main() {
  const prisma = getPrisma();
  const eps = await prisma.episode.findMany({
    where: { youtubeVideoId: { not: null } },
    select: { youtubeVideoId: true },
    orderBy: { episodeNumber: "asc" },
  });
  const ids = eps.map((e) => e.youtubeVideoId).join("\n");
  writeFileSync("scripts/ingest/data/all-yt-ids.txt", ids);
  console.log(`Wrote ${eps.length} IDs`);
  await disconnect();
}

main();
