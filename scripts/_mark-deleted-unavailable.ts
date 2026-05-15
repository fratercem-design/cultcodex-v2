import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

/**
 * Mark episodes whose YouTube videos no longer exist as unavailable.
 * Run after _fix-airdates-youtube.ts to clean up the residue.
 */
const DELETED_VIDEO_IDS = [
  "Xutjua36EaY", // EP 10 - Man Flying Through the Clouds
  "RPHIrqi_wIo", // EP 694 - The Wacky Adventures of KZ
  "3IbKCBsu7hQ", // EP 695 - Raid plan: go to Danny Stranger
];

async function main() {
  const p = getPrisma();
  const eps = await p.episode.findMany({
    where: { youtubeVideoId: { in: DELETED_VIDEO_IDS } },
    select: { id: true, episodeNumber: true, title: true, status: true, youtubeVideoId: true },
  });

  console.log(`Found ${eps.length} episodes to mark unavailable:`);
  for (const ep of eps) {
    console.log(`  EP ${ep.episodeNumber} | yt:${ep.youtubeVideoId} | status:${ep.status} | ${ep.title?.slice(0, 60)}`);
  }

  const dryRun = !process.argv.includes("--execute");
  if (dryRun) {
    console.log("\nDRY RUN — pass --execute to apply.");
    await disconnect();
    return;
  }

  let updated = 0;
  for (const ep of eps) {
    if (ep.status === "unavailable") continue;
    await p.episode.update({
      where: { id: ep.id },
      data: { status: "unavailable" },
    });
    updated++;
  }
  console.log(`\nUpdated ${updated} episodes to status=unavailable`);
  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
