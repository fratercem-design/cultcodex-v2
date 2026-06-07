/**
 * People dedup pass 3 — clean up clusters surfaced after pass2.
 *
 * Conservative merges only. The pass3 fuzzy audit surfaced 47 clusters,
 * but most are false positives (token collisions between unrelated
 * people: Psyche+Tracy+Narrator share name parts, "Unknown Participant"
 * collapses 45 different unknown speakers, etc.).
 *
 * Triage decisions (skipped clusters documented inline):
 *   - Psyche megacluster: 21 distinct people, NOT merged
 *   - Unknown Participant: 45 different unknowns from different episodes
 *   - Mason cluster: per MEMORY, ThingThatIs ≠ Mason
 *   - Joe / Joe Shipley: Joe explicitly says "I'm not Joe Shipley"
 *   - Chris K / Chris: clearly different bios
 *   - Pi/Paige: ambiguous (former friend now accuser) — skipped in pass2
 *   - Sweet Pea / Sweet Summer: skipped in pass2 (different)
 *   - Lola/Laura/Bea-V: ambiguous overlaps, skipped
 *
 * Usage:
 *   npx tsx scripts/_dedup-people-pass3.ts            # dry run
 *   npx tsx scripts/_dedup-people-pass3.ts --execute  # apply
 */

import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

type Prisma = ReturnType<typeof getPrisma>;

interface MergeGroup {
  label: string;
  keepId: string;
  dupeIds: string[];
  notes?: string;
}

