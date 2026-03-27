import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

// Fix all series: publish them and assign proper types
const SERIES_TYPES: Record<string, string> = {
  "shorts-clips": "other",
  "psyche-awakens-tarot": "tarot",
  "astrology-deep-dives": "other",
  "mythology-lore": "story",
  "music-videos": "music_video",
  "quantum-scary-tales": "story",
  "baital-pachchisi-tales": "story",
  "the-golden-ass": "story",
  "uncle-wiggly-stories": "story",
  "troll-tribunal": "panel",
  "trollopedia": "documentary",
  "midnight-madness": "other",
  "weekday-streams": "other",
  "open-panel": "panel",
  "original-transmissions": "other",
};

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const p = getPrisma();

  const allSeries = await p.series.findMany({
    select: { id: true, title: true, slug: true, type: true, status: true },
  });

  for (const s of allSeries) {
    const newType = SERIES_TYPES[s.slug] ?? s.type;
    const needsUpdate = s.status !== "published" || s.type !== newType;

    if (needsUpdate) {
      console.log(`${s.title}: ${s.status}/${s.type} → published/${newType}`);
      if (!dryRun) {
        await p.series.update({
          where: { id: s.id },
          data: { status: "published", type: newType as any },
        });
      }
    } else {
      console.log(`${s.title}: OK`);
    }
  }

  console.log(dryRun ? "\n[DRY RUN]" : "\nDone");
  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
