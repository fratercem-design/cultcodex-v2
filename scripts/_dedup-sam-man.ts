import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

/**
 * Merge the duplicate "Sam Man" record found by _audit-dupes.ts.
 *   keep:  cmn47iwtb032eb0ttn84y0y22 (slug=sam, 7g/2q/0m)
 *   merge: cmo3c94c602hjcktt340pg651 (slug=sam-man, 3g/0q/0m)
 */
const KEEP_ID = "cmn47iwtb032eb0ttn84y0y22";
const DUPE_ID = "cmo3c94c602hjcktt340pg651";

async function main() {
  const dryRun = !process.argv.includes("--execute");
  const p = getPrisma();

  for (const id of [KEEP_ID, DUPE_ID]) {
    const person = await p.person.findUnique({
      where: { id },
      include: {
        _count: {
          select: { guestAppearances: true, quotes: true, mentions: true },
        },
      },
    });
    console.log(
      person
        ? `  ${id} | "${person.displayName}" (slug=${person.slug}) — ${person._count.guestAppearances}g/${person._count.quotes}q/${person._count.mentions}m`
        : `  ${id} — NOT FOUND`
    );
  }

  if (dryRun) {
    console.log("\nDRY RUN — pass --execute to apply.");
    await disconnect();
    return;
  }

  // Move guest appearances (skip ones the keeper already has)
  const keeperGuests = await p.episodeGuest.findMany({
    where: { personId: KEEP_ID },
    select: { episodeId: true },
  });
  const keeperEpIds = new Set(keeperGuests.map((g) => g.episodeId));
  const dupeGuests = await p.episodeGuest.findMany({ where: { personId: DUPE_ID } });
  for (const g of dupeGuests) {
    if (keeperEpIds.has(g.episodeId)) {
      await p.episodeGuest.delete({
        where: { episodeId_personId: { episodeId: g.episodeId, personId: DUPE_ID } },
      });
    } else {
      await p.episodeGuest.update({
        where: { episodeId_personId: { episodeId: g.episodeId, personId: DUPE_ID } },
        data: { personId: KEEP_ID },
      });
    }
  }

  // Quotes
  await p.quote.updateMany({
    where: { speakerPersonId: DUPE_ID },
    data: { speakerPersonId: KEEP_ID },
  });

  // Mentions (with dedupe)
  const keeperMentions = await p.episodeMentionedPerson.findMany({
    where: { personId: KEEP_ID },
    select: { episodeId: true },
  });
  const mEps = new Set(keeperMentions.map((m) => m.episodeId));
  const dupeMentions = await p.episodeMentionedPerson.findMany({
    where: { personId: DUPE_ID },
  });
  for (const m of dupeMentions) {
    if (mEps.has(m.episodeId)) {
      await p.episodeMentionedPerson.delete({
        where: { episodeId_personId: { episodeId: m.episodeId, personId: DUPE_ID } },
      });
    } else {
      await p.episodeMentionedPerson.update({
        where: { episodeId_personId: { episodeId: m.episodeId, personId: DUPE_ID } },
        data: { personId: KEEP_ID },
      });
    }
  }

  // Topics
  const keeperTopics = await p.personTopic.findMany({
    where: { personId: KEEP_ID },
    select: { topicId: true },
  });
  const tIds = new Set(keeperTopics.map((t) => t.topicId));
  const dupeTopics = await p.personTopic.findMany({ where: { personId: DUPE_ID } });
  for (const t of dupeTopics) {
    if (tIds.has(t.topicId)) {
      await p.personTopic.delete({
        where: { personId_topicId: { personId: DUPE_ID, topicId: t.topicId } },
      });
    } else {
      await p.personTopic.update({
        where: { personId_topicId: { personId: DUPE_ID, topicId: t.topicId } },
        data: { personId: KEEP_ID },
      });
    }
  }

  // Lore
  const keeperLore = await p.personLore.findMany({
    where: { personId: KEEP_ID },
    select: { loreEntryId: true },
  });
  const lIds = new Set(keeperLore.map((l) => l.loreEntryId));
  const dupeLore = await p.personLore.findMany({ where: { personId: DUPE_ID } });
  for (const l of dupeLore) {
    if (lIds.has(l.loreEntryId)) {
      await p.personLore.delete({
        where: { personId_loreEntryId: { personId: DUPE_ID, loreEntryId: l.loreEntryId } },
      });
    } else {
      await p.personLore.update({
        where: { personId_loreEntryId: { personId: DUPE_ID, loreEntryId: l.loreEntryId } },
        data: { personId: KEEP_ID },
      });
    }
  }

  await p.person.delete({ where: { id: DUPE_ID } });
  console.log("\n  Merged + deleted dupe Sam Man.");

  const after = await p.person.findUnique({
    where: { id: KEEP_ID },
    include: { _count: { select: { guestAppearances: true, quotes: true, mentions: true } } },
  });
  console.log(`  Sam Man final: ${after?._count.guestAppearances}g/${after?._count.quotes}q/${after?._count.mentions}m`);

  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
