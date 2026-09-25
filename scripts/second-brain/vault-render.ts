/**
 * Pure Markdown renderers for the transcript vault (an Obsidian "LLM wiki"
 * in the shape Karpathy describes: immutable raw sources + a linked wiki).
 * No DB or filesystem access here, so everything is unit-testable; the
 * exporter in export-transcript-vault.ts feeds these from Prisma.
 */
import { cleanTitle } from "../../src/lib/format/clean-title";
import { formatSeconds } from "../../src/lib/format/duration";

export interface VaultQuote {
  text: string;
  speakerId: string | null;
  timestampSeconds: number | null;
}

export interface VaultEpisode {
  id: string;
  title: string;
  slug: string;
  episodeNumber: number | null;
  airDate: Date | null;
  duration: string | null;
  youtubeVideoId: string | null;
  rumbleVideoId: string | null;
  contentType: string;
  seriesTitle: string | null;
  summaryShort: string | null;
  summaryLong: string | null;
  summaryFacts: string | null;
  summaryThemes: string | null;
  guestIds: string[];
  mentionedIds: string[];
  topicIds: string[];
  loreIds: string[];
  quotes: VaultQuote[];
  hasTranscript: boolean;
  /** Not in the database export: only a Rumble auto-caption file exists. */
  captionsOnly?: boolean;
}

export interface VaultPerson {
  id: string;
  displayName: string;
  altNames: string[];
  shortBio: string | null;
  loreSummary: string | null;
  personType: string;
}

export interface VaultTopic {
  id: string;
  title: string;
  description: string | null;
}

export interface VaultLore {
  id: string;
  title: string;
  category: string | null;
  summary: string | null;
  fullEntry: string | null;
  canonStatus: string;
}

export interface VaultSegment {
  startSeconds: number;
  speakerLabel: string | null;
  text: string;
}

/** Note names are filenames and wikilink targets, so they must be unique vault-wide. */
export interface NoteNames {
  episode: Map<string, string>;
  transcript: Map<string, string>;
  person: Map<string, string>;
  topic: Map<string, string>;
  lore: Map<string, string>;
}

// ─── Naming ──────────────────────────────────────────

/** Strips characters that break filenames or [[wikilinks]] on any OS. */
export function sanitizeNoteName(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|#^[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "")
    .slice(0, 120)
    .replace(/[\s.]+$/, "");
  return cleaned || "Untitled";
}

export function isoDate(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

export function assignNoteNames(
  episodes: VaultEpisode[],
  people: VaultPerson[],
  topics: VaultTopic[],
  lore: VaultLore[]
): NoteNames {
  // Case-insensitive: macOS and Windows filesystems treat "Foo" and "foo" as one file.
  const taken = new Set<string>();
  const claim = (base: string, kind: string): string => {
    for (let i = 1; ; i++) {
      const name = i === 1 ? base : i === 2 ? `${base} (${kind})` : `${base} (${kind} ${i - 1})`;
      if (!taken.has(name.toLowerCase())) {
        taken.add(name.toLowerCase());
        return name;
      }
    }
  };

  const names: NoteNames = {
    episode: new Map(),
    transcript: new Map(),
    person: new Map(),
    topic: new Map(),
    lore: new Map(),
  };
  // People first: they're linked most often, so they get the plain names.
  for (const p of people) names.person.set(p.id, claim(sanitizeNoteName(p.displayName), "person"));
  for (const l of lore) names.lore.set(l.id, claim(sanitizeNoteName(l.title), "lore"));
  for (const t of topics) names.topic.set(t.id, claim(sanitizeNoteName(t.title), "topic"));
  for (const e of episodes) {
    const base = sanitizeNoteName(`${isoDate(e.airDate) ?? "undated"} ${cleanTitle(e.title)}`);
    const name = claim(base, "episode");
    names.episode.set(e.id, name);
    names.transcript.set(e.id, claim(`${name} (transcript)`, "transcript"));
  }
  return names;
}

// ─── Helpers ─────────────────────────────────────────

export function youtubeUrl(videoId: string, seconds?: number): string {
  const base = `https://www.youtube.com/watch?v=${videoId}`;
  return seconds === undefined ? base : `${base}&t=${seconds}s`;
}

function link(name: string | undefined): string | null {
  return name ? `[[${name}]]` : null;
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function frontmatter(fields: Record<string, string | number | string[] | null | undefined>): string {
  const lines = ["---"];
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${key}:`);
      for (const v of value) lines.push(`  - ${yamlString(v)}`);
    } else if (typeof value === "number") {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: ${yamlString(value)}`);
    }
  }
  lines.push("---", "");
  return lines.join("\n");
}

function section(heading: string, body: string | null | undefined): string {
  const trimmed = body?.trim();
  return trimmed ? `## ${heading}\n\n${trimmed}\n\n` : "";
}

function linkList(ids: string[], names: Map<string, string>): string {
  return ids
    .map((id) => link(names.get(id)))
    .filter((l): l is string => l !== null)
    .map((l) => `- ${l}`)
    .join("\n");
}

