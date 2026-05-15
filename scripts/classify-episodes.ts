import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

interface Rule {
  seriesSlug: string;
  contentType: "livestream" | "original" | "short" | "clip";
  match: (title: string, epNum: number | null) => boolean;
}

const RULES: Rule[] = [
  // Shorts & Clips — check first (most specific hashtag patterns)
  { seriesSlug: "shorts-and-clips", contentType: "short", match: (t) => /#shorts/i.test(t) || /#tiktoklive/i.test(t) || /^#\w+/i.test(t) || /#livehighlights/i.test(t) },

  // Live Streams
  { seriesSlug: "psyche-awakens-tarot", contentType: "livestream", match: (t, n) => /psyche awakens tarot/i.test(t) && (n ?? 999) <= 84 },
  { seriesSlug: "open-panel", contentType: "livestream", match: (t) => /open panel/i.test(t) },
  { seriesSlug: "midnight-madness", contentType: "livestream", match: (t) => /midnight madness/i.test(t) },
  { seriesSlug: "troll-tribunal", contentType: "livestream", match: (t) => /troll tribunal/i.test(t) || /troll side of the panel/i.test(t) },
  { seriesSlug: "weekday-streams", contentType: "livestream", match: (t) => /^(tuesday|wednesday|thursday|friday|saturday|sunday)\s+(afternoon|morning|night|stream)/i.test(t) || /chill friday/i.test(t) || /friday night with psyche/i.test(t) || /saturday night alive/i.test(t) || /^happy (friday|saturday|thursday)/i.test(t) },
  { seriesSlug: "classic-cult-of-psyche", contentType: "clip", match: (t) => /^classic cult of psyche/i.test(t) },

  // Original Content
  { seriesSlug: "music-videos", contentType: "original", match: (t) => /music video/i.test(t) || /official music video/i.test(t) },
  { seriesSlug: "journey-through-the-tarot", contentType: "original", match: (t) => /journey through the tarot/i.test(t) },
  { seriesSlug: "baital-pachchisi-tales", contentType: "original", match: (t) => /bai?tal\s*(pa|ch)/i.test(t) },
  { seriesSlug: "the-golden-ass", contentType: "original", match: (t) => /the golden ass/i.test(t) },
  { seriesSlug: "quantum-scary-tales", contentType: "original", match: (t) => /scary tales?/i.test(t) || (/what really happened/i.test(t) && /(little|goldilocks|mermaid|riding hood|sleeping|duckling|frog|chicken|rumpel|beanstalk)/i.test(t)) },
  { seriesSlug: "uncle-wiggly-stories", contentType: "original", match: (t) => /uncle wigg/i.test(t) },
  { seriesSlug: "secrets-of-the-mahavidyas", contentType: "original", match: (t) => /mahavidya/i.test(t) || /secrets of the mahavidyas/i.test(t) || /(goddess\s+(kali|tara|bagalamukhi|matangi|kameshvari|lalitha|tripura))/i.test(t) },
  { seriesSlug: "64-divine-arts", contentType: "original", match: (t) => /divine art(s?)\s*(of|#|series)/i.test(t) || /^#?\d+\s*the divine art/i.test(t) },
  { seriesSlug: "astrology-deep-dives", contentType: "original", match: (t) => /astrology deep dive/i.test(t) || /astrological (deep dive|analysis)/i.test(t) || /vedic (horoscope|astrology)/i.test(t) || /sabian symbols/i.test(t) },
  { seriesSlug: "trollopedia", contentType: "original", match: (t) => /trollopedia/i.test(t) || /troll decoder/i.test(t) || /panelverse troll/i.test(t) },
  { seriesSlug: "mythology-and-lore", contentType: "original", match: (t) => /(inanna|ceridwen|taliesin|urvasi|mohini|ganesh|arachne|athena|cupid and psyche|dead sea scrolls|jezebel|yakshini|dakini)/i.test(t) },
];

async function main() {
  const prisma = getPrisma();

  // Load series slugs → IDs
  const allSeries = await prisma.series.findMany({ select: { id: true, slug: true } });
  const seriesMap = new Map(allSeries.map((s) => [s.slug, s.id]));

  // Load all episodes
  const episodes = await prisma.episode.findMany({
    select: { id: true, title: true, slug: true, episodeNumber: true, seriesId: true },
    orderBy: { episodeNumber: "asc" },
  });

  let matched = 0;
  let skipped = 0;
  const unmatched: string[] = [];

  for (const ep of episodes) {
    const rule = RULES.find((r) => r.match(ep.title, ep.episodeNumber));
    if (rule) {
      const seriesId = seriesMap.get(rule.seriesSlug);
      if (!seriesId) { console.error(`  ✗ No series ID for slug: ${rule.seriesSlug}`); continue; }
      await prisma.episode.update({
        where: { id: ep.id },
        data: {
          series: { connect: { id: seriesId } },
          contentType: rule.contentType,
        },
      });
      matched++;
    } else {
      unmatched.push(`${ep.episodeNumber}|${ep.title}`);
      skipped++;
    }
  }

  console.log(`\nMatched: ${matched}, Unmatched: ${skipped}`);
  if (unmatched.length > 0) {
    const unmatchedPath = "scripts/unmatched-episodes.txt";
    require("fs").writeFileSync(unmatchedPath, unmatched.join("\n"));
    console.log(`Unmatched episodes saved to ${unmatchedPath}`);
  }

  await disconnect();
}

main();
