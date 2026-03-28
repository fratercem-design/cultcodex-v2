import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";
async function main() {
  const p = getPrisma();
  
  const unenriched = await p.episode.findMany({
    where: { OR: [{ summaryLong: null }, { summaryLong: "" }] },
    select: { 
      id: true, title: true, slug: true,
      summaryShort: true, 
      _count: { select: { topics: true, guests: true, quotes: true, segments: true } }
    },
    take: 20,
    orderBy: { episodeNumber: "desc" },
  });
  
  const total = await p.episode.count({ where: { OR: [{ summaryLong: null }, { summaryLong: "" }] } });
  console.log(`Total unenriched: ${total}`);
  
  // Check what data they have
  let hasSummary = 0, hasTopics = 0, hasGuests = 0, hasTranscript = 0;
  const all = await p.episode.findMany({
    where: { OR: [{ summaryLong: null }, { summaryLong: "" }] },
    select: { 
      summaryShort: true,
      _count: { select: { topics: true, guests: true, segments: true } }
    },
  });
  for (const e of all) {
    if (e.summaryShort) hasSummary++;
    if (e._count.topics > 0) hasTopics++;
    if (e._count.guests > 0) hasGuests++;
    if (e._count.segments > 0) hasTranscript++;
  }
  console.log(`  Has summaryShort: ${hasSummary}`);
  console.log(`  Has topics: ${hasTopics}`);
  console.log(`  Has guests: ${hasGuests}`);
  console.log(`  Has transcript segments: ${hasTranscript}`);
  
  console.log("\nSample unenriched:");
  for (const e of unenriched.slice(0, 10)) {
    console.log(`  ${e.title?.slice(0, 60)} | summary: ${e.summaryShort ? "yes" : "no"} | topics: ${e._count.topics} | segs: ${e._count.segments}`);
  }
  
  await disconnect();
}
main();
