import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();
  
  // Get all quotes, episode summaries, and person bios to mine for slang
  const quotes = await prisma.quote.findMany({
    select: { text: true, speaker: { select: { displayName: true } }, episode: { select: { episodeNumber: true, title: true } } },
  });
  
  const episodes = await prisma.episode.findMany({
    select: { episodeNumber: true, title: true, summaryShort: true, summaryLong: true },
  });
  
  const people = await prisma.person.findMany({
    select: { displayName: true, shortBio: true, altNames: true },
  });
  
  // Collect all text
  const allText = [
    ...quotes.map(q => q.text),
    ...episodes.map(e => [e.title, e.summaryShort, e.summaryLong].filter(Boolean).join(" ")),
    ...people.map(p => [p.shortBio].filter(Boolean).join(" ")),
  ].join("\n");
  
  // Find recurring unique terms/phrases
  // Search for terms in quotes that appear multiple times
  const termFreq = new Map<string, number>();
  const words = allText.toLowerCase().split(/[\s.,!?;:'"()\[\]]+/);
  for (const w of words) {
    if (w.length > 3) termFreq.set(w, (termFreq.get(w) || 0) + 1);
  }
  
  // Known panelverse terms to look for usage context
  const panelverseTerms = [
    "panel", "panelverse", "open panel", "gong", "gonged", "porn bomb", "porn bombed",
    "mod", "moderator", "kick", "kicked", "ban", "banned", "muted",
    "super chat", "superchat", "raid", "raided", "dono", "donate",
    "tarot", "reading", "pull", "spread", "deck",
    "troll", "trolling", "sock", "sock account", "sock puppet",
    "dox", "doxxing", "doxxed",
    "beetas", "beta", "golden girl", "rage queen",
    "cult", "cult of psyche", "codex", "cultcodex",
    "psycheverse", "awakens",
    "cat daddy", "meow", "mr trix", "lenore",
    "freestyle", "rap battle", "bars",
    "clique", "circus", "panel circus",
    "normie", "npc", "based", "cringe",
    "simp", "simping", "white knight",
    "receipts", "screenshots", "exposed",
    "karen", "pick me",
    "lurk", "lurking", "lurker",
    "rogue mod", "nightbot",
    "membership", "member",
    "hater", "haters club",
    "drama", "tea", "spill",
    "clout", "clout chasing",
    "beef", "squash", "squashing beef",
    "roast", "roasted",
    "salty", "pressed", "triggered",
    "cope", "coping",
    "vibe", "vibes", "energy",
    "manifest", "manifestation",
    "third eye", "awakening",
  ];
  
  // Find actual usage examples for each term
  console.log("=== PANELVERSE TERM USAGE ===\n");
  for (const term of panelverseTerms) {
    const regex = new RegExp(term, "gi");
    const matchingQuotes = quotes.filter(q => regex.test(q.text)).slice(0, 2);
    const matchingTitles = episodes.filter(e => regex.test(e.title || "")).slice(0, 1);
    const matchingSummaries = episodes.filter(e => regex.test(e.summaryLong || "")).slice(0, 1);
    
    const totalMatches = quotes.filter(q => regex.test(q.text)).length 
      + episodes.filter(e => regex.test(e.title || "") || regex.test(e.summaryLong || "")).length;
    
    if (totalMatches > 0) {
      console.log(`\n"${term}" — ${totalMatches} mentions`);
      for (const q of matchingQuotes) {
        console.log(`  Q [${q.speaker?.displayName}]: "${q.text.substring(0, 120)}"`);
      }
      for (const e of matchingTitles) {
        console.log(`  EP.${e.episodeNumber}: "${e.title}"`);
      }
    }
  }
  
  // Find unique/interesting words that appear frequently in quotes but not in normal English
  console.log("\n\n=== HIGH-FREQUENCY UNUSUAL TERMS ===");
  const commonWords = new Set(["the","and","that","this","with","have","from","they","been","were","what","when","will","your","their","about","would","there","could","other","than","then","some","them","more","into","over","just","also","know","like","don't","i'm","it's","can't","he's","she's","we're","you're","didn't","doesn't","people","going","because","really","think","want","make","good","look","very","much","come","back","still","even","here","take","only","come","need","said","each","tell","does","give","most","find","them","after","same","well","long","work","call","keep","last","down","should","never","time","hand","life","came","went","made","left","gone","many","being","those","used","right","first","thing","where","help","turn","put","hard","mean","love"]);
  
  const unusual = [...termFreq.entries()]
    .filter(([word, count]) => count >= 5 && count < 500 && !commonWords.has(word))
    .sort((a, b) => b[1] - a[1]);
  
  // Check lore entries too
  const loreCount = await prisma.loreEntry.count();
  const topicCount = await prisma.topic.count();
  console.log(`\nLore entries: ${loreCount}, Topics: ${topicCount}`);
  
  // Get unique episode titles with panelverse-specific language
  console.log("\n=== UNIQUE TITLE PATTERNS ===");
  const titlePatterns = episodes.filter(e => 
    /panel|tarot|cats|meow|psyche|troll|drama|open|circus|madness|awaken/i.test(e.title || "")
  ).slice(0, 20);
  for (const e of titlePatterns) {
    console.log(`  EP.${e.episodeNumber}: ${e.title}`);
  }
  
  await disconnect();
}
main();
