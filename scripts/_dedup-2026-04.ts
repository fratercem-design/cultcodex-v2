/**
 * Phase 7 dedup pass — 2026-04-23.
 *
 * Conservative merge of clear-cut variants only. Skips generic "Alex" /
 * "Alexander" / "Alexandra" records that need per-episode analysis.
 *
 * Targets:
 *
 *   Alexander McQueen (canonical cmn46u8y000zab0tt7i3m0giv)
 *     ← Alexander McQueen/Alex (cmo3dqr4k05j3ckttiosf9fp1)
 *     ← Alexander McQueen/NYPD (cmo3cndgl03b2cktt0vwhi1zk)
 *     ← Alexander/Alexander McQueen (cmo3cgzxw02y5ckttcy0l7eik)
 *     ← NYPD/Alexander McQueen (cmo3eizi8074ockttvdddhc28)
 *     ← Officer Alex McQueen (cmo3be34p00p0cktthkdsi88t)
 *     ← McQueen (cmo3bgslt00ucckttfneiuatv)
 *
 *   Alexandra Mayers (canonical cmn5tenff00mgpottlmcnwxje)
 *     ← Alex Mayer (cmo3b4btd005dckttzu99pnus)        — already in altNames as "Alex Mayer"
 *     ← Alexandra Meyer (cmo3bt7d801kfcktt2c4n4bvf)   — already in altNames as "Alexandra Meyer"
 *     ← Alexandra Meyer/Monica Foster (cmo3dqrd905j5ckttoqj6cm23)
 *     ← Alexandra Myers/Alex (cmo3efhvu06x4cktticfrb4tx)
 *     ← Alexandra Mares (cmo3d4qww04c1cktt7r4ad1t5)   — already in altNames as "Alexandra Mares"
 *     ← Alexander Mayors (cmo3deyph04wtckttejw5yx3e)  — typo of Mayers
 *
 *   ThingThatIs (canonical cmo3e3awl066ucktt1u82nus5 — slug "thingthatis")
 *     ← Thing That Is (cmo3dt2mz05nyckttyosm55wj)
 *
 *   Mason (canonical cmn46npg900drb0ttpq84hpqj)
 *     ← Thing That Is/Mason (cmo3dta2605ofckttn9qj2kmk) — guest record on EP linked to Mason
 *
 *   LEFT ALONE:
 *     - "Alex" (19g/5q) — too generic, likely many distinct people
 *     - "Alexander" (15g/6q) — possibly a distinct community member
 *     - "Alexandra" (8g/4q) — possibly a distinct streamer
 *     - "Alexander/Alex" (8g) — mixed, needs per-episode split
 *     - "Alexandra/Alex" (3g), "Alexandra/Alexander" (1g),
 *       "Alexander/Alexandra" (1g), "Alexandria" / "Alexandria/Alexander" — unclear
 *     - "Bea/Bea's Kitties", "Bea/Beta Kitties", "Bea's Kitties" — unrelated cluster, skipping
 *     - "Alexandra Botez" — real chess streamer, distinct person
 *     - "Mrs. Mason" — Psyche's mother, distinct from Mason
 *
 * Safety:
 *   - DRY RUN by default. Pass --execute to apply.
 *   - Each merge re-uses the proven mergePerson() pattern from
 *     _dedup-tti-mason.ts: move EpisodeGuest / EpisodeMentionedPerson /
 *     Quote / PersonTopic / PersonLore rows, dedupe overlaps, then delete
 *     the dupe Person row.
 */

import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

const MCQUEEN_KEEP = "cmn46u8y000zab0tt7i3m0giv";
const MCQUEEN_MERGE: { id: string; label: string }[] = [
  { id: "cmo3dqr4k05j3ckttiosf9fp1", label: "Alexander McQueen/Alex" },
  { id: "cmo3cndgl03b2cktt0vwhi1zk", label: "Alexander McQueen/NYPD" },
  { id: "cmo3cgzxw02y5ckttcy0l7eik", label: "Alexander/Alexander McQueen" },
  { id: "cmo3eizi8074ockttvdddhc28", label: "NYPD/Alexander McQueen" },
  { id: "cmo3be34p00p0cktthkdsi88t", label: "Officer Alex McQueen" },
  { id: "cmo3bgslt00ucckttfneiuatv", label: "McQueen" },
];

