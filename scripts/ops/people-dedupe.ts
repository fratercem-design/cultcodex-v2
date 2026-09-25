/**
 * People audit: find duplicate Person rows and fold them together.
 *
 * Two kinds of cluster:
 *   1. Named — known people whose name the captions and enrichment spell a
 *      dozen ways (Alexandra Mayers, Alexander McQueen, Beeta). Matched by
 *      pattern on the display name and alt names.
 *   2. Exact — rows whose names are the same once case, punctuation and a
 *      trailing "(…)" or "/ …" alias are dropped ("Chris Kay" / "chris kay").
 * Near-misses (one letter apart) are only listed, never merged.
 *
 * The keeper is the canonical name when a named cluster has one, otherwise the
 * row with the most appearances. It takes the strongest role in the cluster
 * (host > recurring > guest > mentioned).
 *
 * Read-only by default; the -apply wrapper merges.
 */
import { getPrisma, disconnect } from "../ingest/lib";
import { mergePerson } from "./lib/merge-person";
import type { PersonType } from "../../src/generated/prisma/client";

interface Named {
  keep: string;
  match: RegExp;
  exclude?: RegExp;
}

/** Kept apart on purpose: McQueen and Mayers are different people. */
export const NAMED: Named[] = [
  {
    keep: "Alexandra Mayers",
    match: /\b(alexandr[ae]|alexandria|alexander|alex)\b[^/]*?\bm[aey]{1,2}[eo]?rs?\b|\bmonica foster\b|^alexandra$/i,
    exclude: /mc\s?queen/i,
  },
  { keep: "Alexander McQueen", match: /\bmc\s?queen\b/i, exclude: /\bm[aey]{1,2}[eo]?rs\b/i },
  { keep: "Beeta", match: /\b(beeta|beetah|beeda|beedah|bita|beda)\b/i },
];

const ROLE_RANK: Record<PersonType, number> = { host: 3, recurring: 2, guest: 1, mentioned: 0 };

/** Name with case, punctuation, and a trailing alias ("(…)", "/ …") removed. */
export function nameKey(name: string): string {
  return name
    .replace(/\(.*?\)/g, " ")
    .split("/")[0]
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function matchesNamed(n: Named, names: string[]): boolean {
  return names.some((s) => n.match.test(s)) && !names.some((s) => n.exclude?.test(s));
}

function oneEditApart(a: string, b: string): boolean {
  if (a === b || Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

export async function run(apply: boolean) {
  const p = getPrisma();
  const people = await p.person.findMany({
    select: {
      id: true, slug: true, displayName: true, altNames: true, personType: true,
      _count: { select: { guestAppearances: true, mentions: true, quotes: true } },
    },
  });
  type Row = (typeof people)[number];
  const weight = (r: Row) => r._count.guestAppearances + r._count.mentions;
  const show = (r: Row) =>
    `"${r.displayName}" [${r.personType}] ${r._count.guestAppearances} appearances, ${r._count.mentions} mentions, ${r._count.quotes} quotes`;

  console.log(`${apply ? "APPLY" : "REPORT (read-only)"} — ${people.length} people\n`);
  const byType = people.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.personType]: (acc[r.personType] ?? 0) + 1 }), {});
  console.log(`By type: ${Object.entries(byType).map(([k, v]) => `${k} ${v}`).join(" · ")}\n`);

  const taken = new Set<string>();
  const clusters: { keep: Row; dupes: Row[]; why: string }[] = [];

  for (const n of NAMED) {
    const rows = people.filter((r) => matchesNamed(n, [r.displayName, ...r.altNames]));
    if (rows.length < 2) continue;
    const keep =
      rows.find((r) => r.displayName.toLowerCase() === n.keep.toLowerCase()) ??
      [...rows].sort((a, b) => weight(b) - weight(a))[0];
    rows.forEach((r) => taken.add(r.id));
    clusters.push({ keep, dupes: rows.filter((r) => r.id !== keep.id), why: `named: ${n.keep}` });
  }

  const byKey = new Map<string, Row[]>();
  for (const r of people) {
    if (taken.has(r.id)) continue;
    const k = nameKey(r.displayName);
    if (k.length < 3) continue;
    byKey.set(k, [...(byKey.get(k) ?? []), r]);
  }
  for (const [k, rows] of byKey) {
    if (rows.length < 2) continue;
    const [keep, ...dupes] = [...rows].sort((a, b) => weight(b) - weight(a));
    clusters.push({ keep, dupes, why: `same name: "${k}"` });
  }

  let merges = 0;
  for (const c of clusters.sort((a, b) => b.dupes.length - a.dupes.length)) {
    console.log(`KEEP ${show(c.keep)}  (${c.why})`);
    for (const d of c.dupes) console.log(`   ← ${show(d)}`);
    merges += c.dupes.length;
  }

  // Near misses: listed for a human to judge, never merged automatically.
  const keys = [...byKey.keys()].filter((k) => k.length >= 6).sort();
  const near: string[] = [];
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length && keys[j][0] === keys[i][0]; j++)
      if (oneEditApart(keys[i], keys[j])) near.push(`"${keys[i]}" ~ "${keys[j]}"`);
  if (near.length) console.log(`\nNear misses (not merged — review by hand):\n  ${near.join("\n  ")}`);

  console.log(`\nSummary: ${clusters.length} clusters · ${merges} duplicate rows ${apply ? "merged" : "to merge"} · ${near.length} near misses listed`);
  if (!apply) return disconnect();

  for (const c of clusters) {
    for (const d of c.dupes) await mergePerson(p, c.keep.id, c.keep.slug, d.id, d.slug);
    const best = [c.keep, ...c.dupes].reduce((a, b) => (ROLE_RANK[b.personType] > ROLE_RANK[a.personType] ? b : a));
    const keeper = await p.person.findUniqueOrThrow({
      where: { id: c.keep.id },
      select: { displayName: true, altNames: true, shortBio: true, loreSummary: true },
    });
    const named = NAMED.find((n) => c.why === `named: ${n.keep}`);
    const displayName = named?.keep ?? keeper.displayName;
    const altNames = [...new Set([...keeper.altNames, keeper.displayName])].filter((a) => a !== displayName);
    await p.person.update({
      where: { id: c.keep.id },
      data: {
        displayName,
        altNames,
        personType: best.personType,
        searchText: [displayName, altNames.join(" "), keeper.shortBio, keeper.loreSummary].filter(Boolean).join(" "),
      },
    });
    console.log(`  merged ${c.dupes.length} into "${displayName}"`);
  }
  await disconnect();
}

if (process.argv[1]?.endsWith("people-dedupe.ts")) {
  run(process.argv.includes("--apply")).catch(async (e) => {
    console.error(e);
    await disconnect();
    process.exit(1);
  });
}
