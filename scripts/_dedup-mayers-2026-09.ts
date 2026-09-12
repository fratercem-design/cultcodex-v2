/**
 * Merge the Alexandra Mayers duplicate Person rows (admin people list,
 * 2026-09-12) into the canonical "Alexandra Mayers". The McQueen rows are
 * deliberately left alone per John.
 *
 * Extends _dedup-mcqueen-mayers.ts with the relations that script missed:
 * RelationshipEvent (cascade-deletes with the dupe otherwise), the personSlug
 * soft links (PersonMedia, PsychenomiconEntity, SavedSearch), WeeklyDigest
 * personIds arrays, and the keeper's firstAppearanceEpisodeId.
 *
 *   npx tsx scripts/_dedup-mayers-2026-09.ts            # dry run
 *   npx tsx scripts/_dedup-mayers-2026-09.ts --execute  # apply
 */
import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

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

async function mergeOne(p: Prisma, keepId: string, keepSlug: string, dupeId: string, dupeSlug: string) {
  // 1. EpisodeGuest — move, or drop when the keeper already has that episode
  const keeperEp = new Set((await p.episodeGuest.findMany({ where: { personId: keepId }, select: { episodeId: true } })).map(g => g.episodeId));
  for (const g of await p.episodeGuest.findMany({ where: { personId: dupeId } })) {
    const where = { episodeId_personId: { episodeId: g.episodeId, personId: dupeId } };
    if (keeperEp.has(g.episodeId)) await p.episodeGuest.delete({ where });
    else await p.episodeGuest.update({ where, data: { personId: keepId } });
  }

  // 2. EpisodeMentionedPerson
  const keeperM = new Set((await p.episodeMentionedPerson.findMany({ where: { personId: keepId }, select: { episodeId: true } })).map(m => m.episodeId));
  for (const m of await p.episodeMentionedPerson.findMany({ where: { personId: dupeId } })) {
    const where = { episodeId_personId: { episodeId: m.episodeId, personId: dupeId } };
    if (keeperM.has(m.episodeId)) await p.episodeMentionedPerson.delete({ where });
    else await p.episodeMentionedPerson.update({ where, data: { personId: keepId } });
  }

  // 3. Quotes
  await p.quote.updateMany({ where: { speakerPersonId: dupeId }, data: { speakerPersonId: keepId } });

  // 4. PersonTopic
  const keeperT = new Set((await p.personTopic.findMany({ where: { personId: keepId }, select: { topicId: true } })).map(t => t.topicId));
  for (const t of await p.personTopic.findMany({ where: { personId: dupeId } })) {
    const where = { personId_topicId: { personId: dupeId, topicId: t.topicId } };
    if (keeperT.has(t.topicId)) await p.personTopic.delete({ where });
    else await p.personTopic.update({ where, data: { personId: keepId } });
  }

  // 5. PersonLore
  const keeperL = new Set((await p.personLore.findMany({ where: { personId: keepId }, select: { loreEntryId: true } })).map(l => l.loreEntryId));
  for (const l of await p.personLore.findMany({ where: { personId: dupeId } })) {
    const where = { personId_loreEntryId: { personId: dupeId, loreEntryId: l.loreEntryId } };
    if (keeperL.has(l.loreEntryId)) await p.personLore.delete({ where });
    else await p.personLore.update({ where, data: { personId: keepId } });
  }

  // 6. RelatedPerson — both directions; drop would-be self-references and existing pairs
  for (const r of await p.relatedPerson.findMany({ where: { personAId: dupeId } })) {
    const where = { personAId_personBId: { personAId: dupeId, personBId: r.personBId } };
    const clash = r.personBId === keepId
      || !!(await p.relatedPerson.findUnique({ where: { personAId_personBId: { personAId: keepId, personBId: r.personBId } } }));
    if (clash) await p.relatedPerson.delete({ where });
    else await p.relatedPerson.update({ where, data: { personAId: keepId } });
  }
  for (const r of await p.relatedPerson.findMany({ where: { personBId: dupeId } })) {
    const where = { personAId_personBId: { personAId: r.personAId, personBId: dupeId } };
    const clash = r.personAId === keepId
      || !!(await p.relatedPerson.findUnique({ where: { personAId_personBId: { personAId: r.personAId, personBId: keepId } } }));
    if (clash) await p.relatedPerson.delete({ where });
    else await p.relatedPerson.update({ where, data: { personBId: keepId } });
  }

  // 7. RelationshipEvent — no unique pair constraint, so just repoint; drop self-references
  await p.relationshipEvent.deleteMany({ where: { OR: [{ personAId: dupeId, personBId: keepId }, { personAId: keepId, personBId: dupeId }, { personAId: dupeId, personBId: dupeId }] } });
  await p.relationshipEvent.updateMany({ where: { personAId: dupeId }, data: { personAId: keepId } });
  await p.relationshipEvent.updateMany({ where: { personBId: dupeId }, data: { personBId: keepId } });

  // 8. Soft links by slug
  await p.personMedia.updateMany({ where: { personSlug: dupeSlug }, data: { personSlug: keepSlug } });
  await p.psychenomiconEntity.updateMany({ where: { personSlug: dupeSlug }, data: { personSlug: keepSlug } });
  await p.savedSearch.updateMany({ where: { personSlug: dupeSlug }, data: { personSlug: keepSlug } });

  // 9. WeeklyDigest.personIds arrays
  for (const d of await p.weeklyDigest.findMany({ where: { personIds: { has: dupeId } }, select: { id: true, personIds: true } })) {
    const ids = Array.from(new Set(d.personIds.map(id => (id === dupeId ? keepId : id))));
    await p.weeklyDigest.update({ where: { id: d.id }, data: { personIds: ids } });
  }

  // 10. Names → keeper altNames; first appearance backfill; bio only if keeper has none
  const keeper = await p.person.findUnique({ where: { id: keepId }, select: { altNames: true, displayName: true, firstAppearanceEpisodeId: true, shortBio: true, loreSummary: true } });
  const dupe = await p.person.findUnique({ where: { id: dupeId }, select: { displayName: true, altNames: true, firstAppearanceEpisodeId: true, shortBio: true, loreSummary: true } });
  if (keeper && dupe) {
    const alt = new Set(keeper.altNames);
    if (dupe.displayName !== keeper.displayName) alt.add(dupe.displayName);
    for (const a of dupe.altNames) if (a !== keeper.displayName) alt.add(a);
    await p.person.update({
      where: { id: keepId },
      data: {
        altNames: Array.from(alt),
        firstAppearanceEpisodeId: keeper.firstAppearanceEpisodeId ?? dupe.firstAppearanceEpisodeId ?? undefined,
        shortBio: keeper.shortBio ?? dupe.shortBio ?? undefined,
        loreSummary: keeper.loreSummary ?? dupe.loreSummary ?? undefined,
      },
    });
  }

  // 11. Delete the dupe
  await p.person.delete({ where: { id: dupeId } });
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
