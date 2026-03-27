import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

// Fix common encoding artifacts in episode text fields
const REPLACEMENTS: [RegExp, string][] = [
  // Mojibake for smart quotes and apostrophes
  [/\u00e2\u0080\u0099/g, "'"],
  [/\u00e2\u0080\u009c/g, "\u201C"],
  [/\u00e2\u0080\u009d/g, "\u201D"],
  [/\u00e2\u0080\u0093/g, "\u2013"],
  [/\u00e2\u0080\u0094/g, "\u2014"],
  [/\u00e2\u0080\u00a6/g, "\u2026"],
  // Replacement character
  [/\uFFFD/g, "'"],
  // Common HTML entities that leaked through
  [/&amp;/g, "&"],
  [/&lt;/g, "<"],
  [/&gt;/g, ">"],
  [/&#39;/g, "'"],
  [/&quot;/g, '"'],
  // Patterns like "It;s" "Don;t" — semicolons replacing apostrophes
  [/\b(It|Don|Can|Won|Didn|Doesn|Isn|Wasn|Weren|Shouldn|Couldn|Wouldn|Ain|That|There|Here|Who|What|Let|I);(s|t|m|d|ll|re|ve)\b/g, "$1'$2"],
];

function fixText(text: string): string {
  let result = text;
  for (const [pattern, replacement] of REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const p = getPrisma();

  // Fix episodes
  const episodes = await p.episode.findMany({
    select: { id: true, title: true, summaryShort: true, summaryLong: true, cutOfPsyche: true },
  });

  let fixCount = 0;
  for (const ep of episodes) {
    const newTitle = fixText(ep.title);
    const newShort = ep.summaryShort ? fixText(ep.summaryShort) : null;
    const newLong = ep.summaryLong ? fixText(ep.summaryLong) : null;
    const newCut = ep.cutOfPsyche ? fixText(ep.cutOfPsyche) : null;

    const changed =
      newTitle !== ep.title ||
      newShort !== ep.summaryShort ||
      newLong !== ep.summaryLong ||
      newCut !== ep.cutOfPsyche;

    if (changed) {
      fixCount++;
      if (fixCount <= 10) {
        console.log("Fix: " + ep.title.slice(0, 60) + (ep.title !== newTitle ? " → " + newTitle.slice(0, 60) : " (body fix)"));
      }

      if (!dryRun) {
        await p.episode.update({
          where: { id: ep.id },
          data: {
            title: newTitle,
            summaryShort: newShort,
            summaryLong: newLong,
            cutOfPsyche: newCut,
          },
        });
      }
    }
  }

  // Fix quotes
  const quotes = await p.quote.findMany({
    select: { id: true, text: true, context: true },
  });

  let quoteFixCount = 0;
  for (const q of quotes) {
    const newText = fixText(q.text);
    const newCtx = q.context ? fixText(q.context) : null;
    if (newText !== q.text || newCtx !== q.context) {
      quoteFixCount++;
      if (!dryRun) {
        await p.quote.update({
          where: { id: q.id },
          data: { text: newText, context: newCtx },
        });
      }
    }
  }

  // Fix lore entries
  const lore = await p.loreEntry.findMany({
    select: { id: true, title: true, summary: true, fullEntry: true },
  });

  let loreFixCount = 0;
  for (const l of lore) {
    const newTitle = fixText(l.title);
    const newSummary = l.summary ? fixText(l.summary) : null;
    const newFull = l.fullEntry ? fixText(l.fullEntry) : null;
    if (newTitle !== l.title || newSummary !== l.summary || newFull !== l.fullEntry) {
      loreFixCount++;
      if (!dryRun) {
        await p.loreEntry.update({
          where: { id: l.id },
          data: { title: newTitle, summary: newSummary, fullEntry: newFull },
        });
      }
    }
  }

  console.log("Episodes fixed: " + fixCount);
  console.log("Quotes fixed: " + quoteFixCount);
  console.log("Lore fixed: " + loreFixCount);
  console.log(dryRun ? "\n[DRY RUN]" : "\nDone");
  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
