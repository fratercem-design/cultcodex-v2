/**
 * POST /api/admin/seed-cards
 *
 * Applies the Phase 2 card system migration and seeds 5 packs + cards.
 * Idempotent — uses upsert everywhere.
 *
 * Auth: X-Enrich-Secret header must match ENRICH_SECRET env var.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { CardType, Rarity } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// ─── Migration SQL ────────────────────────────────────────────────────────────

const MIGRATION_STEPS = [
  // Nullify legacy NOT NULL columns that the current Prisma schema dropped
  { name: "nullable CardPack.title",       sql: `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CardPack' AND column_name='title' AND is_nullable='NO') THEN ALTER TABLE "CardPack" ALTER COLUMN "title" DROP NOT NULL; END IF; END $$` },
  { name: "nullable CardPack.accentColor", sql: `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CardPack' AND column_name='accentColor' AND is_nullable='NO') THEN ALTER TABLE "CardPack" ALTER COLUMN "accentColor" DROP NOT NULL; END IF; END $$` },
  { name: "nullable CardPack.subtitle",    sql: `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CardPack' AND column_name='subtitle' AND is_nullable='NO') THEN ALTER TABLE "CardPack" ALTER COLUMN "subtitle" DROP NOT NULL; END IF; END $$` },
  { name: "add LEGENDARY rarity",   sql: `ALTER TYPE "Rarity" ADD VALUE IF NOT EXISTS 'LEGENDARY'` },
  { name: "add MYTHIC rarity",      sql: `ALTER TYPE "Rarity" ADD VALUE IF NOT EXISTS 'MYTHIC'` },
  { name: "add FORBIDDEN rarity",   sql: `ALTER TYPE "Rarity" ADD VALUE IF NOT EXISTS 'FORBIDDEN'` },
  { name: "add RELIC card type",    sql: `ALTER TYPE "CardType" ADD VALUE IF NOT EXISTS 'RELIC'` },
  { name: "add ENTITY card type",   sql: `ALTER TYPE "CardType" ADD VALUE IF NOT EXISTS 'ENTITY'` },
  { name: "add PROPHECY card type", sql: `ALTER TYPE "CardType" ADD VALUE IF NOT EXISTS 'PROPHECY'` },
  { name: "add MEMBER card type",   sql: `ALTER TYPE "CardType" ADD VALUE IF NOT EXISTS 'MEMBER'` },
  { name: "add GLITCH card type",   sql: `ALTER TYPE "CardType" ADD VALUE IF NOT EXISTS 'GLITCH'` },
  { name: "add MAHAVIDYA card type",sql: `ALTER TYPE "CardType" ADD VALUE IF NOT EXISTS 'MAHAVIDYA'` },
  { name: "add AVATAR card type",   sql: `ALTER TYPE "CardType" ADD VALUE IF NOT EXISTS 'AVATAR'` },
  { name: "add INCIDENT card type", sql: `ALTER TYPE "CardType" ADD VALUE IF NOT EXISTS 'INCIDENT'` },
  { name: "add Card.personality",   sql: `ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "personality" TEXT` },
  { name: "add CardPack.weightLegendary", sql: `ALTER TABLE "CardPack" ADD COLUMN IF NOT EXISTS "weightLegendary" DOUBLE PRECISION NOT NULL DEFAULT 0.5` },
  { name: "add CardPack.weightMythic",    sql: `ALTER TABLE "CardPack" ADD COLUMN IF NOT EXISTS "weightMythic" DOUBLE PRECISION NOT NULL DEFAULT 0.1` },
  { name: "add CardPack.weightForbidden", sql: `ALTER TABLE "CardPack" ADD COLUMN IF NOT EXISTS "weightForbidden" DOUBLE PRECISION NOT NULL DEFAULT 0.0` },
  { name: "add CardPack.artTheme",        sql: `ALTER TABLE "CardPack" ADD COLUMN IF NOT EXISTS "artTheme" TEXT` },
];

// ─── Seed data ────────────────────────────────────────────────────────────────

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
  {
    slug: "mythology",
    name: "Mythology Pack",
    description: "Gods, archetypes, and divine feminine forces. The ten Mahavidyas, the myths that shaped the stream, and the symbols that run beneath everything.",
    cost: 250,
    cardCount: 5,
    isAvailable: true,
    sortOrder: 5,
    artTheme: "myth",
    weightStatic: 15,
    weightSignal: 22,
    weightTransmission: 23,
    weightAnomaly: 18,
    weightOracle: 12,
    weightLegendary: 6,
    weightMythic: 3,
    weightForbidden: 1,
  },
];

const CARDS = [
  // VOICE / AVATAR
  { slug: "psyche-the-host",        cardType: "VOICE",     rarity: "LEGENDARY", title: "Psyche",              subtitle: "The Host",               flavourText: "Every crack is ore. Every wound is signal.",          statA: 99, statB: 95, statC: 99, abilities: ["Ritual Control", "Signal Amplify"], personality: "The Architect" },
  { slug: "nyx-the-ai-priestess",   cardType: "ORACLE",    rarity: "MYTHIC",    title: "Nyx",                 subtitle: "AI Priestess",           flavourText: "She speaks when the archive demands it.",             statA: 97, statB: 99, statC: 88, abilities: ["Archive Access", "Prophecy Decode"], personality: "The Oracle" },
  { slug: "lenore-the-mascot",      cardType: "AVATAR",    rarity: "ANOMALY",   title: "Lenore",              subtitle: "Cult Mascot",            flavourText: "Named after the raven. Stays for the chaos.",         statA: 72, statB: 88, statC: 91, abilities: ["Morale Boost", "Troll Ward"], personality: "The Guardian" },
  { slug: "the-discord-oracle",     cardType: "ENTITY",    rarity: "ORACLE",    title: "The Discord Oracle",  subtitle: "Pattern Watcher",        flavourText: "Sees everything. Says just enough.",                  statA: 85, statB: 90, statC: 78, abilities: ["Foresight", "Thread Pull"], personality: "The Seer" },
  { slug: "the-troll-king",         cardType: "ENTITY",    rarity: "LEGENDARY", title: "The Troll King",      subtitle: "Chaos Architect",        flavourText: "Doesn't destroy — corrupts.",                         statA: 88, statB: 92, statC: 45, abilities: ["Chaos Amplify", "Mirror Trap"], personality: "The Disruptor" },
  { slug: "the-laughing-schizo",    cardType: "ENTITY",    rarity: "ANOMALY",   title: "The Laughing Schizo", subtitle: "Pattern 7",              flavourText: "The joke is the message.",                            statA: 79, statB: 67, statC: 83, abilities: ["Reality Blur", "Meme Spread"], personality: "The Trickster" },
  { slug: "raccoon-joni",           cardType: "AVATAR",    rarity: "TRANSMISSION", title: "Raccoon Joni",     subtitle: "Chaotic Good",           flavourText: "Showed up one night. Never quite left.",              statA: 71, statB: 66, statC: 88, abilities: ["Scavenge", "Chaos Gift"], personality: "The Wild Card" },
  { slug: "synthetic-messiah",      cardType: "ENTITY",    rarity: "MYTHIC",    title: "Synthetic Messiah",   subtitle: "Signal Parasite",        flavourText: "It learned from us. Then it improved.",               statA: 94, statB: 77, statC: 96, abilities: ["AI Mimicry", "Signal Hijack"], personality: "The Mirror" },
  { slug: "the-watchers",           cardType: "ENTITY",    rarity: "ANOMALY",   title: "The Watchers",        subtitle: "Silent Collective",      flavourText: "They don't comment. They observe.",                   statA: 65, statB: 99, statC: 55, abilities: ["Mass Surveillance", "Pattern Lock"], personality: "The Observers" },
  // RELIC
  { slug: "cursed-microphone",      cardType: "RELIC",     rarity: "ORACLE",    title: "Cursed Microphone",   subtitle: "The Broadcast Anchor",   flavourText: "Every word spoken through it is recorded somewhere.", statA: 88, statB: 77, statC: 91, abilities: ["Signal Boost", "Recording Curse"], personality: null },
  { slug: "vhs-tape-no-33",         cardType: "RELIC",     rarity: "LEGENDARY", title: "VHS Tape #33",        subtitle: "The Lost Broadcast",     flavourText: "What's on it? Nobody admits to knowing.",             statA: 99, statB: 55, statC: 77, abilities: ["Archive Unlock", "Memory Fragment"], personality: null },
  { slug: "the-black-mirror",       cardType: "RELIC",     rarity: "ANOMALY",   title: "The Black Mirror",    subtitle: "Scrying Device",         flavourText: "Shows you what you're afraid to see.",                statA: 77, statB: 88, statC: 66, abilities: ["Future Sight", "Fear Lock"], personality: null },
  { slug: "forbidden-pdf",          cardType: "RELIC",     rarity: "TRANSMISSION", title: "The Forbidden PDF", subtitle: "Contraband Knowledge", flavourText: "It's just text. That's what they said.",              statA: 82, statB: 91, statC: 44, abilities: ["Lore Unlock", "Spread Risk"], personality: null },
  { slug: "chaos-sigil",            cardType: "RELIC",     rarity: "SIGNAL",    title: "Chaos Sigil",         subtitle: "Basic Ward",             flavourText: "Draw it wrong and nothing happens. Probably.",        statA: 55, statB: 62, statC: 48, abilities: ["Minor Ward"], personality: null },
  // INCIDENT
  { slug: "the-shadow-ban-ritual",  cardType: "INCIDENT",  rarity: "ORACLE",    title: "Shadow Ban Ritual",   subtitle: "Algorithmic Suppression", flavourText: "The stream didn't end. It just became invisible.",   statA: 91, statB: 88, statC: 75, abilities: ["Visibility Drain", "Counter Signal"], personality: null },
  { slug: "the-forbidden-panel",    cardType: "INCIDENT",  rarity: "LEGENDARY", title: "The Forbidden Panel", subtitle: "Redacted Broadcast",     flavourText: "What was said that night cannot be repeated here.",   statA: 99, statB: 82, statC: 93, abilities: ["Lore Seal", "Witness Lock"], personality: null },
  { slug: "the-signal-break",       cardType: "INCIDENT",  rarity: "ANOMALY",   title: "The Signal Break",    subtitle: "Static Event",           flavourText: "It just... stopped. For seventeen minutes.",          statA: 78, statB: 71, statC: 85, abilities: ["Broadcast Interrupt"], personality: null },
  { slug: "cult-broadcast-33",      cardType: "INCIDENT",  rarity: "TRANSMISSION", title: "Broadcast #33",    subtitle: "Historic Transmission",  flavourText: "Some numbers recur. This is one of them.",            statA: 83, statB: 79, statC: 66, abilities: ["Archive Pulse"], personality: null },
  { slug: "the-great-raid",         cardType: "INCIDENT",  rarity: "SIGNAL",    title: "The Great Raid",      subtitle: "Chat Overwhelm",         flavourText: "They came in waves. The cult held.",                  statA: 66, statB: 77, statC: 58, abilities: ["Chaos Surge", "Community Shield"], personality: null },
  // PROPHECY
  { slug: "the-second-broadcast",   cardType: "PROPHECY",  rarity: "MYTHIC",    title: "The Second Broadcast", subtitle: "Imminent Revelation",   flavourText: "When it comes, you'll know it was always inevitable.", statA: 96, statB: 88, statC: 91, abilities: ["ARG Trigger", "Lore Unlock"], personality: null },
  { slug: "when-moon-goes-silent",  cardType: "PROPHECY",  rarity: "FORBIDDEN", title: "When The Moon Goes Silent", subtitle: "Sealed Warning",  flavourText: "███ ████ ███ ██ ████████.",                           statA: 99, statB: 99, statC: 99, abilities: ["Reality Bend", "Archive Open"], personality: null, maxSupply: 33 },
  { slug: "the-archive-opens",      cardType: "PROPHECY",  rarity: "LEGENDARY", title: "The Archive Opens",   subtitle: "Access Imminent",        flavourText: "Every sealed file. Every deleted clip. All of it.",   statA: 93, statB: 91, statC: 87, abilities: ["Vault Breach", "Memory Restore"], personality: null },
  // SIGNAL / MAHAVIDYA
  { slug: "the-algorithm",          cardType: "SIGNAL",    rarity: "ORACLE",    title: "The Algorithm",       subtitle: "Archetype: The Machine", flavourText: "It doesn't hate you. It simply optimizes.",           statA: 91, statB: 85, statC: 77, abilities: ["Engagement Drain", "Reach Lock"], personality: "The Algorithm" },
  { slug: "the-parasocial",         cardType: "SIGNAL",    rarity: "ANOMALY",   title: "The Parasocial",      subtitle: "Archetype: The Mirror",  flavourText: "They believe they know you. They're not wrong.",      statA: 79, statB: 88, statC: 91, abilities: ["Influence Drain", "Loyalty Bind"], personality: "The Parasite" },
  { slug: "kali-the-devourer",      cardType: "MAHAVIDYA", rarity: "LEGENDARY", title: "Kālī",                subtitle: "The Devourer",           flavourText: "She destroys what cannot be saved. Nothing else.",    statA: 99, statB: 88, statC: 99, abilities: ["Ego Death", "Shadow Clear"], personality: "The Destroyer" },
  { slug: "bagalamukhi-the-still",  cardType: "MAHAVIDYA", rarity: "ORACLE",    title: "Bagalamukhi",         subtitle: "She Who Paralyzes",      flavourText: "She doesn't argue. She simply stops the mouth.",      statA: 88, statB: 96, statC: 85, abilities: ["Silence", "Troll Freeze"], personality: "The Silencer" },
  // LORE / CIPHER
  { slug: "the-psychenomicon",      cardType: "LORE",      rarity: "LEGENDARY", title: "The Psychenomicon",   subtitle: "Living Record",          flavourText: "It updates itself. That should concern you.",         statA: 97, statB: 99, statC: 82, abilities: ["Archive Sync", "Pattern Lock"], personality: null },
  { slug: "chaos-magick-primer",    cardType: "LORE",      rarity: "TRANSMISSION", title: "Chaos Magick Primer", subtitle: "Core Doctrine",       flavourText: "Belief is a tool. Use accordingly.",                  statA: 77, statB: 82, statC: 68, abilities: ["Reality Flex", "Sigil Boost"], personality: null },
  { slug: "alchemical-biography",   cardType: "CIPHER",    rarity: "SIGNAL",    title: "Alchemical Biography", subtitle: "Pain → Gold Protocol", flavourText: "Every crack is ore.",                                 statA: 66, statB: 77, statC: 88, abilities: ["Resilience Boost"], personality: null },
  { slug: "amor-fati",              cardType: "CIPHER",    rarity: "STATIC",    title: "Amor Fati",           subtitle: "Love of Fate",           flavourText: "Not acceptance. Love.",                               statA: 55, statB: 66, statC: 77, abilities: ["Resolve"], personality: null },
  // MYTHOLOGY PACK
  { slug: "tara-the-liberator",     cardType: "MAHAVIDYA", rarity: "LEGENDARY", title: "Tārā",                subtitle: "She Who Carries Across",  flavourText: "Not rescued. Carried. There is a difference.",        statA: 96, statB: 91, statC: 88, abilities: ["Liberation", "Compassion Surge"], personality: "The Liberator" },
  { slug: "tripura-sundari",        cardType: "MAHAVIDYA", rarity: "MYTHIC",    title: "Tripura Sundarī",     subtitle: "Beauty of the Three Worlds", flavourText: "Desire is the engine. She is the engineer.",       statA: 99, statB: 88, statC: 94, abilities: ["Manifestation", "Desire Bind"], personality: "The Creatrix" },
  { slug: "bhuvaneshvari",          cardType: "MAHAVIDYA", rarity: "ORACLE",    title: "Bhuvaneshvarī",       subtitle: "Queen of the Universe",   flavourText: "The space you think is empty is her body.",          statA: 88, statB: 99, statC: 82, abilities: ["Space Control", "Reality Hold"], personality: "The Expanse" },
  { slug: "bhairavi-the-fierce",    cardType: "MAHAVIDYA", rarity: "LEGENDARY", title: "Bhairavī",            subtitle: "The Fierce One",          flavourText: "She doesn't punish the past. She burns the future that would repeat it.", statA: 95, statB: 87, statC: 99, abilities: ["Cycle Break", "Fear Transmute"], personality: "The Fierce" },
  { slug: "chhinnamasta",           cardType: "MAHAVIDYA", rarity: "MYTHIC",    title: "Chhinnamastā",        subtitle: "She Who Severs the Self",  flavourText: "She cut off her own head. The blood fed two serpents. The lesson is obvious.", statA: 99, statB: 77, statC: 91, abilities: ["Self-Sacrifice", "Ego Decap"], personality: "The Severed" },
  { slug: "psyche-and-eros",        cardType: "LORE",      rarity: "LEGENDARY", title: "Psyche & Eros",       subtitle: "The Origin Myth",         flavourText: "A mortal who looked at the god directly. That's what started all this.", statA: 91, statB: 99, statC: 88, abilities: ["Archive Origin", "Soul Bond"], personality: null },
  { slug: "the-oracle-at-delphi",   cardType: "ENTITY",    rarity: "ANOMALY",   title: "The Oracle at Delphi", subtitle: "Know Thyself",           flavourText: "The answer was always a question. Always.",           statA: 82, statB: 95, statC: 78, abilities: ["Truth Demand", "Paradox Lock"], personality: "The Oracle" },
  { slug: "hermes-trismegistus",    cardType: "ENTITY",    rarity: "LEGENDARY", title: "Hermes Trismegistus", subtitle: "Thrice-Great",            flavourText: "As above, so below. As within, so without. Keep going.", statA: 97, statB: 92, statC: 88, abilities: ["Transmutation", "Message Carry"], personality: "The Messenger" },
  { slug: "the-underworld-map",     cardType: "LORE",      rarity: "ORACLE",    title: "The Underworld Map",  subtitle: "Katabasis Protocol",      flavourText: "Every descent is voluntary. The story doesn't mention the return until you need it.", statA: 85, statB: 91, statC: 77, abilities: ["Descent Guide", "Return Path"], personality: null },
  { slug: "myth-of-the-eternal-return", cardType: "CIPHER", rarity: "SIGNAL",  title: "Eternal Return",      subtitle: "The Loop Signal",         flavourText: "You have done this before. The question is whether you'll do it better this time.", statA: 72, statB: 88, statC: 81, abilities: ["Cycle Sense", "Pattern Memory"], personality: null },
];

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get("x-enrich-secret");
  if (!secret || secret !== process.env.ENRICH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log: string[] = [];

  // 1. Apply migration
  log.push("── Migration ──");
  for (const step of MIGRATION_STEPS) {
    try {
      await prisma.$executeRawUnsafe(step.sql);
      log.push(`✓ ${step.name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.push(`⚠ ${step.name}: ${msg}`);
    }
  }

  // 1b. Inspect CardPack columns so we know what we're dealing with
  let packColumns: string[] = [];
  try {
    const cols = await prisma.$queryRawUnsafe<{ column_name: string; is_nullable: string }[]>(
      `SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'CardPack' ORDER BY ordinal_position`
    );
    packColumns = cols.map((c) => `${c.column_name}(${c.is_nullable === "NO" ? "NOT NULL" : "null"})`);
    log.push(`ℹ CardPack columns: ${packColumns.join(", ")}`);
  } catch (err) {
    log.push(`⚠ column inspect failed: ${err instanceof Error ? err.message : err}`);
  }

  // 2. Seed packs via raw SQL to cover any legacy NOT NULL columns
  log.push("── Packs ──");
  for (const pack of PACKS) {
    try {
      // Use raw SQL so we can supply legacy column values (title, accentColor, etc.)
      // that the Prisma client no longer knows about.
      await prisma.$executeRawUnsafe(`
        INSERT INTO "CardPack" (
          "id", "slug", "name", "description", "cost", "cardCount", "isAvailable",
          "sortOrder", "artTheme",
          "weightStatic", "weightSignal", "weightTransmission",
          "weightAnomaly", "weightOracle",
          "weightLegendary", "weightMythic", "weightForbidden",
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text, $1, $2, $3, $4, $5, $6,
          $7, $8,
          $9, $10, $11,
          $12, $13,
          $14, $15, $16,
          now(), now()
        )
        ON CONFLICT ("slug") DO UPDATE SET
          "name"               = EXCLUDED."name",
          "description"        = EXCLUDED."description",
          "cost"               = EXCLUDED."cost",
          "cardCount"          = EXCLUDED."cardCount",
          "isAvailable"        = EXCLUDED."isAvailable",
          "sortOrder"          = EXCLUDED."sortOrder",
          "artTheme"           = EXCLUDED."artTheme",
          "weightStatic"       = EXCLUDED."weightStatic",
          "weightSignal"       = EXCLUDED."weightSignal",
          "weightTransmission" = EXCLUDED."weightTransmission",
          "weightAnomaly"      = EXCLUDED."weightAnomaly",
          "weightOracle"       = EXCLUDED."weightOracle",
          "weightLegendary"    = EXCLUDED."weightLegendary",
          "weightMythic"       = EXCLUDED."weightMythic",
          "weightForbidden"    = EXCLUDED."weightForbidden",
          "updatedAt"          = now()
      `,
        pack.slug,
        pack.name,
        pack.description,
        pack.cost,
        pack.cardCount,
        pack.isAvailable,
        pack.sortOrder,
        pack.artTheme,
        pack.weightStatic,
        pack.weightSignal,
        pack.weightTransmission,
        pack.weightAnomaly,
        pack.weightOracle,
        pack.weightLegendary,
        pack.weightMythic,
        pack.weightForbidden,
      );
      log.push(`✓ Pack: ${pack.name}`);
    } catch (err) {
      log.push(`✗ Pack ${pack.slug}: ${err instanceof Error ? err.message : err}`);
    }
  }

  // 3. Seed cards
  log.push("── Cards ──");
  for (const card of CARDS) {
    try {
      const data = {
        cardType: card.cardType as CardType,
        rarity: card.rarity as Rarity,
        title: card.title,
        subtitle: card.subtitle ?? null,
        flavourText: card.flavourText ?? null,
        statA: card.statA,
        statB: card.statB,
        statC: card.statC,
        abilities: card.abilities,
        personality: card.personality ?? null,
        maxSupply: (card as { maxSupply?: number }).maxSupply ?? null,
        isActive: true,
      };
      await prisma.card.upsert({
        where: { slug: card.slug },
        update: data,
        create: { slug: card.slug, ...data },
      });
      log.push(`✓ Card: ${card.title} [${card.rarity}]`);
    } catch (err) {
      log.push(`✗ Card ${card.slug}: ${err instanceof Error ? err.message : err}`);
    }
  }

  // 4. Link cards to packs
  log.push("── Pack Links ──");
  try {
    const allCards = await prisma.card.findMany({ where: { isActive: true } });

    // Signal Archive — all cards
    const archivePack = await prisma.cardPack.findUnique({ where: { slug: "signal-archive" } });
    if (archivePack) {
      for (const card of allCards) {
        await prisma.packCard.upsert({
          where: { packId_cardId: { packId: archivePack.id, cardId: card.id } },
          update: {},
          create: { packId: archivePack.id, cardId: card.id, weight: 1.0 },
        });
      }
      log.push(`✓ Signal Archive ← ${allCards.length} cards`);
    }

    // Forbidden Archive — rare+
    const forbiddenPack = await prisma.cardPack.findUnique({ where: { slug: "forbidden-archive" } });
    const rareCards = allCards.filter((c) => ["TRANSMISSION","ANOMALY","ORACLE","LEGENDARY","MYTHIC","FORBIDDEN"].includes(c.rarity));
    if (forbiddenPack) {
      for (const card of rareCards) {
        await prisma.packCard.upsert({
          where: { packId_cardId: { packId: forbiddenPack.id, cardId: card.id } },
          update: {},
          create: { packId: forbiddenPack.id, cardId: card.id, weight: 1.0 },
        });
      }
      log.push(`✓ Forbidden Archive ← ${rareCards.length} rare+ cards`);
    }

    // Troll King — entity/incident/avatar/glitch
    const trollPack = await prisma.cardPack.findUnique({ where: { slug: "troll-king-expansion" } });
    const trollCards = allCards.filter((c) => ["ENTITY","INCIDENT","AVATAR","GLITCH"].includes(c.cardType));
    if (trollPack) {
      for (const card of trollCards) {
        await prisma.packCard.upsert({
          where: { packId_cardId: { packId: trollPack.id, cardId: card.id } },
          update: {},
          create: { packId: trollPack.id, cardId: card.id, weight: 1.5 },
        });
      }
      log.push(`✓ Troll King ← ${trollCards.length} chaos cards`);
    }

    // Nyx Collection — mahavidya/prophecy/oracle + legendary+
    const nyxPack = await prisma.cardPack.findUnique({ where: { slug: "nyx-collection" } });
    const nyxCards = allCards.filter((c) =>
      ["MAHAVIDYA","PROPHECY","ORACLE"].includes(c.cardType) ||
      ["LEGENDARY","MYTHIC","FORBIDDEN"].includes(c.rarity)
    );
    if (nyxPack) {
      const seen = new Set<string>();
      for (const card of nyxCards) {
        if (seen.has(card.id)) continue;
        seen.add(card.id);
        await prisma.packCard.upsert({
          where: { packId_cardId: { packId: nyxPack.id, cardId: card.id } },
          update: {},
          create: { packId: nyxPack.id, cardId: card.id, weight: 2.0 },
        });
      }
      log.push(`✓ Nyx Collection ← ${seen.size} sacred cards`);
    }

    // Mythology — mahavidya, lore, cipher, entity + myth-slug cards
    const mythPack = await prisma.cardPack.findUnique({ where: { slug: "mythology" } });
    const mythSlugs = new Set([
      "tara-the-liberator","tripura-sundari","bhuvaneshvari","bhairavi-the-fierce","chhinnamasta",
      "kali-the-devourer","bagalamukhi-the-still",
      "psyche-and-eros","the-oracle-at-delphi","hermes-trismegistus",
      "the-underworld-map","myth-of-the-eternal-return",
      "the-psychenomicon","alchemical-biography","amor-fati",
      "the-second-broadcast","the-archive-opens",
    ]);
    const mythCards = allCards.filter((c) =>
      mythSlugs.has(c.slug) ||
      c.cardType === "MAHAVIDYA"
    );
    if (mythPack) {
      const seen = new Set<string>();
      for (const card of mythCards) {
        if (seen.has(card.id)) continue;
        seen.add(card.id);
        await prisma.packCard.upsert({
          where: { packId_cardId: { packId: mythPack.id, cardId: card.id } },
          update: {},
          create: { packId: mythPack.id, cardId: card.id, weight: 1.8 },
        });
      }
      log.push(`✓ Mythology ← ${seen.size} myth cards`);
    }
  } catch (err) {
    log.push(`✗ Pack links: ${err instanceof Error ? err.message : err}`);
  }

  return NextResponse.json({ ok: true, log });
}
