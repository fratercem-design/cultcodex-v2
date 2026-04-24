/**
 * Merge duplicate Person records for:
 *
 *   1. Alexander McQueen — 7 records collapse to 1
 *   2. Alexandra Mayers (a.k.a. "Neon Priestess" / Monica Foster) — 6 records collapse to 1
 *
 * Conservative merge plan (only entries where the bio + naming pattern
 * unambiguously identify the same person — see comments inline).
 *
 * Usage:
 *   npx tsx scripts/_dedup-mcqueen-mayers.ts            # dry run (default)
 *   npx tsx scripts/_dedup-mcqueen-mayers.ts --execute  # apply
 */

import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

type Prisma = ReturnType<typeof getPrisma>;

interface MergeGroup {
  label: string;
  keepId: string;
  dupeIds: string[];
}

const GROUPS: MergeGroup[] = [
  {
    label: "Alexander McQueen",
    // canonical: alexander-mcqueen, 10g/2q
    keepId: "cmn46u8y000zab0tt7i3m0giv",
    dupeIds: [
      "cmoc5iuwb05nh2ottmszktj5q", // alexander-mcqueen-alex     (former mod, doxxing — same person)
      "cmoc4esof03e72ottk4fladwq", // alexander-mcqueen-nypd     (NYPD officer — same person)
      "cmoc487f303142ottjyq15dac", // alexander-alexander-mcqueen (Boston accent panel guest)
      "cmoc36uq800vj2ottlg73nwaa", // mcqueen                    (phone no longer in service)
      "cmoc6awmo079e2ott99jm7mqn", // nypd-alexander-mcqueen     (romantic prospect crude jokes)
      "cmoc3414e00q12ottjn1fgg67", // officer-alex-mcqueen       (police officer with occult interest)
    ],
  },
  {
    label: "Alexandra Mayers",
    // canonical: alexandra-mayers, 6g/1q ("Neon Priestess")
    keepId: "cmn5tenff00mgpottlmcnwxje",
    dupeIds: [
      "cmnt1nrd20069hwttzktc748y", // alexandra              (runs IRL News Time, exposes streamers)
      "cmoc3jh3e01m12ottkwihst0w", // alexandra-meyer        (host of IRL Newstime show)
      "cmoc5iv4y05nj2ottfxp4uezx", // alexandra-meyer-monica-foster (former porn star -> Christian)
      "cmoc67b26071o2ottsgirsk36", // alexandra-myers-alex   (former friend, AI art of Psyche)
      "cmoc2tuh1005m2ottwsv688rp", // alex-mayer             (made racist claims, accused Psyche)
    ],
  },
];

async function fetchPerson(p: Prisma, id: string) {
  return p.person.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          guestAppearances: true,
          quotes: true,
          mentions: true,
          topics: true,
          loreConnections: true,
        },
      },
    },
  });
}

