/**
 * CC-DEDUP-ALEX-V2: Comprehensive deduplication of Alexandra Mayers and Alexander McQueen
 *
 * Analysis of 14 person records containing "Alex/Alexander/Alexandra/Alexandria":
 *
 * CANONICAL TARGETS:
 *   Alexandra Mayers (cmn5tenff00mgpottlmcnwxje) - 17 eps currently
 *   Alexander McQueen (cmn46u8y000zab0tt7i3m0giv) - 14 eps currently
 *
 * MERGE INTO ALEXANDRA MAYERS:
 *   - "Alex Mayer" (1 ep: 1042) - name match, ep titled "Alex Mayer vs Me"
 *   - "Alexander Mayors" (2 eps: 883, 412) - misspelling, "romantic interest for Carl" = female
 *   - "Alexandria" (1 ep: 941) - "The Real Woman: Meeting Alexandra in Person" = clearly Mayers
 *   - "Alexander/Alexandra" (1 ep: 409) - "copyright strikes against channel" = Mayers
 *   - "Alexandra/Alexander" (1 ep: 438) - mediator figure, Alexandra listed first
 *   - "Alexandra/Alex" (2 eps: 414, 437) - Alexandra listed first, panel drama
 *   - "Alexandria/Alexander" (1 ep: 420) - "Summer vs Alexandria" confrontation
 *
 * MERGE INTO ALEXANDER McQUEEN:
 *   - "Alexander (Alex)" (7 eps) - "Loud, confrontational panel regular" = McQueen
 *   - "Alexander/Canada Dry" (1 ep: 514) - panel regular, technical support
 *
 * SPLIT BETWEEN BOTH:
 *   - "Alex" (19 eps) - police roleplay quote = McQueen, but EP.920 (dinner) and EP.1262 (threats) = Mayers
 *   - "Alexander" (13 eps) - EP.212 (California upbringing) and EP.792 (romantic rumors w/ Psyche) = Mayers, rest = McQueen
 *
 * LEAVE ALONE:
 *   - "Emma/Alexandra" (1 ep: 1260) - about Emma leaving streaming, not either Alex
 */

import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

const MAYERS_ID = "cmn5tenff00mgpottlmcnwxje";
const MCQUEEN_ID = "cmn46u8y000zab0tt7i3m0giv";

// Records to merge entirely into Mayers
const MAYERS_MERGE_IDS = [
  "cmnc75db6005gf0ttulikcd5p",  // Alex Mayer
  "cmn9jdffb03yyw8tt943z1826",  // Alexander Mayors
  "cmn9q6r4704lmq0ttl1z0c949",  // Alexandria
  "cmnjau2jh01sw4ottkusxloze",  // Alexander/Alexandra (copyright strikes)
  "cmn9ic7xz01rnw8ttewojx5c4",  // Alexandra/Alexander (mediator)
  "cmn9hqx1a00how8ttm47jdt3g",  // Alexandra/Alex
  "cmn6exyhk04brl8ttzc1k3zxs",  // Alexandria/Alexander (Summer confrontation)
];

// Records to merge entirely into McQueen
const MCQUEEN_MERGE_IDS = [
  "cmn9hyw7900ypw8ttjkqzyrkn",  // Alexander (Alex) - loud, confrontational
  "cmn9imepo02f9w8ttd6nfgstf",  // Alexander/Canada Dry
];

// "Alex" record (19 eps) - mostly McQueen, but specific eps go to Mayers
const ALEX_MIXED_ID = "cmn46kb8n001qb0tta4yinfke";
const ALEX_MAYERS_EPS = [920, 1262]; // dinner gesture, channel threats

// "Alexander" record (13 eps) - split: California/romantic = Mayers, rest = McQueen
const ALEXANDER_MIXED_ID = "cmn9i7jws01hdw8ttoa5nfmmr";
const ALEXANDER_MAYERS_EPS = [212, 792]; // California upbringing, romantic rumors

async function moveAppearances(
  prisma: any,
  sourceId: string,
  targetId: string,
  specificEpNumbers?: number[]
) {
  let moved = 0;
  let skippedDup = 0;

  // Get source appearances
  const appearances = await prisma.episodeGuest.findMany({
    where: { personId: sourceId },
    include: { episode: { select: { episodeNumber: true, id: true } } },
  });

  for (const app of appearances) {
    // If we only want specific episodes, skip others
    if (specificEpNumbers && !specificEpNumbers.includes(app.episode.episodeNumber)) {
      continue;
    }

    // Check if target already appears in this episode
    const existing = await prisma.episodeGuest.findFirst({
      where: { personId: targetId, episodeId: app.episodeId },
    });

    if (existing) {
      // Delete the duplicate using compound key
      await prisma.episodeGuest.delete({
        where: { episodeId_personId: { episodeId: app.episodeId, personId: sourceId } },
      });
      skippedDup++;
    } else {
      // Reassign to target using compound key
      await prisma.episodeGuest.update({
        where: { episodeId_personId: { episodeId: app.episodeId, personId: sourceId } },
        data: { personId: targetId },
      });
      moved++;
    }
  }

  return { moved, skippedDup };
}

