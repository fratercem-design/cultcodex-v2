import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

const SERIES = [
  // Live Streams
  { title: "Psyche Awakens Tarot", slug: "psyche-awakens-tarot", type: "tarot", description: "The original daily tarot live stream that started it all. Psyche reads tarot cards with cat companions and community vibes.", sortOrder: 1 },
  { title: "Open Panel", slug: "open-panel", type: "panel", description: "Open panel sessions featuring tarot readings, community discussions, cats, and unfiltered conversation.", sortOrder: 2 },
  { title: "Midnight Madness", slug: "midnight-madness", type: "panel", description: "Late night hangout streams with tarot, open panels, and after-dark energy.", sortOrder: 3 },
  { title: "Weekday Streams", slug: "weekday-streams", type: "panel", description: "Casual day-of-week hangout streams — Tuesday afternoons, Chill Fridays, Saturday specials.", sortOrder: 4 },
  { title: "Troll Tribunal", slug: "troll-tribunal", type: "panel", description: "Episodes dedicated to confronting, debating, and roasting trolls. The panel's dark side.", sortOrder: 5 },
  { title: "Classic Cult of Psyche", slug: "classic-cult-of-psyche", type: "other", description: "Recovered and remastered classic moments from the early days of the channel.", sortOrder: 6 },
  // Original Content
  { title: "Music Videos", slug: "music-videos", type: "music_video", description: "Original music videos produced by Cult of Psyche — from Lilith in Scorpio to Diabolique.", sortOrder: 10 },
  { title: "Journey Through the Tarot", slug: "journey-through-the-tarot", type: "tarot", description: "A structured walk through the Major Arcana, one card at a time.", sortOrder: 11 },
  { title: "Baital Pachchisi Tales", slug: "baital-pachchisi-tales", type: "story", description: "Retellings of the ancient Indian Baital Pachchisi (Vikram and the Vampire) stories.", sortOrder: 12 },
  { title: "The Golden Ass", slug: "the-golden-ass", type: "story", description: "A retelling of Apuleius' The Golden Ass, featuring the tale of Cupid and Psyche.", sortOrder: 13 },
  { title: "Quantum Scary Tales", slug: "quantum-scary-tales", type: "story", description: "Classic fairy tales retold through a quantum lens — what really happened to Goldilocks, Little Red Riding Hood, and more.", sortOrder: 14 },
  { title: "Uncle Wiggly Stories", slug: "uncle-wiggly-stories", type: "story", description: "Readings from the beloved Uncle Wiggly Longears stories.", sortOrder: 15 },
  { title: "Secrets of the Mahavidyas", slug: "secrets-of-the-mahavidyas", type: "documentary", description: "Deep dives into the ten Mahavidya goddesses of Hindu tantra — Kali, Tara, Matangi, and beyond.", sortOrder: 16 },
  { title: "64 Divine Arts", slug: "64-divine-arts", type: "documentary", description: "Exploring the 64 traditional arts and sciences — voice, sound, dance, and the skills that define civilization.", sortOrder: 17 },
  { title: "Astrology Deep Dives", slug: "astrology-deep-dives", type: "documentary", description: "In-depth astrological analysis — planetary placements, zodiac signs, birth charts, and cosmic insights.", sortOrder: 18 },
  { title: "Mythology & Lore", slug: "mythology-and-lore", type: "documentary", description: "Standalone retellings and explorations of myths from Greek, Hindu, Buddhist, Tibetan, and folk traditions.", sortOrder: 19 },
  { title: "Trollopedia", slug: "trollopedia", type: "documentary", description: "The comprehensive guide to understanding, identifying, and defeating digital trolls.", sortOrder: 20 },
  { title: "Shorts & Clips", slug: "shorts-and-clips", type: "other", description: "Quick takes, TikTok highlights, viral moments, and bite-sized content.", sortOrder: 30 },
] as const;

async function main() {
  const prisma = getPrisma();

  for (const s of SERIES) {
    await prisma.series.upsert({
      where: { slug: s.slug },
      update: { title: s.title, description: s.description, type: s.type, sortOrder: s.sortOrder, status: "published" },
      create: { title: s.title, slug: s.slug, description: s.description, type: s.type as any, sortOrder: s.sortOrder, status: "published" },
    });
    console.log(`  ✓ ${s.title}`);
  }

  console.log(`\nSeeded ${SERIES.length} series.`);
  await disconnect();
}

main();
