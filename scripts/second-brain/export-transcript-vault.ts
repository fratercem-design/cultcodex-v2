/**
 * Exports every published episode transcript (plus the local Rumble caption
 * files, see rumble-srt.ts) and the people, topics and lore
 * they link to, into an Obsidian vault Claude Code can read as an "LLM wiki".
 *
 *   npm run brain:export                      # -> second-brain/transcripts-vault
 *   npm run brain:export -- --out ~/CultBrain # anywhere else
 *
 * Re-running is safe and incremental: unchanged files aren't rewritten, notes
 * for removed records are pruned, and wiki/concepts + wiki/analyses (the parts
 * Claude writes) are never touched. New episodes are listed in log.md so the
 * vault's /ingest command knows what to read.
 */
import * as fs from "fs";
import * as path from "path";
import { getPrisma, disconnect } from "../ingest/lib";
import { parseIndex, parseSrt } from "../ops/rumble-transcripts";
import { planRumbleTranscripts } from "./rumble-srt";
import {
  assignNoteNames,
  renderEpisode,
  renderIndex,
  renderLore,
  renderPerson,
  renderTopic,
  renderTranscript,
  type VaultEpisode,
} from "./vault-render";

const REPO_ROOT = path.resolve(__dirname, "../..");
const TEMPLATE_DIR = path.join(REPO_ROOT, "second-brain/transcripts-template");
const DEFAULT_OUT = path.join(REPO_ROOT, "second-brain/transcripts-vault");
const RUMBLE_DIR = path.join(REPO_ROOT, "scripts/ingest/data/rumble-transcripts");

/** Folders the exporter owns: rebuilt every run, stale notes deleted. */
const OWNED = {
  transcripts: "raw/transcripts",
  episodes: "wiki/episodes",
  people: "wiki/people",
  topics: "wiki/topics",
  lore: "wiki/lore",
};

function parseOut(): string {
  const i = process.argv.indexOf("--out");
  const raw = i >= 0 ? process.argv[i + 1] : undefined;
  if (!raw) return DEFAULT_OUT;
  return path.resolve(raw.replace(/^~(?=$|\/)/, process.env.HOME ?? "~"));
}

/** Copies the vault template (CLAUDE.md, .obsidian, .claude) without overwriting anything. */
function copyTemplate(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyTemplate(from, to);
    else if (!fs.existsSync(to)) fs.copyFileSync(from, to);
  }
}

let written = 0;
function writeIfChanged(file: string, content: string): void {
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === content) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  written++;
}

function listNotes(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.slice(0, -3))
    .sort();
}