const MAYERS_KEEP = "cmn5tenff00mgpottlmcnwxje";
const MAYERS_MERGE: { id: string; label: string }[] = [
  { id: "cmo3b4btd005dckttzu99pnus", label: "Alex Mayer" },
  { id: "cmo3bt7d801kfcktt2c4n4bvf", label: "Alexandra Meyer" },
  { id: "cmo3dqrd905j5ckttoqj6cm23", label: "Alexandra Meyer/Monica Foster" },
  { id: "cmo3efhvu06x4cktticfrb4tx", label: "Alexandra Myers/Alex" },
  { id: "cmo3d4qww04c1cktt7r4ad1t5", label: "Alexandra Mares" },
  { id: "cmo3deyph04wtckttejw5yx3e", label: "Alexander Mayors" },
];

const TTI_KEEP = "cmo3e3awl066ucktt1u82nus5"; // @thingthatis
const TTI_MERGE: { id: string; label: string }[] = [
  { id: "cmo3dt2mz05nyckttyosm55wj", label: "Thing That Is" },
];

const MASON_KEEP = "cmn46npg900drb0ttpq84hpqj";
const MASON_MERGE: { id: string; label: string }[] = [
  // Conflated "Thing That Is/Mason" — bio confirms drummer (Mason), not TTI
  { id: "cmo3dta2605ofckttn9qj2kmk", label: "Thing That Is/Mason" },
];

const p = getPrisma();
const dryRun = !process.argv.includes("--execute");

async function mergePerson(dupeId: string, dupeLabel: string, keeperId: string) {
  // EpisodeGuest
  const keeperGuest = await p.episodeGuest.findMany({
    where: { personId: keeperId },
    select: { episodeId: true },
  });
  const keeperGuestEps = new Set(keeperGuest.map((g) => g.episodeId));
  const dupeGuests = await p.episodeGuest.findMany({ where: { personId: dupeId } });
  let movedGuest = 0;
  let dropGuest = 0;
  for (const g of dupeGuests) {
    if (keeperGuestEps.has(g.episodeId)) {
      if (!dryRun) {
        await p.episodeGuest.delete({
          where: { episodeId_personId: { episodeId: g.episodeId, personId: dupeId } },
        });
      }
      dropGuest++;
    } else {
      if (!dryRun) {
        await p.episodeGuest.update({
          where: { episodeId_personId: { episodeId: g.episodeId, personId: dupeId } },
          data: { personId: keeperId },
        });
      }
      movedGuest++;
    }
  }

  // Quote — speakerPersonId
  const dupeQuotes = await p.quote.count({ where: { speakerPersonId: dupeId } });
  if (!dryRun && dupeQuotes > 0) {
    await p.quote.updateMany({
      where: { speakerPersonId: dupeId },
      data: { speakerPersonId: keeperId },
    });
  }

  // EpisodeMentionedPerson
  const keeperMen = await p.episodeMentionedPerson.findMany({
    where: { personId: keeperId },
    select: { episodeId: true },
  });
  const keeperMenEps = new Set(keeperMen.map((m) => m.episodeId));
  const dupeMen = await p.episodeMentionedPerson.findMany({ where: { personId: dupeId } });
  let movedMen = 0;
  let dropMen = 0;
  for (const m of dupeMen) {
    if (keeperMenEps.has(m.episodeId)) {
      if (!dryRun) {
        await p.episodeMentionedPerson.delete({
          where: { episodeId_personId: { episodeId: m.episodeId, personId: dupeId } },
        });
      }
      dropMen++;
    } else {
      if (!dryRun) {
        await p.episodeMentionedPerson.update({
          where: { episodeId_personId: { episodeId: m.episodeId, personId: dupeId } },
          data: { personId: keeperId },
        });
      }
      movedMen++;
    }
  }

  // PersonTopic
  const keeperTopics = await p.personTopic.findMany({
    where: { personId: keeperId },
    select: { topicId: true },
  });
  const keeperTopicSet = new Set(keeperTopics.map((t) => t.topicId));
  const dupeTopics = await p.personTopic.findMany({ where: { personId: dupeId } });
  for (const t of dupeTopics) {
    if (keeperTopicSet.has(t.topicId)) {
      if (!dryRun) {
        await p.personTopic.delete({
          where: { personId_topicId: { personId: dupeId, topicId: t.topicId } },
        });
      }
    } else {
      if (!dryRun) {
        await p.personTopic.update({
          where: { personId_topicId: { personId: dupeId, topicId: t.topicId } },
          data: { personId: keeperId },
        });
      }
    }
  }

  // PersonLore
  const keeperLore = await p.personLore.findMany({
    where: { personId: keeperId },
    select: { loreEntryId: true },
  });
  const keeperLoreSet = new Set(keeperLore.map((l) => l.loreEntryId));
  const dupeLore = await p.personLore.findMany({ where: { personId: dupeId } });
  for (const l of dupeLore) {
    if (keeperLoreSet.has(l.loreEntryId)) {
      if (!dryRun) {
        await p.personLore.delete({
          where: { personId_loreEntryId: { personId: dupeId, loreEntryId: l.loreEntryId } },
        });
      }
    } else {
      if (!dryRun) {
        await p.personLore.update({
          where: { personId_loreEntryId: { personId: dupeId, loreEntryId: l.loreEntryId } },
          data: { personId: keeperId },
        });
      }
    }
  }

  if (!dryRun) {
    await p.person.delete({ where: { id: dupeId } });
  }

  console.log(
    `  ${dupeLabel} (${dupeId.slice(0, 8)})` +
      ` → guest: ${movedGuest}m/${dropGuest}d, quotes: ${dupeQuotes}m,` +
      ` mentions: ${movedMen}m/${dropMen}d`
  );
}

