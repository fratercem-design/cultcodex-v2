// Fix encoding artifacts in episode titles
import { getPrisma, disconnect, buildSearchText } from "./lib";

const REPLACEMENTS: [RegExp, string][] = [
  [/It;s/g, "It's"],
  [/it;s/g, "it's"],
  [/It\'s/g, "It's"],     // already correct, skip
  [/that;s/gi, "that's"],
  [/what;s/gi, "what's"],
  [/who;s/gi, "who's"],
  [/here;s/gi, "here's"],
  [/there;s/gi, "there's"],
  [/don;t/gi, "don't"],
  [/can;t/gi, "can't"],
  [/won;t/gi, "won't"],
  [/isn;t/gi, "isn't"],
  [/aren;t/gi, "aren't"],
  [/wasn;t/gi, "wasn't"],
  [/doesn;t/gi, "doesn't"],
  [/didn;t/gi, "didn't"],
  [/couldn;t/gi, "couldn't"],
  [/wouldn;t/gi, "wouldn't"],
  [/shouldn;t/gi, "shouldn't"],
  [/let;s/gi, "let's"],
  [/I;m/g, "I'm"],
  [/i;m/g, "I'm"],
  [/I;ve/g, "I've"],
  [/i;ve/g, "I've"],
  [/I;ll/g, "I'll"],
  [/you;re/gi, "you're"],
  [/you;ve/gi, "you've"],
  [/we;re/gi, "we're"],
  [/they;re/gi, "they're"],
  [/&amp;/g, "&"],
  [/&#39;/g, "'"],
  [/&quot;/g, '"'],
  [/\u00e2\u0080\u0099/g, "'"],  // UTF-8 right single quote mojibake
  [/\u00c3\u00a9/g, "e"],        // é mojibake
  [/\u00e2\u0080\u009c/g, '"'],  // left double quote mojibake
  [/\u00e2\u0080\u009d/g, '"'],  // right double quote mojibake
  [/\u00e2\u0080\u0093/g, "—"],  // em dash mojibake
  [/\u00ef\u00bf\u00bd/g, "'"],  // replacement character
];

async function main() {
  const prisma = getPrisma();

  const episodes = await prisma.episode.findMany({
    select: { id: true, title: true, summaryShort: true },
  });

  let titlesFixed = 0;
  let summariesFixed = 0;

  for (const ep of episodes) {
    let newTitle = ep.title;
    let newSummary = ep.summaryShort;

    for (const [pattern, replacement] of REPLACEMENTS) {
      newTitle = newTitle.replace(pattern, replacement);
      if (newSummary) newSummary = newSummary.replace(pattern, replacement);
    }

    const titleChanged = newTitle !== ep.title;
    const summaryChanged = newSummary !== ep.summaryShort;

    if (titleChanged || summaryChanged) {
      const data: Record<string, string> = {};
      if (titleChanged) {
        data.title = newTitle;
        data.searchText = buildSearchText(newTitle, newSummary);
        console.log(`  TITLE: "${ep.title}" → "${newTitle}"`);
        titlesFixed++;
      }
      if (summaryChanged && newSummary) {
        data.summaryShort = newSummary;
        summariesFixed++;
      }
      await prisma.episode.update({ where: { id: ep.id }, data });
    }
  }

  console.log(`\nTitles fixed: ${titlesFixed}`);
  console.log(`Summaries fixed: ${summariesFixed}`);
  await disconnect();
}

main();
