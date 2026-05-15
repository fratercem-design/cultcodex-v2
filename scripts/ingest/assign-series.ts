// scripts/ingest/assign-series.ts
// Auto-assigns unassigned episodes to series based on title/contentType patterns
import "dotenv/config";
import { getPrisma, disconnect } from "./lib";

interface SeriesRule {
  seriesSlug: string;
  match: (title: string, contentType: string | null) => boolean;
}

// Rules are checked in order — first match wins
const RULES: SeriesRule[] = [
  // Shorts → "Shorts & Clips"
  {
    seriesSlug: "shorts-and-clips",
    match: (_title, ct) => ct === "short" || ct === "clip",
  },
  // Psyche Awakens VODs / Tarot readings
  {
    seriesSlug: "psyche-awakens-tarot",
    match: (title) =>
      /psyche awakens/i.test(title) ||
      /psyche.*tarot/i.test(title) ||
      /tarot\s*(reading|guidance|spread|pull)/i.test(title) ||
      /cat\s*tarot/i.test(title) ||
      /\bVOD\b.*psyche/i.test(title),
  },
  // Astrology episodes
  {
    seriesSlug: "astrology-deep-dives",
    match: (title) =>
      /\b(zodiac|horoscope|horroroscope|astrolog|mercury retrograde|venus in|mars in|saturn in|jupiter in|12th house|rising sign|natal chart|sun sign|moon sign|birth chart|all.*signs)/i.test(title),
  },
  // Mythology & Lore
  {
    seriesSlug: "mythology-and-lore",
    match: (title) =>
      /\b(mytholog|ancient.*gods?|goddess|greek myth|egyptian myth|norse|mahavidya|shiva|kali|vishnu|ganesh|deity|pantheon|occult history|esoteric|kabbalah|alchemy|hermetic|gnostic)/i.test(title),
  },
  // Music Videos
  {
    seriesSlug: "music-videos",
    match: (title) =>
      /\b(music video|official video|song for you|lyric video|AMC Tony)/i.test(title) ||
      /\b(choo choo|conductor)/i.test(title),
  },
  // Quantum Scary Tales
  {
    seriesSlug: "quantum-scary-tales",
    match: (title) => /quantum scary|scary tale|horror.*story|creepypasta|ghost stor/i.test(title),
  },
  // Baital / Vetala tales
  {
    seriesSlug: "baital-pachchisi-tales",
    match: (title) => /baital|vetala|vampire.*tale/i.test(title),
  },
  // Golden Ass
  {
    seriesSlug: "the-golden-ass",
    match: (title) => /golden ass|apuleius/i.test(title),
  },
  // Uncle Wiggly
  {
    seriesSlug: "uncle-wiggly-stories",
    match: (title) => /uncle wigg/i.test(title),
  },
  // Troll Tribunal
  {
    seriesSlug: "troll-tribunal",
    match: (title) => /troll tribunal/i.test(title),
  },
  // Trollopedia
  {
    seriesSlug: "trollopedia",
    match: (title) => /trollopedia/i.test(title),
  },
  // Midnight Madness
  {
    seriesSlug: "midnight-madness",
    match: (title) => /midnight madness/i.test(title),
  },
  // Weekday Streams (catch-all for generic livestreams)
  // Only match if title suggests a weekday/daily stream
  {
    seriesSlug: "weekday-streams",
    match: (title, ct) =>
      ct === "livestream" && /\b(monday|tuesday|wednesday|thursday|friday|weekday|daily|morning stream|night stream)\b/i.test(title),
  },
  // Open Panel — catch-all for remaining livestreams that mention panel/live/chat
  {
    seriesSlug: "open-panel",
    match: (_title, ct) => ct === "livestream",
  },
];

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const prisma = getPrisma();

  // Load series slugs → IDs
  const allSeries = await prisma.series.findMany({
    select: { id: true, slug: true, title: true },
  });
  const seriesMap = new Map(allSeries.map((s) => [s.slug, s]));

  // Validate all rules reference existing series
  for (const rule of RULES) {
    if (!seriesMap.has(rule.seriesSlug)) {
      console.error(`ERROR: Series slug "${rule.seriesSlug}" not found in DB`);
      console.log("Available:", allSeries.map((s) => s.slug).join(", "));
      await disconnect();
      process.exit(1);
    }
  }

  // Get unassigned episodes
  const unassigned = await prisma.episode.findMany({
    where: { seriesId: null },
    select: { id: true, title: true, contentType: true, slug: true },
    orderBy: { episodeNumber: "asc" },
  });

  console.log(`Found ${unassigned.length} unassigned episodes`);

  const assignments: Record<string, number> = {};
  let matched = 0;
  let unmatched = 0;
  const unmatchedList: string[] = [];

  for (const ep of unassigned) {
    let assigned = false;
    for (const rule of RULES) {
      if (rule.match(ep.title, ep.contentType)) {
        const series = seriesMap.get(rule.seriesSlug)!;
        assignments[series.title] = (assignments[series.title] || 0) + 1;

        if (!dryRun) {
          await prisma.episode.update({
            where: { id: ep.id },
            data: { seriesId: series.id },
          });
        }

        matched++;
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      unmatched++;
      unmatchedList.push(`[${ep.contentType}] ${ep.title}`);
    }
  }

  console.log(`\n${dryRun ? "[DRY RUN] " : ""}Results:`);
  console.log(`  Matched: ${matched}`);
  console.log(`  Unmatched: ${unmatched}`);

  console.log("\nAssignments by series:");
  for (const [title, count] of Object.entries(assignments).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count.toString().padStart(4)} → ${title}`);
  }

  if (unmatchedList.length > 0 && unmatchedList.length <= 50) {
    console.log("\nUnmatched episodes:");
    for (const t of unmatchedList) console.log(`  ${t}`);
  } else if (unmatchedList.length > 50) {
    console.log(`\nFirst 30 unmatched:`);
    for (const t of unmatchedList.slice(0, 30)) console.log(`  ${t}`);
  }

  await disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  disconnect();
  process.exit(1);
});
