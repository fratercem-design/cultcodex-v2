/**
 * Final dedup: Alexandria → Alexandra Mayers | generic Alex/Alexander → Alexander McQueen
 *
 * Owner rules:
 *   1. "alexandria" records  → Alexandra Mayers (slug: alexandra-mayers)
 *   2. "most Alex's"        → Alexander McQueen (slug: alexander-mcqueen)
 *
 * Strategy: slug/name pattern queries instead of hardcoded IDs so the script
 * is safe to run regardless of which prior dedup passes have been applied.
 *
 * Canonical records (kept, never merged):
 *   alexandra-mayers   — the one true Mayers record
 *   alexander-mcqueen  — the one true McQueen record
 *
 * Explicit exclusions (distinct real people):
 *   alexandra-botez         — chess streamer
 *   any slug starting with "alexandra-d" — unlikely to be our person
 *
 * For the McQueen merge we only absorb slugs that are clearly generic
 * (alex, alexander, alexander-alex, etc.) — we do NOT blindly vacuum all
 * "alex*" slugs because "Alexandra Mayers" is also an alex* slug.
 *
 * Usage:
 *   npx tsx scripts/_dedup-alexandria-alex-final.ts           # dry run
 *   npx tsx scripts/_dedup-alexandria-alex-final.ts --execute # apply
 */

import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

const DRY = !process.argv.includes("--execute");

// ─── helpers ──────────────────────────────────────────────────────────────────

async function getCanonical(p: ReturnType<typeof getPrisma>, slug: string) {
  const rec = await p.person.findUnique({
    where: { slug },
    include: {
      _count: { select: { guestAppearances: true, quotes: true, mentions: true } },
    },
  });
  if (!rec) throw new Error(`Canonical "${slug}" not found in DB — aborting.`);
  return rec;
}

