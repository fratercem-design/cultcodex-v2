// One-off: merge "alexandria" → "Alexandra Mayers"
import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

async function mergePerson(sourceSlug: string, targetSlug: string) {
  const p = getPrisma();

  const source = await p.person.findFirst({
    where: { OR: [{ slug: sourceSlug }, { displayName: { equals: sourceSlug, mode: "insensitive" } }] },
  });
  const target = await p.person.findFirst({
    where: { OR: [{ slug: targetSlug }, { displayName: { equals: "Alexandra Mayers", mode: "insensitive" } }] },
  });

  if (!source) { console.log(`Source not found: ${sourceSlug}`); return; }
  if (!target) { console.log(`Target not found: ${targetSlug}`); return; }

  console.log(`Merging "${source.displayName}" (${source.id}) → "${target.displayName}" (${target.id})`);

  // Guest appearances
  const sourceGuests = await p.episodeGuest.findMany({ where: { personId: source.id } });
  const targetGuestEpIds = new Set(
    (await p.episodeGuest.findMany({ where: { personId: target.id }, select: { episodeId: true } }))
      .map((g) => g.episodeId)
  );
  for (const sg of sourceGuests) {
    await p.episodeGuest.delete({ where: { episodeId_personId: { episodeId: sg.episodeId, personId: source.id } } });
    if (!targetGuestEpIds.has(sg.episodeId)) {
      await p.episodeGuest.create({ data: { episodeId: sg.episodeId, personId: target.id } });
    }
  }
  console.log(`  Moved ${sourceGuests.length} guest appearances`);

  // Mentions
  const sourceMentions = await p.episodeMentionedPerson.findMany({ where: { personId: source.id } });
  const targetMentionEpIds = new Set(
    (await p.episodeMentionedPerson.findMany({ where: { personId: target.id }, select: { episodeId: true } }))
      .map((m) => m.episodeId)
  );
  for (const sm of sourceMentions) {
    await p.episodeMentionedPerson.delete({ where: { episodeId_personId: { episodeId: sm.episodeId, personId: source.id } } });
    if (!targetMentionEpIds.has(sm.episodeId)) {
      await p.episodeMentionedPerson.create({ data: { episodeId: sm.episodeId, personId: target.id } });
    }
  }
  console.log(`  Moved ${sourceMentions.length} mentions`);

  // Quotes
  const qCount = await p.quote.count({ where: { speakerPersonId: source.id } });
  if (qCount > 0) await p.quote.updateMany({ where: { speakerPersonId: source.id }, data: { speakerPersonId: target.id } });
  console.log(`  Moved ${qCount} quotes`);

  // Topics
  const sourceTopics = await p.personTopic.findMany({ where: { personId: source.id } });
  const targetTopicIds = new Set(
    (await p.personTopic.findMany({ where: { personId: target.id }, select: { topicId: true } }))
      .map((t) => t.topicId)
  );
  for (const st of sourceTopics) {
    await p.personTopic.delete({ where: { personId_topicId: { personId: source.id, topicId: st.topicId } } });
    if (!targetTopicIds.has(st.topicId)) {
      await p.personTopic.create({ data: { personId: target.id, topicId: st.topicId } });
    }
  }
  console.log(`  Moved ${sourceTopics.length} topic links`);

  // Lore
  const sourceLore = await p.personLore.findMany({ where: { personId: source.id } });
  const targetLoreIds = new Set(
    (await p.personLore.findMany({ where: { personId: target.id }, select: { loreEntryId: true } }))
      .map((l) => l.loreEntryId)
  );
  for (const sl of sourceLore) {
    await p.personLore.delete({ where: { personId_loreEntryId: { personId: source.id, loreEntryId: sl.loreEntryId } } });
    if (!targetLoreIds.has(sl.loreEntryId)) {
      await p.personLore.create({ data: { personId: target.id, loreEntryId: sl.loreEntryId } });
    }
  }
  console.log(`  Moved ${sourceLore.length} lore links`);

  // Related persons (rebuild after enrich-relationships runs)
  await p.relatedPerson.deleteMany({ where: { OR: [{ personAId: source.id }, { personBId: source.id }] } });

  // Merge altNames
  const mergedAltNames = [...new Set([...target.altNames, source.displayName, ...source.altNames])];
  await p.person.update({
    where: { id: target.id },
    data: { altNames: mergedAltNames },
  });

  // Delete source
  await p.person.delete({ where: { id: source.id } });
  console.log(`\n✓ Deleted "${source.displayName}" — merged into "${target.displayName}"`);
  console.log(`  altNames updated: ${mergedAltNames.join(", ")}`);

  await disconnect();
}

mergePerson("alexandria", "alexandra-mayers").catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