function timestampLink(ep: VaultEpisode, seconds: number): string {
  const label = formatSeconds(seconds);
  if (ep.youtubeVideoId) return `[${label}](${youtubeUrl(ep.youtubeVideoId, seconds)})`;
  if (ep.rumbleVideoId) return `[${label}](https://rumble.com/${ep.rumbleVideoId}?start=${seconds})`;
  return label;
}

function byAirDate(a: VaultEpisode, b: VaultEpisode): number {
  return (a.airDate?.getTime() ?? 0) - (b.airDate?.getTime() ?? 0);
}

// ─── Notes ───────────────────────────────────────────

/** Paragraph break when the speaker changes or this many seconds have passed. */
const PARAGRAPH_SECONDS = 60;

export function renderTranscript(
  ep: VaultEpisode,
  names: NoteNames,
  segments: VaultSegment[],
  transcriptRaw: string | null
): string {
  const head = frontmatter({
    type: "transcript",
    episode: `[[${names.episode.get(ep.id)}]]`,
    date: isoDate(ep.airDate),
    youtube: ep.youtubeVideoId ? youtubeUrl(ep.youtubeVideoId) : null,
    rumble: ep.rumbleVideoId ? `https://rumble.com/${ep.rumbleVideoId}` : null,
    tags: ["transcript"],
  });
  const title = `# ${cleanTitle(ep.title)} (transcript)\n\nEpisode notes: [[${names.episode.get(ep.id)}]]\n\n`;

  if (segments.length === 0) {
    return `${head}${title}${(transcriptRaw ?? "").trim()}\n`;
  }

  const paragraphs: string[] = [];
  let current: { start: number; speaker: string | null; texts: string[] } | null = null;
  const flush = () => {
    if (!current) return;
    const speaker = current.speaker ? `${current.speaker}: ` : "";
    paragraphs.push(`**${timestampLink(ep, current.start)}** ${speaker}${current.texts.join(" ")}`);
  };
  for (const seg of segments) {
    const text = seg.text.replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (
      !current ||
      seg.speakerLabel !== current.speaker ||
      seg.startSeconds - current.start >= PARAGRAPH_SECONDS
    ) {
      flush();
      current = { start: seg.startSeconds, speaker: seg.speakerLabel, texts: [] };
    }
    current.texts.push(text);
  }
  flush();
  return `${head}${title}${paragraphs.join("\n\n")}\n`;
}

export function renderEpisode(ep: VaultEpisode, names: NoteNames): string {
  const watch = [
    ep.youtubeVideoId ? `[YouTube](${youtubeUrl(ep.youtubeVideoId)})` : null,
    ep.rumbleVideoId ? `[Rumble](https://rumble.com/${ep.rumbleVideoId})` : null,
  ].filter(Boolean);
  const meta = [
    ep.hasTranscript ? `**Transcript:** [[${names.transcript.get(ep.id)}]]` : "**Transcript:** none yet",
    watch.length ? `**Watch:** ${watch.join(" · ")}` : null,
    ep.captionsOnly
      ? "**Source:** Rumble auto-captions only. This stream isn't in the CultCodex export yet, so it has no summary, guests or topics."
      : null,
  ].filter(Boolean);

  const quotes = ep.quotes
    .map((q) => {
      const speaker = q.speakerId ? link(names.person.get(q.speakerId)) : null;
      const when = q.timestampSeconds !== null ? timestampLink(ep, q.timestampSeconds) : null;
      const cite = [speaker, when].filter(Boolean).join(" · ");
      return `> ${q.text.trim()}${cite ? `\n> — ${cite}` : ""}`;
    })
    .join("\n\n");

  return (
    frontmatter({
      type: "episode",
      episode: ep.episodeNumber,
      date: isoDate(ep.airDate),
      series: ep.seriesTitle,
      content_type: ep.contentType,
      duration: ep.duration,
      tags: ["episode", ep.contentType, ...(ep.captionsOnly ? ["captions-only"] : [])],
    }) +
    `# ${cleanTitle(ep.title)}\n\n` +
    (ep.summaryShort?.trim() ? `> ${ep.summaryShort.trim()}\n\n` : "") +
    `${meta.join("  \n")}\n\n` +
    section("Guests", linkList(ep.guestIds, names.person)) +
    section("Mentioned", linkList(ep.mentionedIds, names.person)) +
    section("Topics", linkList(ep.topicIds, names.topic)) +
    section("Lore", linkList(ep.loreIds, names.lore)) +
    section("Summary", ep.summaryLong) +
    section("What happened", ep.summaryFacts) +
    section("Themes", ep.summaryThemes) +
    section("Quotes", quotes)
  );
}

function episodeList(eps: VaultEpisode[], names: NoteNames): string {
  return [...eps]
    .sort(byAirDate)
    .map((e) => `- [[${names.episode.get(e.id)}]]`)
    .join("\n");
}

