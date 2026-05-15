import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();

  const allTopics = await prisma.topic.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      _count: { select: { episodes: true, people: true } },
    },
    orderBy: { title: "asc" },
  });

  console.log(`Total topics: ${allTopics.length}\n`);

  // 1. Exact title duplicates (case-insensitive)
  const titleMap = new Map<string, typeof allTopics>();
  for (const t of allTopics) {
    const key = t.title.toLowerCase().trim();
    if (!titleMap.has(key)) titleMap.set(key, []);
    titleMap.get(key)!.push(t);
  }

  const exactDupes = [...titleMap.entries()].filter(([_, v]) => v.length > 1);
  console.log(`=== EXACT TITLE DUPLICATES (${exactDupes.length} groups) ===`);
  let exactTotal = 0;
  for (const [name, records] of exactDupes) {
    console.log(`\n  "${name}" (${records.length} records):`);
    for (const r of records) {
      console.log(`    ${r.slug} | eps=${r._count.episodes} ppl=${r._count.people}`);
    }
    exactTotal += records.length - 1;
  }
  console.log(`\n  -> ${exactTotal} removable from exact dupes`);

  // 2. Singular/plural pairs
  console.log(`\n\n=== SINGULAR/PLURAL PAIRS ===`);
  const slugSet = new Set(allTopics.map(t => t.slug));
  let pluralCount = 0;
  for (const t of allTopics) {
    const slug = t.slug;
    // Check if adding/removing 's' matches another
    if (slug.endsWith("s") && slugSet.has(slug.slice(0, -1))) {
      const singular = allTopics.find(x => x.slug === slug.slice(0, -1));
      if (singular) {
        pluralCount++;
        console.log(`  "${t.title}" (${t.slug}, eps=${t._count.episodes}) <-> "${singular.title}" (${singular.slug}, eps=${singular._count.episodes})`);
      }
    }
  }
  if (pluralCount === 0) console.log("  None found.");

  // 3. Topics with 0 episodes AND 0 people (orphans)
  const orphans = allTopics.filter(t => t._count.episodes === 0 && t._count.people === 0);
  console.log(`\n\n=== ORPHAN TOPICS (0 episodes, 0 people): ${orphans.length} ===`);
  if (orphans.length > 0) {
    for (const t of orphans.slice(0, 30)) {
      console.log(`  "${t.title}" (${t.slug})`);
    }
    if (orphans.length > 30) console.log(`  ... and ${orphans.length - 30} more`);
  }

  // 4. Near-duplicate titles (normalized comparison)
  console.log(`\n\n=== NEAR-DUPLICATE TITLES ===`);
  const normalized = allTopics.map(t => ({
    ...t,
    norm: t.title.toLowerCase().replace(/[^a-z0-9]/g, ""),
  }));

  const normMap = new Map<string, typeof normalized>();
  for (const t of normalized) {
    if (t.norm.length < 3) continue;
    if (!normMap.has(t.norm)) normMap.set(t.norm, []);
    normMap.get(t.norm)!.push(t);
  }

  const nearDupes = [...normMap.entries()].filter(([_, v]) => v.length > 1);
  let nearCount = 0;
  for (const [norm, records] of nearDupes) {
    // Skip if already caught by exact match
    const titles = new Set(records.map(r => r.title.toLowerCase().trim()));
    if (titles.size === 1) continue; // already in exact dupes

    nearCount++;
    console.log(`\n  [${norm}]:`);
    for (const r of records) {
      console.log(`    "${r.title}" (${r.slug}) eps=${r._count.episodes} ppl=${r._count.people}`);
    }
  }
  if (nearCount === 0) console.log("  None found beyond exact dupes.");

  // 5. Topics that differ only by capitalization or punctuation
  console.log(`\n\n=== CASE/PUNCTUATION VARIANTS ===`);
  let caseCount = 0;
  for (const [_, records] of exactDupes) {
    const uniqueTitles = new Set(records.map(r => r.title));
    if (uniqueTitles.size > 1) {
      caseCount++;
      console.log(`  Variants: ${[...uniqueTitles].join(" | ")}`);
    }
  }
  if (caseCount === 0) console.log("  None found.");

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Total topics: ${allTopics.length}`);
  console.log(`Exact dupe groups: ${exactDupes.length} (${exactTotal} removable)`);
  console.log(`Orphans: ${orphans.length}`);
  console.log(`Near-dupes (beyond exact): ${nearCount}`);

  await disconnect();
}

main().catch(async (e) => { console.error(e); await disconnect(); process.exit(1); });
