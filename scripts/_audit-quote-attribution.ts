import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();

  const mayersId = "cmn5tenff00mgpottlmcnwxje";
  const mcqueenId = "cmn46u8y000zab0tt7i3m0giv";

  // 1. All Mayers quotes with episode info
  console.log("\n========== ALEXANDRA MAYERS QUOTES ==========");
  const mayersQuotes = await prisma.quote.findMany({
    where: { speakerPersonId: mayersId },
    include: {
      episode: { select: { episodeNumber: true, title: true, slug: true } },
    },
    orderBy: { episode: { episodeNumber: "asc" } },
  });
  for (const q of mayersQuotes) {
    console.log(`\n  EP.${q.episode?.episodeNumber}: "${q.text.substring(0, 120)}"`);
    console.log(`    Context: ${q.context || "none"}`);
    console.log(`    Episode: ${q.episode?.title}`);
    console.log(`    ID: ${q.id}`);
  }
  console.log(`\n  TOTAL: ${mayersQuotes.length} quotes`);

  // 2. All McQueen quotes with episode info
  console.log("\n========== ALEXANDER MCQUEEN QUOTES ==========");
  const mcqueenQuotes = await prisma.quote.findMany({
    where: { speakerPersonId: mcqueenId },
    include: {
      episode: { select: { episodeNumber: true, title: true, slug: true } },
    },
    orderBy: { episode: { episodeNumber: "asc" } },
  });
  for (const q of mcqueenQuotes) {
    console.log(`\n  EP.${q.episode?.episodeNumber}: "${q.text.substring(0, 120)}"`);
    console.log(`    Context: ${q.context || "none"}`);
    console.log(`    Episode: ${q.episode?.title}`);
    console.log(`    ID: ${q.id}`);
  }
  console.log(`\n  TOTAL: ${mcqueenQuotes.length} quotes`);

  // 3. Check for quotes on episodes where the speaker is NOT a guest
  console.log("\n========== ORPHANED QUOTE CHECK ==========");
  console.log("Checking if any quotes reference speakers who aren't guests on that episode...");

  // Get all quotes with speakers
  const allQuotes = await prisma.quote.findMany({
    where: { speakerPersonId: { not: null } },
    select: { id: true, text: true, speakerPersonId: true, episodeId: true },
  });

  // Get all episodeGuest records
  const allGuests = await prisma.episodeGuest.findMany({
    select: { episodeId: true, personId: true },
  });

  // Build a set of "episodeId_personId" for fast lookup
  const guestSet = new Set(allGuests.map(g => `${g.episodeId}_${g.personId}`));

  // Also get host (Psyche) - hosts aren't always in episodeGuest
  const psycheId = "cmn46jta40000b0ttcrogz2xs";

  let orphanCount = 0;
  const orphans: { text: string; speakerId: string; episodeId: string; quoteId: string }[] = [];

  for (const q of allQuotes) {
    if (!q.episodeId || !q.speakerPersonId) continue;
    if (q.speakerPersonId === psycheId) continue; // Psyche is always valid as host

    const key = `${q.episodeId}_${q.speakerPersonId}`;
    if (!guestSet.has(key)) {
      orphanCount++;
      orphans.push({
        text: q.text.substring(0, 80),
        speakerId: q.speakerPersonId,
        episodeId: q.episodeId,
        quoteId: q.id,
      });
    }
  }

  if (orphans.length > 0) {
    // Resolve names
    const speakerIds = [...new Set(orphans.map(o => o.speakerId))];
    const speakers = await prisma.person.findMany({
      where: { id: { in: speakerIds } },
      select: { id: true, displayName: true },
    });
    const speakerMap = new Map(speakers.map(s => [s.id, s.displayName]));

    const episodeIds = [...new Set(orphans.map(o => o.episodeId))];
    const episodes = await prisma.episode.findMany({
      where: { id: { in: episodeIds } },
      select: { id: true, episodeNumber: true, title: true },
    });
    const episodeMap = new Map(episodes.map(e => [e.id, e]));

    console.log(`\n  Found ${orphanCount} quotes where speaker is NOT a guest on the episode:`);
    for (const o of orphans) {
      const speaker = speakerMap.get(o.speakerId) || "Unknown";
      const ep = episodeMap.get(o.episodeId);
      console.log(`\n  ORPHAN: "${o.text}..."`);
      console.log(`    Speaker: ${speaker} (${o.speakerId})`);
      console.log(`    Episode: EP.${ep?.episodeNumber} - ${ep?.title}`);
      console.log(`    Quote ID: ${o.quoteId}`);
    }
  } else {
    console.log("  ✓ No orphaned quotes found — all speakers are guests on their episodes");
  }

  // 4. Check for Mayers/McQueen name confusion in quote text
  console.log("\n========== NAME CONFUSION CHECK ==========");
  const confusedQuotes = await prisma.quote.findMany({
    where: {
      OR: [
        // Mayers quotes mentioning McQueen-specific things
        { speakerPersonId: mayersId, text: { contains: "McQueen", mode: "insensitive" as any } },
        { speakerPersonId: mayersId, text: { contains: "NYPD", mode: "insensitive" as any } },
        { speakerPersonId: mayersId, text: { contains: "glory hole", mode: "insensitive" as any } },
        // McQueen quotes mentioning Mayers-specific things
        { speakerPersonId: mcqueenId, text: { contains: "Monica", mode: "insensitive" as any } },
        { speakerPersonId: mcqueenId, text: { contains: "ip2wiki", mode: "insensitive" as any } },
        { speakerPersonId: mcqueenId, text: { contains: "Bible study", mode: "insensitive" as any } },
      ],
    },
    include: {
      speaker: { select: { displayName: true } },
      episode: { select: { episodeNumber: true, title: true } },
    },
  });

  if (confusedQuotes.length > 0) {
    console.log(`  Found ${confusedQuotes.length} potentially confused quotes:`);
    for (const q of confusedQuotes) {
      console.log(`\n  "${q.text.substring(0, 100)}..."`);
      console.log(`    Attributed to: ${q.speaker?.displayName}`);
      console.log(`    Episode: EP.${q.episode?.episodeNumber}`);
    }
  } else {
    console.log("  ✓ No name confusion detected in Mayers/McQueen quotes");
  }

  console.log("\n========== SUMMARY ==========");
  console.log(`Alexandra Mayers: ${mayersQuotes.length} quotes, 29 episodes`);
  console.log(`Alexander McQueen: ${mcqueenQuotes.length} quotes, 51 episodes`);
  console.log(`Orphaned quotes (speaker not guest): ${orphanCount}`);

  await disconnect();
}

main().catch(console.error);
