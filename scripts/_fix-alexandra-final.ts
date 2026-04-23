/**
 * ALEXANDRA MAYERS — FINAL CORRECTION + CONSOLIDATION
 *
 * Correct biographical data for Alexandra Mayers (Monica Foster).
 * Mayers is NOT a recurring guest of the Cult of Psyche — she is an
 * external figure who appears as a *subject of discussion* across many
 * episodes. Her personType should be "mentioned", not "guest" or "recurring".
 *
 * Key facts:
 *  - Real name: Alexandra Mayers. Stage name: Monica Foster.
 *  - IRL streamer / content creator / journalist.
 *  - YouTube: @AlexandraMayers, @IRLNewsTime, ip2wiki.info
 *  - Former adult film performer turned Bible study & news commentary.
 *  - Known for exposing fraudulent figures in the IRL streaming world.
 *  - Frequently discussed (but NOT present) on Cult of Psyche panels.
 *
 * This script also merges any remaining stray "Alex*" records that
 * belong to Mayers rather than McQueen and updates the canonical entry.
 *
 * Run: npx tsx scripts/_fix-alexandra-final.ts
 */

import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

const MAYERS_SLUG = "alexandra-mayers";

// Known stray slugs that are definitively Mayers (not McQueen).
// Re-check these after every mega-dedup run.
const MAYERS_STRAYS: string[] = [
  // Add any newly discovered stray slugs here, e.g.:
  // "alexandra-mayers-2", "monica-foster", "alex-mayers"
];

async function mergeIntoMayers(
  prisma: ReturnType<typeof getPrisma>,
  straySlug: string,
  mayersId: string,
) {
  const stray = await prisma.person.findUnique({
    where: { slug: straySlug },
    include: {
      guestAppearances: true,
      quotes: true,
      topics: true,
    },
  });
  if (!stray) {
    console.log(`  [skip] ${straySlug} — not found`);
    return;
  }

  let appsMoved = 0, appsDup = 0, quotesMoved = 0, topicsMoved = 0;

  // Move episode appearances
  for (const app of stray.guestAppearances) {
    const existing = await prisma.episodeGuest.findUnique({
      where: { episodeId_personId: { episodeId: app.episodeId, personId: mayersId } },
    });
    if (existing) {
      await prisma.episodeGuest.delete({
        where: { episodeId_personId: { episodeId: app.episodeId, personId: stray.id } },
      });
      appsDup++;
    } else {
      await prisma.episodeGuest.update({
        where: { episodeId_personId: { episodeId: app.episodeId, personId: stray.id } },
        data: { personId: mayersId },
      });
      appsMoved++;
    }
  }

  // Move quotes
  const q = await prisma.quote.updateMany({
    where: { speakerPersonId: stray.id },
    data: { speakerPersonId: mayersId },
  });
  quotesMoved = q.count;

  // Move topics
  for (const t of stray.topics) {
    const exists = await prisma.personTopic.findUnique({
      where: { personId_topicId: { personId: mayersId, topicId: t.topicId } },
    });
    if (!exists) {
      await prisma.personTopic.update({
        where: { personId_topicId: { personId: stray.id, topicId: t.topicId } },
        data: { personId: mayersId },
      });
      topicsMoved++;
    } else {
      await prisma.personTopic.delete({
        where: { personId_topicId: { personId: stray.id, topicId: t.topicId } },
      });
    }
  }

  await prisma.person.delete({ where: { id: stray.id } });
  console.log(
    `  [merged] "${stray.displayName}" (${straySlug}) → Mayers: ` +
    `${appsMoved} apps, ${appsDup} dups, ${quotesMoved} quotes, ${topicsMoved} topics → deleted`,
  );
}