const GROUPS: MergeGroup[] = [
  {
    label: "Alexandra Mayers (final)",
    notes: "Misspelling 'Alexander Mayors' captured as romantic-interest variant.",
    keepId: "cmn5tenff00mgpottlmcnwxje",
    dupeIds: [
      "cmoc56xki05152ottuy6eo3jw", // Alexander Mayors
    ],
  },
  {
    label: "Bea (Bita) — pass3 extras",
    notes: "Beta/VA variants that survived pass2. All bios point to the Persian community member.",
    keepId: "cmn9hme700089w8ttp79it7hx",
    dupeIds: [
      "cmnt1wkwt00oqhwttl83u7q2n", // Beta (16g/11q)
      "cmnt1x07u00pqhwttvtnidz0x", // VA/Beta
      "cmo3bsr1d01jccktti3pj5njw", // Beta/Bea
      "cmo3c9ufa02jecktt6evwftcs", // Beta/VA
      "cmo3cgtc902xpcktt29q4kuwo", // Bea/Beta
      "cmo3c8hd802g7ckttcb7zc201", // Beta/Beat Up
      "cmo3bmres0177cktt06s0vrrl", // Beta/BG
      "cmo3e8c9i06hmcktte30h9ey5", // Beta/Bea/VA
      "cmo3c7uc502epcktte9mc1ayh", // Be/Beta — Psyche's best friend, OC CA
      "cmo3c9b1p02hxckttdr58oq5a", // Beta/Be/VA
    ],
  },
  {
    label: "Music is Marty",
    notes: "Both 'Marty' and 'Music Biz Marty' bios reference deceased internet personality.",
    keepId: "cmo3bvnax01packttblffunx6",
    dupeIds: [
      "cmo3bz7hu01wgckttxg5iqctp", // Marty
      "cmo3bniry018scktt4p8i6o09", // Music Biz Marty
    ],
  },
  {
    label: "Mr. Rude (Psyche's cat)",
    notes: "Same cat — bios both describe the soft strawberry-blond cat called Rude/Mr. Rude.",
    keepId: "cmo3e4aij068pckttar8ivuxp",
    dupeIds: [
      "cmo3cfv9j02vtckttpzpio55q", // Rude
    ],
  },
  {
    label: "Tricks (Psyche's cat)",
    notes: "Both labels describe the same cat that appears on the show.",
    keepId: "cmo3bl0f40134ckttkisebfu3",
    dupeIds: [
      "cmo3e5l5206b9ckttcxy7qfjs", // Mr. Tricks
    ],
  },
  {
    label: "Spunky — pass3 follow-up",
    notes: "Pass2 merged 'Spunky/Stephanie'. Lone 'Stephanie' bio explicitly references the nickname connection.",
    keepId: "cmn5t78in004hpotts0s39w2g",
    dupeIds: [
      "cmo3dlad8058rckttn6mpjduf", // Stephanie — "nickname that might stick"
    ],
  },
  {
    label: "Tiger Butterfly — pass3 follow-up",
    notes: "Slash combo 'Bea/V/Tiger Butterfly' explicitly identifies Tiger Butterfly.",
    keepId: "cmn46lkex0061b0ttarceiome",
    dupeIds: [
      "cmo3ch5s302yicktt5et733o3", // Bea/V/Tiger Butterfly
    ],
  },
  {
    label: "Miss Fearless Soul",
    notes: "Both bios describe a British panelist; canonical kept the more specific bio.",
    keepId: "cmo3c80g602f7ckttxd0gpzle",
    dupeIds: [
      "cmo3d84qp04j6ckttcowloxov", // Fearless Soul
    ],
  },
  {
    label: "Alexandria → Alexandra Mayers",
    notes: "Owner rule: 'alexandria is ALEXANDRA MAYERS'. Both records merge into canonical Mayers.",
    keepId: "cmn5tenff00mgpottlmcnwxje", // alexandra-mayers (canonical)
    dupeIds: [
      "cmo3dvx3j05t7cktt3rfhud1y", // Alexandria
      "cmo3e8jq106i7cktta0xmz93j", // Alexandria/Alexander
    ],
  },
  {
    label: "Kell/Kelloggs",
    notes: "Both 'Kell/Kelloggs' (mod from Liverpool) and 'Kellog/Kelly' (chat participant made mod) describe the long-time mod.",
    keepId: "cmo3c70v702d5ckttc3f5llhg",
    dupeIds: [
      "cmo3cs7m103lsckttvo3hkrsb", // Kellog/Kelly
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
  // 1. EpisodeGuest
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

  // 2. EpisodeMentionedPerson
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

  // 3. Quotes
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

  // 6. RelatedPerson — both directions
  const dupeRelFrom = await p.relatedPerson.findMany({ where: { personAId: dupeId } });
  for (const r of dupeRelFrom) {
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

  // 7. altNames preservation
  const keeper = await p.person.findUnique({
    where: { id: keepId },
    select: { altNames: true, displayName: true },
  });
  const dupe = await p.person.findUnique({
    where: { id: dupeId },
    select: { displayName: true, slug: true, altNames: true },
  });
  if (keeper && dupe) {
    const merged = new Set<string>(keeper.altNames ?? []);
    if (dupe.displayName && dupe.displayName !== keeper.displayName) merged.add(dupe.displayName);
    for (const a of dupe.altNames ?? []) if (a !== keeper.displayName) merged.add(a);
    await p.person.update({ where: { id: keepId }, data: { altNames: Array.from(merged) } });
  }

  // 8. delete dupe
  await p.person.delete({ where: { id: dupeId } });
}

async function main() {
  const dryRun = !process.argv.includes("--execute");
  const p = getPrisma();
  let totalMerged = 0;

  for (const group of GROUPS) {
    console.log(`\n=== ${group.label} ===`);
    if (group.notes) console.log(`  note: ${group.notes}`);
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
      totalMerged++;
    }
    const after = await fetchPerson(p, group.keepId);
    console.log(
      `  -> AFTER ${after?.displayName} ${after?._count.guestAppearances}g/${after?._count.quotes}q/${after?._count.mentions}m`
    );
  }

  if (dryRun) {
    console.log("\nDRY RUN — pass --execute to apply.");
  } else {
    console.log(`\nDone. Deleted ${totalMerged} dupes. Run scripts/_rebuild-search-text.ts.`);
  }
  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
