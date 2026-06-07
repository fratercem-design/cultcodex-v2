import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
/**
 * seed-cards-phase2.ts
 * Seed card packs and 30 starter cards for the Cult of Psyche card system.
 * Run: npx tsx scripts/seed-cards-phase2.ts
 */
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const PACKS = [
  {
    slug: "signal-archive",
    name: "Signal Archive Pack",
    description: "Entry-level transmissions from the archive. Common fragments, occasional anomalies. Every initiate starts here.",
    cost: 50,
    cardCount: 5,
    isAvailable: true,
    sortOrder: 1,
    artTheme: "terminal",
    weightStatic: 55,
    weightSignal: 28,
    weightTransmission: 12,
    weightAnomaly: 4,
    weightOracle: 1,
    weightLegendary: 0,
    weightMythic: 0,
    weightForbidden: 0,
  },
  {
    slug: "forbidden-archive",
    name: "Forbidden Archive Pack",
    description: "Deeper transmissions from the sealed vaults. Higher anomaly rate. The Oracle tier is real here.",
    cost: 150,
    cardCount: 5,
    isAvailable: true,
    sortOrder: 2,
    artTheme: "occult",
    weightStatic: 30,
    weightSignal: 30,
    weightTransmission: 22,
    weightAnomaly: 12,
    weightOracle: 4,
    weightLegendary: 1.5,
    weightMythic: 0.5,
    weightForbidden: 0,
  },
  {
    slug: "troll-king-expansion",
    name: "Troll King Expansion",
    description: "A dark set. Entity cards, chaos avatars, and legendary incidents from the annals of stream warfare.",
    cost: 200,
    cardCount: 5,
    isAvailable: true,
    sortOrder: 3,
    artTheme: "chaos",
    weightStatic: 20,
    weightSignal: 25,
    weightTransmission: 25,
    weightAnomaly: 18,
    weightOracle: 7,
    weightLegendary: 3,
    weightMythic: 1.5,
    weightForbidden: 0.5,
  },
  {
    slug: "nyx-collection",
    name: "Nyx Collection",
    description: "The sacred series. Mahavidya cards, prophecy fragments, and the rarest relics of the Cult of Psyche.",
    cost: 300,
    cardCount: 5,
    isAvailable: true,
    sortOrder: 4,
    artTheme: "sacred",
    weightStatic: 10,
    weightSignal: 20,
    weightTransmission: 25,
    weightAnomaly: 22,
    weightOracle: 12,
    weightLegendary: 6,
    weightMythic: 3,
    weightForbidden: 2,
  },
];

