/**
 * Find every mention of "Joni" across the database — Person, Quote,
 * Episode (titles, summaries), Topic, LoreEntry. Read-only audit.
 */
import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

(async () => {
  const p = getPrisma();
  const ci = { mode: "insensitive" as const };

  const persons = await p.person.findMany({
    where: {
      OR: [
        { displayName: { contains: "joni", ...ci } },
        { slug: { contains: "joni" } },
        { altNames: { has: "Joni" } },
        { shortBio: { contains: "joni", ...ci } },
        { searchText: { contains: "joni", ...ci } },
      ],
    },
    select: {
      id: true, displayName: true, slug: true, altNames: true, shortBio: true,
      _count: { select: { guestAppearances: true, quotes: true, mentions: true } },
    },
  });
  console.log(`\n=== Persons (${persons.length}) ===`);
  for (const r of persons) {
    console.log(`  ${r.id} | "${r.displayName}" (${r.slug}) — ${r._count.guestAppearances}g/${r._count.quotes}q/${r._count.mentions}m`);
    if (r.altNames?.length) console.log(`     altNames: ${JSON.stringify(r.altNames)}`);
    if (r.shortBio?.toLowerCase().includes("joni")) console.log(`     bio: ${r.shortBio.slice(0, 200)}`);
  }

  const quotes = await p.quote.findMany({
    where: { text: { contains: "joni", ...ci } },
    select: { id: true, text: true, episodeId: true, speakerPersonId: true, context: true },
    take: 200,
  });
  console.log(`\n=== Quotes (${quotes.length}) ===`);
  for (const q of quotes) {
    console.log(`  ${q.id} | speaker=${q.speakerPersonId ?? "?"} | "${q.text.slice(0, 160)}"`);
  }

  const episodes = await p.episode.findMany({
    where: {
      OR: [
        { title: { contains: "joni", ...ci } },
        { summaryShort: { contains: "joni", ...ci } },
        { summaryLong: { contains: "joni", ...ci } },
      ],
    },
    select: { id: true, title: true, slug: true, summaryShort: true, summaryLong: true },
    take: 200,
  });
  console.log(`\n=== Episodes (${episodes.length}) ===`);
  for (const e of episodes) {
    console.log(`  ${e.id} | "${e.title}" (${e.slug})`);
    if (e.summaryShort?.toLowerCase().includes("joni")) console.log(`     short: ${e.summaryShort.slice(0, 200)}`);
    if (e.summaryLong?.toLowerCase().includes("joni")) {
      const txt = e.summaryLong;
      const idx = txt.toLowerCase().indexOf("joni");
      console.log(`     long@${idx}: ...${txt.slice(Math.max(0, idx - 60), idx + 120)}...`);
    }
  }

  const topics = await p.topic.findMany({
    where: { OR: [
      { title: { contains: "joni", ...ci } },
      { slug: { contains: "joni" } },
      { description: { contains: "joni", ...ci } },
    ]},
    select: { id: true, title: true, slug: true, description: true },
  });
  console.log(`\n=== Topics (${topics.length}) ===`);
  for (const t of topics) {
    console.log(`  ${t.id} | "${t.title}" (${t.slug})`);
    if (t.description?.toLowerCase().includes("joni")) console.log(`     desc: ${t.description.slice(0, 200)}`);
  }

  const lore = await p.loreEntry.findMany({
    where: { OR: [
      { title: { contains: "joni", ...ci } },
      { slug: { contains: "joni" } },
      { summary: { contains: "joni", ...ci } },
      { fullEntry: { contains: "joni", ...ci } },
      { searchText: { contains: "joni", ...ci } },
    ]},
    select: { id: true, title: true, slug: true, summary: true, fullEntry: true },
  });
  console.log(`\n=== Lore Entries (${lore.length}) ===`);
  for (const l of lore) {
    console.log(`  ${l.id} | "${l.title}" (${l.slug})`);
    for (const [field, txt] of [["summary", l.summary], ["fullEntry", l.fullEntry]] as const) {
      if (txt?.toLowerCase().includes("joni")) {
        const idx = txt.toLowerCase().indexOf("joni");
        console.log(`     ${field}@${idx}: ...${txt.slice(Math.max(0, idx - 60), idx + 120)}...`);
      }
    }
  }

  await disconnect();
})();
