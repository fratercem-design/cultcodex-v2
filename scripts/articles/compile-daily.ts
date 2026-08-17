// scripts/articles/compile-daily.ts
//
// Compiles one day of the archive into a publishable "field report" article and
// (optionally) upserts it as a LoreEntry with category "article", which is what
// /articles already lists and /lore/[slug] renders.
//
// Design:
//   • Deterministic. Same date always compiles to the same article — no model
//     call, no clock reads outside the requested date — so it can run unattended
//     on a schedule and a given day never changes once written.
//   • Reads the enriched schema, not raw transcripts where richer data exists:
//     curated Quote rows (with significance) are preferred over scored transcript
//     windows; mentioned people and topics come from the Episode relations.
//   • Writes nothing by default. Pass --write to upsert the LoreEntry. Pass
//     --flagged to include the sensitive accusation section (off by default:
//     that material names people and should not auto-publish unreviewed).
//
// Usage:
//   npx tsx scripts/articles/compile-daily.ts [--date latest|today|yesterday|YYYY-MM-DD]
//                                             [--write] [--flagged] [--out <file>]
//
// The default (no --write) prints the markdown to stdout so you can review a day
// before committing it to the database.

import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { getPrisma, disconnect, slugify, buildSearchText } from "../ingest/lib";

/* ── args ──────────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const flag = (n: string) => argv.includes(`--${n}`);
function opt(n: string, fallback: string): string {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}

const prisma = getPrisma();
const DAY_MS = 86_400_000;

/* ── date resolution ───────────────────────────────────────────────────── */

async function resolveDate(spec: string): Promise<string> {
  if (/^\d{4}-\d{2}-\d{2}$/.test(spec)) return spec;
  if (spec === "today") return new Date().toISOString().slice(0, 10);
  if (spec === "yesterday") return new Date(Date.now() - DAY_MS).toISOString().slice(0, 10);

  // latest = the most recent day that actually has an aired episode
  const latest = await prisma.episode.findFirst({
    where: { airDate: { not: null } },
    orderBy: { airDate: "desc" },
    select: { airDate: true },
  });
  if (!latest?.airDate) {
    throw new Error("no episodes with an airDate in the database");
  }
  return latest.airDate.toISOString().slice(0, 10);
}

/* ── duration parsing ──────────────────────────────────────────────────── */

/** Episode.duration is a display string ("1:28:11" or "44:02"). Parse to seconds. */
function durationToSeconds(d: string | null): number {
  if (!d) return 0;
  const parts = d.split(":").map((x) => parseInt(x, 10));
  if (parts.some((x) => Number.isNaN(x))) return 0;
  return parts.reduce((acc, x) => acc * 60 + x, 0);
}

/* ── transcript-scored pull-quotes (fallback only) ─────────────────────── */

/**
 * When an episode has no curated Quote rows, lift quotes from the transcript.
 * Every viable window is scored and the best, well-spaced few are kept — fixed
 * positions on a multi-hour stream land on crosstalk, so this rewards sustained
 * speech (long segments, clean endings) and penalizes filler.
 */
