import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

/**
 * Survey likely duplicate Person and Topic records.
 * Heuristics:
 *   - Persons: identical lowercased displayName, OR very-close slugs
 *   - Topics: identical lowercased name, OR very-close slugs
 * Output is a manual review list — does NOT mutate anything.
 */

function norm(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function main() {
  const p = getPrisma();

  // ─── Persons ──────────────────────────────────────────
  const people = await p.person.findMany({
    select: {
      id: true,
      displayName: true,
      slug: true,
      personType: true,
      altNames: true,
      _count: {
        select: { guestAppearances: true, quotes: true, mentions: true },
      },
    },
  });

  const byNorm = new Map<string, typeof people>();
  for (const person of people) {
    const key = norm(person.displayName);
    if (!key) continue;
    const arr = byNorm.get(key) ?? [];
    arr.push(person);
    byNorm.set(key, arr);
  }

  const personDupes = [...byNorm.entries()].filter(([, arr]) => arr.length > 1);
  console.log(`\n=== Person duplicates (by normalized displayName) — ${personDupes.length} groups ===\n`);
  for (const [key, arr] of personDupes.slice(0, 50)) {
    console.log(`  "${key}":`);
    for (const person of arr) {
      console.log(
        `    id=${person.id} | "${person.displayName}" (slug=${person.slug}, type=${person.personType}) — ${person._count.guestAppearances}g/${person._count.quotes}q/${person._count.mentions}m`
      );
    }
  }

  // ─── Topics ───────────────────────────────────────────
  const topics = await p.topic.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      _count: { select: { episodes: true, people: true } },
    },
  });

  const tByNorm = new Map<string, typeof topics>();
  for (const t of topics) {
    const key = norm(t.title);
    if (!key) continue;
    const arr = tByNorm.get(key) ?? [];
    arr.push(t);
    tByNorm.set(key, arr);
  }
  const topicDupes = [...tByNorm.entries()].filter(([, arr]) => arr.length > 1);

  console.log(`\n=== Topic duplicates (by normalized name) — ${topicDupes.length} groups ===\n`);
  for (const [key, arr] of topicDupes.slice(0, 50)) {
    console.log(`  "${key}":`);
    for (const t of arr) {
      console.log(
        `    id=${t.id} | "${t.title}" (slug=${t.slug}) — ${t._count.episodes}eps/${t._count.people}ppl`
      );
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total persons: ${people.length}`);
  console.log(`Person dupe groups: ${personDupes.length}`);
  console.log(`Person rows that could merge away: ${personDupes.reduce((acc, [, arr]) => acc + arr.length - 1, 0)}`);
  console.log(`Total topics: ${topics.length}`);
  console.log(`Topic dupe groups: ${topicDupes.length}`);
  console.log(`Topic rows that could merge away: ${topicDupes.reduce((acc, [, arr]) => acc + arr.length - 1, 0)}`);

  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