export function renderPerson(
  person: VaultPerson,
  names: NoteNames,
  episodes: VaultEpisode[]
): string {
  const guestOn = episodes.filter((e) => e.guestIds.includes(person.id));
  const mentionedIn = episodes.filter((e) => e.mentionedIds.includes(person.id));
  const quotes = [...episodes]
    .sort(byAirDate)
    .flatMap((e) =>
      e.quotes
        .filter((q) => q.speakerId === person.id)
        .map((q) => {
          const when = q.timestampSeconds !== null ? ` · ${timestampLink(e, q.timestampSeconds)}` : "";
          return `> ${q.text.trim()}\n> — [[${names.episode.get(e.id)}]]${when}`;
        })
    )
    .join("\n\n");

  return (
    frontmatter({
      type: "person",
      person_type: person.personType,
      aliases: person.altNames.filter((a) => a.trim() && a !== person.displayName),
      appearances: guestOn.length,
      mentions: mentionedIn.length,
      tags: ["person", person.personType],
    }) +
    `# ${person.displayName}\n\n` +
    (person.shortBio?.trim() ? `${person.shortBio.trim()}\n\n` : "") +
    section("In the lore", person.loreSummary) +
    section(`Appearances (${guestOn.length})`, episodeList(guestOn, names)) +
    section(`Mentioned in (${mentionedIn.length})`, episodeList(mentionedIn, names)) +
    section("Quotes", quotes)
  );
}

export function renderTopic(topic: VaultTopic, names: NoteNames, episodes: VaultEpisode[]): string {
  const eps = episodes.filter((e) => e.topicIds.includes(topic.id));
  return (
    frontmatter({ type: "topic", episodes: eps.length, tags: ["topic"] }) +
    `# ${topic.title}\n\n` +
    (topic.description?.trim() ? `${topic.description.trim()}\n\n` : "") +
    section(`Episodes (${eps.length})`, episodeList(eps, names))
  );
}

export function renderLore(lore: VaultLore, names: NoteNames, episodes: VaultEpisode[]): string {
  const eps = episodes.filter((e) => e.loreIds.includes(lore.id));
  return (
    frontmatter({
      type: "lore",
      category: lore.category,
      canon: lore.canonStatus,
      episodes: eps.length,
      tags: ["lore", lore.canonStatus],
    }) +
    `# ${lore.title}\n\n` +
    (lore.summary?.trim() ? `> ${lore.summary.trim()}\n\n` : "") +
    section("Entry", lore.fullEntry) +
    section(`Episodes (${eps.length})`, episodeList(eps, names))
  );
}

function oneLine(text: string | null, max = 140): string {
  const flat = (text ?? "").replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

/**
 * The catalog Claude reads first. `synthesis` lists the hand-grown notes
 * (wiki/concepts, wiki/analyses) found on disk, so the exporter can rebuild
 * this file without losing them.
 */
export function renderIndex(
  names: NoteNames,
  episodes: VaultEpisode[],
  people: VaultPerson[],
  topics: VaultTopic[],
  lore: VaultLore[],
  synthesis: { concepts: string[]; analyses: string[] }
): string {
  const appearances = new Map<string, number>();
  for (const e of episodes) {
    for (const id of [...e.guestIds, ...e.mentionedIds]) {
      appearances.set(id, (appearances.get(id) ?? 0) + 1);
    }
  }
  const peopleLines = [...people]
    .sort((a, b) => (appearances.get(b.id) ?? 0) - (appearances.get(a.id) ?? 0))
    .map((p) => `- [[${names.person.get(p.id)}]] (${appearances.get(p.id) ?? 0}) ${oneLine(p.shortBio, 100)}`.trimEnd());

  const byYear = new Map<string, VaultEpisode[]>();
  for (const e of [...episodes].sort(byAirDate).reverse()) {
    const year = e.airDate ? String(e.airDate.getUTCFullYear()) : "Undated";
    byYear.set(year, [...(byYear.get(year) ?? []), e]);
  }
  const episodeSections = [...byYear.entries()]
    .map(
      ([year, eps]) =>
        `### ${year}\n\n` +
        eps
          .map((e) => `- [[${names.episode.get(e.id)}]] ${oneLine(e.summaryShort)}`.trimEnd())
          .join("\n")
    )
    .join("\n\n");

  const wikiLinks = (list: string[]) => list.map((n) => `- [[${n}]]`).join("\n") || "_None yet._";

  return (
    `# Index\n\n` +
    `Generated by \`npm run brain:export\`. Read this first, then open the notes you need. ` +
    `${episodes.length} episodes · ${people.length} people · ${topics.length} topics · ${lore.length} lore entries.\n\n` +
    `## Concepts\n\n${wikiLinks(synthesis.concepts)}\n\n` +
    `## Analyses\n\n${wikiLinks(synthesis.analyses)}\n\n` +
    `## People\n\n${peopleLines.join("\n")}\n\n` +
    `## Topics\n\n${[...topics].sort((a, b) => a.title.localeCompare(b.title)).map((t) => `- [[${names.topic.get(t.id)}]]`).join("\n")}\n\n` +
    `## Lore\n\n${[...lore].sort((a, b) => a.title.localeCompare(b.title)).map((l) => `- [[${names.lore.get(l.id)}]] ${oneLine(l.summary, 100)}`.trimEnd()).join("\n")}\n\n` +
    `## Episodes\n\n${episodeSections}\n`
  );
}