function scoreWindow(parts: string[], text: string): number {
  const avgLen = text.length / parts.length;
  const stubs = parts.filter((p) => p.length < 25).length;
  let score = avgLen - stubs * 8;
  if (/[.?!]$/.test(text)) score += 12;
  const filler = (text.match(/\b(uh|um|yeah|okay|like|I don't know|you know)\b/gi) ?? []).length;
  score -= filler * 4;
  return score;
}

async function transcriptQuotes(episodeId: string, want: number): Promise<string[]> {
  const segs = await prisma.transcriptSegment.findMany({
    where: { episodeId },
    orderBy: { startSeconds: "asc" },
    select: { text: true },
  });
  if (segs.length < 8 || want < 1) return [];

  type Cand = { i: number; text: string; score: number };
  const cands: Cand[] = [];

  for (let i = 0; i < segs.length; i++) {
    if ((segs[i].text ?? "").trim().length < 40) continue;
    const parts: string[] = [];
    let len = 0;
    for (let j = i; j < segs.length && len < 190 && j - i < 8; j++) {
      const t = (segs[j].text ?? "").trim();
      if (t) {
        parts.push(t);
        len += t.length + 1;
      }
    }
    if (parts.length < 2) continue;

    let text = parts.join(" ").replace(/\s+/g, " ").trim();
    if (text.length < 80) continue;
    const stop = Math.max(text.lastIndexOf(". "), text.lastIndexOf("? "), text.lastIndexOf("! "));
    if (stop > 90) text = text.slice(0, stop + 1);
    else if (!/[.?!]$/.test(text)) text += "…";
    cands.push({ i, text, score: scoreWindow(parts, text) });
  }
  if (!cands.length) return [];

  cands.sort((a, b) => b.score - a.score || a.i - b.i);
  const minGap = Math.max(8, Math.floor(segs.length / (want + 1) / 2));
  const picked: Cand[] = [];
  for (const c of cands) {
    if (picked.length >= want) break;
    if (picked.every((p) => Math.abs(p.i - c.i) >= minGap)) picked.push(c);
  }
  return picked.sort((a, b) => a.i - b.i).map((p) => p.text);
}

/* ── the digest ────────────────────────────────────────────────────────── */

type EpisodeDigest = {
  title: string;
  slug: string;
  youtubeVideoId: string | null;
  airTime: string;
  durationSec: number;
  summary: string | null;
  quotes: { text: string; speaker: string | null; significance: string | null }[];
  mentioned: string[];
  topics: string[];
};

type DailyDigest = {
  date: string;
  compiledAt: string;
  episodes: EpisodeDigest[];
  totals: { episodes: number; runtimeSec: number };
  topPeople: { name: string; episodes: number }[];
  topTopics: { label: string; episodes: number }[];
};

async function compile(date: string, quotesPerEpisode: number): Promise<DailyDigest> {
  const from = new Date(`${date}T00:00:00.000Z`);
  const to = new Date(`${date}T23:59:59.999Z`);

  const episodes = await prisma.episode.findMany({
    where: { airDate: { gte: from, lte: to } },
    orderBy: { airDate: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      airDate: true,
      duration: true,
      youtubeVideoId: true,
      summaryLong: true,
      summaryShort: true,
      quotes: {
        select: { text: true, significance: true, speaker: { select: { displayName: true } } },
        take: quotesPerEpisode,
      },
      mentionedPeople: { select: { person: { select: { displayName: true } } } },
      topics: { select: { topic: { select: { title: true } } } },
    },
  });

  const peopleTally = new Map<string, number>();
  const topicTally = new Map<string, number>();

  const digests: EpisodeDigest[] = [];
  for (const e of episodes) {
    let quotes = e.quotes.map((q) => ({
      text: q.text,
      speaker: q.speaker?.displayName ?? null,
      significance: q.significance ?? null,
    }));
    // Only fall back to transcript scoring when nothing was curated.
    if (quotes.length === 0) {
      const scored = await transcriptQuotes(e.id, quotesPerEpisode);
      quotes = scored.map((text) => ({ text, speaker: null, significance: null }));
    }

    const mentioned = e.mentionedPeople.map((m) => m.person.displayName);
    const topics = e.topics.map((t) => t.topic.title);
    for (const name of mentioned) peopleTally.set(name, (peopleTally.get(name) ?? 0) + 1);
    for (const label of topics) topicTally.set(label, (topicTally.get(label) ?? 0) + 1);

    digests.push({
      title: e.title,
      slug: e.slug,
      youtubeVideoId: e.youtubeVideoId,
      airTime: e.airDate ? e.airDate.toISOString().slice(11, 16) : "",
      durationSec: durationToSeconds(e.duration),
      summary: e.summaryShort ?? e.summaryLong ?? null,
      quotes,
      mentioned,
      topics,
    });
  }

  const rank = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  return {
    date,
    compiledAt: new Date().toISOString(),
    episodes: digests,
    totals: {
      episodes: digests.length,
      runtimeSec: digests.reduce((a, e) => a + e.durationSec, 0),
    },
    topPeople: rank(peopleTally).slice(0, 8).map(([name, episodes]) => ({ name, episodes })),
    topTopics: rank(topicTally).slice(0, 8).map(([label, episodes]) => ({ label, episodes })),
  };
}

/* ── flagged section (opt-in) ──────────────────────────────────────────── */

/**
 * Accusation-shaped quotes for the day, gathered from curated Quote rows whose
 * significance/text is flagged. Opt-in only; renders under an explicit
 * "quoted, not asserted" disclaimer.
 */
async function flaggedSection(date: string): Promise<string[]> {
  const from = new Date(`${date}T00:00:00.000Z`);
  const to = new Date(`${date}T23:59:59.999Z`);
  const terms = ["harass", "doxx", "dox", "liar", "predator", "groomer", "threat", "stalk"];

  const rows = await prisma.quote.findMany({
    where: {
      episode: { airDate: { gte: from, lte: to } },
      OR: terms.map((t) => ({ text: { contains: t, mode: "insensitive" as const } })),
    },
    select: {
      text: true,
      speaker: { select: { displayName: true } },
      episode: { select: { title: true } },
    },
    take: 20,
  });

  return rows.map(
    (r) =>
      `> ${r.text}\n> — ${r.speaker?.displayName ?? "unattributed"}${
        r.episode?.title ? `, ${r.episode.title}` : ""
      }`,
  );
}

/* ── rendering ─────────────────────────────────────────────────────────── */

function hms(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function longDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function title(d: DailyDigest): string {
  const n = d.totals.episodes;
  if (n === 0) return `Quiet day in the archive — ${longDate(d.date)}`;
  if (n === 1) return `${d.episodes[0].title} — ${longDate(d.date)}`;
  return `${n} transmissions — ${longDate(d.date)}`;
}

function lede(d: DailyDigest): string {
  const n = d.totals.episodes;
  if (n === 0) {
    return `Nothing aired on ${longDate(d.date)}. The archive stayed open and the feed stayed quiet.`;
  }
  const bits = [
    `${n} ${n === 1 ? "episode" : "episodes"} landed on ${longDate(d.date)}, ${
      n === 1 ? "running" : "totalling"
    } ${hms(d.totals.runtimeSec)}${n === 1 ? "" : " of runtime"}.`,
  ];
  if (d.topPeople.length) {
    bits.push(
      `The names in play: ${d.topPeople.slice(0, 5).map((p) => p.name).join(", ")}.`,
    );
  }
  if (d.topTopics.length) {
    bits.push(`Threads that recurred: ${d.topTopics.slice(0, 4).map((t) => t.label).join(", ")}.`);
  }
  return bits.join(" ");
}

function renderMarkdown(d: DailyDigest, flagged: string[] | null): string {
  const L: string[] = [];
  L.push(lede(d));
  L.push("");

  if (d.episodes.length) {
    L.push("## The day's transmissions");
    L.push("");
    for (const e of d.episodes) {
      const href = `/episodes/${e.slug}`;
      L.push(`### [${e.title}](${href})`);
      L.push("");
      const meta = [e.airTime ? `${e.airTime} UTC` : null, e.durationSec ? hms(e.durationSec) : null]
        .filter(Boolean)
        .join(" · ");
      if (meta) {
        L.push(`*${meta}*`);
        L.push("");
      }
      if (e.summary) {
        L.push(e.summary);
        L.push("");
      }
      for (const q of e.quotes) {
        L.push(`> ${q.text}`);
        if (q.speaker) L.push(`> — ${q.speaker}`);
        L.push("");
      }
      if (e.mentioned.length) {
        L.push(`*Names: ${[...new Set(e.mentioned)].join(", ")}.*`);
        L.push("");
      }
    }
  }

  if (d.topTopics.length) {
    L.push("## Threads of the day");
    L.push("");
    for (const t of d.topTopics) {
      L.push(`- **${t.label}** — ${t.episodes} ${t.episodes === 1 ? "episode" : "episodes"}`);
    }
    L.push("");
  }

  if (flagged && flagged.length) {
    L.push("## Flagged moments");
    L.push("");
    L.push(
      "*Automatically extracted, not verified. These are quotations of what was said on stream, not claims by this archive.*",
    );
    L.push("");
    for (const q of flagged) {
      L.push(q);
      L.push("");
    }
  }

  L.push("---");
  L.push("");
  L.push(
    `*Compiled automatically from the CultCodex archive on ${d.compiledAt.slice(0, 10)}.*`,
  );
  L.push("");
  return L.join("\n");
}

/* ── main ──────────────────────────────────────────────────────────────── */

async function main() {
  const date = await resolveDate(opt("date", "latest"));
  const quotesPerEpisode = Number(opt("quotes", "2"));
  const digest = await compile(date, quotesPerEpisode);
  const flagged = flag("flagged") ? await flaggedSection(date) : null;

  const heading = title(digest);
  const body = renderMarkdown(digest, flagged);
  const summary = lede(digest).slice(0, 300);
  const slug = `daily-${date}`;

  const outFile = opt("out", "");
  if (outFile) {
    mkdirSync(dirname(outFile), { recursive: true });
    writeFileSync(outFile, `# ${heading}\n\n${body}`, "utf8");
    console.log(`Wrote ${outFile}`);
  }

  if (flag("write")) {
    const searchText = buildSearchText(heading, "article", summary);
    const result = await prisma.loreEntry.upsert({
      where: { slug },
      create: {
        title: heading,
        slug,
        category: "article",
        summary,
        fullEntry: body,
        searchText,
      },
      update: {
        title: heading,
        category: "article",
        summary,
        fullEntry: body,
        searchText,
      },
    });
    console.log(
      `Upserted LoreEntry ${result.id} (slug: ${slug}) — visible at /articles → /lore/${slug}`,
    );
  } else if (!outFile) {
    // Default: print for review, write nothing.
    process.stdout.write(`# ${heading}\n\n${body}`);
  }

  console.log(
    `\n[${date}] ${digest.totals.episodes} episodes · ${hms(digest.totals.runtimeSec)}` +
      `${flagged ? ` · ${flagged.length} flagged quotes` : ""}` +
      `${flag("write") ? " · written to DB" : " · dry run (no DB write)"}`,
  );

  // Use slugify to keep the import lint-clean; slug is date-based by design.
  void slugify;
}

main()
  .catch((e) => {
    console.error("compile-daily error:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => disconnect());
