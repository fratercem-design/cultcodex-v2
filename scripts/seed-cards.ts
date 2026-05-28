/**
 * Seed the trading card system:
 *   1. Generate Card rows from existing Person, Episode, LoreEntry, Topic
 *   2. Create the default CardPack catalogue
 *
 * Run: npx tsx scripts/seed-cards.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { computeStats } from "../src/lib/cards/rarity";
import type { CardType, Rarity } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

// ─── Rarity helpers ──────────────────────────────────────────────────────────

function personRarity(type: string): Rarity {
  switch (type) {
    case "host":      return "ANOMALY";
    case "recurring": return "TRANSMISSION";
    case "guest":     return "SIGNAL";
    default:          return "STATIC";
  }
}

function loreRarity(status: string): Rarity {
  switch (status) {
    case "canonical":      return "TRANSMISSION";
    case "speculative":    return "SIGNAL";
    case "community_myth": return "SIGNAL";
    case "disputed":       return "STATIC";
    default:               return "STATIC";
  }
}

function episodeRarity(num: number | null): Rarity {
  if (!num) return "STATIC";
  if (num % 100 === 0) return "ANOMALY";
  if (num % 50 === 0) return "TRANSMISSION";
  if (num <= 20)       return "TRANSMISSION";
  return "SIGNAL";
}

// ─── Ability lists ───────────────────────────────────────────────────────────

const VOICE_ABILITIES: Record<string, string[]> = {
  host:      ["Recurring Presence", "Archive Authority"],
  recurring: ["Frequent Signal",    "Known Frequency"],
  guest:     ["Guest Transmission", "Signal Visitor"],
  mentioned: ["Signal Echo",        "Distant Frequency"],
};

const LORE_ABILITIES: Record<string, string[]> = {
  canonical:      ["Canon Confirmed", "Archive Verified"],
  speculative:    ["Unverified Signal", "Pending Decode"],
  community_myth: ["Community Legend", "Collective Memory"],
  disputed:       ["Signal Contested", "Decode Incomplete"],
  humorous:       ["Comic Relief", "Light Signal"],
};

// ─── Flavour texts ────────────────────────────────────────────────────────────

const EPISODE_FLAVOUR = [
  "Every transmission carries a fragment of the signal.",
  "Broadcast into the void, received by those who listen.",
  "The archive grows. The signal persists.",
  "Another frequency captured for eternity.",
];

const LORE_FLAVOUR = [
  "Carved into the Codex by the hands of the faithful.",
  "Truth is a spectrum. Clarity is earned.",
  "The canon reveals itself one entry at a time.",
  "Some signals are clear. Others require years to decode.",
];

const TOPIC_FLAVOUR = [
  "A node in the network of meaning.",
  "Every signal connects to a broader field.",
  "Mapped, catalogued, and woven into the archive.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Main seed ────────────────────────────────────────────────────────────────

async function seedCards() {
  console.log("🃏 Seeding trading cards...\n");
  let created = 0;
  let skipped = 0;

  // ── Person cards ────────────────────────────────────────────────────────────
  const people = await prisma.person.findMany({
    include: {
      _count: { select: { guestAppearances: true, topics: true, loreConnections: true } },
    },
    orderBy: { displayName: "asc" },
  });

  for (const person of people) {
    const slug = `voice-${person.slug}`;
    const existing = await prisma.card.findUnique({ where: { slug } });
    if (existing) { skipped++; continue; }

    const rarity = personRarity(person.personType);
    const abilities = VOICE_ABILITIES[person.personType] ?? VOICE_ABILITIES.guest;
    const { statA, statB, statC } = computeStats("VOICE", {
      appearanceCount: person._count.guestAppearances,
      personType: person.personType,
      topicCount: person._count.topics,
      loreCount: person._count.loreConnections,
    });

    await prisma.card.create({
      data: {
        slug,
        cardType: "VOICE" as CardType,
        rarity,
        personSlug: person.slug,
        title: person.displayName,
        subtitle: person.personType.toUpperCase(),
        flavourText: person.shortBio ? person.shortBio.slice(0, 80) : undefined,
        artUrl: person.avatarUrl ?? undefined,
        statA,
        statB,
        statC,
        abilities,
        totalMinted: 0,
        isActive: true,
      },
    });
    created++;
  }
  console.log(`✓ Voice cards: ${created} created, ${skipped} skipped`);
  created = 0; skipped = 0;

  // ── Episode cards ────────────────────────────────────────────────────────────
  const episodes = await prisma.episode.findMany({
    where: { status: "published" },
    include: {
      _count: { select: { guests: true, topics: true, segments: true } },
    },
    orderBy: { episodeNumber: "asc" },
    take: 500,
  });

  for (const ep of episodes) {
    const slug = `transmission-${ep.episodeNumber ?? ep.id}`;
    const existing = await prisma.card.findUnique({ where: { slug } });
    if (existing) { skipped++; continue; }

    const rarity = episodeRarity(ep.episodeNumber);
    const { statA, statB, statC } = computeStats("TRANSMISSION", {
      guestCount: ep._count.guests,
      topicCount: ep._count.topics,
      segmentCount: ep._count.segments,
    });

    await prisma.card.create({
      data: {
        slug,
        cardType: "TRANSMISSION" as CardType,
        rarity,
        episodeNumber: ep.episodeNumber ?? undefined,
        title: ep.title.slice(0, 60),
        subtitle: ep.episodeNumber ? `EP.${String(ep.episodeNumber).padStart(3, "0")}` : undefined,
        flavourText: pick(EPISODE_FLAVOUR),
        artUrl: ep.thumbnailUrl ?? undefined,
        statA,
        statB,
        statC,
        abilities: ep.episodeNumber && ep.episodeNumber % 100 === 0
          ? ["Milestone Broadcast", "Signal Peak"]
          : ["Live Transmission", "Archive Entry"],
        totalMinted: 0,
        isActive: true,
      },
    });
    created++;
  }
  console.log(`✓ Transmission cards: ${created} created, ${skipped} skipped`);
  created = 0; skipped = 0;

  // ── Lore cards ───────────────────────────────────────────────────────────────
  const loreEntries = await prisma.loreEntry.findMany({
    include: {
      _count: { select: { episodes: true, people: true, topics: true } },
    },
    orderBy: { title: "asc" },
  });

  for (const lore of loreEntries) {
    const slug = `lore-${lore.slug}`;
    const existing = await prisma.card.findUnique({ where: { slug } });
    if (existing) { skipped++; continue; }

    const rarity = loreRarity(lore.canonStatus);
    const { statA, statB, statC } = computeStats("LORE", {
      canonStatus: lore.canonStatus,
      episodeCount: lore._count.episodes,
      loreCount: lore._count.people,
      topicCount: lore._count.topics,
    });

    await prisma.card.create({
      data: {
        slug,
        cardType: "LORE" as CardType,
        rarity,
        loreSlug: lore.slug,
        title: lore.title.slice(0, 60),
        subtitle: lore.category?.toUpperCase() ?? lore.canonStatus.toUpperCase(),
        flavourText: lore.summary ? lore.summary.slice(0, 80) : pick(LORE_FLAVOUR),
        statA,
        statB,
        statC,
        abilities: LORE_ABILITIES[lore.canonStatus] ?? LORE_ABILITIES.speculative,
        totalMinted: 0,
        isActive: true,
      },
    });
    created++;
  }
  console.log(`✓ Lore cards: ${created} created, ${skipped} skipped`);
  created = 0; skipped = 0;

  // ── Topic / Signal cards ─────────────────────────────────────────────────────
  const topics = await prisma.topic.findMany({
    include: {
      _count: { select: { episodes: true, lore: true } },
    },
    orderBy: { title: "asc" },
    take: 200,
  });

  for (const topic of topics) {
    const slug = `signal-${topic.slug}`;
    const existing = await prisma.card.findUnique({ where: { slug } });
    if (existing) { skipped++; continue; }

    const { statA, statB, statC } = computeStats("SIGNAL", {
      episodeCount: topic._count.episodes,
      loreCount: topic._count.lore,
    });

    const rarity: Rarity = topic._count.episodes > 20 ? "TRANSMISSION"
                         : topic._count.episodes > 8  ? "SIGNAL"
                         : "STATIC";

    await prisma.card.create({
      data: {
        slug,
        cardType: "SIGNAL" as CardType,
        rarity,
        topicSlug: topic.slug,
        title: topic.title.slice(0, 60),
        subtitle: `${topic._count.episodes} transmissions`,
        flavourText: topic.description ? topic.description.slice(0, 80) : pick(TOPIC_FLAVOUR),
        statA,
        statB,
        statC,
        abilities: ["Signal Node", "Network Point"],
        totalMinted: 0,
        isActive: true,
      },
    });
    created++;
  }
  console.log(`✓ Signal cards: ${created} created, ${skipped} skipped`);

  // ─── Seed default packs ───────────────────────────────────────────────────
  console.log("\n📦 Seeding packs...");

  const packs = [
    {
      slug: "static-pack",
      title: "STATIC PACK",
      subtitle: "Your entry point into the archive",
      description: "A standard signal pack. Contains 3 cards from across the full archive.",
      flavourText: "All signals start somewhere.",
      cost: 50,
      cardCount: 3,
      accentColor: "neon",
      sortOrder: 1,
      weightStatic: 60, weightSignal: 28, weightTransmission: 10, weightAnomaly: 2, weightOracle: 0,
    },
    {
      slug: "signal-burst",
      title: "SIGNAL BURST",
      subtitle: "Higher yield. More noise.",
      description: "5 cards with boosted uncommon odds. Good for building breadth.",
      flavourText: "More cards. More signal. More chaos.",
      cost: 120,
      cardCount: 5,
      accentColor: "neon",
      sortOrder: 2,
      weightStatic: 40, weightSignal: 38, weightTransmission: 18, weightAnomaly: 3, weightOracle: 1,
    },
    {
      slug: "voice-pack",
      title: "VOICE PACK",
      subtitle: "Voices from the archive",
      description: "Cards biased toward Voice (person) entries. Hosts, guests, and recurring signals.",
      flavourText: "Every voice carries a frequency.",
      cost: 100,
      cardCount: 4,
      accentColor: "cyan",
      filterCardType: "VOICE" as CardType,
      sortOrder: 3,
      weightStatic: 45, weightSignal: 35, weightTransmission: 16, weightAnomaly: 4, weightOracle: 0,
    },
    {
      slug: "lore-pack",
      title: "LORE PACK",
      subtitle: "Entries from the Psychenomicon",
      description: "Cards drawn from the lore archive. Canonical entries have elevated pull rates.",
      flavourText: "The canon does not forget.",
      cost: 150,
      cardCount: 4,
      accentColor: "amber",
      filterCardType: "LORE" as CardType,
      sortOrder: 4,
      weightStatic: 35, weightSignal: 38, weightTransmission: 22, weightAnomaly: 4, weightOracle: 1,
    },
    {
      slug: "oracle-pack",
      title: "ORACLE PACK",
      subtitle: "Rare. Powerful. Costly.",
      description: "Guaranteed ANOMALY or ORACLE rarity in every pack. For the committed collector.",
      flavourText: "The Oracle speaks only to those who can afford to listen.",
      cost: 500,
      cardCount: 3,
      accentColor: "magenta",
      sortOrder: 5,
      weightStatic: 0, weightSignal: 0, weightTransmission: 50, weightAnomaly: 40, weightOracle: 10,
    },
  ] as const;

  for (const pack of packs) {
    const { filterCardType, ...rest } = pack as typeof pack & { filterCardType?: CardType };
    await prisma.cardPack.upsert({
      where: { slug: pack.slug },
      update: {},
      create: { ...rest, filterCardType: filterCardType ?? null },
    });
  }
  console.log(`✓ ${packs.length} packs seeded`);

  const total = await prisma.card.count();
  console.log(`\n✅ Total cards in database: ${total}`);
}

seedCards()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
