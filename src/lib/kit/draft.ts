/**
 * Transmission Kit draft: turns a replay's captions into a first-draft kit
 * (chapters, clip moments, description, Shorts hooks) for a human to edit.
 * Pure helpers only; the Claude call and file IO live in scripts/kit-draft.ts.
 */
import { z } from "zod/v4";

export interface CaptionSegment {
  startSec: number;
  text: string;
}

/**
 * youtube-transcript returns `offset` in milliseconds for the srv3 caption
 * format but in seconds for the classic format, under the same field name.
 * No real stream is 100,000 seconds (27h) long, so anything past that is ms.
 */
export function segmentsFromYouTube(raw: { offset: number; text: string }[]): CaptionSegment[] {
  const isMs = raw.some((s) => s.offset > 100_000);
  return raw
    .map((s) => ({ startSec: isMs ? s.offset / 1000 : s.offset, text: s.text.trim() }))
    .filter((s) => s.text);
}

/** Parses an .srt file (Rumble, Twitch and most editors export these). */
export function parseSrt(srt: string): CaptionSegment[] {
  const segments: CaptionSegment[] = [];
  for (const block of srt.replace(/\r/g, "").split(/\n\s*\n/)) {
    const lines = block.trim().split("\n");
    const timeIdx = lines.findIndex((l) => l.includes("-->"));
    if (timeIdx === -1) continue;
    const m = lines[timeIdx].match(/(\d+):(\d{2}):(\d{2})[,.](\d{1,3})/);
    if (!m) continue;
    const text = lines.slice(timeIdx + 1).join(" ").replace(/<[^>]+>/g, "").trim();
    if (!text) continue;
    segments.push({ startSec: +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4].padEnd(3, "0") / 1000, text });
  }
  return segments;
}

/** YouTube chapter style: 0:00, 4:12, 1:02:03. */
export function formatTimestamp(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/**
 * Joins captions into ~blockSec-second lines prefixed with their start time.
 * Fewer, longer lines cut the timestamp overhead on a 3-hour transcript while
 * keeping enough resolution to place chapters and clips.
 */
export function formatTranscript(segments: CaptionSegment[], blockSec = 30): string {
  const lines: string[] = [];
  let blockStart = -Infinity;
  let parts: string[] = [];
  const flush = () => {
    if (parts.length) lines.push(`[${formatTimestamp(blockStart)}] ${parts.join(" ")}`);
    parts = [];
  };
  for (const seg of segments) {
    if (seg.startSec - blockStart >= blockSec) {
      flush();
      blockStart = seg.startSec;
    }
    parts.push(seg.text);
  }
  flush();
  return lines.join("\n");
}

export function youtubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host !== "youtube.com") return null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const m = u.pathname.match(/^\/(?:live|shorts|embed)\/([\w-]{6,})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// Times come back as whole seconds so formatting and range checks stay in code.
export const KitDraftSchema = z.object({
  chapters: z.array(z.object({ startSec: z.number().int(), title: z.string() })),
  clips: z.array(
    z.object({ startSec: z.number().int(), endSec: z.number().int(), title: z.string(), why: z.string() }),
  ),
  description: z.string(),
  tags: z.array(z.string()),
  hooks: z.array(z.object({ hook: z.string(), clipStartSec: z.number().int() })),
});

export type KitDraft = z.infer<typeof KitDraftSchema>;

export const DRAFT_SYSTEM_PROMPT = `You help tarot, astrology and occult live streamers repurpose their replays. You read a timestamped transcript of one live stream and draft a "Transmission Kit" the streamer will paste into YouTube and use to cut Shorts. A human editor reviews your draft before it goes to the streamer, so be concrete and point at real moments rather than hedging.

Each transcript line starts with [h:mm:ss], the time that block of speech begins. All times you return are whole seconds from the start of the stream, taken from those markers.

Draft:
- chapters: 8 to 15 YouTube chapters covering the whole stream in order. The first starts at 0. Titles are short (under 60 characters), specific to what happens ("Pile 2: Queen of Cups and the friendship question"), and written the way a viewer would search.
- clips: the 10 strongest standalone moments, 20 to 90 seconds each. Favor a clear take, a quotable line, a funny exchange, a reading with a payoff, or a teaching moment a beginner would search for. "why" says in one sentence what makes it work as a clip.
- description: a YouTube description of 80 to 150 words that says what was covered in plain language, mentions the specific cards, signs or topics discussed, and ends with 4 to 6 relevant hashtags on their own line. No chapter list; that is added separately.
- tags: 10 to 15 YouTube search tags.
- hooks: 5 opening lines for Shorts, each under 15 words, each tied to one of your clips by its start time. A hook is what the Short opens on, so it should make someone stop scrolling.

Write in the streamer's voice where you can, using words they actually say. Don't invent readings, cards, guests or claims that aren't in the transcript. Captions are auto-generated, so fix obvious mis-hearings of card names and astrology terms when the meaning is clear.`;

/**
 * Makes the model's timestamps safe to paste: sorted, inside the stream,
 * first chapter at 0:00 and chapters at least 10 seconds apart (YouTube's rules).
 */
export function tidyDraft(draft: KitDraft, durationSec: number): KitDraft {
  const clamp = (n: number) => Math.min(Math.max(0, Math.round(n)), Math.floor(durationSec));
  const chapters: KitDraft["chapters"] = [];
  for (const c of [...draft.chapters].sort((a, b) => a.startSec - b.startSec)) {
    const startSec = chapters.length === 0 ? 0 : clamp(c.startSec);
    const prev = chapters[chapters.length - 1];
    if (prev && startSec - prev.startSec < 10) continue;
    chapters.push({ startSec, title: c.title.trim() });
  }
  const clips = draft.clips
    .map((c) => ({ ...c, startSec: clamp(c.startSec), endSec: clamp(c.endSec) }))
    .filter((c) => c.endSec > c.startSec)
    .sort((a, b) => a.startSec - b.startSec);
  const hooks = draft.hooks.map((h) => ({ ...h, clipStartSec: clamp(h.clipStartSec) }));
  return { ...draft, chapters, clips, hooks };
}

export interface DraftMeta {
  source: string;
  durationSec: number;
  generatedAt: Date;
}

/** Markdown the owner edits and pastes into the delivery email. */
export function renderDraftMarkdown(draft: KitDraft, meta: DraftMeta): string {
  const out: string[] = [
    `# Transmission Kit draft`,
    ``,
    `Source: ${meta.source}`,
    `Length: ${formatTimestamp(meta.durationSec)} · Drafted ${meta.generatedAt.toISOString().slice(0, 10)} · REVIEW BEFORE SENDING`,
    ``,
    `## Chapters (paste into the YouTube description)`,
    ``,
    ...draft.chapters.map((c) => `${formatTimestamp(c.startSec)} ${c.title}`),
    ``,
    `## Clip moments`,
    ``,
    ...draft.clips.flatMap((c, i) => [
      `${i + 1}. **${c.title}** (${formatTimestamp(c.startSec)} → ${formatTimestamp(c.endSec)})`,
      `   ${c.why}`,
    ]),
    ``,
    `## Description`,
    ``,
    draft.description.trim(),
    ``,
    `## Tags`,
    ``,
    draft.tags.join(", "),
    ``,
    `## Shorts hooks`,
    ``,
    ...draft.hooks.map((h) => `- "${h.hook}" (clip at ${formatTimestamp(h.clipStartSec)})`),
    ``,
  ];
  return out.join("\n");
}
