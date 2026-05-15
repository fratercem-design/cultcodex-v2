import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();
  
  const allQuotes = await prisma.quote.findMany({
    select: { id: true, text: true, context: true, significance: true, speakerPersonId: true, episodeId: true,
      episode: { select: { episodeNumber: true, title: true } },
      speaker: { select: { displayName: true, personType: true } }
    },
  });
  
  console.log(`Total quotes: ${allQuotes.length}`);
  
  // Short quotes
  const short = allQuotes.filter(q => q.text.length < 20);
  console.log(`\n=== VERY SHORT QUOTES (<20 chars): ${short.length} ===`);
  for (const q of short.slice(0, 15)) {
    console.log(`  "${q.text}" — ${q.speaker?.displayName || "NO SPEAKER"} (EP.${q.episode?.episodeNumber})`);
  }
  
  // Duplicates
  const textMap = new Map<string, typeof allQuotes>();
  for (const q of allQuotes) {
    const key = q.text.toLowerCase().trim().substring(0, 100);
    if (!textMap.has(key)) textMap.set(key, []);
    textMap.get(key)!.push(q);
  }
  let dupeCount = 0;
  const dupeIds: string[] = [];
  console.log(`\n=== DUPLICATE QUOTES ===`);
  for (const [text, group] of textMap) {
    if (group.length > 1) {
      dupeCount += group.length - 1;
      // Keep first, mark rest for deletion
      for (let i = 1; i < group.length; i++) dupeIds.push(group[i].id);
      if (dupeCount <= 15) {
        console.log(`  "${text.substring(0, 80)}" x${group.length}`);
      }
    }
  }
  console.log(`Total duplicates: ${dupeCount}`);
  
  // Quotes from Unknown speakers
  const unknownQuotes = allQuotes.filter(q => q.speaker?.displayName?.toLowerCase().includes("unknown"));
  console.log(`\n=== UNKNOWN SPEAKER QUOTES: ${unknownQuotes.length} ===`);
  const bySpeaker = new Map<string, typeof allQuotes>();
  for (const q of unknownQuotes) {
    const name = q.speaker?.displayName || "null";
    if (!bySpeaker.has(name)) bySpeaker.set(name, []);
    bySpeaker.get(name)!.push(q);
  }
  for (const [name, quotes] of bySpeaker) {
    console.log(`\n  ${name} (${quotes.length} quotes):`);
    for (const q of quotes.slice(0, 3)) {
      console.log(`    EP.${q.episode?.episodeNumber}: "${q.text.substring(0, 120)}"`);
    }
  }
  
  // Speakerless quotes  
  const noSpeaker = allQuotes.filter(q => !q.speakerPersonId);
  console.log(`\n=== NO SPEAKER: ${noSpeaker.length} ===`);
  for (const q of noSpeaker.slice(0, 10)) {
    console.log(`  EP.${q.episode?.episodeNumber}: "${q.text.substring(0, 120)}"`);
  }
  
  // VA and Beta leftover records
  const va = await prisma.person.findFirst({ where: { displayName: "VA" }, select: { id: true, slug: true, shortBio: true, _count: { select: { guestAppearances: true, quotes: true } } } });
  const beta = await prisma.person.findFirst({ where: { displayName: "Beta" }, select: { id: true, slug: true, shortBio: true, _count: { select: { guestAppearances: true, quotes: true } } } });
  console.log(`\nVA record:`, va ? `${va.slug} - ${va._count.guestAppearances} eps, ${va._count.quotes} quotes` : "not found");
  console.log(`Beta record:`, beta ? `${beta.slug} - ${beta._count.guestAppearances} eps, ${beta._count.quotes} quotes` : "not found");
  
  // Check significance field usage
  const withSig = allQuotes.filter(q => q.significance);
  console.log(`\nQuotes with significance: ${withSig.length}`);
  if (withSig.length > 0) {
    const sigCounts = new Map<string, number>();
    for (const q of withSig) {
      sigCounts.set(q.significance!, (sigCounts.get(q.significance!) || 0) + 1);
    }
    for (const [sig, count] of [...sigCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
      console.log(`  "${sig.substring(0, 80)}": ${count}`);
    }
  }
  
  // Context field usage
  const withCtx = allQuotes.filter(q => q.context);
  console.log(`Quotes with context: ${withCtx.length}`);
  
  // Episodes with most quotes
  const epQuotes = new Map<number, number>();
  for (const q of allQuotes) {
    if (q.episode) {
      epQuotes.set(q.episode.episodeNumber, (epQuotes.get(q.episode.episodeNumber) || 0) + 1);
    }
  }
  const topEps = [...epQuotes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log(`\n=== TOP 10 EPISODES BY QUOTES ===`);
  for (const [ep, count] of topEps) {
    console.log(`  EP.${ep}: ${count} quotes`);
  }
  
  // How many episodes have 0 quotes?
  const totalEps = await prisma.episode.count();
  const epsWithQuotes = new Set(allQuotes.map(q => q.episodeId)).size;
  console.log(`\nEpisodes with quotes: ${epsWithQuotes} / ${totalEps}`);
  
  // Check episodes WITH transcripts but WITHOUT quotes
  const epsWithTranscripts = await prisma.episode.count({ where: { transcriptRaw: { not: null } } });
  const epsWithBoth = await prisma.episode.findMany({
    where: { transcriptRaw: { not: null } },
    select: { id: true, episodeNumber: true },
  });
  let withTranscriptNoQuotes = 0;
  const noQuoteEpIds = new Set(allQuotes.map(q => q.episodeId));
  for (const ep of epsWithBoth) {
    if (!noQuoteEpIds.has(ep.id)) withTranscriptNoQuotes++;
  }
  console.log(`Episodes with transcripts: ${epsWithTranscripts}`);
  console.log(`Episodes with transcript but NO quotes: ${withTranscriptNoQuotes}`);
  
  await disconnect();
}
main();