async function mergeBatch(label: string, keeperId: string, dupes: { id: string; label: string }[]) {
  const keeper = await p.person.findUnique({ where: { id: keeperId }, select: { displayName: true } });
  if (!keeper) {
    console.log(`SKIP — keeper ${label} (${keeperId}) not found in DB.\n`);
    return;
  }
  console.log(`\n=== ${label} ===`);
  console.log(`  Keeping: "${keeper.displayName}" (${keeperId.slice(0, 8)})`);
  for (const d of dupes) {
    const exists = await p.person.findUnique({ where: { id: d.id }, select: { id: true } });
    if (!exists) {
      console.log(`  SKIP — ${d.label} (${d.id.slice(0, 8)}) not found.`);
      continue;
    }
    await mergePerson(d.id, d.label, keeperId);
  }
}

async function main() {
  console.log(dryRun ? "=== DRY RUN — pass --execute to apply ===" : "=== EXECUTING ===");

  await mergeBatch("Alexander McQueen", MCQUEEN_KEEP, MCQUEEN_MERGE);
  await mergeBatch("Alexandra Mayers", MAYERS_KEEP, MAYERS_MERGE);
  await mergeBatch("ThingThatIs", TTI_KEEP, TTI_MERGE);
  await mergeBatch("Mason", MASON_KEEP, MASON_MERGE);

  if (!dryRun) {
    // Update altNames + bio polish on the four canonical records.
    console.log("\nPolishing canonical records...");
    await p.person.update({
      where: { id: MCQUEEN_KEEP },
      data: {
        altNames: ["NYPD", "Officer Alex McQueen", "Alex McQueen", "McQueen"],
      },
    });
    await p.person.update({
      where: { id: MAYERS_KEEP },
      data: {
        altNames: [
          "Alexandra Meyer",
          "Monica Foster",
          "Alexandra Myers",
          "Alexandra Mares",
          "Alex Mayer",
          "Alexander Mayors",
        ],
      },
    });
    await p.person.update({
      where: { id: TTI_KEEP },
      data: {
        displayName: "ThingThatIs",
        slug: "thingthatis",
        altNames: ["Thing That Is", "TTI"],
        personType: "recurring",
      },
    });
    console.log("  Done.");
  }

  // Final counts.
  for (const [label, id] of [
    ["Alexander McQueen", MCQUEEN_KEEP],
    ["Alexandra Mayers", MAYERS_KEEP],
    ["ThingThatIs", TTI_KEEP],
    ["Mason", MASON_KEEP],
  ] as const) {
    const person = await p.person.findUnique({
      where: { id },
      include: { _count: { select: { guestAppearances: true, quotes: true, mentions: true } } },
    });
    if (person) {
      console.log(
        `\n${label}: ${person._count.guestAppearances}g / ${person._count.quotes}q / ${person._count.mentions}m`
      );
    }
  }

  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
