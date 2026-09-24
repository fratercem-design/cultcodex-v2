import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

/**
 * People system audit — 2026-07 pass.
 * Read-only. Prints: type counts, exact/fuzzy duplicates, altName collisions,
 * categorization anomalies, missing profile data, orphans.
 */

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tightNorm(s: string): string {
  return norm(s).replace(/\s+/g, "");
}

async function main() {
  const p = getPrisma();

  const people = await p.person.findMany({
    select: {
      id: true,
      displayName: true,
      slug: true,
      altNames: true,
      shortBio: true,
      loreSummary: true,
      avatarUrl: true,
      personType: true,
      firstAppearanceEpisodeId: true,
      _count: { select: { guestAppearances: true, mentions: true, quotes: true, loreConnections: true, topics: true } },
    },
    orderBy: { displayName: "asc" },
  });

  console.log(`\n===== PEOPLE AUDIT ${new Date().toISOString()} =====`);
  console.log(`Total people: ${people.length}`);

  // ── Counts by type
  const byType = new Map<string, number>();
  for (const x of people) byType.set(x.personType, (byType.get(x.personType) ?? 0) + 1);
  console.log("\n── Counts by personType");
  for (const [t, c] of [...byType.entries()].sort()) console.log(`  ${t}: ${c}`);

  // ── Exact duplicate displayNames (normalized)
  console.log("\n── Exact duplicate displayNames (normalized)");
  const nameMap = new Map<string, typeof people>();
  for (const x of people) {
    const k = norm(x.displayName);
    if (!nameMap.has(k)) nameMap.set(k, []);
    nameMap.get(k)!.push(x);
  }
  let exactDupes = 0;
  for (const [k, group] of nameMap) {
    if (group.length > 1) {
      exactDupes++;
      console.log(`  DUPE "${k}": ${group.map((g) => `${g.slug} [${g.personType}, g${g._count.guestAppearances}/m${g._count.mentions}${g.shortBio ? ",bio" : ""}${g.avatarUrl ? ",av" : ""}]`).join("  |  ")}`);
    }
  }
  if (exactDupes === 0) console.log("  none");

  // ── Tight-norm near duplicates (whitespace-collapsed, e.g. "Jay Dog" vs "JayDog")
  console.log("\n── Near duplicates (tight normalization)");
  const tightMap = new Map<string, typeof people>();
  for (const x of people) {
    const k = tightNorm(x.displayName);
    if (!tightMap.has(k)) tightMap.set(k, []);
    tightMap.get(k)!.push(x);
  }
  let nearDupes = 0;
  for (const [k, group] of tightMap) {
    if (group.length > 1 && norm(group[0].displayName) !== norm(group[1].displayName)) {
      nearDupes++;
      console.log(`  NEAR "${k}": ${group.map((g) => g.slug).join(" | ")}`);
    }
  }
  // prefix/containment fuzzy: slug of one contained in another with same first token
  const slugs = people.map((x) => ({ x, s: x.slug.replace(/-/g, "") }));
  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      const a = slugs[i], b = slugs[j];
      if (a.s.length >= 5 && b.s.length >= 5 && (a.s.startsWith(b.s) || b.s.startsWith(a.s)) && a.s !== b.s) {
        nearDupes++;
        console.log(`  PREFIX ${a.x.slug} [${a.x.personType}] <~> ${b.x.slug} [${b.x.personType}]`);
      }
    }
  }
  if (nearDupes === 0) console.log("  none");

  // ── altName collisions
  console.log("\n── altName collisions (someone's altName = another's displayName)");
  const byNormName = new Map<string, (typeof people)[number]>();
  for (const x of people) byNormName.set(norm(x.displayName), x);
  let altCollisions = 0;
  for (const x of people) {
    for (const alt of x.altNames) {
      const hit = byNormName.get(norm(alt));
      if (hit && hit.id !== x.id) {
        altCollisions++;
        console.log(`  ALT "${alt}" on ${x.slug} matches person ${hit.slug} [${hit.personType}]`);
      }
    }
  }
  if (altCollisions === 0) console.log("  none");

  // ── Categorization anomalies
  console.log("\n── Guests with ≥3 guest appearances (recurring candidates)");
  const promo = people.filter((x) => x.personType === "guest" && x._count.guestAppearances >= 3);
  for (const x of promo) console.log(`  ${x.slug}: ${x._count.guestAppearances} appearances${x.shortBio ? " (profiled)" : ""}`);
  if (promo.length === 0) console.log("  none");

  console.log("\n── Recurring with ≤1 guest appearance (demotion candidates)");
  const demo = people.filter((x) => x.personType === "recurring" && x._count.guestAppearances <= 1);
  for (const x of demo) console.log(`  ${x.slug}: g${x._count.guestAppearances}/m${x._count.mentions}`);
  if (demo.length === 0) console.log("  none");

  console.log("\n── Mentioned-type people with guest appearance rows (type contradiction)");
  const contra = people.filter((x) => x.personType === "mentioned" && x._count.guestAppearances > 0);
  for (const x of contra) console.log(`  ${x.slug}: g${x._count.guestAppearances}/m${x._count.mentions}`);
  if (contra.length === 0) console.log("  none");

  // ── Profile gaps
  console.log("\n── Profiled people (bio or lore) missing avatar");
  const noAvatar = people.filter((x) => (x.shortBio || x.loreSummary) && !x.avatarUrl && x.personType !== "mentioned");
  for (const x of noAvatar) console.log(`  ${x.slug} [${x.personType}]`);
  if (noAvatar.length === 0) console.log("  none");

  console.log("\n── Hosts/recurring missing shortBio (profile gaps on prominent people)");
  const noBio = people.filter((x) => (x.personType === "host" || x.personType === "recurring") && !x.shortBio);
  for (const x of noBio) console.log(`  ${x.slug} [${x.personType}]`);
  if (noBio.length === 0) console.log("  none");

  // ── Orphans
  console.log("\n── Orphans (0 guest appearances, 0 mentions, 0 quotes)");
  const orphans = people.filter((x) => x._count.guestAppearances === 0 && x._count.mentions === 0 && x._count.quotes === 0);
  for (const x of orphans) console.log(`  ${x.slug} [${x.personType}]${x.shortBio ? " (has bio)" : ""}${x.loreSummary ? " (has lore)" : ""}`);
  if (orphans.length === 0) console.log("  none");

  console.log("\n===== SUMMARY =====");
  console.log(`total=${people.length} exactDupeGroups=${exactDupes} nearDupeSignals=${nearDupes} altCollisions=${altCollisions}`);
  console.log(`recurringCandidates=${promo.length} demotionCandidates=${demo.length} typeContradictions=${contra.length}`);
  console.log(`profiledNoAvatar=${noAvatar.length} prominentNoBio=${noBio.length} orphans=${orphans.length}`);

  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