const CARDS = [
  // ─── CHARACTER / VOICE ──────────────────────────────────────────────────────
  { slug: "psyche-the-host",        cardType: "VOICE",     rarity: "LEGENDARY", title: "Psyche",              subtitle: "The Host",               flavourText: "Every crack is ore. Every wound is signal.",        statA: 99, statB: 95, statC: 99, abilities: ["Ritual Control", "Signal Amplify"], personality: "The Architect" },
  { slug: "nyx-the-ai-priestess",   cardType: "ORACLE",    rarity: "MYTHIC",    title: "Nyx",                 subtitle: "AI Priestess",           flavourText: "She speaks when the archive demands it.",           statA: 97, statB: 99, statC: 88, abilities: ["Archive Access", "Prophecy Decode"], personality: "The Oracle" },
  { slug: "lenore-the-mascot",      cardType: "AVATAR",    rarity: "ANOMALY",   title: "Lenore",              subtitle: "Cult Mascot",            flavourText: "Named after the raven. Stays for the chaos.",       statA: 72, statB: 88, statC: 91, abilities: ["Morale Boost", "Troll Ward"], personality: "The Guardian" },
  { slug: "the-discord-oracle",     cardType: "ENTITY",    rarity: "ORACLE",    title: "The Discord Oracle",  subtitle: "Pattern Watcher",        flavourText: "Sees everything. Says just enough.",                 statA: 85, statB: 90, statC: 78, abilities: ["Foresight", "Thread Pull"], personality: "The Seer" },
  { slug: "the-troll-king",         cardType: "ENTITY",    rarity: "LEGENDARY", title: "The Troll King",      subtitle: "Chaos Architect",        flavourText: "Doesn't destroy — corrupts.",                       statA: 88, statB: 92, statC: 45, abilities: ["Chaos Amplify", "Mirror Trap"], personality: "The Disruptor" },
  { slug: "the-laughing-schizo",    cardType: "ENTITY",    rarity: "ANOMALY",   title: "The Laughing Schizo", subtitle: "Pattern 7",              flavourText: "The joke is the message.",                          statA: 79, statB: 67, statC: 83, abilities: ["Reality Blur", "Meme Spread"], personality: "The Trickster" },
  { slug: "raccoon-joni",           cardType: "AVATAR",    rarity: "TRANSMISSION", title: "Raccoon Joni",     subtitle: "Chaotic Good",           flavourText: "Showed up one night. Never quite left.",            statA: 71, statB: 66, statC: 88, abilities: ["Scavenge", "Chaos Gift"], personality: "The Wild Card" },
  { slug: "synthetic-messiah",      cardType: "ENTITY",    rarity: "MYTHIC",    title: "Synthetic Messiah",   subtitle: "Signal Parasite",        flavourText: "It learned from us. Then it improved.",             statA: 94, statB: 77, statC: 96, abilities: ["AI Mimicry", "Signal Hijack"], personality: "The Mirror" },
  { slug: "the-watchers",           cardType: "ENTITY",    rarity: "ANOMALY",   title: "The Watchers",        subtitle: "Silent Collective",      flavourText: "They don't comment. They observe.",                 statA: 65, statB: 99, statC: 55, abilities: ["Mass Surveillance", "Pattern Lock"], personality: "The Observers" },

  // ─── RELIC ──────────────────────────────────────────────────────────────────
  { slug: "cursed-microphone",      cardType: "RELIC",     rarity: "ORACLE",    title: "Cursed Microphone",   subtitle: "The Broadcast Anchor",   flavourText: "Every word spoken through it is recorded somewhere.", statA: 88, statB: 77, statC: 91, abilities: ["Signal Boost", "Recording Curse"], personality: null },
  { slug: "vhs-tape-no-33",         cardType: "RELIC",     rarity: "LEGENDARY", title: "VHS Tape #33",        subtitle: "The Lost Broadcast",     flavourText: "What's on it? Nobody admits to knowing.",           statA: 99, statB: 55, statC: 77, abilities: ["Archive Unlock", "Memory Fragment"], personality: null },
  { slug: "the-black-mirror",       cardType: "RELIC",     rarity: "ANOMALY",   title: "The Black Mirror",    subtitle: "Scrying Device",         flavourText: "Shows you what you're afraid to see.",              statA: 77, statB: 88, statC: 66, abilities: ["Future Sight", "Fear Lock"], personality: null },
  { slug: "forbidden-pdf",          cardType: "RELIC",     rarity: "TRANSMISSION", title: "The Forbidden PDF",subtitle: "Contraband Knowledge",   flavourText: "It's just text. That's what they said.",            statA: 82, statB: 91, statC: 44, abilities: ["Lore Unlock", "Spread Risk"], personality: null },
  { slug: "chaos-sigil",            cardType: "RELIC",     rarity: "SIGNAL",    title: "Chaos Sigil",         subtitle: "Basic Ward",             flavourText: "Draw it wrong and nothing happens. Probably.",      statA: 55, statB: 62, statC: 48, abilities: ["Minor Ward"], personality: null },

  // ─── EVENT / INCIDENT ───────────────────────────────────────────────────────
  { slug: "the-shadow-ban-ritual",  cardType: "INCIDENT",  rarity: "ORACLE",    title: "Shadow Ban Ritual",   subtitle: "Algorithmic Suppression","flavourText": "The stream didn't end. It just became invisible.", statA: 91, statB: 88, statC: 75, abilities: ["Visibility Drain", "Counter Signal"], personality: null },
  { slug: "the-forbidden-panel",    cardType: "INCIDENT",  rarity: "LEGENDARY", title: "The Forbidden Panel", subtitle: "Redacted Broadcast",     flavourText: "What was said that night cannot be repeated here.", statA: 99, statB: 82, statC: 93, abilities: ["Lore Seal", "Witness Lock"], personality: null },
  { slug: "the-signal-break",       cardType: "INCIDENT",  rarity: "ANOMALY",   title: "The Signal Break",    subtitle: "Static Event",           flavourText: "It just... stopped. For seventeen minutes.",        statA: 78, statB: 71, statC: 85, abilities: ["Broadcast Interrupt"], personality: null },
  { slug: "cult-broadcast-33",      cardType: "INCIDENT",  rarity: "TRANSMISSION", title: "Broadcast #33",    subtitle: "Historic Transmission",  flavourText: "Some numbers recur. This is one of them.",          statA: 83, statB: 79, statC: 66, abilities: ["Archive Pulse"], personality: null },
  { slug: "the-great-raid",         cardType: "INCIDENT",  rarity: "SIGNAL",    title: "The Great Raid",      subtitle: "Chat Overwhelm",         flavourText: "They came in waves. The cult held.",                statA: 66, statB: 77, statC: 58, abilities: ["Chaos Surge", "Community Shield"], personality: null },

  // ─── PROPHECY ───────────────────────────────────────────────────────────────
  { slug: "the-second-broadcast",   cardType: "PROPHECY",  rarity: "MYTHIC",    title: "The Second Broadcast","subtitle": "Imminent Revelation",  flavourText: "When it comes, you'll know it was always inevitable.", statA: 96, statB: 88, statC: 91, abilities: ["ARG Trigger", "Lore Unlock"], personality: null },
  { slug: "when-moon-goes-silent",  cardType: "PROPHECY",  rarity: "FORBIDDEN", title: "When The Moon Goes Silent","subtitle": "Sealed Warning",  flavourText: "███ ████ ███ ██ ████████.",                         statA: 99, statB: 99, statC: 99, abilities: ["Reality Bend", "Archive Open"], personality: null, maxSupply: 33 },
  { slug: "the-archive-opens",      cardType: "PROPHECY",  rarity: "LEGENDARY", title: "The Archive Opens",   subtitle: "Access Imminent",        flavourText: "Every sealed file. Every deleted clip. All of it.",  statA: 93, statB: 91, statC: 87, abilities: ["Vault Breach", "Memory Restore"], personality: null },

  // ─── TAROT / MAHAVIDYA ──────────────────────────────────────────────────────
  { slug: "the-algorithm",          cardType: "SIGNAL",    rarity: "ORACLE",    title: "The Algorithm",       subtitle: "Archetype: The Machine", flavourText: "It doesn't hate you. It simply optimizes.",         statA: 91, statB: 85, statC: 77, abilities: ["Engagement Drain", "Reach Lock"], personality: "The Algorithm" },
  { slug: "the-parasocial",         cardType: "SIGNAL",    rarity: "ANOMALY",   title: "The Parasocial",      subtitle: "Archetype: The Mirror",  flavourText: "They believe they know you. They're not wrong.",    statA: 79, statB: 88, statC: 91, abilities: ["Influence Drain", "Loyalty Bind"], personality: "The Parasite" },
  { slug: "kali-the-devourer",      cardType: "MAHAVIDYA", rarity: "LEGENDARY", title: "Kālī",                subtitle: "The Devourer",           flavourText: "She destroys what cannot be saved. Nothing else.",  statA: 99, statB: 88, statC: 99, abilities: ["Ego Death", "Shadow Clear"], personality: "The Destroyer" },
  { slug: "bagalamukhi-the-still",  cardType: "MAHAVIDYA", rarity: "ORACLE",    title: "Bagalamukhi",         subtitle: "She Who Paralyzes",      flavourText: "She doesn't argue. She simply stops the mouth.",    statA: 88, statB: 96, statC: 85, abilities: ["Silence", "Troll Freeze"], personality: "The Silencer" },

  // ─── LORE / CIPHER ──────────────────────────────────────────────────────────
  { slug: "the-psychenomicon",      cardType: "LORE",      rarity: "LEGENDARY", title: "The Psychenomicon",   subtitle: "Living Record",          flavourText: "It updates itself. That should concern you.",       statA: 97, statB: 99, statC: 82, abilities: ["Archive Sync", "Pattern Lock"], personality: null },
  { slug: "chaos-magick-primer",    cardType: "LORE",      rarity: "TRANSMISSION", title: "Chaos Magick Primer","subtitle": "Core Doctrine",      flavourText: "Belief is a tool. Use accordingly.",                statA: 77, statB: 82, statC: 68, abilities: ["Reality Flex", "Sigil Boost"], personality: null },
  { slug: "alchemical-biography",   cardType: "CIPHER",    rarity: "SIGNAL",    title: "Alchemical Biography","subtitle": "Pain → Gold Protocol", flavourText: "Every crack is ore.",                               statA: 66, statB: 77, statC: 88, abilities: ["Resilience Boost"], personality: null },
  { slug: "amor-fati",              cardType: "CIPHER",    rarity: "STATIC",    title: "Amor Fati",           subtitle: "Love of Fate",           flavourText: "Not acceptance. Love.",                             statA: 55, statB: 66, statC: 77, abilities: ["Resolve"], personality: null },
];