async function mergeOne(p: Prisma, keepId: string, dupeId: string) {
  // 1. EpisodeGuest — move or drop on conflict
  const keeperGuests = await p.episodeGuest.findMany({
    where: { personId: keepId },
    select: { episodeId: true },
  });
  const keeperEpIds = new Set(keeperGuests.map((g) => g.episodeId));
  const dupeGuests = await p.episodeGuest.findMany({ where: { personId: dupeId } });
  for (const g of dupeGuests) {
    if (keeperEpIds.has(g.episodeId)) {
      await p.episodeGuest.delete({
        where: { episodeId_personId: { episodeId: g.episodeId, personId: dupeId } },
      });
    } else {
      await p.episodeGuest.update({
        where: { episodeId_personId: { episodeId: g.episodeId, personId: dupeId } },
        data: { personId: keepId },
      });
    }
  }

  // 2. EpisodeMentionedPerson — same conflict-aware move
  const keeperMentions = await p.episodeMentionedPerson.findMany({
    where: { personId: keepId },
    select: { episodeId: true },
  });
  const mEps = new Set(keeperMentions.map((m) => m.episodeId));
  const dupeMentions = await p.episodeMentionedPerson.findMany({ where: { personId: dupeId } });
  for (const m of dupeMentions) {
    if (mEps.has(m.episodeId)) {
      await p.episodeMentionedPerson.delete({
        where: { episodeId_personId: { episodeId: m.episodeId, personId: dupeId } },
      });
    } else {
      await p.episodeMentionedPerson.update({
        where: { episodeId_personId: { episodeId: m.episodeId, personId: dupeId } },
        data: { personId: keepId },
      });
    }
  }

  // 3. Quotes — simple FK update
  await p.quote.updateMany({
    where: { speakerPersonId: dupeId },
    data: { speakerPersonId: keepId },
  });

  // 4. PersonTopic
  const keeperTopics = await p.personTopic.findMany({
    where: { personId: keepId },
    select: { topicId: true },
  });
  const tIds = new Set(keeperTopics.map((t) => t.topicId));
  const dupeTopics = await p.personTopic.findMany({ where: { personId: dupeId } });
  for (const t of dupeTopics) {
    if (tIds.has(t.topicId)) {
      await p.personTopic.delete({
        where: { personId_topicId: { personId: dupeId, topicId: t.topicId } },
      });
    } else {
      await p.personTopic.update({
        where: { personId_topicId: { personId: dupeId, topicId: t.topicId } },
        data: { personId: keepId },
      });
    }
  }

  // 5. PersonLore
  const keeperLore = await p.personLore.findMany({
    where: { personId: keepId },
    select: { loreEntryId: true },
  });
  const lIds = new Set(keeperLore.map((l) => l.loreEntryId));
  const dupeLore = await p.personLore.findMany({ where: { personId: dupeId } });
  for (const l of dupeLore) {
    if (lIds.has(l.loreEntryId)) {
      await p.personLore.delete({
        where: { personId_loreEntryId: { personId: dupeId, loreEntryId: l.loreEntryId } },
      });
    } else {
      await p.personLore.update({
        where: { personId_loreEntryId: { personId: dupeId, loreEntryId: l.loreEntryId } },
        data: { personId: keepId },
      });
    }
  }

  // 6. RelatedPerson — both directions, drop self-references and dupes
  const dupeRelFrom = await p.relatedPerson.findMany({ where: { personAId: dupeId } });
  for (const r of dupeRelFrom) {
    // would become a self-reference?
    if (r.personBId === keepId) {
      await p.relatedPerson.delete({
        where: { personAId_personBId: { personAId: dupeId, personBId: r.personBId } },
      });
      continue;
    }
    const existing = await p.relatedPerson.findUnique({
      where: { personAId_personBId: { personAId: keepId, personBId: r.personBId } },
    });
    if (existing) {
      await p.relatedPerson.delete({
        where: { personAId_personBId: { personAId: dupeId, personBId: r.personBId } },
      });
    } else {
      await p.relatedPerson.update({
        where: { personAId_personBId: { personAId: dupeId, personBId: r.personBId } },
        data: { personAId: keepId },
      });
    }
  }
  const dupeRelTo = await p.relatedPerson.findMany({ where: { personBId: dupeId } });
  for (const r of dupeRelTo) {
    if (r.personAId === keepId) {
      await p.relatedPerson.delete({
        where: { personAId_personBId: { personAId: r.personAId, personBId: dupeId } },
      });
      continue;
    }
    const existing = await p.relatedPerson.findUnique({
      where: { personAId_personBId: { personAId: r.personAId, personBId: keepId } },
    });
    if (existing) {
      await p.relatedPerson.delete({
        where: { personAId_personBId: { personAId: r.personAId, personBId: dupeId } },
      });
    } else {
      await p.relatedPerson.update({
        where: { personAId_personBId: { personAId: r.personAId, personBId: dupeId } },
        data: { personBId: keepId },
      });
    }
  }

  // 7. Preserve dupe display name + slug as alt-names on keeper
  const keeper = await p.person.findUnique({ where: { id: keepId }, select: { altNames: true, displayName: true } });
  const dupe = await p.person.findUnique({ where: { id: dupeId }, select: { displayName: true, slug: true, altNames: true } });
  if (keeper && dupe) {
    const merged = new Set<string>(keeper.altNames ?? []);
    if (dupe.displayName && dupe.displayName !== keeper.displayName) merged.add(dupe.displayName);
    for (const a of dupe.altNames ?? []) if (a !== keeper.displayName) merged.add(a);
    await p.person.update({
      where: { id: keepId },
      data: { altNames: Array.from(merged) },
    });
  }

  // 8. Finally delete the dupe
  await p.person.delete({ where: { id: dupeId } });
}

async function main() {
  const dryRun = !process.argv.includes("--execute");
  const p = getPrisma();

  for (const group of GROUPS) {
    console.log(`\n=== ${group.label} ===`);
    const keeper = await fetchPerson(p, group.keepId);
    if (!keeper) {
      console.log(`  KEEP ${group.keepId} — NOT FOUND, skipping group`);
      continue;
    }
    console.log(
      `  KEEP   ${keeper.id} | "${keeper.displayName}" (slug=${keeper.slug}) — ` +
        `${keeper._count.guestAppearances}g/${keeper._count.quotes}q/${keeper._count.mentions}m`
    );
    const validDupes: string[] = [];
    for (const did of group.dupeIds) {
      const d = await fetchPerson(p, did);
      if (!d) {
        console.log(`  MERGE  ${did} — NOT FOUND, skipping`);
        continue;
      }
      console.log(
        `  MERGE  ${d.id} | "${d.displayName}" (slug=${d.slug}) — ` +
          `${d._count.guestAppearances}g/${d._count.quotes}q/${d._count.mentions}m`
      );
      validDupes.push(did);
    }

    if (dryRun) continue;

    for (const dupeId of validDupes) {
      await mergeOne(p, group.keepId, dupeId);
    }
    const after = await fetchPerson(p, group.keepId);
    console.log(
      `  -> AFTER  ${after?.displayName} ${after?._count.guestAppearances}g/${after?._count.quotes}q/${after?._count.mentions}m | altNames=${(await p.person.findUnique({ where: { id: group.keepId }, select: { altNames: true } }))?.altNames?.length ?? 0}`
    );
  }

  if (dryRun) {
    console.log("\nDRY RUN — pass --execute to apply.");
  } else {
    console.log("\nDone. Remember to rerun scripts/_rebuild-search-text.ts.");
  }

  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
