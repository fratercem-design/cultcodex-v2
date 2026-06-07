/**
 * Backfill missing airDate and/or duration for episodes that have a YouTube ID.
 *
 * Run modes:
 *   --audit          print a summary only, no DB writes (default)
 *   --fix-airdates   backfill null airDate from YouTube publishedAt
 *   --fix-durations  backfill null / malformed duration from YouTube contentDetails
 *   --fix-all        both of the above
 *
 * Usage:
 *   npx tsx scripts/backfill-episode-metadata.ts --audit
 *   YOUTUBE_API_KEY=... npx tsx scripts/backfill-episode-metadata.ts --fix-all
 */

import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";
import { getYouTube, parseDuration } from "./scrape/lib";

const BATCH = 50; // YouTube Data API v3 max per request

const args = new Set(process.argv.slice(2));
const FIX_DATES = args.has("--fix-airdates") || args.has("--fix-all");
const FIX_DURATIONS = args.has("--fix-durations") || args.has("--fix-all");
const AUDIT_ONLY = !FIX_DATES && !FIX_DURATIONS;

// ── YouTube helpers ────────────────────────────────────────────────────────

interface YTVideo {
  id: string;
  snippet?: { publishedAt?: string };
  contentDetails?: { duration?: string };
}

async function fetchBatch(videoIds: string[]): Promise<Map<string, YTVideo>> {
  const yt = getYouTube();
  const parts: string[] = [];
  if (FIX_DATES || AUDIT_ONLY) parts.push("snippet");
  if (FIX_DURATIONS || AUDIT_ONLY) parts.push("contentDetails");

  const res = await yt.videos.list({ part: parts, id: videoIds });
  const map = new Map<string, YTVideo>();
  for (const item of res.data.items ?? []) {
    if (item.id) map.set(item.id, item as YTVideo);
  }
  return map;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const prisma = getPrisma();

  const total = await prisma.episode.count();

  const [missingDate, missingDuration, malformedDuration] = await Promise.all([
    prisma.episode.count({ where: { airDate: null } }),
    prisma.episode.count({ where: { duration: null } }),
    prisma.episode.count({ where: { duration: { contains: "NaN" } } }),
  ]);

  const missingDateYT = await prisma.episode.count({
    where: { airDate: null, youtubeVideoId: { not: null } },
  });
  const missingDurationYT = await prisma.episode.count({
    where: { OR: [{ duration: null }, { duration: { contains: "NaN" } }], youtubeVideoId: { not: null } },
  });

  console.log("\n── Episode Metadata Audit ─────────────────────────────────");
  console.log(`  Total episodes:           ${total}`);
  console.log(`  Missing airDate:          ${missingDate}  (${missingDateYT} have YouTube ID)`);
  console.log(`  Missing duration:         ${missingDuration}  (includes ${malformedDuration} malformed "NaN")`);
  console.log(`  Fixable via YouTube API:  airDate=${missingDateYT}, duration=${missingDurationYT}`);
  console.log("──────────────────────────────────────────────────────────\n");

  if (AUDIT_ONLY) {
    console.log("Audit only — pass --fix-all (or --fix-airdates / --fix-durations) to write fixes.");
    await disconnect();
    return;
  }

  if (!process.env.YOUTUBE_API_KEY) {
    console.error("Error: YOUTUBE_API_KEY not set");
    process.exit(1);
  }

  // Fetch episodes to fix
  const episodes = await prisma.episode.findMany({
    where: {
      youtubeVideoId: { not: null },
      OR: [
        ...(FIX_DATES ? [{ airDate: null }] : []),
        ...(FIX_DURATIONS ? [{ duration: null }, { duration: { contains: "NaN" } }] : []),
      ],
    },
    select: { id: true, slug: true, youtubeVideoId: true, airDate: true, duration: true },
    orderBy: { episodeNumber: "asc" },
  });

  if (episodes.length === 0) {
    console.log("Nothing to fix — all targeted fields are already populated.");
    await disconnect();
    return;
  }

  console.log(`Fetching metadata for ${episodes.length} episodes from YouTube API...\n`);

  let updatedDates = 0;
  let updatedDurations = 0;
  let notFound = 0;

  for (let i = 0; i < episodes.length; i += BATCH) {
    const batch = episodes.slice(i, i + BATCH);
    const ids = batch.map((e) => e.youtubeVideoId!);
    const batchNum = Math.floor(i / BATCH) + 1;
    const totalBatches = Math.ceil(episodes.length / BATCH);
    process.stdout.write(`Batch ${batchNum}/${totalBatches}...`);

    try {
      const ytMap = await fetchBatch(ids);

      for (const ep of batch) {
        const yt = ytMap.get(ep.youtubeVideoId!);
        if (!yt) {
          notFound++;
          continue;
        }

        const updates: Record<string, unknown> = {};

        if (FIX_DATES && ep.airDate === null && yt.snippet?.publishedAt) {
          updates.airDate = new Date(yt.snippet.publishedAt);
        }

        if (FIX_DURATIONS && (ep.duration === null || ep.duration?.includes("NaN"))) {
          const raw = yt.contentDetails?.duration;
          if (raw) {
            const parsed = parseDuration(raw);
            if (parsed) updates.duration = parsed;
          }
        }

        if (Object.keys(updates).length > 0) {
          await prisma.episode.update({ where: { id: ep.id }, data: updates });
          if (updates.airDate) updatedDates++;
          if (updates.duration) updatedDurations++;
        }
      }

      process.stdout.write(` done\n`);
    } catch (err) {
      process.stdout.write(` ERROR\n`);
      console.error(`  Batch ${batchNum} failed:`, err instanceof Error ? err.message : err);
    }

    if (i + BATCH < episodes.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log("\n── Results ────────────────────────────────────────────────");
  if (FIX_DATES) console.log(`  airDate backfilled:  ${updatedDates}`);
  if (FIX_DURATIONS) console.log(`  duration backfilled: ${updatedDurations}`);
  console.log(`  not found on YouTube: ${notFound}`);
  console.log("──────────────────────────────────────────────────────────");

  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
