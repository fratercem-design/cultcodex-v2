/**
 * Fold one Person row into another: every relation moves to the keeper
 * (skipping pairs it already has), names become keeper altNames, then the
 * duplicate is deleted. Lifted from _dedup-mayers-2026-09.ts, which covers the
 * relations earlier dedupe scripts missed.
 */
import type { getPrisma } from "../../ingest/lib";

type Prisma = ReturnType<typeof getPrisma>;

export async function mergePerson(p: Prisma, keepId: string, keepSlug: string, dupeId: string, dupeSlug: string) {
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
