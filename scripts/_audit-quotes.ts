import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();
  
  // 1. Overall stats
  const total = await prisma.quote.count();
  const withSpeaker = await prisma.quote.count({ where: { speakerPersonId: { not: null } } });
  const noSpeaker = await prisma.quote.count({ where: { speakerPersonId: null } });
  console.log(`=== QUOTE STATS ===`);
  console.log(`Total: ${total}, With speaker: ${withSpeaker}, No speaker: ${noSpeaker}`);
  
  // 2. Top speakers by quote count
  const topSpeakers = await prisma.quote.groupBy({
    by: ["speakerPersonId"],
    _count: true,
    where: { speakerPersonId: { not: null } },
    orderBy: { _count: { speakerPersonId: "desc" } },
    take: 30,
  });
  
  console.log(`\n=== TOP 30 SPEAKERS ===`);
  for (const s of topSpeakers) {
    const person = await prisma.person.findUnique({
      where: { id: s.speakerPersonId! },
      select: { displayName: true, personType: true },
    });
    console.log(`  ${person?.displayName} (${person?.personType}): ${s._count} quotes`);
  }
  
  // 3. Check for very short/meaningless quotes
  const shortQuotes = await prisma.quote.findMany({
    where: { text: { not: null } },
    select: { id: true, text: true, speakerPersonId: true },
    orderBy: { text: "asc" },
  });
  
  let tooShort = 0;
  let meaningless = 0;
  const meaninglessPatterns = [
    /^(yeah|yes|no|ok|okay|hmm|um|uh|wow|oh|ha|haha|lol|right|sure|hey|hi|hello|bye|thanks|thank you|what|why|how|well|so|like|just|really|actually)\.?$/i,
  ];
  
  const shortExamples: string[] = [];
  for (const q of shortQuotes) {
    if (q.text.length < 15) {
      tooShort++;
      if (shortExamples.length < 10) shortExamples.push(`"${q.text}"`);
    }
    for (const pat of meaninglessPatterns) {
      if (pat.test(q.text.trim())) {
        meaningless++;
        break;
      }
    }
  }
  console.log(`\n=== QUALITY CHECK ===`);
  console.log(`Very short (<15 chars): ${tooShort}`);
  console.log(`  Examples: ${shortExamples.join(", ")}`);
  console.log(`Single-word filler: ${meaningless}`);
  
  // 4. Check for duplicate quotes
  const quoteCounts = new Map<string, number>();
  for (const q of shortQuotes) {
    const key = q.text.toLowerCase().trim();
    quoteCounts.set(key, (quoteCounts.get(key) || 0) + 1);
  }
  let dupes = 0;
  const dupeExamples: string[] = [];
  for (const [text, count] of quoteCounts) {
    if (count > 1) {
      dupes += count - 1;
      if (dupeExamples.length < 5) dupeExamples.push(`"${text.substring(0, 60)}" (x${count})`);
    }
  }
  console.log(`\nDuplicate quotes: ${dupes}`);
  console.log(`  Examples: ${dupeExamples.join(", ")}`);

  // 5. Sample quotes from "Unknown" speakers
  const unknownSpeakers = await prisma.person.findMany({
    where: { displayName: { contains: "unknown", mode: "insensitive" } },
    select: { id: true, displayName: true },
  });
  const unknownIds = unknownSpeakers.map(u => u.id);
  const unknownQuotes = await prisma.quote.findMany({
    where: { speakerPersonId: { in: unknownIds } },
    select: { text: true, speakerPersonId: true, episode: { select: { episodeNumber: true } } },
    take: 20,
  });
  console.log(`\n=== QUOTES FROM "UNKNOWN" SPEAKERS (${unknownQuotes.length}) ===`);
  for (const q of unknownQuotes.slice(0, 15)) {
    const speaker = unknownSpeakers.find(u => u.id === q.speakerPersonId);
    console.log(`  [EP.${q.episode.episodeNumber}] ${speaker?.displayName}: "${q.text.substring(0, 120)}"`);
  }
  
  // 6. Check quote schema
  const sampleQuote = await prisma.quote.findFirst({
    select: { id: true, text: true, context: true, speakerPersonId: true, episodeId: true, tags: true },
  });
  console.log(`\n=== QUOTE SCHEMA SAMPLE ===`);
  console.log(JSON.stringify(sampleQuote, null, 2));
  
  await disconnect();
}
main();
