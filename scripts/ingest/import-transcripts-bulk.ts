// scripts/ingest/import-transcripts-bulk.ts
// Imports raw YouTube transcript JSONs (offset/duration/text) into TranscriptSegment table
// Maps videoId → episode via youtubeVideoId column
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { getPrisma, disconnect } from "./lib";

const TRANSCRIPTS_DIR = path.join(__dirname, "..", "scrape", "data", "transcripts");

interface RawSegment {
  offset: number;   // ms
  duration: number;  // ms
  text: string;
}

async function main() {
  const prisma = getPrisma();
  const batchSize = parseInt(process.argv[2] || "0", 10); // 0 = all

  // Build videoId → episodeId map
  const episodes = await prisma.episode.findMany({
    where: { youtubeVideoId: { not: null } },
    select: { id: true, youtubeVideoId: true, slug: true },
  });
  const videoToEpisode = new Map<string, { id: string; slug: string }>();
  for (const ep of episodes) {
    if (ep.youtubeVideoId) {
      videoToEpisode.set(ep.youtubeVideoId, { id: ep.id, slug: ep.slug });
    }
  }
  console.log(`Mapped ${videoToEpisode.size} episodes with YouTube IDs`);

  // Check which episodes already have transcripts
  const episodesWithTranscripts = await prisma.transcriptSegment.groupBy({
    by: ["episodeId"],
  });
  const alreadyImported = new Set(episodesWithTranscripts.map((e) => e.episodeId));
  console.log(`${alreadyImported.size} episodes already have transcript segments`);

  // List transcript files
  const files = fs.readdirSync(TRANSCRIPTS_DIR).filter((f) => f.endsWith(".json"));
  console.log(`Found ${files.length} transcript files on disk`);

  let imported = 0;
  let skipped = 0;
  let noMatch = 0;
  let failed = 0;
  let totalSegments = 0;

  const toProcess = batchSize > 0 ? files.slice(0, batchSize) : files;

  for (const file of toProcess) {
    const videoId = path.basename(file, ".json");
    const episode = videoToEpisode.get(videoId);

    if (!episode) {
      noMatch++;
      continue;
    }

    if (alreadyImported.has(episode.id)) {
      skipped++;
      continue;
    }

    try {
      const raw: RawSegment[] = JSON.parse(
        fs.readFileSync(path.join(TRANSCRIPTS_DIR, file), "utf-8")
      );

      if (raw.length === 0) {
        skipped++;
        continue;
      }

      // Convert to DB format and batch insert
      const data = raw.map((seg) => ({
        episodeId: episode.id,
        startSeconds: Math.round(seg.offset / 1000),
        endSeconds: Math.round((seg.offset + seg.duration) / 1000),
        text: seg.text,
        searchText: seg.text.toLowerCase(),
        speakerLabel: null as string | null,
      }));

      // Use createMany for speed. The alreadyImported snapshot above is taken
      // once per run, so a concurrent ingest can beat us to an episode —
      // skipDuplicates (backed by the natural-key unique index) makes that a
      // silent no-op instead of a second copy.
      await prisma.transcriptSegment.createMany({ data, skipDuplicates: true });

      totalSegments += data.length;
      imported++;

      if (imported % 50 === 0) {
        console.log(`  ... ${imported} episodes imported (${totalSegments} segments)`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  FAIL ${videoId} (${episode.slug}): ${msg}`);
      failed++;
    }
  }

  console.log(`\nDone:`);
  console.log(`  ${imported} episodes imported (${totalSegments} segments)`);
  console.log(`  ${skipped} skipped (already imported or empty)`);
  console.log(`  ${noMatch} transcript files with no matching episode`);
  console.log(`  ${failed} failed`);

  await disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  disconnect();
  process.exit(1);
});
