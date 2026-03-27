import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

/**
 * Find potential duplicate people entries by comparing names.
 * Groups by normalized name (lowercase, trimmed, no accents).
 */
async function main() {
  const p = getPrisma();

  const people = await p.person.findMany({
    select: {
      id: true,
      displayName: true,
      slug: true,
      personType: true,
      _count: {
        select: {
          guestAppearances: true,
          mentions: true,
          quotes: true,
        },
      },
    },
    orderBy: { displayName: "asc" },
  });

  console.log(`Total people: ${people.length}\n`);

  // Normalize name for comparison
  function normalize(name: string): string {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // strip accents
      .replace(/[^a-z0-9\s]/g, "")    // strip punctuation
      .replace(/\s+/g, " ")
      .trim();
  }

  // Group by normalized first word (first name)
  const byFirstName = new Map<string, typeof people>();
  for (const p of people) {
    const parts = normalize(p.displayName).split(" ");
    const key = parts[0];
    if (!key || key.length < 2) continue;
    const group = byFirstName.get(key) ?? [];
    group.push(p);
    byFirstName.set(key, group);
  }

  // Find groups with potential duplicates
  console.log("=== POTENTIAL DUPLICATES (by first name) ===\n");
  let found = 0;
  for (const [firstName, group] of byFirstName) {
    if (group.length < 2) continue;
    // Check if any pair has Levenshtein distance < 3 or shares first+last name
    const potentialDups: typeof people = [];
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = normalize(group[i].displayName);
        const b = normalize(group[j].displayName);
        // Same first name, similar rest
        if (a === b || levenshtein(a, b) <= 3) {
          if (!potentialDups.includes(group[i])) potentialDups.push(group[i]);
          if (!potentialDups.includes(group[j])) potentialDups.push(group[j]);
        }
      }
    }
    if (potentialDups.length >= 2) {
      found++;
      console.log(`Group: "${firstName}"`);
      for (const p of potentialDups) {
        const total = p._count.guestAppearances + p._count.mentions + p._count.quotes;
        console.log(
          `  "${p.displayName}" (${p.slug}) — ${p.personType} — ${p._count.guestAppearances} guest, ${p._count.mentions} mentioned, ${p._count.quotes} quotes = ${total} total refs`
        );
      }
      console.log();
    }
  }

  // Also check for exact normalized duplicates
  console.log("=== EXACT NORMALIZED DUPLICATES ===\n");
  const byNorm = new Map<string, typeof people>();
  for (const p of people) {
    const key = normalize(p.displayName);
    const group = byNorm.get(key) ?? [];
    group.push(p);
    byNorm.set(key, group);
  }
  for (const [norm, group] of byNorm) {
    if (group.length < 2) continue;
    console.log(`Normalized: "${norm}"`);
    for (const p of group) {
      const total = p._count.guestAppearances + p._count.mentions + p._count.quotes;
      console.log(
        `  "${p.displayName}" (${p.slug}) — ${p.personType} — ${total} total refs`
      );
    }
    console.log();
  }

  if (found === 0) {
    console.log("No fuzzy duplicates found by first name.\n");
  }

  await disconnect();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[m][n];
}

main().catch((e) => { console.error(e); process.exit(1); });
