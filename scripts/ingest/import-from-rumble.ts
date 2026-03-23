// scripts/ingest/import-from-rumble.ts
// Reads rumble-psyche-awakens.txt, cross-references with DB by title, imports new episodes
import { readFileSync } from "fs";
import { getPrisma, disconnect, slugify, buildSearchText } from "./lib";

interface RumbleVideo {
  date: string; // MM/DD/YY
  title: string;
  rumbleId: string;
  rumbleUrl: string;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [m, d, y] = dateStr.split("/");
  if (!m || !d || !y) return null;
  const year = parseInt(y) + 2000; // "25" → 2025
  return new Date(`${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00Z`);
}

// Normalize title for fuzzy matching
function normalize(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const prisma = getPrisma();

  // Read rumble data
  const raw = readFileSync("scripts/ingest/data/rumble-psyche-awakens.txt", "utf-8").trim();
  const lines = raw.split("\n").filter(Boolean);

  const videos: RumbleVideo[] = lines.map((line) => {
    const parts = line.split("|");
    return {
      date: parts[0],
      title: parts[1],
      rumbleId: parts[2],
      rumbleUrl: parts[3],
    };
  });

  console.log(`Rumble videos found: ${videos.length}`);

  // Get all existing episodes from DB
  const existing = await prisma.episode.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      youtubeVideoId: true,
      rumbleVideoId: true,
    },
  });

  // Build lookup sets
  const existingRumbleIds = new Set(
    existing.filter((e) => e.rumbleVideoId).map((e) => e.rumbleVideoId)
  );
  const existingTitlesNorm = new Map<string, { id: string; title: string }>();
  for (const ep of existing) {
    existingTitlesNorm.set(normalize(ep.title), { id: ep.id, title: ep.title });
  }
  const existingSlugs = new Set(existing.map((e) => e.slug));

  console.log(`Existing episodes: ${existing.length}`);
  console.log(`Existing with Rumble IDs: ${existingRumbleIds.size}`);

  // Get current max episode number
  const maxEp = await prisma.episode.findFirst({
    orderBy: { episodeNumber: "desc" },
    select: { episodeNumber: true },
  });
  let nextNumber = (maxEp?.episodeNumber ?? 0) + 1;

  // Sort by date (oldest first)
  videos.sort((a, b) => {
    const da = parseDate(a.date);
    const db = parseDate(b.date);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da.getTime() - db.getTime();
  });

  let created = 0;
  let linked = 0; // existing episode got rumbleId added
  let skippedDupe = 0;
  let skippedSlug = 0;
  let errors = 0;

  for (const video of videos) {
    // Skip if rumbleId already in DB
    if (existingRumbleIds.has(video.rumbleId)) {
      skippedDupe++;
      continue;
    }

    const normTitle = normalize(video.title);

    // Check if there's an existing episode with a matching title
    const match = existingTitlesNorm.get(normTitle);
    if (match) {
      // Link the Rumble ID to the existing episode
      try {
        await prisma.episode.update({
          where: { id: match.id },
          data: { rumbleVideoId: video.rumbleId },
        });
        existingRumbleIds.add(video.rumbleId);
        linked++;
        console.log(`  🔗 Linked: "${video.title}" → existing "${match.title}"`);
      } catch (err: any) {
        console.log(`  ERROR linking: ${err.message?.slice(0, 100)}`);
        errors++;
      }
      continue;
    }

    // New episode — create it
    const slug = slugify(video.title);
    if (existingSlugs.has(slug)) {
      console.log(`  SKIP (slug exists): ${video.title}`);
      skippedSlug++;
      continue;
    }

    const airDate = parseDate(video.date);

    try {
      await prisma.episode.create({
        data: {
          title: video.title,
          slug,
          episodeNumber: nextNumber,
          airDate,
          rumbleVideoId: video.rumbleId,
          status: "draft",
          contentType: "livestream", // Rumble VODs are all livestream recordings
          searchText: buildSearchText(video.title, null),
        },
      });
      existingSlugs.add(slug);
      existingRumbleIds.add(video.rumbleId);
      console.log(`  ✓ EP.${nextNumber}: ${video.title}`);
      nextNumber++;
      created++;
    } catch (err: any) {
      console.log(`  ERROR: ${video.title} — ${err.message?.slice(0, 100)}`);
      errors++;
    }
  }

  console.log(`\n--- Results ---`);
  console.log(`Created: ${created} new episodes`);
  console.log(`Linked: ${linked} (added Rumble ID to existing episode)`);
  console.log(`Skipped (already has Rumble ID): ${skippedDupe}`);
  console.log(`Skipped (slug conflict): ${skippedSlug}`);
  console.log(`Errors: ${errors}`);

  await disconnect();
}

main();