async function main() {
  const out = parseOut();
  const p = getPrisma();
  console.log(`Exporting transcript vault to ${out}`);

  const rows = await p.episode.findMany({
    where: { status: { in: ["published", "unavailable"] } },
    orderBy: [{ airDate: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      episodeNumber: true,
      airDate: true,
      duration: true,
      youtubeVideoId: true,
      rumbleVideoId: true,
      contentType: true,
      summaryShort: true,
      summaryLong: true,
      summaryFacts: true,
      summaryThemes: true,
      series: { select: { title: true } },
      guests: { select: { personId: true } },
      mentionedPeople: { select: { personId: true } },
      topics: { select: { topicId: true } },
      loreEntries: { select: { loreEntryId: true } },
      quotes: {
        select: { text: true, speakerPersonId: true, timestampSeconds: true },
        orderBy: { timestampSeconds: "asc" },
      },
      _count: { select: { segments: true } },
    },
  });
  // transcriptRaw is large, so only fetch it for episodes that have no segments.
  const rawOnly = await p.episode.findMany({
    where: {
      id: { in: rows.filter((r) => r._count.segments === 0).map((r) => r.id) },
      transcriptRaw: { not: null },
      NOT: { transcriptRaw: "" },
    },
    select: { id: true },
  });
  const hasRaw = new Set(rawOnly.map((r) => r.id));

  const episodes: VaultEpisode[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    episodeNumber: r.episodeNumber,
    airDate: r.airDate,
    duration: r.duration,
    youtubeVideoId: r.youtubeVideoId,
    rumbleVideoId: r.rumbleVideoId,
    contentType: r.contentType,
    seriesTitle: r.series?.title ?? null,
    summaryShort: r.summaryShort,
    summaryLong: r.summaryLong,
    summaryFacts: r.summaryFacts,
    summaryThemes: r.summaryThemes,
    guestIds: r.guests.map((g) => g.personId),
    mentionedIds: r.mentionedPeople.map((m) => m.personId),
    topicIds: r.topics.map((t) => t.topicId),
    loreIds: r.loreEntries.map((l) => l.loreEntryId),
    quotes: r.quotes.map((q) => ({
      text: q.text,
      speakerId: q.speakerPersonId,
      timestampSeconds: q.timestampSeconds,
    })),
    hasTranscript: r._count.segments > 0 || hasRaw.has(r.id),
  }));

  const rumble = planRumbleTranscripts(
    parseIndex(fs.readFileSync(path.join(RUMBLE_DIR, "index.csv"), "utf8")),
    episodes
  );
  episodes.push(...rumble.standalone);
  console.log(
    `Rumble captions: ${rumble.attach.size} fill missing transcripts, ${rumble.standalone.length} caption-only streams, ` +
      `${rumble.skipped} already covered by the database`
  );

  const personIds = new Set(
    episodes.flatMap((e) => [
      ...e.guestIds,
      ...e.mentionedIds,
      ...e.quotes.map((q) => q.speakerId).filter((id): id is string => id !== null),
    ])
  );
  const topicIds = new Set(episodes.flatMap((e) => e.topicIds));
  const [people, topics, lore] = await Promise.all([
    p.person.findMany({
      where: { id: { in: [...personIds] } },
      orderBy: { displayName: "asc" },
      select: { id: true, displayName: true, altNames: true, shortBio: true, loreSummary: true, personType: true },
    }),
    p.topic.findMany({
      where: { id: { in: [...topicIds] } },
      orderBy: { title: "asc" },
      select: { id: true, title: true, description: true },
    }),
    p.loreEntry.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, category: true, summary: true, fullEntry: true, canonStatus: true },
    }),
  ]);

  const names = assignNoteNames(episodes, people, topics, lore);
  const known = new Set(listNotes(path.join(out, OWNED.episodes)));
  const firstRun = known.size === 0;
  const keep: Record<keyof typeof OWNED, Set<string>> = {
    transcripts: new Set(),
    episodes: new Set(),
    people: new Set(),
    topics: new Set(),
    lore: new Set(),
  };
  const emit = (kind: keyof typeof OWNED, name: string, content: string) => {
    keep[kind].add(name);
    writeIfChanged(path.join(out, OWNED[kind], `${name}.md`), content);
  };

  copyTemplate(TEMPLATE_DIR, out);

  // Transcripts: fetch segments a few episodes at a time to keep memory flat.
  const withTranscript = episodes.filter((e) => e.hasTranscript);
  const BATCH = 5;
  for (let i = 0; i < withTranscript.length; i += BATCH) {
    await Promise.all(
      withTranscript.slice(i, i + BATCH).map(async (ep) => {
        const srt = rumble.attach.get(ep.id) ?? rumble.standaloneFiles.get(ep.id);
        const segments = srt
          ? parseSrt(fs.readFileSync(path.join(RUMBLE_DIR, srt), "utf8")).map((s) => ({
              startSeconds: s.startSeconds,
              speakerLabel: null,
              text: s.text,
            }))
          : await p.transcriptSegment.findMany({
              where: { episodeId: ep.id },
              orderBy: { startSeconds: "asc" },
              select: { startSeconds: true, speakerLabel: true, text: true },
            });
        const raw = segments.length || srt
          ? null
          : (await p.episode.findUnique({ where: { id: ep.id }, select: { transcriptRaw: true } }))?.transcriptRaw ?? null;
        emit("transcripts", names.transcript.get(ep.id)!, renderTranscript(ep, names, segments, raw));
      })
    );
    process.stdout.write(`\r  transcripts ${Math.min(i + BATCH, withTranscript.length)}/${withTranscript.length}`);
  }
  process.stdout.write("\n");

  for (const ep of episodes) emit("episodes", names.episode.get(ep.id)!, renderEpisode(ep, names));
  for (const person of people) emit("people", names.person.get(person.id)!, renderPerson(person, names, episodes));
  for (const topic of topics) emit("topics", names.topic.get(topic.id)!, renderTopic(topic, names, episodes));
  for (const entry of lore) emit("lore", names.lore.get(entry.id)!, renderLore(entry, names, episodes));

  let pruned = 0;
  for (const kind of Object.keys(OWNED) as (keyof typeof OWNED)[]) {
    const dir = path.join(out, OWNED[kind]);
    for (const name of listNotes(dir)) {
      if (!keep[kind].has(name)) {
        fs.unlinkSync(path.join(dir, `${name}.md`));
        pruned++;
      }
    }
  }

  writeIfChanged(
    path.join(out, "index.md"),
    renderIndex(names, episodes, people, topics, lore, {
      concepts: listNotes(path.join(out, "wiki/concepts")),
      analyses: listNotes(path.join(out, "wiki/analyses")),
    })
  );

  const added = episodes.map((e) => names.episode.get(e.id)!).filter((n) => !known.has(n));
  const today = new Date().toISOString().slice(0, 10);
  const entry =
    `\n## [${today}] export | ${episodes.length} episodes, ${withTranscript.length} transcripts, ` +
    `${firstRun ? "first export" : `${added.length} new`}\n\n` +
    (firstRun || added.length === 0 ? "" : added.map((n) => `- [[${n}]]`).join("\n") + "\n");
  const logFile = path.join(out, "log.md");
  if (firstRun || added.length > 0) fs.appendFileSync(logFile, entry);

  console.log(
    `Done: ${episodes.length} episodes (${withTranscript.length} with transcripts), ${people.length} people, ` +
      `${topics.length} topics, ${lore.length} lore. ${written} files written, ${pruned} pruned, ` +
      `${firstRun ? "first export" : `${added.length} new episodes`}.`
  );
  await disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await disconnect();
  process.exit(1);
});