async function moveQuotes(
  prisma: any,
  sourceId: string,
  targetId: string,
  specificEpNumbers?: number[]
) {
  let moved = 0;

  if (specificEpNumbers) {
    // Get episode IDs for these numbers
    const episodes = await prisma.episode.findMany({
      where: { episodeNumber: { in: specificEpNumbers } },
      select: { id: true },
    });
    const epIds = episodes.map((e: any) => e.id);

    const result = await prisma.quote.updateMany({
      where: { speakerPersonId: sourceId, episodeId: { in: epIds } },
      data: { speakerPersonId: targetId },
    });
    moved = result.count;
  } else {
    const result = await prisma.quote.updateMany({
      where: { speakerPersonId: sourceId },
      data: { speakerPersonId: targetId },
    });
    moved = result.count;
  }

  return moved;
}

async function moveTopics(prisma: any, sourceId: string, targetId: string) {
  const topics = await prisma.personTopic.findMany({
    where: { personId: sourceId },
  });
  let moved = 0;
  for (const t of topics) {
    const exists = await prisma.personTopic.findFirst({
      where: { personId: targetId, topicId: t.topicId },
    });
    if (exists) {
      await prisma.personTopic.delete({
        where: { personId_topicId: { personId: sourceId, topicId: t.topicId } },
      });
    } else {
      await prisma.personTopic.update({
        where: { personId_topicId: { personId: sourceId, topicId: t.topicId } },
        data: { personId: targetId },
      });
      moved++;
    }
  }
  return moved;
}