async function main() {
  const prisma = getPrisma();

  console.log("=== Alexandra Mayers — Final Correction ===\n");

  // 1. Find canonical record
  const mayers = await prisma.person.findUnique({
    where: { slug: MAYERS_SLUG },
    select: {
      id: true, displayName: true, personType: true,
      altNames: true, shortBio: true,
      _count: { select: { guestAppearances: true, quotes: true, mentions: true } },
    },
  });

  if (!mayers) {
    console.error(`ERROR: ${MAYERS_SLUG} not found in database`);
    process.exit(1);
  }

  console.log("Current state:");
  console.log(`  displayName: ${mayers.displayName}`);
  console.log(`  personType:  ${mayers.personType}`);
  console.log(`  episodes:    ${mayers._count.guestAppearances}`);
  console.log(`  mentions:    ${mayers._count.mentions}`);
  console.log(`  quotes:      ${mayers._count.quotes}`);
  console.log(`  altNames:    ${mayers.altNames.join(", ")}\n`);

  // 2. Merge any remaining stray records
  if (MAYERS_STRAYS.length) {
    console.log("--- Merging strays ---");
    for (const slug of MAYERS_STRAYS) {
      await mergeIntoMayers(prisma, slug, mayers.id);
    }
    console.log();
  } else {
    console.log("No additional strays to merge.\n");
  }

  // 3. Check for any remaining alex* records that might be Mayers
  console.log("--- Scanning for remaining Alex* records ---");
  const alexRecords = await prisma.person.findMany({
    where: {
      OR: [
        { slug: { startsWith: "alexandra" } },
        { slug: { startsWith: "alexandria" } },
        { displayName: { startsWith: "Alexandra", mode: "insensitive" } },
        { displayName: { startsWith: "Alexandria", mode: "insensitive" } },
        { displayName: { contains: "Monica Foster", mode: "insensitive" } },
        { displayName: { contains: "Mayers", mode: "insensitive" } },
      ],
      NOT: { slug: MAYERS_SLUG },
    },
    select: {
      id: true, slug: true, displayName: true, personType: true,
      _count: { select: { guestAppearances: true, quotes: true } },
    },
    orderBy: { displayName: "asc" },
  });

  if (alexRecords.length) {
    console.log(`Found ${alexRecords.length} record(s) that may need review:`);
    for (const r of alexRecords) {
      console.log(
        `  "${r.displayName}" (${r.slug}) — type=${r.personType} — ${r._count.guestAppearances} apps, ${r._count.quotes} quotes`,
      );
    }
    console.log("\n  → Review these manually and add slugs to MAYERS_STRAYS if they belong to Mayers.");
  } else {
    console.log("  No stray Alexandra/Monica records found.\n");
  }

  // 4. Apply canonical corrections
  console.log("--- Applying canonical corrections ---");

  const canonicalAltNames = [
    "Monica Foster",      // adult film stage name
    "Alexandra Meyer",    // common misspelling
    "Alexandra Myers",    // common misspelling
    "Alexandra Mares",    // enrichment misspelling
    "Alex Mayers",        // short form
    "Alexandra",          // often referenced by first name only
  ];

  const canonicalBio =
    "IRL streamer and content creator operating under the YouTube channels " +
    "@AlexandraMayers and @IRLNewsTime, and the site ip2wiki.info. Born Alexandra " +
    "Mayers, she performed in adult films as Monica Foster before pivoting to Bible " +
    "study streams, Christian commentary, and investigative journalism focused on the " +
    "IRL streaming community. She documents fraud, doxxing, and misconduct in online " +
    "spaces. Referenced frequently across Cult of Psyche panels as a subject of " +
    "discussion — not a guest of the show.";

  await prisma.person.update({
    where: { id: mayers.id },
    data: {
      displayName: "Alexandra Mayers",
      personType: "mentioned",         // She is discussed, not a show guest
      altNames: canonicalAltNames,
      shortBio: canonicalBio,
      searchText: [
        "Alexandra Mayers",
        "Monica Foster",
        ...canonicalAltNames,
        canonicalBio,
      ].join(" ").toLowerCase(),
    },
  });

  console.log("  Updated: displayName, personType → mentioned, altNames, bio, searchText");

  // 5. Verify final state
  const final = await prisma.person.findUnique({
    where: { id: mayers.id },
    select: {
      displayName: true, personType: true, altNames: true,
      _count: { select: { guestAppearances: true, quotes: true, mentions: true } },
    },
  });

  console.log("\n=== FINAL STATE ===");
  console.log(`  displayName: ${final?.displayName}`);
  console.log(`  personType:  ${final?.personType}`);
  console.log(`  episodes:    ${final?._count.guestAppearances}`);
  console.log(`  mentions:    ${final?._count.mentions}`);
  console.log(`  quotes:      ${final?._count.quotes}`);
  console.log(`  altNames:    ${final?.altNames.join(", ")}`);

  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
