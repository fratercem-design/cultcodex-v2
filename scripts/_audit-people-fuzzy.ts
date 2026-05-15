/**
 * Aggressive people-dupe audit.
 *
 * For every Person, derive a set of name "tokens" (last names, paired
 * names from slash-aliases, etc.). Group persons that share any
 * non-trivial token, then rank groups by how likely they are to be
 * the same human.
 *
 * Output:
 *   - HIGH confidence: one obvious canonical (lots of appearances) +
 *     small satellites with bios that reference the same identity
 *   - REVIEW: ambiguous or multi-canonical clusters
 *
 * This script is read-only. Use the printout to author dedup-* scripts.
 */

import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

const STOPWORDS = new Set([
  "the", "a", "an", "of", "and", "or", "in", "on", "at", "for", "to",
  "from", "by", "with", "is", "are", "was", "were", "psyche", "host",
  "guest", "panel", "show", "podcast", "neon", "priestess", "officer",
  "mr", "mrs", "ms", "dr", "sir", "lord", "lady", "the", "alex", "alexandra",
  "alexander", "and", "his", "her", "they",
  // generic role words that can collide across unrelated people
]);

// Tokens of length >=4 are interesting. Two-letter ones rarely identify a person.
const MIN_TOKEN_LEN = 4;

function tokensFromName(displayName: string): string[] {
  // Split on whitespace, slashes, parens
  const parts = displayName
    .toLowerCase()
    .replace(/[()]/g, " ")
    .split(/[\s/]+/)
    .map((s) => s.replace(/[^a-z0-9]/g, ""))
    .filter((s) => s.length >= MIN_TOKEN_LEN && !STOPWORDS.has(s));
  return parts;
}

interface PersonRow {
  id: string;
  displayName: string;
  slug: string;
  personType: string;
  shortBio: string | null;
  altNames: string[];
  count: number; // guests + quotes + mentions
  guests: number;
  quotes: number;
  mentions: number;
}

async function main() {
  const p = getPrisma();
  const peopleRaw = await p.person.findMany({
    select: {
      id: true, displayName: true, slug: true, personType: true,
      shortBio: true, altNames: true,
      _count: { select: { guestAppearances: true, quotes: true, mentions: true } },
    },
  });
  const people: PersonRow[] = peopleRaw.map((r) => ({
    id: r.id,
    displayName: r.displayName,
    slug: r.slug,
    personType: r.personType,
    shortBio: r.shortBio,
    altNames: r.altNames ?? [],
    guests: r._count.guestAppearances,
    quotes: r._count.quotes,
    mentions: r._count.mentions,
    count: r._count.guestAppearances + r._count.quotes + r._count.mentions,
  }));

  // tokenIndex: token -> set of person ids
  const tokenIndex = new Map<string, Set<string>>();
  const personTokens = new Map<string, Set<string>>();
  for (const person of people) {
    const all = new Set<string>([
      ...tokensFromName(person.displayName),
      ...person.altNames.flatMap(tokensFromName),
    ]);
    personTokens.set(person.id, all);
    for (const tok of all) {
      const set = tokenIndex.get(tok) ?? new Set<string>();
      set.add(person.id);
      tokenIndex.set(tok, set);
    }
  }

  // Build candidate clusters via union-find
  const parent = new Map<string, string>();
  function find(x: string): string {
    let cur = x;
    while (parent.get(cur) !== cur) {
      const next = parent.get(cur)!;
      parent.set(cur, parent.get(next)!);
      cur = parent.get(cur)!;
    }
    return cur;
  }
  function union(a: string, b: string) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }
  for (const person of people) parent.set(person.id, person.id);

  // Two persons are linked if they share at least one identifying token
  // AND at least one other shared signal — but here, sharing one rare-ish
  // token (>=4 chars, not a stopword) is good enough to put them in the
  // same review cluster. The user manually triages from there.
  for (const [, ids] of tokenIndex) {
    const arr = [...ids];
    if (arr.length < 2 || arr.length > 12) continue; // skip giant or singleton clusters
    for (let i = 1; i < arr.length; i++) union(arr[0], arr[i]);
  }

  const clusters = new Map<string, PersonRow[]>();
  for (const person of people) {
    const root = find(person.id);
    const arr = clusters.get(root) ?? [];
    arr.push(person);
    clusters.set(root, arr);
  }

  // Keep clusters with >=2 records
  const interesting = [...clusters.values()]
    .filter((arr) => arr.length >= 2)
    // Sort by largest cluster activity total, descending
    .sort((a, b) => {
      const aT = a.reduce((s, x) => s + x.count, 0);
      const bT = b.reduce((s, x) => s + x.count, 0);
      return bT - aT;
    });

  console.log(`\n=== People dedup candidates: ${interesting.length} clusters ===\n`);

  let totalCollapsable = 0;

  for (const cluster of interesting) {
    cluster.sort((a, b) => b.count - a.count);
    const canonical = cluster[0];
    const satellites = cluster.slice(1);
    totalCollapsable += satellites.length;

    // Skip clusters with no clearly dominant canonical (top has <=1 activity)
    // — those are too risky to suggest as auto-merges
    const flag = canonical.count >= 2 ? "MERGE?" : "REVIEW";

    console.log(`\n[${flag}] cluster anchor "${canonical.displayName}" (${cluster.length} records)`);
    for (const r of cluster) {
      const isCanon = r.id === canonical.id ? " <- KEEP" : "";
      const bio = (r.shortBio ?? "").slice(0, 100);
      console.log(
        `  ${r.id} | ${r.guests}g/${r.quotes}q/${r.mentions}m | ${r.personType.padEnd(9)} | "${r.displayName}" (${r.slug})${isCanon}`
      );
      if (bio) console.log(`      bio: ${bio}${(r.shortBio ?? "").length > 100 ? "…" : ""}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total persons: ${people.length}`);
  console.log(`Multi-record clusters: ${interesting.length}`);
  console.log(`Records that could collapse: ${totalCollapsable}`);

  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
