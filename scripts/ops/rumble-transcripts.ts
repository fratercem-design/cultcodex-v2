/**
 * Imports verified Rumble auto-caption transcripts (SRT) from
 * scripts/ingest/data/rumble-transcripts/ into TranscriptSegment rows.
 *
 * Each row of index.csv names an .srt file and its Rumble page. The episode is
 * found by rumbleVideoId (the `v7…` code in the Rumble URL), then by title
 * within two days of the air date; if none exists it is created the same way import-from-rumble.ts
 * creates Rumble VODs (draft, livestream), so it can be reviewed and enriched
 * before it goes public.
 *
 * READ-ONLY by default — prints what it would do.
 *
 *   npx tsx scripts/ops/rumble-transcripts.ts            # report
 *   npx tsx scripts/ops/rumble-transcripts.ts --apply    # write
 *
 * From GitHub Actions (Run DB Script workflow), which cannot pass flags:
 *   script = ops/rumble-transcripts.ts         → report
 *   script = ops/rumble-transcripts-apply.ts   → apply
 *
 * Idempotent: an episode that already has transcript segments is left alone,
 * and segment inserts skip duplicates on the (episodeId, start, end, text) key.
 */
import { readFileSync } from "fs";
import * as path from "path";
import { getPrisma, disconnect, slugify } from "../ingest/lib";

const DATA_DIR = path.resolve(__dirname, "../ingest/data/rumble-transcripts");

export interface IndexRow {
  filename: string;
  title: string;
  durationSeconds: number;
  rumbleUrl: string;
}

export interface Segment {
  startSeconds: number;
  endSeconds: number;
  text: string;
}

/** Minimal RFC-4180 CSV parser (quoted fields, "" escapes, BOM). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.length)) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.length)) rows.push(row);
  return rows;
}

export function parseIndex(csv: string): IndexRow[] {
  const [header, ...rows] = parseCsv(csv);
  const col = (name: string) => header.indexOf(name);
  return rows.map((r) => ({
    filename: r[col("filename")],
    title: r[col("title")],
    durationSeconds: Number(r[col("duration_seconds")]) || 0,
    rumbleUrl: r[col("rumble_url")],
  }));
}

/** `https://rumble.com/v7expgc-…html` → `v7expgc`. */
export function rumbleIdFromUrl(url: string): string | null {
  return url.match(/rumble\.com\/(v[a-z0-9]+)-/i)?.[1] ?? null;
}

/**
 * `08/31/26 Psyche Awakens VOD: "I DECLARE INDEPENDENCE"` →
 * { title: "I DECLARE INDEPENDENCE", airDate: 2026-08-31 }. Mirrors the title
 * shape import-from-rumble.ts stores (the quoted part only).
 */
export function parseRumbleTitle(raw: string): { title: string; airDate: Date | null } {
  const date = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})/);
  const airDate = date
    ? new Date(Date.UTC(2000 + Number(date[3]), Number(date[1]) - 1, Number(date[2])))
    : null;
  const after = raw.includes("VOD:") ? raw.slice(raw.indexOf("VOD:") + 4) : raw;
  // Rumble wraps the name in quotes, sometimes only partly ("X" (Partial)) or
  // with a stray apostrophe ('X"), so drop every double quote and trim edge ones.
  // NFKC turns Rumble's full-width stand-ins (？ ： ＂) back into ? : "; the
  // big solidus (⧸) it uses for "/" has no compatibility mapping, so swap it by hand.
  const title = after.normalize("NFKC").replace(/\u29F8/g, "/").replace(/"/g, "").trim().replace(/^'+|'+$/g, "").replace(/\s+/g, " ").trim();
  return { title: title || raw.trim(), airDate };
}

function toSeconds(ts: string): number {
  const [h, m, rest] = ts.split(":");
  const [sec, ms] = rest.split(/[,.]/);
  return Number(h) * 3600 + Number(m) * 60 + Number(sec) + Number(ms ?? 0) / 1000;
}

