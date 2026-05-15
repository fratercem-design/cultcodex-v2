// scripts/ingest/import-from-youtube.ts
// Reads yt-videos.txt, cross-references with DB, imports missing episodes
import { readFileSync } from "fs";
import { getPrisma, disconnect, slugify, buildSearchText } from "./lib";

interface YTVideo {
  videoId: string;
  title: string;
  uploadDate: string; // YYYYMMDD or "NA"
  duration: number; // seconds
}

function parseDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === "NA") return null;
  const y = dateStr.slice(0, 4);
  const m = dateStr.slice(4, 6);
  const d = dateStr.slice(6, 8);
  return new Date(`${y}-${m}-${d}T00:00:00Z`);
}

async function main() {
  const prisma = getPrisma();

  // Read yt-dlp output
  const raw = readFileSync("scripts/ingest/data/yt-videos.txt", "utf-8").trim();
  const lines = raw.split("\n").filter(Boolean);

  const videos: YTVideo[] = lines.map((line) => {
    const parts = line.split("|");
    return {
      videoId: parts[0],
      title: parts[1],
      uploadDate: parts[2],
      duration: parseFloat(parts[3]) || 0,
    };
  });

  console.log(`YouTube videos found: ${videos.length}`);

  // Get all existing YouTube video IDs from DB
  const existing = await prisma.episode.findMany({
    select: { youtubeVideoId: true },
    where: { youtubeVideoId: { not: null } },
  });
  const existingIds = new Set(existing.map((e) => e.youtubeVideoId));
  console.log(`Existing episodes with YouTube IDs: ${existingIds.size}`);

  // Filter to only new videos
  const newVideos = videos.filter((v) => !existingIds.has(v.videoId));
  console.log(`New videos to import: ${newVideos.length}`);

  if (newVideos.length === 0) {
    console.log("Nothing to import.");
    await disconnect();
    return;
  }

  // Get the current max episode number
  const maxEp = await prisma.episode.findFirst({
    orderBy: { episodeNumber: "desc" },
    select: { episodeNumber: true },
  });
  let nextNumber = (maxEp?.episodeNumber ?? 0) + 1;

  // Sort new videos by upload date (oldest first) so numbering makes sense
  newVideos.sort((a, b) => {
    const da = a.uploadDate === "NA" ? "99999999" : a.uploadDate;
    const db = b.uploadDate === "NA" ? "99999999" : b.uploadDate;
    return da.localeCompare(db);
  });

  let created = 0;
  let skipped = 0;

  for (const video of newVideos) {
    const slug = slugify(video.title);

    // Check slug uniqueness
    const slugExists = await prisma.episode.findUnique({ where: { slug } });
    if (slugExists) {
      console.log(`  SKIP (slug exists): ${video.title}`);
      skipped++;
      continue;
    }

    const airDate = parseDate(video.uploadDate);
    const duration = video.duration > 0 ? parseDuration(video.duration) : null;
    const thumbnailUrl = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;

    try {
      await prisma.episode.create({
        data: {
          title: video.title,
          slug,
          episodeNumber: nextNumber,
          airDate,
          duration,
          youtubeVideoId: video.videoId,
          thumbnailUrl,
          status: "draft",
          contentType: video.duration > 0 && video.duration <= 90 ? "short" : video.duration > 0 && video.duration > 3600 ? "livestream" : "original",
          searchText: buildSearchText(video.title, null),
        },
      });
      console.log(`  ✓ EP.${nextNumber}: ${video.title}`);
      nextNumber++;
      created++;
    } catch (err: any) {
      console.log(`  ERROR: ${video.title} — ${err.message?.slice(0, 100)}`);
      skipped++;
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped`);
  await disconnect();
}

main();
