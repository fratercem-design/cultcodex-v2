import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();

  // 1. Get EP.792
  const ep = await prisma.episode.findFirst({
    where: { episodeNumber: 792 },
    select: { id: true, slug: true, title: true, summaryShort: true, episodeNumber: true, youtubeVideoId: true },
  });
  console.log("\n=== EP.792 ===");
  console.log(JSON.stringify(ep, null, 2));

  if (!ep) { await disconnect(); return; }

  // 2. All guests on EP.792
  const guests = await prisma.episodeGuest.findMany({
    where: { episodeId: ep.id },
    include: { person: { select: { id: true, displayName: true, slug: true } } },
  });
  console.log("\n=== GUESTS ON EP.792 ===");
  for (const g of guests) {
    console.log(`  ${g.person.displayName} (${g.person.slug}) [${g.person.id}]`);
  }

  // 3. All quotes from EP.792
  const quotes = await prisma.quote.findMany({
    where: { episodeId: ep.id },
    include: { speaker: { select: { id: true, displayName: true, slug: true } } },
  });
  console.log("\n=== QUOTES FROM EP.792 ===");
  for (const q of quotes) {
    console.log(`  [${q.speaker?.displayName ?? "NO SPEAKER"}] "${q.text.substring(0, 80)}..." (${q.id})`);
  }

  // 4. Check McQueen on EP.792
  const mcqueenId = "cmn46u8y000zab0tt7i3m0giv";
  const mcqueenGuest = guests.find(g => g.person.id === mcqueenId);
  console.log(`\n=== McQueen on EP.792? ${mcqueenGuest ? "YES" : "NO"} ===`);

  // 5. Check Mayers on EP.792
  const mayersId = "cmn5tenff00mgpottlmcnwxje";
  const mayersGuest = guests.find(g => g.person.id === mayersId);
  console.log(`=== Mayers on EP.792? ${mayersGuest ? "YES" : "NO"} ===`);

  await disconnect();
}

main().catch(console.error);