/**
 * Drops formatting tags (<i>, <font …>) by skipping everything between angle
 * brackets, nesting included, so no markup — broken or not — survives into
 * stored text. A character scan rather than a regex: a single regex pass can
 * leave a tag behind when tags are nested.
 */
export function stripTags(text: string): string {
  let out = "";
  let depth = 0;
  for (const ch of text) {
    if (ch === "<") depth++;
    else if (ch === ">") depth = Math.max(0, depth - 1);
    else if (depth === 0) out += ch;
  }
  return out;
}

/** SRT → segments. Rounds like the YouTube sync does; drops empty and [tag]-only cues. */
export function parseSrt(srt: string): Segment[] {
  const out: Segment[] = [];
  for (const block of srt.replace(/\r/g, "").split(/\n\s*\n/)) {
    const lines = block.trim().split("\n");
    const timeIdx = lines.findIndex((l) => l.includes("-->"));
    if (timeIdx < 0) continue;
    const [start, end] = lines[timeIdx].split("-->").map((t) => t.trim().split(" ")[0]);
    const text = stripTags(lines.slice(timeIdx + 1).join(" "))
      .replace(/\[.*?\]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    out.push({ startSeconds: Math.round(toSeconds(start)), endSeconds: Math.round(toSeconds(end)), text });
  }
  return out;
}

export function formatDuration(seconds: number): string | null {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

function normalize(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Word trigrams of a transcript. Two caption engines transcribing the same
 * stream share a large share of these; unrelated streams share almost none.
 */
export function shingles(text: string): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (let i = 2; i < words.length; i++) out.add(`${words[i - 2]} ${words[i - 1]} ${words[i]}`);
  return out;
}

/** Share of the smaller transcript's trigrams that also appear in the other. */
export function overlap(a: Set<string>, b: Set<string>): number {
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  if (small.size === 0) return 0;
  let hits = 0;
  for (const g of small) if (big.has(g)) hits++;
  return hits / small.size;
}

/** At or above this overlap two same-titled transcripts are one stream. */
export const SAME_STREAM = 0.3;

// Rumble titles carry the US stream date; episodes created from YouTube carry
// the upload date, a day later in UTC. Two days covers that drift without
// merging different streams that reused a title (e.g. four "I'm Back"s).
const MATCH_WINDOW_MS = 2 * 86_400_000;

export async function run(apply: boolean) {
  const prisma = getPrisma();
  const rows = parseIndex(readFileSync(path.join(DATA_DIR, "index.csv"), "utf8"));
  console.log(`${apply ? "APPLY" : "REPORT (read-only)"} — ${rows.length} transcripts in index.csv\n`);

  const episodes = await prisma.episode.findMany({
    select: {
      id: true, slug: true, title: true, airDate: true, rumbleVideoId: true, status: true,
      _count: { select: { segments: true } },
    },
  });
  const byRumble = new Map(episodes.filter((e) => e.rumbleVideoId).map((e) => [e.rumbleVideoId!, e]));
  const slugs = new Set(episodes.map((e) => e.slug));
  // An episode is one stream: once a Rumble video has matched it, a second
  // same-titled video (Rumble splits streams into several VODs) gets its own.
  const claimed = new Set<string>();
  // Postgres sorts NULLs first on DESC, so unnumbered episodes must be excluded
  // or the "highest" number comes back null and numbering restarts at 1.
  const maxEp = await prisma.episode.findFirst({
    where: { episodeNumber: { not: null } },
    orderBy: { episodeNumber: "desc" },
    select: { episodeNumber: true },
  });
  let nextNumber = (maxEp?.episodeNumber ?? 0) + 1;

  const tally = { transcripts: 0, created: 0, linked: 0, skippedHasTranscript: 0, empty: 0, segments: 0, duplicates: 0 };

  // Episode dates are unreliable (bulk YouTube uploads carry the upload day),
  // so same-titled episodes are compared by transcript text as well.
  const shingleCache = new Map<string, Set<string>>();
  const episodeShingles = async (id: string) => {
    let set = shingleCache.get(id);
    if (!set) {
      const segs = await prisma.transcriptSegment.findMany({ where: { episodeId: id }, select: { text: true } });
      set = shingles(segs.map((s) => s.text).join(" "));
      shingleCache.set(id, set);
    }
    return set;
  };
  /** Transcribed, same-titled episodes other than `except`, with their overlap against `mine`, best first. */
  const twinsOf = async (title: string, mine: Set<string>, except?: string) => {
    const twins = episodes.filter((e) => e.id !== except && normalize(e.title) === normalize(title));
    const scored = await Promise.all(
      twins.map(async (e) => ({ e, score: e._count.segments > 0 ? overlap(mine, await episodeShingles(e.id)) : 0 })),
    );
    return scored.sort((a, b) => b.score - a.score);
  };
  const twinLine = ({ e, score }: { e: (typeof episodes)[number]; score: number }) =>
    `      same title: "${e.slug}" aired ${e.airDate?.toISOString().slice(0, 10) ?? "unknown"}, ` +
    `${e.status}, ${e._count.segments} segments${e.rumbleVideoId ? `, rumble ${e.rumbleVideoId}` : ""}, ` +
    `overlap ${score.toFixed(2)}`;

  for (const row of rows) {
    const rumbleId = rumbleIdFromUrl(row.rumbleUrl);
    const { title, airDate } = parseRumbleTitle(row.title);
    const segments = parseSrt(readFileSync(path.join(DATA_DIR, row.filename), "utf8"));
    const label = `${airDate?.toISOString().slice(0, 10) ?? "????-??-??"} "${title}" [${rumbleId}]`;

    if (segments.length === 0) {
      console.log(`  ✗ ${label}: no usable cues in ${row.filename}`);
      tally.empty++;
      continue;
    }

    // 1. by Rumble id; 2. by title within two days of the air date (titles
    //    repeat across streams, so the date must agree too).
    let ep = rumbleId ? byRumble.get(rumbleId) : undefined;
    let how = "rumble id";
    const mine = shingles(segments.map((s) => s.text).join(" "));

    // A draft an earlier run created, for a stream the archive already had
    // under a drifted date: remove it and put its Rumble id on the original.
    if (ep?.status === "draft") {
      const draft = ep;
      const best = (await twinsOf(title, mine, draft.id)).find((t) => t.e.status !== "draft");
      if (best && best.score >= SAME_STREAM) {
        console.log(`  - ${label}: draft "${draft.slug}" duplicates "${best.e.slug}" (overlap ${best.score.toFixed(2)}) — draft removed`);
        tally.duplicates++;
        claimed.add(best.e.id);
        if (apply) {
          await prisma.$transaction([
            prisma.episode.delete({ where: { id: draft.id } }),
            ...(best.e.rumbleVideoId ? [] : [prisma.episode.update({ where: { id: best.e.id }, data: { rumbleVideoId: rumbleId } })]),
          ]);
        }
        continue;
      }
    }

    if (!ep) {
      const gap = (e: (typeof episodes)[number]) =>
        airDate && e.airDate ? Math.abs(e.airDate.getTime() - airDate.getTime()) : 0;
      ep = episodes
        .filter(
          (e) =>
            !claimed.has(e.id) &&
            (!e.rumbleVideoId || e.rumbleVideoId === rumbleId) &&
            normalize(e.title) === normalize(title) &&
            gap(e) <= MATCH_WINDOW_MS,
        )
        .sort((a, b) => gap(a) - gap(b))[0];
      how = "title + date";
    }
    if (!ep) {
      // Matching text means the archive already has this stream, even when a
      // second Rumble upload of it already claimed the episode, so no claim or
      // Rumble-id filter here: at worst this skips, it never merges streams.
      const [best] = await twinsOf(title, mine);
      if (best && best.score >= SAME_STREAM) {
        ep = best.e;
        how = `title + transcript (overlap ${best.score.toFixed(2)})`;
      }
    }
    if (ep) claimed.add(ep.id);

    if (ep && ep._count.segments > 0) {
      console.log(`  = ${label}: episode "${ep.slug}" already has ${ep._count.segments} segments — skipped${how === "rumble id" ? "" : ` (${how})`}`);
      tally.skippedHasTranscript++;
      continue;
    }

    const rawText = segments.map((s) => s.text).join(" ");

    if (!ep) {
      const base = slugify(title) || `rumble-${rumbleId}`;
      let slug = base;
      if (slugs.has(slug)) slug = `${base}-${airDate?.toISOString().slice(0, 10) ?? rumbleId}`;
      if (slugs.has(slug)) slug = `${base}-${rumbleId}`;
      slugs.add(slug);
      console.log(`  + ${label}: new draft episode "${slug}" with ${segments.length} segments`);
      // Same-titled episodes whose transcripts differ: a different show that
      // reused the title. The overlap is printed so the cutoff can be checked.
      for (const twin of await twinsOf(title, mine)) console.log(twinLine(twin));
      tally.created++;
      tally.transcripts++;
      tally.segments += segments.length;
      if (!apply) continue;
      // Episode + segments in one transaction: a failure leaves nothing behind.
      await prisma.$transaction(async (tx) => {
        const created = await tx.episode.create({
          data: {
            title, slug, episodeNumber: nextNumber, airDate, rumbleVideoId: rumbleId,
            duration: formatDuration(row.durationSeconds), status: "draft", contentType: "livestream",
            transcriptRaw: rawText.slice(0, 200000),
            searchText: [slug, title, rawText].join(" ").toLowerCase().slice(0, 10000),
          },
          select: { id: true },
        });
        await tx.transcriptSegment.createMany({
          data: segments.map((s) => ({ episodeId: created.id, ...s, searchText: s.text.toLowerCase() })),
          skipDuplicates: true,
        });
      }, { timeout: 60_000 });
      nextNumber++;
      continue;
    }

    console.log(`  → ${label}: matched "${ep.slug}" (${ep.status}) by ${how} — ${segments.length} segments`);
    tally.transcripts++;
    tally.segments += segments.length;
    if (how !== "rumble id") tally.linked++;
    if (!apply) continue;
    const matched = ep;
    await prisma.$transaction(async (tx) => {
      await tx.transcriptSegment.createMany({
        data: segments.map((s) => ({ episodeId: matched.id, ...s, searchText: s.text.toLowerCase() })),
        skipDuplicates: true,
      });
      await tx.episode.update({
        where: { id: matched.id },
        data: {
          transcriptRaw: rawText.slice(0, 200000),
          searchText: [matched.slug, rawText].join(" ").toLowerCase().slice(0, 10000),
          ...(matched.rumbleVideoId ? {} : { rumbleVideoId: rumbleId }),
        },
      });
    }, { timeout: 60_000 });
  }

  console.log(
    `\nSummary: ${apply ? "imported" : "would import"} ${tally.transcripts} transcripts ` +
      `(${tally.segments} segments) · new draft episodes ${tally.created} · matched by title ${tally.linked} · ` +
      `skipped (already transcribed) ${tally.skippedHasTranscript} · unreadable ${tally.empty} · ` +
      `duplicate drafts ${apply ? "removed" : "to remove"} ${tally.duplicates}`,
  );
  await disconnect();
}

if (process.argv[1]?.endsWith("rumble-transcripts.ts")) {
  run(process.argv.includes("--apply")).catch(async (e) => {
    console.error(e);
    await disconnect();
    process.exit(1);
  });
}
