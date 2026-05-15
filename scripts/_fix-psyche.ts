import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();
  
  const PSYCHE_ID = (await prisma.person.findFirst({ where: { slug: "psyche" }, select: { id: true } }))!.id;
  
  // 1. Remove "Trix" from Psyche's altNames — Trix is his youngest male cat
  const psyche = await prisma.person.findUnique({
    where: { id: PSYCHE_ID },
    select: { altNames: true, shortBio: true }
  });
  
  const newAltNames = (psyche!.altNames as string[]).filter(n => n !== "Trix");
  
  await prisma.person.update({
    where: { id: PSYCHE_ID },
    data: {
      altNames: newAltNames,
      shortBio: "Host of the Cult of Psyche podcast and owner of the CultCodex archive. Male streamer, tarot reader, musician, and content creator. Known for hosting open panel discussions, creating original music, and building a vibrant streaming community.",
    }
  });
  console.log(`Removed "Trix" from Psyche altNames. New: ${JSON.stringify(newAltNames)}`);
  
  // 2. Fix Mr. Trix / Psyche's Cat / Psyche's Cats — merge cat records
  const catRecords = await prisma.person.findMany({
    where: {
      OR: [
        { slug: "mr-trix" },
        { slug: "psyches-cat" },
        { slug: "psyches-cats" },
      ]
    },
    select: { id: true, displayName: true, slug: true, _count: { select: { guestAppearances: true, quotes: true } } }
  });
  
  console.log("\nCat records:");
  for (const c of catRecords) {
    console.log(`  ${c.displayName} (${c.slug}): ${c._count.guestAppearances} eps, ${c._count.quotes} quotes`);
  }
  
  // Check the "Unknown Participant" with 172 quotes - could be Psyche
  const bigUnknown = await prisma.person.findFirst({
    where: { slug: "unknown-participant" },
    select: { id: true, shortBio: true, guestAppearances: { select: { episode: { select: { episodeNumber: true, title: true } } } } }
  });
  if (bigUnknown) {
    console.log(`\nUnknown Participant (172 quotes): ${bigUnknown.shortBio}`);
    for (const g of bigUnknown.guestAppearances) {
      console.log(`  EP.${g.episode.episodeNumber}: ${g.episode.title}`);
    }
    
    // Check some quotes to see if they sound like Psyche
    const quotes = await prisma.quote.findMany({
      where: { speakerPersonId: bigUnknown.id },
      select: { text: true },
      take: 5
    });
    console.log("  Sample quotes:");
    for (const q of quotes) {
      console.log(`    "${q.text.substring(0, 120)}"`);
    }
  }
  
  // Rebuild Psyche searchText
  const updated = await prisma.person.findUnique({
    where: { id: PSYCHE_ID },
    select: { displayName: true, altNames: true, shortBio: true, loreSummary: true }
  });
  if (updated) {
    const searchText = [updated.displayName, ...updated.altNames, updated.shortBio, updated.loreSummary].filter(Boolean).join(" ");
    await prisma.person.update({ where: { id: PSYCHE_ID }, data: { searchText } });
  }
  console.log("\nPsyche searchText rebuilt");
  
  await disconnect();
}
main();
