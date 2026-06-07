import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

// Removes filler words (uh, um, umm, uhh, etc.) from quote text.
// Handles patterns like: "uh, ", " uh ", ", uh,", "um— ", etc.
function removeFillers(text: string): string {
  // Order matters: handle punctuation-adjacent patterns first
  return text
    // "uh, " or "um, " at start or mid-sentence
    .replace(/\b(uh|um|umm|uhh|uhm|erm)\s*,\s*/gi, "")
    // ", uh " or ", um " mid-sentence
    .replace(/,\s*(uh|um|umm|uhh|uhm|erm)\b\s*/gi, ",")
    // " uh " or " um " standalone
    .replace(/\s+(uh|um|umm|uhh|uhm|erm)\b\s+/gi, " ")
    // "uh— " or "um— " (em dash stutters)
    .replace(/\b(uh|um|umm|uhh|uhm|erm)\s*[—–-]\s*/gi, "")
    // leftover at start of string
    .replace(/^(uh|um|umm|uhh|uhm|erm)\b\s*/gi, "")
    // clean up double spaces and leading/trailing whitespace
    .replace(/  +/g, " ")
    .trim();
}

async function main() {
  const prisma = getPrisma();

  const quotes = await prisma.quote.findMany({
    select: { id: true, text: true },
  });

  const toUpdate: { id: string; original: string; cleaned: string }[] = [];

  for (const q of quotes) {
    const cleaned = removeFillers(q.text);
    if (cleaned !== q.text) {
      toUpdate.push({ id: q.id, original: q.text, cleaned });
    }
  }

  console.log(`Found ${toUpdate.length} quotes to clean out of ${quotes.length} total.\n`);

  for (const { id, original, cleaned } of toUpdate) {
    console.log(`[${id}]`);
    console.log(`  BEFORE: ${original.substring(0, 120)}`);
    console.log(`  AFTER:  ${cleaned.substring(0, 120)}`);
    console.log();
  }

  if (toUpdate.length === 0) {
    console.log("Nothing to update.");
    await disconnect();
    return;
  }

  const args = process.argv.slice(2);
  if (!args.includes("--apply")) {
    console.log("Dry run. Pass --apply to commit changes.");
    await disconnect();
    return;
  }

  for (const { id, cleaned } of toUpdate) {
    await prisma.quote.update({ where: { id }, data: { text: cleaned } });
  }

  console.log(`Updated ${toUpdate.length} quotes.`);
  await disconnect();
}

main();
