import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();
  
  const mcqueen = await prisma.person.findFirst({ where: { slug: "alexander-mcqueen" }, select: { id: true } });
  
  // Move both EP.792 quotes from Mayers to McQueen
  const q1 = await prisma.quote.update({
    where: { id: "cmnjeiav601pi48ttaix1mx0y" },
    data: { speakerPersonId: mcqueen!.id }
  });
  const q2 = await prisma.quote.update({
    where: { id: "cmnjeiazu01pj48ttduwgzpe1" },
    data: { speakerPersonId: mcqueen!.id }
  });
  
  console.log("Moved 2 EP.792 quotes to Alexander McQueen");
  
  // Verify final counts
  const mayers = await prisma.person.findFirst({ where: { slug: "alexandra-mayers" }, select: { _count: { select: { quotes: true } } } });
  const mcq = await prisma.person.findFirst({ where: { slug: "alexander-mcqueen" }, select: { _count: { select: { quotes: true } } } });
  console.log(`Alexandra Mayers: ${mayers?._count.quotes} quotes`);
  console.log(`Alexander McQueen: ${mcq?._count.quotes} quotes`);
  
  await disconnect();
}
main();
