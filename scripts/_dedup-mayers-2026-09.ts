/**
 * Merge the Alexandra Mayers duplicate Person rows (admin people list,
 * 2026-09-12) into the canonical "Alexandra Mayers". The McQueen rows are
 * deliberately left alone per John.
 *
 * Extends _dedup-mcqueen-mayers.ts with the relations that script missed:
 * RelationshipEvent (cascade-deletes with the dupe otherwise), the personSlug
 * soft links (PersonMedia, PsychenomiconEntity, SavedSearch, person Annotations),
 * WeeklyDigest personIds arrays, and missing keeper profile metadata.
 * Related-person pairs and relationship-event endpoints stay normalized.
 *
 *   npx tsx scripts/_dedup-mayers-2026-09.ts            # dry run
 *   npx tsx scripts/_dedup-mayers-2026-09.ts --execute  # apply
 */
import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";
import { mergeOne } from "./merge-mayers-person";

type Prisma = ReturnType<typeof getPrisma>;

const KEEP_NAME = "Alexandra Mayers";

// Exact displayNames from the admin list. Anything containing "McQueen" is excluded.
const DUPE_NAMES = [
  "Alexander May / Alexander Mayer",
  "Alexander Mayer",
  "Alexander Mayers",
  "Alexander Mayor / Alex",
  "Alexander Mayors",
  "Alexander/Alexandria",
  "Alexandra",
  "Alexandra (Alex / AM / Grateful 2026 / Dana / Peek Cartel)",
  "Alexandra (Alex Meyers)",
  "Alexandra (Alex)",
  "Alexandra (Alex/Alexandre Mayors)",
  "Alexandra (Monica Foster)",
  "Alexandra Mayers (AM)",
  "Alexandra Mayers (Monica Foster)",
  "Alexandra Mayers / Alex / Melissa",
  "Alexandra Mayers / Bita",
  "Alexandra Mayor (Alex)",
  "Alexandra Mayors",
  // Round 2 — rows past the first admin page, approved 2026-09-12
  "Alexandra Mayors / Alexandra Mayor",
  "Alexandra Mayors / Monica Foster",
  "Alexandra Melody Mayers",
  "Alexandra Melody Mayors",
  "Alexandra Meyers",
  "Alexandra Meyers / Alexandra Mayers",
  "Alexandra Myers",
  "Alexandra/Alexandra Mayers",
];

const COUNTS = {
  select: {
    guestAppearances: true, mentions: true, quotes: true, topics: true, loreConnections: true,
    relatedFrom: true, relatedTo: true, relationshipEventsFrom: true, relationshipEventsTo: true,
  },
} as const;

async function byName(p: Prisma, displayName: string) {
  return p.person.findMany({
    where: { displayName },
    include: { _count: COUNTS },
    orderBy: { createdAt: "asc" },
  });
}

function fmt(c: { guestAppearances: number; mentions: number; quotes: number; topics: number; loreConnections: number; relatedFrom: number; relatedTo: number; relationshipEventsFrom: number; relationshipEventsTo: number }) {
  return `${c.guestAppearances}g/${c.mentions}m/${c.quotes}q/${c.topics}t/${c.loreConnections}l/${c.relatedFrom + c.relatedTo}rel/${c.relationshipEventsFrom + c.relationshipEventsTo}ev`;
}

async function main() {
  const execute = process.argv.includes("--execute");
  const p = getPrisma();

  const keepers = await byName(p, KEEP_NAME);
  if (keepers.length !== 1) {
    console.error(`Expected exactly one "${KEEP_NAME}", found ${keepers.length}:`, keepers.map(k => `${k.id} (${k.slug})`));
    process.exit(1);
  }
  const keep = keepers[0];
  console.log(`KEEP   ${keep.id} | "${keep.displayName}" slug=${keep.slug} — ${fmt(keep._count)}`);

  const dupes: { id: string; slug: string; displayName: string }[] = [];
  for (const name of DUPE_NAMES) {
    const rows = await byName(p, name);
    if (rows.length === 0) { console.log(`  ??     "${name}" — NOT FOUND, skipping`); continue; }
    for (const r of rows) {
      console.log(`  MERGE  ${r.id} | "${r.displayName}" slug=${r.slug} — ${fmt(r._count)}${rows.length > 1 ? "  (one of " + rows.length + " with this name)" : ""}`);
      dupes.push({ id: r.id, slug: r.slug, displayName: r.displayName });
    }
  }
  console.log(`\n${dupes.length} rows to merge into "${KEEP_NAME}".`);

  if (!execute) { console.log("DRY RUN — pass --execute to apply."); await disconnect(); return; }

  for (const d of dupes) {
    await mergeOne(p, keep.id, keep.slug, d.id, d.slug);
    console.log(`  merged "${d.displayName}"`);
  }
  const after = await p.person.findUnique({ where: { id: keep.id }, include: { _count: COUNTS } });
  console.log(`\nAFTER  "${after?.displayName}" — ${after ? fmt(after._count) : "?"} | altNames=${after?.altNames.length}`);
  console.log("Now run: npx tsx scripts/_rebuild-search-text.ts");
  await disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
