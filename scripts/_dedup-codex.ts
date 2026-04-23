/**
 * CODEX DEDUP — Comprehensive deduplication pass
 *
 * Modes:
 *   --audit   Print all detected dupes without making any changes (default)
 *   --fix     Apply the hardcoded MERGE_PLAN to the database
 *
 * Detection strategy:
 *   1. Exact displayName match (case-insensitive)
 *   2. Normalised name match (strip punctuation/accents, collapse spaces)
 *   3. Compound "A/B" names where one component is an existing person
 *   4. Names that are strict substrings of another name
 *
 * After running in --audit mode, update MERGE_PLAN below with the
 * confirmed groups, then run with --fix.
 *
 * Run audit: npx tsx scripts/_dedup-codex.ts
 * Run fix:   npx tsx scripts/_dedup-codex.ts --fix
 */

import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

// ─── Merge plan ──────────────────────────────────────────────────────────────
// Format: { primary: slug-to-keep, secondaries: [slugs-to-merge-and-delete] }
// This is populated manually after reviewing the --audit output.
const MERGE_PLAN: Array<{ primary: string; secondaries: string[] }> = [
  // Example — uncomment and fill in after audit:
  // { primary: "psyche", secondaries: ["psyche-2", "the-host"] },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

// ─── Merge function ───────────────────────────────────────────────────────────
async function mergePerson(
  prisma: ReturnType<typeof getPrisma>,
  primaryId: string,
  secondaryId: string,
  secondaryName: string,
) {
  let appsMoved = 0, appsDup = 0, quotesMoved = 0, topicsMoved = 0;

  const apps = await prisma.episodeGuest.findMany({ where: { personId: secondaryId } });
  for (const app of apps) {
    const existing = await prisma.episodeGuest.findUnique({
      where: { episodeId_personId: { episodeId: app.episodeId, personId: primaryId } },
    });
    if (existing) {
      await prisma.episodeGuest.delete({
        where: { episodeId_personId: { episodeId: app.episodeId, personId: secondaryId } },
      });
      appsDup++;
    } else {
      await prisma.episodeGuest.update({
        where: { episodeId_personId: { episodeId: app.episodeId, personId: secondaryId } },
        data: { personId: primaryId },
      });
      appsMoved++;
    }
  }

  const q = await prisma.quote.updateMany({
    where: { speakerPersonId: secondaryId },
    data: { speakerPersonId: primaryId },
  });
  quotesMoved = q.count;

  const topics = await prisma.personTopic.findMany({ where: { personId: secondaryId } });
  for (const t of topics) {
    const exists = await prisma.personTopic.findUnique({
      where: { personId_topicId: { personId: primaryId, topicId: t.topicId } },
    });
    if (!exists) {
      await prisma.personTopic.update({
        where: { personId_topicId: { personId: secondaryId, topicId: t.topicId } },
        data: { personId: primaryId },
      });
      topicsMoved++;
    } else {
      await prisma.personTopic.delete({
        where: { personId_topicId: { personId: secondaryId, topicId: t.topicId } },
      });
    }
  }

  await prisma.person.delete({ where: { id: secondaryId } });
  console.log(
    `  [merged] "${secondaryName}" → primary: ` +
    `${appsMoved} apps, ${appsDup} dup apps, ${quotesMoved} quotes, ${topicsMoved} topics`,
  );
  return { appsMoved, quotesMoved };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const prisma = getPrisma();
  const mode = process.argv.includes("--fix") ? "fix" : "audit";
  console.log(`=== Codex Dedup (mode: ${mode}) ===\n`);

  const allPeople = await prisma.person.findMany({
    select: {
      id: true, slug: true, displayName: true, altNames: true, personType: true,
      _count: { select: { guestAppearances: true, quotes: true, mentions: true } },
    },
    orderBy: { displayName: "asc" },
  });

  console.log(`Total people: ${allPeople.length}\n`);

  // ── 1. Exact displayName duplicates ────────────────────────────────────────
  const nameMap = new Map<string, typeof allPeople>();
  for (const p of allPeople) {
    const key = p.displayName.toLowerCase().trim();
    const group = nameMap.get(key) ?? [];
    group.push(p);
    nameMap.set(key, group);
  }
  const exactDupes = [...nameMap.entries()].filter(([, v]) => v.length > 1);

  if (exactDupes.length) {
    console.log(`=== EXACT NAME DUPLICATES (${exactDupes.length} groups) ===`);
    for (const [name, records] of exactDupes) {
      console.log(`\n  "${name}"`);
      for (const r of records) {
        const total = r._count.guestAppearances + r._count.mentions + r._count.quotes;
        console.log(`    ${r.slug} | ${r.personType} | apps=${r._count.guestAppearances} ment=${r._count.mentions} quotes=${r._count.quotes} (total=${total})`);
      }
    }
  } else {
    console.log("=== EXACT NAME DUPLICATES: none ===");
  }

  // ── 2. Normalised-name near-duplicates ─────────────────────────────────────
  const normMap = new Map<string, typeof allPeople>();
  for (const p of allPeople) {
    const key = normalize(p.displayName);
    const group = normMap.get(key) ?? [];
    group.push(p);
    normMap.set(key, group);
  }
  const normDupes = [...normMap.entries()].filter(([, v]) => v.length > 1);

  const newNormDupes = normDupes.filter(
    ([key, records]) =>
      !exactDupes.some(([ek]) => ek === records[0].displayName.toLowerCase().trim()),
  );

  if (newNormDupes.length) {
    console.log(`\n=== NORMALISED NAME NEAR-DUPLICATES (${newNormDupes.length} groups) ===`);
    for (const [norm, records] of newNormDupes) {
      console.log(`\n  norm="${norm}"`);
      for (const r of records) {
        const total = r._count.guestAppearances + r._count.mentions + r._count.quotes;
        console.log(`    "${r.displayName}" (${r.slug}) | ${r.personType} | total=${total}`);
      }
    }
  } else {
    console.log("\n=== NORMALISED NAME NEAR-DUPLICATES: none ===");
  }

  // ── 3. Fuzzy Levenshtein candidates (distance ≤ 2, min length 5) ──────────
  console.log("\n=== LEVENSHTEIN NEAR-DUPLICATES (distance ≤ 2) ===");
  const checked = new Set<string>();
  let fuzzyCount = 0;
  for (let i = 0; i < allPeople.length; i++) {
    for (let j = i + 1; j < allPeople.length; j++) {
      const a = allPeople[i], b = allPeople[j];
      const pairKey = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
      if (checked.has(pairKey)) continue;
      checked.add(pairKey);
      const na = normalize(a.displayName);
      const nb = normalize(b.displayName);
      if (na.length < 5 || nb.length < 5) continue;
      if (Math.abs(na.length - nb.length) > 4) continue;
      const dist = levenshtein(na, nb);
      if (dist <= 2) {
        fuzzyCount++;
        console.log(
          `\n  "${a.displayName}" (${a.slug}, apps=${a._count.guestAppearances})` +
          `\n  "${b.displayName}" (${b.slug}, apps=${b._count.guestAppearances})` +
          `\n  → distance=${dist}`,
        );
      }
    }
  }
  if (fuzzyCount === 0) console.log("  None found.");

  // ── 4. Compound "/" names ──────────────────────────────────────────────────
  const compounds = allPeople.filter((p) => p.displayName.includes("/"));
  if (compounds.length) {
    console.log(`\n=== COMPOUND "/" NAMES (${compounds.length}) ===`);
    for (const p of compounds) {
      const total = p._count.guestAppearances + p._count.mentions + p._count.quotes;
      console.log(`  "${p.displayName}" (${p.slug}) | ${p.personType} | total=${total}`);
    }
  } else {
    console.log("\n=== COMPOUND \"/\" NAMES: none ===");
  }

  // ── 5. Zero-reference people ───────────────────────────────────────────────
  const ghosts = allPeople.filter(
    (p) =>
      p._count.guestAppearances === 0 &&
      p._count.mentions === 0 &&
      p._count.quotes === 0,
  );
  if (ghosts.length) {
    console.log(`\n=== ZERO-REFERENCE PEOPLE (${ghosts.length}) ===`);
    for (const p of ghosts) {
      console.log(`  "${p.displayName}" (${p.slug}) — ${p.personType}`);
    }
  } else {
    console.log("\n=== ZERO-REFERENCE PEOPLE: none ===");
  }

  // ── Fix mode ───────────────────────────────────────────────────────────────
  if (mode === "fix") {
    if (MERGE_PLAN.length === 0) {
      console.log("\n[fix] MERGE_PLAN is empty — nothing to do.");
    } else {
      console.log(`\n=== APPLYING MERGE PLAN (${MERGE_PLAN.length} groups) ===`);
      let totalApps = 0, totalQuotes = 0, deleted = 0;

      for (const group of MERGE_PLAN) {
        const primary = await prisma.person.findUnique({ where: { slug: group.primary } });
        if (!primary) {
          console.log(`  [skip] primary "${group.primary}" not found`);
          continue;
        }
        console.log(`\n  Primary: "${primary.displayName}" (${group.primary})`);

        for (const secSlug of group.secondaries) {
          const secondary = await prisma.person.findUnique({ where: { slug: secSlug } });
          if (!secondary) {
            console.log(`    [skip] secondary "${secSlug}" not found`);
            continue;
          }
          const { appsMoved, quotesMoved } = await mergePerson(
            prisma, primary.id, secondary.id, secondary.displayName,
          );
          totalApps += appsMoved;
          totalQuotes += quotesMoved;
          deleted++;
        }
      }

      console.log(`\n=== FIX SUMMARY ===`);
      console.log(`  Appearances moved: ${totalApps}`);
      console.log(`  Quotes moved:      ${totalQuotes}`);
      console.log(`  Records deleted:   ${deleted}`);

      const finalCount = await prisma.person.count();
      console.log(`  People remaining:  ${finalCount}`);
    }
  } else {
    console.log(
      "\n[audit] No changes made. Populate MERGE_PLAN and run with --fix to apply.",
    );
  }

  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
