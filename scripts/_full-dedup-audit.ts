import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();

  // 1. Get ALL people with counts
  const allPeople = await prisma.person.findMany({
    select: {
      id: true,
      slug: true,
      displayName: true,
      altNames: true,
      personType: true,
      shortBio: true,
      _count: { select: { guestAppearances: true, quotes: true, mentions: true } },
    },
    orderBy: { displayName: "asc" },
  });

  console.log(`Total people: ${allPeople.length}\n`);

  // 2. Find exact displayName duplicates
  const nameMap = new Map<string, typeof allPeople>();
  for (const p of allPeople) {
    const key = p.displayName.toLowerCase().trim();
    if (!nameMap.has(key)) nameMap.set(key, []);
    nameMap.get(key)!.push(p);
  }

  const exactDupes = [...nameMap.entries()].filter(([_, v]) => v.length > 1);
  if (exactDupes.length) {
    console.log(`=== EXACT NAME DUPLICATES (${exactDupes.length}) ===`);
    for (const [name, records] of exactDupes) {
      console.log(`\n"${name}" (${records.length} records):`);
      for (const r of records) {
        console.log(`  ${r.slug} | type=${r.personType} | apps=${r._count.guestAppearances} quotes=${r._count.quotes} mentions=${r._count.mentions} | alt=[${r.altNames.join(", ")}]`);
      }
    }
  } else {
    console.log("No exact name duplicates found.");
  }

  // 3. Find fuzzy/similar names (Levenshtein-like: same first+last word)
  console.log("\n\n=== SIMILAR NAME CANDIDATES ===");
  const words = allPeople.map(p => ({
    ...p,
    first: p.displayName.split(/[\s\/]+/)[0]?.toLowerCase() ?? "",
    last: p.displayName.split(/[\s\/]+/).slice(-1)[0]?.toLowerCase() ?? "",
    normalized: p.displayName.toLowerCase().replace(/[^a-z0-9]/g, ""),
  }));

  const checked = new Set<string>();
  let similarCount = 0;

  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      const a = words[i], b = words[j];
      const key = `${a.id}|${b.id}`;
      if (checked.has(key)) continue;
      checked.add(key);

      // Check if normalized names are very similar
      const isSimilar =
        (a.normalized === b.normalized) ||
        (a.first.length > 2 && b.first.length > 2 && a.first === b.first && a.last === b.last) ||
        (a.normalized.length > 4 && b.normalized.includes(a.normalized)) ||
        (b.normalized.length > 4 && a.normalized.includes(b.normalized));

      if (isSimilar && a.slug !== b.slug) {
        similarCount++;
        console.log(`\n  "${a.displayName}" (${a.slug}, apps=${a._count.guestAppearances}, quotes=${a._count.quotes})`);
        console.log(`  "${b.displayName}" (${b.slug}, apps=${b._count.guestAppearances}, quotes=${b._count.quotes})`);
      }
    }
  }
  if (similarCount === 0) console.log("  None found.");

  // 4. Find compound names with "/" that might need splitting
  console.log("\n\n=== COMPOUND NAMES (contains /) ===");
  const compounds = allPeople.filter(p => p.displayName.includes("/"));
  for (const p of compounds) {
    console.log(`  "${p.displayName}" (${p.slug}) | apps=${p._count.guestAppearances} quotes=${p._count.quotes} | bio: ${p.shortBio?.slice(0, 80) ?? "none"}`);
  }

  // 5. Find people with "Alexandra" or "Alexander" in name/altNames
  console.log("\n\n=== ALEX* RECORDS ===");
  const alexes = allPeople.filter(p =>
    p.displayName.toLowerCase().includes("alex") ||
    p.altNames.some(a => a.toLowerCase().includes("alex"))
  );
  for (const p of alexes) {
    console.log(`  "${p.displayName}" (${p.slug}) | alt=[${p.altNames.join(", ")}] | apps=${p._count.guestAppearances} quotes=${p._count.quotes}`);
  }

  // 6. Find records with 0 appearances AND 0 quotes AND 0 mentions (orphans)
  console.log("\n\n=== ORPHAN RECORDS (0 appearances, 0 quotes, 0 mentions) ===");
  const orphans = allPeople.filter(p =>
    p._count.guestAppearances === 0 && p._count.quotes === 0 && p._count.mentions === 0
  );
  console.log(`  ${orphans.length} orphans found:`);
  for (const p of orphans) {
    console.log(`  "${p.displayName}" (${p.slug}) | type=${p.personType}`);
  }

  // 7. Check for altName overlaps (one person's altName matches another's displayName)
  console.log("\n\n=== ALT-NAME COLLISIONS (altName matches another person's displayName) ===");
  const displayNameSet = new Map(allPeople.map(p => [p.displayName.toLowerCase().trim(), p]));
  let collisionCount = 0;
  for (const p of allPeople) {
    for (const alt of p.altNames) {
      const match = displayNameSet.get(alt.toLowerCase().trim());
      if (match && match.id !== p.id) {
        collisionCount++;
        console.log(`  "${p.displayName}" has altName "${alt}" which matches "${match.displayName}" (${match.slug})`);
      }
    }
  }
  if (collisionCount === 0) console.log("  None found.");

  await disconnect();
}

main();