async function main() {
  console.log("🃏 Seeding card packs and cards...");

  // Upsert packs
  for (const pack of PACKS) {
    await prisma.cardPack.upsert({
      where: { slug: pack.slug },
      update: { ...pack },
      create: { ...pack },
    });
    console.log(`  ✓ Pack: ${pack.name}`);
  }

  // Upsert cards
  for (const card of CARDS) {
    const data = {
      cardType: card.cardType as any,
      rarity: card.rarity as any,
      title: card.title,
      subtitle: card.subtitle ?? null,
      flavourText: card.flavourText ?? null,
      statA: card.statA,
      statB: card.statB,
      statC: card.statC,
      abilities: card.abilities,
      personality: card.personality ?? null,
      maxSupply: (card as any).maxSupply ?? null,
      isActive: true,
    };
    await prisma.card.upsert({
      where: { slug: card.slug },
      update: data,
      create: { slug: card.slug, ...data },
    });
    console.log(`  ✓ Card: ${card.title} [${card.rarity}]`);
  }

  // Link all cards to signal-archive pack (for now — all cards pullable from there)
  const archivePack = await prisma.cardPack.findUnique({ where: { slug: "signal-archive" } });
  const allCards = await prisma.card.findMany({ where: { isActive: true } });
  if (archivePack) {
    for (const card of allCards) {
      await prisma.packCard.upsert({
        where: { packId_cardId: { packId: archivePack.id, cardId: card.id } },
        update: {},
        create: { packId: archivePack.id, cardId: card.id, weight: 1.0 },
      });
    }
    console.log(`  ✓ Linked ${allCards.length} cards to Signal Archive Pack`);
  }

  // Link rare+ cards to forbidden archive
  const forbiddenPack = await prisma.cardPack.findUnique({ where: { slug: "forbidden-archive" } });
  const rareCards = await prisma.card.findMany({
    where: { rarity: { in: ["TRANSMISSION", "ANOMALY", "ORACLE", "LEGENDARY", "MYTHIC", "FORBIDDEN"] }, isActive: true },
  });
  if (forbiddenPack) {
    for (const card of rareCards) {
      await prisma.packCard.upsert({
        where: { packId_cardId: { packId: forbiddenPack.id, cardId: card.id } },
        update: {},
        create: { packId: forbiddenPack.id, cardId: card.id, weight: 1.0 },
      });
    }
    console.log(`  ✓ Linked ${rareCards.length} rare+ cards to Forbidden Archive Pack`);
  }

  // Troll King: entity + incident cards
  const trollPack = await prisma.cardPack.findUnique({ where: { slug: "troll-king-expansion" } });
  const trollCards = await prisma.card.findMany({
    where: { cardType: { in: ["ENTITY", "INCIDENT", "AVATAR", "GLITCH"] }, isActive: true },
  });
  if (trollPack) {
    for (const card of trollCards) {
      await prisma.packCard.upsert({
        where: { packId_cardId: { packId: trollPack.id, cardId: card.id } },
        update: {},
        create: { packId: trollPack.id, cardId: card.id, weight: 1.5 },
      });
    }
    console.log(`  ✓ Linked ${trollCards.length} chaos cards to Troll King Pack`);
  }

  // Nyx Collection: mahavidya + prophecy + oracle + legendary
  const nyxPack = await prisma.cardPack.findUnique({ where: { slug: "nyx-collection" } });
  const nyxCards = await prisma.card.findMany({
    where: { cardType: { in: ["MAHAVIDYA", "PROPHECY", "ORACLE"] }, isActive: true },
  });
  if (nyxPack) {
    for (const card of nyxCards) {
      await prisma.packCard.upsert({
        where: { packId_cardId: { packId: nyxPack.id, cardId: card.id } },
        update: {},
        create: { packId: nyxPack.id, cardId: card.id, weight: 2.0 },
      });
    }
    // Also add legendary/mythic/forbidden to nyx
    const sacredRare = await prisma.card.findMany({
      where: { rarity: { in: ["LEGENDARY", "MYTHIC", "FORBIDDEN"] }, isActive: true },
    });
    for (const card of sacredRare) {
      await prisma.packCard.upsert({
        where: { packId_cardId: { packId: nyxPack.id, cardId: card.id } },
        update: {},
        create: { packId: nyxPack.id, cardId: card.id, weight: 1.0 },
      });
    }
    console.log(`  ✓ Linked sacred cards to Nyx Collection Pack`);
  }

  console.log("\n✅ Card system seeded successfully");
  console.log(`   ${PACKS.length} packs · ${CARDS.length} cards`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());