async function main() {
  const prisma = getPrisma();
  let totalMoved = 0;
  let totalSkipped = 0;
  let totalQuotesMoved = 0;

  console.log("=== Alexandra Mayers / Alexander McQueen Dedup v2 ===\n");

  // --- STEP 1: Merge full records into Mayers ---
  console.log("--- Merging duplicates into Alexandra Mayers ---");
  for (const srcId of MAYERS_MERGE_IDS) {
    const src = await prisma.person.findUnique({
      where: { id: srcId },
      select: { displayName: true, _count: { select: { guestAppearances: true, quotes: true } } },
    });
    if (!src) { console.log(`  [SKIP] ${srcId} not found`); continue; }

    const { moved, skippedDup } = await moveAppearances(prisma, srcId, MAYERS_ID);
    const quotesMoved = await moveQuotes(prisma, srcId, MAYERS_ID);
    const topicsMoved = await moveTopics(prisma, srcId, MAYERS_ID);
    totalMoved += moved;
    totalSkipped += skippedDup;
    totalQuotesMoved += quotesMoved;

    console.log(`  "${src.displayName}": ${moved} eps moved, ${skippedDup} dups, ${quotesMoved} quotes, ${topicsMoved} topics`);

    // Delete empty source record
    await prisma.person.delete({ where: { id: srcId } });
    console.log(`  -> deleted record ${srcId}`);
  }

  // --- STEP 2: Merge full records into McQueen ---
  console.log("\n--- Merging duplicates into Alexander McQueen ---");
  for (const srcId of MCQUEEN_MERGE_IDS) {
    const src = await prisma.person.findUnique({
      where: { id: srcId },
      select: { displayName: true, _count: { select: { guestAppearances: true, quotes: true } } },
    });
    if (!src) { console.log(`  [SKIP] ${srcId} not found`); continue; }

    const { moved, skippedDup } = await moveAppearances(prisma, srcId, MCQUEEN_ID);
    const quotesMoved = await moveQuotes(prisma, srcId, MCQUEEN_ID);
    const topicsMoved = await moveTopics(prisma, srcId, MCQUEEN_ID);
    totalMoved += moved;
    totalSkipped += skippedDup;
    totalQuotesMoved += quotesMoved;

    console.log(`  "${src.displayName}": ${moved} eps moved, ${skippedDup} dups, ${quotesMoved} quotes, ${topicsMoved} topics`);

    await prisma.person.delete({ where: { id: srcId } });
    console.log(`  -> deleted record ${srcId}`);
  }

  // --- STEP 3: Split "Alex" (19 eps) ---
  console.log("\n--- Splitting 'Alex' (19 eps) ---");
  // Move Mayers-specific eps to Mayers
  const { moved: am1, skippedDup: ad1 } = await moveAppearances(prisma, ALEX_MIXED_ID, MAYERS_ID, ALEX_MAYERS_EPS);
  const aq1 = await moveQuotes(prisma, ALEX_MIXED_ID, MAYERS_ID, ALEX_MAYERS_EPS);
  console.log(`  -> Mayers eps (${ALEX_MAYERS_EPS.join(",")}): ${am1} moved, ${ad1} dups, ${aq1} quotes`);

  // Move remaining to McQueen
  const { moved: am2, skippedDup: ad2 } = await moveAppearances(prisma, ALEX_MIXED_ID, MCQUEEN_ID);
  const aq2 = await moveQuotes(prisma, ALEX_MIXED_ID, MCQUEEN_ID);
  const at2 = await moveTopics(prisma, ALEX_MIXED_ID, MCQUEEN_ID);
  console.log(`  -> McQueen remaining: ${am2} moved, ${ad2} dups, ${aq2} quotes, ${at2} topics`);
  totalMoved += am1 + am2;
  totalSkipped += ad1 + ad2;
  totalQuotesMoved += aq1 + aq2;

  await prisma.person.delete({ where: { id: ALEX_MIXED_ID } });
  console.log(`  -> deleted "Alex" record`);

  // --- STEP 4: Split "Alexander" (13 eps) ---
  console.log("\n--- Splitting 'Alexander' (13 eps) ---");
  const { moved: am3, skippedDup: ad3 } = await moveAppearances(prisma, ALEXANDER_MIXED_ID, MAYERS_ID, ALEXANDER_MAYERS_EPS);
  const aq3 = await moveQuotes(prisma, ALEXANDER_MIXED_ID, MAYERS_ID, ALEXANDER_MAYERS_EPS);
  console.log(`  -> Mayers eps (${ALEXANDER_MAYERS_EPS.join(",")}): ${am3} moved, ${ad3} dups, ${aq3} quotes`);

  const { moved: am4, skippedDup: ad4 } = await moveAppearances(prisma, ALEXANDER_MIXED_ID, MCQUEEN_ID);
  const aq4 = await moveQuotes(prisma, ALEXANDER_MIXED_ID, MCQUEEN_ID);
  const at4 = await moveTopics(prisma, ALEXANDER_MIXED_ID, MCQUEEN_ID);
  console.log(`  -> McQueen remaining: ${am4} moved, ${ad4} dups, ${aq4} quotes, ${at4} topics`);
  totalMoved += am3 + am4;
  totalSkipped += ad3 + ad4;
  totalQuotesMoved += aq3 + aq4;

  await prisma.person.delete({ where: { id: ALEXANDER_MIXED_ID } });
  console.log(`  -> deleted "Alexander" record`);

  // --- STEP 5: Update canonical records with proper bios and alt names ---
  console.log("\n--- Updating canonical records ---");

  await prisma.person.update({
    where: { id: MAYERS_ID },
    data: {
      displayName: "Alexandra Mayers",
      altNames: [
        "Alexandra Meyer", "Monica Foster", "Alexandra Myers", "Alexandra Mares",
        "Alex Mayer", "Alexander Mayors", "Alexandria", "Alexandra",
        "Alex"
      ],
      shortBio: "IRL streamer and content creator behind the YouTube channels AlexandraMayers, IRLNewsTime, and ip2wiki.info. Former adult film performer (as Monica Foster) who transitioned to Bible study streams, news commentary, and community advocacy. Known for exposing problematic figures in the streaming world and for her confrontational but passionate style.",
      personType: "recurring",
    },
  });
  console.log("  Alexandra Mayers: updated bio, altNames, type");

  await prisma.person.update({
    where: { id: MCQUEEN_ID },
    data: {
      displayName: "Alexander McQueen",
      altNames: [
        "NYPD", "Officer Alex McQueen", "Alex McQueen", "Alex",
        "Alexander", "Canada Dry"
      ],
      shortBio: "Controversial recurring guest who claims to be an NYPD police officer. Known for loud, confrontational behavior, crude roleplay, and heated panel exchanges. Former moderator who was removed after doxxing allegations. A divisive figure who generates strong reactions from the community.",
      personType: "recurring",
    },
  });
  console.log("  Alexander McQueen: updated bio, altNames, type");

  // --- STEP 6: Rebuild searchText for both ---
  for (const id of [MAYERS_ID, MCQUEEN_ID]) {
    const p = await prisma.person.findUnique({
      where: { id },
      select: { displayName: true, altNames: true, shortBio: true, loreSummary: true },
    });
    if (!p) continue;
    const searchText = [p.displayName, ...p.altNames, p.shortBio, p.loreSummary].filter(Boolean).join(" ");
    await prisma.person.update({ where: { id }, data: { searchText } });
  }
  console.log("  searchText rebuilt for both");

  // --- Final counts ---
  const mayers = await prisma.person.findUnique({
    where: { id: MAYERS_ID },
    select: { _count: { select: { guestAppearances: true, quotes: true } } },
  });
  const mcqueen = await prisma.person.findUnique({
    where: { id: MCQUEEN_ID },
    select: { _count: { select: { guestAppearances: true, quotes: true } } },
  });

  console.log(`\n=== RESULTS ===`);
  console.log(`Total appearances moved: ${totalMoved}`);
  console.log(`Duplicate appearances resolved: ${totalSkipped}`);
  console.log(`Quotes reassigned: ${totalQuotesMoved}`);
  console.log(`Records deleted: ${MAYERS_MERGE_IDS.length + MCQUEEN_MERGE_IDS.length + 2}`);
  console.log(`Alexandra Mayers: ${mayers?._count.guestAppearances} eps, ${mayers?._count.quotes} quotes`);
  console.log(`Alexander McQueen: ${mcqueen?._count.guestAppearances} eps, ${mcqueen?._count.quotes} quotes`);

  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