async function mergeInto(
  p: ReturnType<typeof getPrisma>,
  dupeId: string,
  keepId: string
) {
  // EpisodeGuest
  const keeperEps = new Set(
    (await p.episodeGuest.findMany({ where: { personId: keepId }, select: { episodeId: true } })).map(
      (r) => r.episodeId
    )
  );
  for (const g of await p.episodeGuest.findMany({ where: { personId: dupeId } })) {
    if (!DRY) {
      if (keeperEps.has(g.episodeId)) {
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
  }

  // EpisodeMentionedPerson
  const keeperMen = new Set(
    (
      await p.episodeMentionedPerson.findMany({ where: { personId: keepId }, select: { episodeId: true } })
    ).map((r) => r.episodeId)
  );
  for (const m of await p.episodeMentionedPerson.findMany({ where: { personId: dupeId } })) {
    if (!DRY) {
      if (keeperMen.has(m.episodeId)) {
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
  }

  // Quotes
  if (!DRY) {
    await p.quote.updateMany({ where: { speakerPersonId: dupeId }, data: { speakerPersonId: keepId } });
  }

  // PersonTopic
  const keeperTopics = new Set(
    (await p.personTopic.findMany({ where: { personId: keepId }, select: { topicId: true } })).map(
      (t) => t.topicId
    )
  );
  for (const t of await p.personTopic.findMany({ where: { personId: dupeId } })) {
    if (!DRY) {
      if (keeperTopics.has(t.topicId)) {
        await p.personTopic.delete({ where: { personId_topicId: { personId: dupeId, topicId: t.topicId } } });
      } else {
        await p.personTopic.update({
          where: { personId_topicId: { personId: dupeId, topicId: t.topicId } },
          data: { personId: keepId },
        });
      }
    }
  }

  // PersonLore
  const keeperLore = new Set(
    (await p.personLore.findMany({ where: { personId: keepId }, select: { loreEntryId: true } })).map(
      (l) => l.loreEntryId
    )
  );
  for (const l of await p.personLore.findMany({ where: { personId: dupeId } })) {
    if (!DRY) {
      if (keeperLore.has(l.loreEntryId)) {
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
  }

  // RelatedPerson — both directions
  for (const r of await p.relatedPerson.findMany({ where: { personAId: dupeId } })) {
    if (!DRY) {
      if (r.personBId === keepId) {
        await p.relatedPerson.delete({
          where: { personAId_personBId: { personAId: dupeId, personBId: r.personBId } },
        });
      } else {
        const exists = await p.relatedPerson.findUnique({
          where: { personAId_personBId: { personAId: keepId, personBId: r.personBId } },
        });
        if (exists) {
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
    }
  }
  for (const r of await p.relatedPerson.findMany({ where: { personBId: dupeId } })) {
    if (!DRY) {
      if (r.personAId === keepId) {
        await p.relatedPerson.delete({
          where: { personAId_personBId: { personAId: r.personAId, personBId: dupeId } },
        });
      } else {
        const exists = await p.relatedPerson.findUnique({
          where: { personAId_personBId: { personAId: r.personAId, personBId: keepId } },
        });
        if (exists) {
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
    }
  }

  // Absorb displayName + altNames into keeper
  if (!DRY) {
    const keeper = await p.person.findUnique({
      where: { id: keepId },
      select: { displayName: true, altNames: true },
    });
    const dupe = await p.person.findUnique({
      where: { id: dupeId },
      select: { displayName: true, altNames: true },
    });
    if (keeper && dupe) {
      const merged = new Set<string>(keeper.altNames ?? []);
      if (dupe.displayName !== keeper.displayName) merged.add(dupe.displayName);
      for (const a of dupe.altNames ?? []) if (a !== keeper.displayName) merged.add(a);
      await p.person.update({ where: { id: keepId }, data: { altNames: Array.from(merged) } });
    }
    await p.person.delete({ where: { id: dupeId } });
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const p = getPrisma();
  console.log(DRY ? "\n=== DRY RUN — pass --execute to apply ===\n" : "\n=== EXECUTING ===\n");

  // ── 1. Resolve canonical records ─────────────────────────────────────────
  const mayers = await getCanonical(p, "alexandra-mayers");
  const mcqueen = await getCanonical(p, "alexander-mcqueen");
  console.log(
    `Mayers  canonical: "${mayers.displayName}" (${mayers.id}) — ${mayers._count.guestAppearances}g/${mayers._count.quotes}q/${mayers._count.mentions}m`
  );
  console.log(
    `McQueen canonical: "${mcqueen.displayName}" (${mcqueen.id}) — ${mcqueen._count.guestAppearances}g/${mcqueen._count.quotes}q/${mcqueen._count.mentions}m`
  );

  // Slugs we must never touch
  const PROTECTED = new Set([mayers.slug, mcqueen.slug, "alexandra-botez"]);

  // ── 2. Alexandria → Mayers ───────────────────────────────────────────────
  //
  //    Matches any record whose slug contains "alexandria" (case-folded slugs
  //    are lowercase, so this catches alexandria, alexandria-alexander, etc.)
  //    AND any record whose displayName contains "alexandria" case-insensitively.
  const alexandriaRecords = await p.person.findMany({
    where: {
      AND: [
        {
          OR: [
            { slug: { contains: "alexandria" } },
            { displayName: { contains: "alexandria", mode: "insensitive" } },
          ],
        },
        { id: { not: mayers.id } },
        { id: { not: mcqueen.id } },
      ],
    },
    include: {
      _count: { select: { guestAppearances: true, quotes: true, mentions: true } },
    },
    orderBy: { displayName: "asc" },
  });

  console.log(`\n--- Alexandria → Mayers (${alexandriaRecords.length} candidates) ---`);
  for (const rec of alexandriaRecords) {
    if (PROTECTED.has(rec.slug)) {
      console.log(`  SKIP (protected) "${rec.displayName}" (${rec.slug})`);
      continue;
    }
    console.log(
      `  MERGE "${rec.displayName}" (${rec.slug}) — ${rec._count.guestAppearances}g/${rec._count.quotes}q/${rec._count.mentions}m → Mayers`
    );
    await mergeInto(p, rec.id, mayers.id);
  }

  // ── 3. Generic Alex / Alexander → McQueen ───────────────────────────────
  //
  //    Catches standalone "Alex" and "Alexander" records, plus slash combos
  //    like "Alexander/Alex", "Alexander (Alex)", "Alexander/Canada Dry", etc.
  //
  //    We explicitly do NOT catch:
  //      - "Alexandra*"  (starts with "alexandra") — Mayers or Botez
  //      - "Alexandria*" — already handled above
  //      - anything in PROTECTED
  //
  //    The slug-contain filter "alex" would catch "alexander-mcqueen" and
  //    "alexandra-mayers" — those are excluded via the NOT filters.
  const genericAlexRecords = await p.person.findMany({
    where: {
      AND: [
        {
          OR: [
            // slug is exactly "alex" or starts with "alex-" or "alexander"
            { slug: { equals: "alex" } },
            { slug: { startsWith: "alex-" } },
            { slug: { startsWith: "alexander" } },
            // display name exactly "Alex" or "Alexander" or common combos
            { displayName: { equals: "Alex", mode: "insensitive" } },
            { displayName: { equals: "Alexander", mode: "insensitive" } },
            { displayName: { startsWith: "Alex/", mode: "insensitive" } },
            { displayName: { startsWith: "Alexander/", mode: "insensitive" } },
            { displayName: { startsWith: "Alexander (", mode: "insensitive" } },
          ],
        },
        { id: { not: mayers.id } },
        { id: { not: mcqueen.id } },
        // exclude any remaining "alexandra*" (Mayers variants, Botez, etc.)
        { slug: { not: { startsWith: "alexandra" } } },
        // exclude any remaining "alexandria*" (handled above or already merged)
        { slug: { not: { startsWith: "alexandria" } } },
      ],
    },
    include: {
      _count: { select: { guestAppearances: true, quotes: true, mentions: true } },
    },
    orderBy: { displayName: "asc" },
  });

  console.log(`\n--- Generic Alex/Alexander → McQueen (${genericAlexRecords.length} candidates) ---`);
  for (const rec of genericAlexRecords) {
    if (PROTECTED.has(rec.slug)) {
      console.log(`  SKIP (protected) "${rec.displayName}" (${rec.slug})`);
      continue;
    }
    console.log(
      `  MERGE "${rec.displayName}" (${rec.slug}) — ${rec._count.guestAppearances}g/${rec._count.quotes}q/${rec._count.mentions}m → McQueen`
    );
    await mergeInto(p, rec.id, mcqueen.id);
  }

  // ── 4. Rebuild searchText for both canonicals ────────────────────────────
  if (!DRY) {
    for (const id of [mayers.id, mcqueen.id]) {
      const rec = await p.person.findUnique({
        where: { id },
        select: { displayName: true, altNames: true, shortBio: true, loreSummary: true },
      });
      if (!rec) continue;
      const searchText = [rec.displayName, ...rec.altNames, rec.shortBio, rec.loreSummary]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      await p.person.update({ where: { id }, data: { searchText } });
    }
    console.log("\nRebuilt searchText for Mayers + McQueen.");
  }

  // ── 5. Final counts ──────────────────────────────────────────────────────
  const mayersFinal = await p.person.findUnique({
    where: { id: mayers.id },
    include: { _count: { select: { guestAppearances: true, quotes: true, mentions: true } } },
  });
  const mcqueenFinal = await p.person.findUnique({
    where: { id: mcqueen.id },
    include: { _count: { select: { guestAppearances: true, quotes: true, mentions: true } } },
  });
  console.log(`\n=== FINAL COUNTS ===`);
  console.log(
    `Mayers  "${mayersFinal?.displayName}": ${mayersFinal?._count.guestAppearances}g/${mayersFinal?._count.quotes}q/${mayersFinal?._count.mentions}m`
  );
  console.log(
    `McQueen "${mcqueenFinal?.displayName}": ${mcqueenFinal?._count.guestAppearances}g/${mcqueenFinal?._count.quotes}q/${mcqueenFinal?._count.mentions}m`
  );

  if (DRY) {
    console.log("\nDRY RUN complete — no changes written. Pass --execute to apply.");
  } else {
    console.log("\nDone. Run scripts/_rebuild-search-text.ts for a full searchText refresh.");
  }

  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
