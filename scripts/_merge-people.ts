import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

/**
 * Merge duplicate person records.
 * Moves all references from source → target, then deletes source.
 * Uses delete+create for compound-key join tables.
 */

const MERGES: [string, string][] = [
  ["jay-dog-jd", "jay-dog"],
  ["joker-tv", "joker"],
  ["minnie-mans", "minnie-manson"],
  ["tracy", "tracy-x"],
];

async function main() {
  const p = getPrisma();

  for (const [sourceSlug, targetSlug] of MERGES) {
    const source = await p.person.findUnique({ where: { slug: sourceSlug } });
    const target = await p.person.findUnique({ where: { slug: targetSlug } });

    if (!source) { console.log(`Source "${sourceSlug}" not found, skipping`); continue; }
    if (!target) { console.log(`Target "${targetSlug}" not found, skipping`); continue; }

    console.log(`\nMerging "${source.displayName}" → "${target.displayName}"`);

    // Guest appearances
    const sourceGuests = await p.episodeGuest.findMany({ where: { personId: source.id } });
    const targetGuestEps = new Set(
      (await p.episodeGuest.findMany({ where: { personId: target.id }, select: { episodeId: true } }))
        .map((g) => g.episodeId)
    );
    for (const sg of sourceGuests) {
      await p.episodeGuest.delete({ where: { episodeId_personId: { episodeId: sg.episodeId, personId: source.id } } });
      if (!targetGuestEps.has(sg.episodeId)) {
        await p.episodeGuest.create({ data: { episodeId: sg.episodeId, personId: target.id } });
        console.log(`  Moved guest appearance`);
      }
    }

    // Mentions
    const sourceMentions = await p.episodeMentionedPerson.findMany({ where: { personId: source.id } });
    const targetMentionEps = new Set(
      (await p.episodeMentionedPerson.findMany({ where: { personId: target.id }, select: { episodeId: true } }))
        .map((m) => m.episodeId)
    );
    for (const sm of sourceMentions) {
      await p.episodeMentionedPerson.delete({ where: { episodeId_personId: { episodeId: sm.episodeId, personId: source.id } } });
      if (!targetMentionEps.has(sm.episodeId)) {
        await p.episodeMentionedPerson.create({ data: { episodeId: sm.episodeId, personId: target.id } });
        console.log(`  Moved mention`);
      }
    }

    // Quotes
    const quoteCount = await p.quote.count({ where: { speakerPersonId: source.id } });
    if (quoteCount > 0) {
      await p.quote.updateMany({ where: { speakerPersonId: source.id }, data: { speakerPersonId: target.id } });
      console.log(`  Moved ${quoteCount} quotes`);
    }

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
    if (sourceTopics.length > 0) console.log(`  Moved ${sourceTopics.length} topic links`);

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
    if (sourceLore.length > 0) console.log(`  Moved ${sourceLore.length} lore links`);

    // Related persons
    await p.relatedPerson.deleteMany({ where: { OR: [{ personAId: source.id }, { personBId: source.id }] } });

    // Delete source
    await p.person.delete({ where: { id: source.id } });
    console.log(`  ✓ Deleted "${source.displayName}"`);
  }

  console.log("\nDone!");
  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
