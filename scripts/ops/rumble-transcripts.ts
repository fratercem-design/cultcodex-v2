/**
 * Imports verified Rumble auto-caption transcripts (SRT) from
 * scripts/ingest/data/rumble-transcripts/ into TranscriptSegment rows.
 *
 * Each row of index.csv names an .srt file and its Rumble page. The episode is
 * found by rumbleVideoId (the `v7…` code in the Rumble URL), then by title +
 * air date; if none exists it is created the same way import-from-rumble.ts
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
  const title = after.replace(/"/g, "").trim().replace(/^'+|'+$/g, "").replace(/\s+/g, " ").trim();
  return { title: title || raw.trim(), airDate };
}

function toSeconds(ts: string): number {
  const [h, m, rest] = ts.split(":");
  const [sec, ms] = rest.split(/[,.]/);
  return Number(h) * 3600 + Number(m) * 60 + Number(sec) + Number(ms ?? 0) / 1000;
}

/** SRT → segments. Rounds like the YouTube sync does; drops empty and [tag]-only cues. */
export function parseSrt(srt: string): Segment[] {
  const out: Segment[] = [];
  for (const block of srt.replace(/\r/g, "").split(/\n\s*\n/)) {
    const lines = block.trim().split("\n");
    const timeIdx = lines.findIndex((l) => l.includes("-->"));
    if (timeIdx < 0) continue;
    const [start, end] = lines[timeIdx].split("-->").map((t) => t.trim().split(" ")[0]);
    const text = lines
      .slice(timeIdx + 1)
      .join(" ")
      // Drop formatting tags (<i>, <font …>), then any stray angle bracket, so a
      // malformed or nested tag can't leave markup behind in stored text.
      .replace(/<[^>]*>/g, "")
      .replace(/[<>]/g, "")
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

const DAY_MS = 86_400_000;

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
  const maxEp = await prisma.episode.findFirst({ orderBy: { episodeNumber: "desc" }, select: { episodeNumber: true } });
  let nextNumber = (maxEp?.episodeNumber ?? 0) + 1;

  const tally = { transcripts: 0, created: 0, linked: 0, skippedHasTranscript: 0, empty: 0, segments: 0 };

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

    // 1. by Rumble id; 2. by title within a day of the air date (titles like
    //    "Come Hang" repeat, so the date must agree too).
    let ep = rumbleId ? byRumble.get(rumbleId) : undefined;
    let how = "rumble id";
    if (!ep) {
      ep = episodes.find(
        (e) =>
          normalize(e.title) === normalize(title) &&
          (!airDate || !e.airDate || Math.abs(e.airDate.getTime() - airDate.getTime()) <= DAY_MS),
      );
      how = "title + date";
    }

    if (ep && ep._count.segments > 0) {
      console.log(`  = ${label}: episode "${ep.slug}" already has ${ep._count.segments} segments — skipped`);
      tally.skippedHasTranscript++;
      continue;
    }

    const rawText = segments.map((s) => s.text).join(" ");

    if (!ep) {
      let slug = slugify(title) || `rumble-${rumbleId}`;
      if (slugs.has(slug)) slug = `${slug}-${airDate?.toISOString().slice(0, 10) ?? rumbleId}`;
      console.log(`  + ${label}: new draft episode "${slug}" with ${segments.length} segments`);
      tally.created++;
      tally.transcripts++;
      tally.segments += segments.length;
      if (!apply) continue;
      const created = await prisma.episode.create({
        data: {
          title, slug, episodeNumber: nextNumber++, airDate, rumbleVideoId: rumbleId,
          duration: formatDuration(row.durationSeconds), status: "draft", contentType: "livestream",
          transcriptRaw: rawText.slice(0, 200000),
          searchText: [slug, title, rawText].join(" ").toLowerCase().slice(0, 10000),
        },
        select: { id: true },
      });
      slugs.add(slug);
      await prisma.transcriptSegment.createMany({
        data: segments.map((s) => ({ episodeId: created.id, ...s, searchText: s.text.toLowerCase() })),
        skipDuplicates: true,
      });
      continue;
    }

    console.log(`  → ${label}: matched "${ep.slug}" (${ep.status}) by ${how} — ${segments.length} segments`);
    tally.transcripts++;
    tally.segments += segments.length;
    if (how !== "rumble id") tally.linked++;
    if (!apply) continue;
    await prisma.transcriptSegment.createMany({
      data: segments.map((s) => ({ episodeId: ep.id, ...s, searchText: s.text.toLowerCase() })),
      skipDuplicates: true,
    });
    await prisma.episode.update({
      where: { id: ep.id },
      data: {
        transcriptRaw: rawText.slice(0, 200000),
        searchText: [ep.slug, rawText].join(" ").toLowerCase().slice(0, 10000),
        ...(ep.rumbleVideoId ? {} : { rumbleVideoId: rumbleId }),
      },
    });
  }

  console.log(
    `\nSummary: ${apply ? "imported" : "would import"} ${tally.transcripts} transcripts ` +
      `(${tally.segments} segments) · new draft episodes ${tally.created} · matched by title ${tally.linked} · ` +
      `skipped (already transcribed) ${tally.skippedHasTranscript} · unreadable ${tally.empty}`,
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
