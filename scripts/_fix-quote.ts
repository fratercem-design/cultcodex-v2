import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();
  
  const mayers = await prisma.person.findFirst({ where: { slug: "alexandra-mayers" }, select: { id: true } });
  const mcqueen = await prisma.person.findFirst({ where: { slug: "alexander-mcqueen" }, select: { id: true } });
  
  if (!mayers || !mcqueen) { console.log("Missing records"); await disconnect(); return; }
  
  // Show all quotes attributed to Alexandra Mayers
  const quotes = await prisma.quote.findMany({
    where: { speakerPersonId: mayers.id },
    select: { id: true, text: true, episode: { select: { episodeNumber: true, title: true } } }
  });
  
  console.log(`Alexandra Mayers has ${quotes.length} quotes:`);
  for (const q of quotes) {
    console.log(`  [${q.id}] EP.${q.episode.episodeNumber}: "${q.text.substring(0, 120)}"`);
  }
  
  // The police officer quote is clearly McQueen
  const policeQuote = quotes.find(q => q.text.includes("license registration") || q.text.includes("Sir,"));
  if (policeQuote) {
    await prisma.quote.update({ where: { id: policeQuote.id }, data: { speakerPersonId: mcqueen.id } });
    console.log(`\nMoved police quote to McQueen: "${policeQuote.text.substring(0, 80)}"`);
  }
  
  await disconnect();
}
main();
