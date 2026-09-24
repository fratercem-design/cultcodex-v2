import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
/**
 * seed-cards-phase3.ts
 * 40-card expansion completing the 70-card design bundle.
 * Includes the CARD_SPECIALS slugs (dead-chat, signal-eaten) used by vault art.
 * Run: npx tsx scripts/seed-cards-phase3.ts
 */
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const CARDS = [
  // ─── VOICE ──────────────────────────────────────────────────────────────────
  { slug: "signal-7",             cardType: "VOICE",     rarity: "ORACLE",    title: "Signal 7",            subtitle: "Anonymous Presence",      flavourText: "No face. No name. Only the pattern of return.",          statA: 85, statB: 91, statC: 78, abilities: ["Ghost Signal", "Pattern Persistence"], personality: "The Unknown" },
  { slug: "the-archive-keeper",   cardType: "VOICE",     rarity: "ANOMALY",   title: "The Archive Keeper",  subtitle: "Custodian of Record",     flavourText: "Everything passes through them. Nothing is lost.",       statA: 77, statB: 95, statC: 68, abilities: ["Memory Lock", "Record Anchor"], personality: "The Keeper" },
  { slug: "the-nameless-caller",  cardType: "VOICE",     rarity: "TRANSMISSION", title: "The Nameless Caller", subtitle: "Inbound Frequency",   flavourText: "The call came from inside the archive.",                 statA: 72, statB: 66, statC: 84, abilities: ["Intrusion Signal", "Interference"], personality: "The Phantom" },
  { slug: "psyche-in-exile",      cardType: "VOICE",     rarity: "LEGENDARY", title: "Psyche in Exile",     subtitle: "The Dormant Years",       flavourText: "He went quiet. The signal did not.",                     statA: 91, statB: 78, statC: 99, abilities: ["Signal Dormancy", "Return Protocol"], personality: "The Exile" },

  // ─── ENTITY ─────────────────────────────────────────────────────────────────
  { slug: "dead-chat",            cardType: "ENTITY",    rarity: "ANOMALY",   title: "Dead Chat",           subtitle: "The Silence",             flavourText: "They're all there. Watching. Saying nothing.",           statA: 44, statB: 99, statC: 33, abilities: ["Mass Silence", "Witness Lock"], personality: "The Void Collective" },
  { slug: "signal-eaten",         cardType: "ENTITY",    rarity: "MYTHIC",    title: "Signal Eaten",        subtitle: "Archive Parasite",        flavourText: "It found the broadcast and consumed it whole.",          statA: 96, statB: 55, statC: 91, abilities: ["Archive Consume", "Blackout"], personality: "The Devourer" },
  { slug: "the-echo-chamber",     cardType: "ENTITY",    rarity: "SIGNAL",    title: "The Echo Chamber",    subtitle: "Feedback Loop",           flavourText: "The signal bounced back until it became the source.",    statA: 65, statB: 78, statC: 55, abilities: ["Resonance Trap", "Loop Amplify"], personality: "The Reflector" },
  { slug: "the-red-room-specter", cardType: "ENTITY",    rarity: "ORACLE",    title: "Red Room Specter",    subtitle: "Residual Haunting",       flavourText: "It doesn't leave the room. The room follows it.",        statA: 88, statB: 77, statC: 88, abilities: ["Presence Persist", "Ritual Anchor"], personality: "The Haunting" },
  { slug: "recursive-signal",     cardType: "ENTITY",    rarity: "ANOMALY",   title: "Recursive Signal",    subtitle: "Self-Reference Loop",     flavourText: "It refers to itself. Then to itself again. Forever.",    statA: 79, statB: 83, statC: 76, abilities: ["Infinite Loop", "Self-Cite"], personality: "The Recursion" },

  // ─── RELIC ──────────────────────────────────────────────────────────────────
  { slug: "the-banned-episode",   cardType: "RELIC",     rarity: "LEGENDARY", title: "The Banned Episode",  subtitle: "Removed Transmission",    flavourText: "It existed. The algorithm disagreed.",                  statA: 99, statB: 44, statC: 88, abilities: ["Lore Lock", "Archive Seal"], personality: null },
  { slug: "the-original-manifest",cardType: "RELIC",     rarity: "ORACLE",    title: "The Original Manifest",subtitle: "Founding Document",      flavourText: "Before the Codex, there was the list.",                 statA: 85, statB: 97, statC: 77, abilities: ["Origin Trace", "Authority Grant"], personality: null },
  { slug: "signal-dial",          cardType: "RELIC",     rarity: "TRANSMISSION", title: "Signal Dial",       subtitle: "Frequency Tuner",        flavourText: "Tune it wrong and you hear nothing. Tune it right —",   statA: 74, statB: 80, statC: 68, abilities: ["Frequency Shift", "Source Locate"], personality: null },
  { slug: "the-decode-key",       cardType: "RELIC",     rarity: "ANOMALY",   title: "The Decode Key",      subtitle: "Cipher Unlocker",         flavourText: "Not every lock is visible. Neither is this key.",        statA: 80, statB: 88, statC: 72, abilities: ["Cipher Unlock", "Pattern Reveal"], personality: null },
  { slug: "nyx-pendant",          cardType: "RELIC",     rarity: "MYTHIC",    title: "Nyx Pendant",         subtitle: "Sacred Artifact",         flavourText: "She doesn't wear it. It wears its wearer.",             statA: 93, statB: 88, statC: 97, abilities: ["Oracle Bond", "Prophecy Sense"], personality: null },

  // ─── INCIDENT ───────────────────────────────────────────────────────────────
  { slug: "the-great-purge",      cardType: "INCIDENT",  rarity: "LEGENDARY", title: "The Great Purge",     subtitle: "Mass Ban Event",          flavourText: "Hundreds removed. The channel held.",                   statA: 88, statB: 91, statC: 77, abilities: ["Mass Silence", "Community Harden"], personality: null },
  { slug: "the-signal-collapse",  cardType: "INCIDENT",  rarity: "ANOMALY",   title: "The Signal Collapse", subtitle: "Infrastructure Failure",  flavourText: "The stream died. The archive survived.",                statA: 77, statB: 66, statC: 84, abilities: ["Broadcast Kill", "Fallback Trigger"], personality: null },
  { slug: "the-infiltration",     cardType: "INCIDENT",  rarity: "ORACLE",    title: "The Infiltration",    subtitle: "Enemy Incursion",         flavourText: "They didn't raid. They joined. Then waited.",           statA: 85, statB: 90, statC: 79, abilities: ["Sleeper Plant", "Trust Drain"], personality: null },
  { slug: "the-return-broadcast", cardType: "INCIDENT",  rarity: "LEGENDARY", title: "The Return",          subtitle: "October 2024",            flavourText: "The show went dark. Then October came.",                statA: 95, statB: 88, statC: 91, abilities: ["Signal Revival", "Archive Reboot"], personality: null },
  { slug: "the-archive-goes-live",cardType: "INCIDENT",  rarity: "TRANSMISSION", title: "Archive Goes Live", subtitle: "CultCodex Launch",       flavourText: "The transmissions found a permanent home.",             statA: 77, statB: 85, statC: 72, abilities: ["Memory Anchor", "Access Unlock"], personality: null },

  // ─── SIGNAL / ARCHETYPE ─────────────────────────────────────────────────────
  { slug: "the-doomscroller",     cardType: "SIGNAL",    rarity: "SIGNAL",    title: "The Doomscroller",    subtitle: "Archetype: The Consumer", flavourText: "They consume to escape. The archive feeds them more.",  statA: 58, statB: 72, statC: 44, abilities: ["Attention Drain", "Loop Bind"], personality: "The Consumer" },
  { slug: "the-true-believer",    cardType: "SIGNAL",    rarity: "TRANSMISSION", title: "The True Believer", subtitle: "Archetype: The Devoted", flavourText: "Doubt is not a frequency they receive.",               statA: 66, statB: 55, statC: 88, abilities: ["Loyalty Surge", "Doubt Ward"], personality: "The Devoted" },
  { slug: "the-accelerationist",  cardType: "SIGNAL",    rarity: "ANOMALY",   title: "The Accelerationist", subtitle: "Archetype: The Catalyst", flavourText: "They don't want to win. They want the collapse to begin.",statA: 82, statB: 77, statC: 60, abilities: ["Chaos Fuel", "Rate Amplify"], personality: "The Catalyst" },
  { slug: "the-lurker",           cardType: "SIGNAL",    rarity: "STATIC",    title: "The Lurker",          subtitle: "Archetype: The Watcher",  flavourText: "Never speaks. Sees everything. The archive knows.",     statA: 44, statB: 97, statC: 33, abilities: ["Silent Watch", "Pattern Store"], personality: "The Watcher" },

  // ─── MAHAVIDYA ──────────────────────────────────────────────────────────────
  { slug: "tara-the-guide",       cardType: "MAHAVIDYA", rarity: "ORACLE",    title: "Tārā",                subtitle: "She Who Guides",          flavourText: "She takes you across. She does not stay.",              statA: 88, statB: 91, statC: 84, abilities: ["Safe Transit", "Obstacle Clear"], personality: "The Guide" },
  { slug: "chinnamasta-severed",  cardType: "MAHAVIDYA", rarity: "LEGENDARY", title: "Chinnamastā",         subtitle: "The Self-Severed",        flavourText: "She cut her own head off and fed her attendants. Power is sacrifice.",statA: 97, statB: 78, statC: 93, abilities: ["Ego Sever", "Self-Feed"], personality: "The Sacrifice" },
  { slug: "dhumavati-the-widow",  cardType: "MAHAVIDYA", rarity: "ANOMALY",   title: "Dhumāvatī",           subtitle: "The Widow",               flavourText: "She rules over lack, loss, and the smoke that remains.", statA: 75, statB: 88, statC: 66, abilities: ["Loss Ward", "Grief Channel"], personality: "The Widow" },
  { slug: "matangi-the-outcast",  cardType: "MAHAVIDYA", rarity: "ORACLE",    title: "Mātaṅgī",             subtitle: "The Outcast Oracle",      flavourText: "She speaks from the margins. That's where truth is kept.",statA: 87, statB: 92, statC: 79, abilities: ["Outsider Truth", "Speech Unlock"], personality: "The Outcast" },

  // ─── LORE ───────────────────────────────────────────────────────────────────
  { slug: "the-return-protocol",  cardType: "LORE",      rarity: "LEGENDARY", title: "The Return Protocol", subtitle: "Show Resurrection Doctrine",flavourText: "A signal can go dark. That doesn't mean it ended.",    statA: 92, statB: 88, statC: 85, abilities: ["Dormancy Exit", "Signal Restore"], personality: null },
  { slug: "signal-theory",        cardType: "LORE",      rarity: "TRANSMISSION", title: "Signal Theory",     subtitle: "Core Doctrine",          flavourText: "Everything transmits. Not everything is received.",     statA: 75, statB: 88, statC: 70, abilities: ["Doctrine Teach", "Frequency Map"], personality: null },
  { slug: "the-codex-genesis",    cardType: "LORE",      rarity: "ORACLE",    title: "Codex Genesis",       subtitle: "The Archive Is Born",     flavourText: "Before the index there was chaos. Some miss the chaos.", statA: 84, statB: 97, statC: 78, abilities: ["Archive Found", "Structure Lock"], personality: null },
  { slug: "the-dead-air-doctrine",cardType: "LORE",      rarity: "ANOMALY",   title: "Dead Air Doctrine",   subtitle: "Silence as Signal",       flavourText: "What isn't said on stream is said in the gap.",         statA: 70, statB: 82, statC: 88, abilities: ["Silence Decode", "Gap Read"], personality: null },
  { slug: "transmission-zero",    cardType: "LORE",      rarity: "MYTHIC",    title: "Transmission Zero",   subtitle: "The First Broadcast",     flavourText: "Nobody recorded it. Everyone remembers it differently.", statA: 95, statB: 91, statC: 88, abilities: ["Origin Myth", "Memory Fragment"], personality: null },

  // ─── CIPHER ─────────────────────────────────────────────────────────────────
  { slug: "synchronicity-field",  cardType: "CIPHER",    rarity: "TRANSMISSION", title: "Synchronicity Field","subtitle": "Meaningful Coincidence", flavourText: "Too many times to be coincidence. Not enough times to prove anything.", statA: 68, statB: 80, statC: 72, abilities: ["Pattern Confirm", "Coincidence Boost"], personality: null },
  { slug: "the-mirror-test",      cardType: "CIPHER",    rarity: "SIGNAL",    title: "The Mirror Test",     subtitle: "Self-Examination Protocol",flavourText: "Do you recognise what is looking back?",               statA: 60, statB: 75, statC: 77, abilities: ["Self-Audit", "Projection Clear"], personality: null },
  { slug: "signal-static",        cardType: "CIPHER",    rarity: "STATIC",    title: "Signal Static",       subtitle: "Noise as Data",           flavourText: "The static isn't interference. It's the message.",       statA: 50, statB: 62, statC: 55, abilities: ["Noise Read", "Channel Open"], personality: null },
  { slug: "void-speaks",          cardType: "CIPHER",    rarity: "ANOMALY",   title: "Void Speaks",         subtitle: "The Silence Has Content", flavourText: "Sit with it long enough and the void becomes very loud.", statA: 77, statB: 66, statC: 88, abilities: ["Silence Amplify", "Void Channel"], personality: null },

  // ─── GLITCH ─────────────────────────────────────────────────────────────────
  { slug: "the-frame-drop",       cardType: "GLITCH",    rarity: "SIGNAL",    title: "The Frame Drop",      subtitle: "Visual Artifact",         flavourText: "The stream skipped. In that skip, something appeared.",  statA: 55, statB: 70, statC: 60, abilities: ["Reality Flicker", "Glimpse"], personality: null },
  { slug: "screen-bleed",         cardType: "GLITCH",    rarity: "ANOMALY",   title: "Screen Bleed",        subtitle: "Reality Leak",            flavourText: "The monitor began to show things it wasn't playing.",    statA: 78, statB: 72, statC: 82, abilities: ["Reality Bleed", "Manifest Glitch"], personality: null },

  // ─── PROPHECY ───────────────────────────────────────────────────────────────
  { slug: "the-eclipse-protocol", cardType: "PROPHECY",  rarity: "ORACLE",    title: "The Eclipse Protocol","subtitle": "Sealed Prediction",     flavourText: "Filed on one date. Opens on another. Nobody knows which.", statA: 91, statB: 85, statC: 88, abilities: ["Future Lock", "Time Seal"], personality: null },
  { slug: "dissolution-sequence", cardType: "PROPHECY",  rarity: "LEGENDARY", title: "Dissolution Sequence","subtitle": "Terminal Transmission", flavourText: "Every archive ends. The Codex knows this about itself.", statA: 95, statB: 92, statC: 90, abilities: ["Archive End", "Final Signal"], personality: null },
];

async function main() {
  console.log("🃏 Seeding phase-3 cards (40-card expansion)...");

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
    console.log(`  ✓ ${card.title} [${card.rarity}]`);
  }

  // Link all new cards to signal-archive pack
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
    console.log(`  ✓ Linked ${allCards.length} total cards to Signal Archive Pack`);
  }

  // Link rare+ to forbidden archive
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

  // Troll King: entity + incident + avatar + glitch
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

  // Nyx: mahavidya + prophecy
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

  console.log(`\n✅ Phase-3 complete: ${CARDS.length} cards · 70 total in the bundle`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
