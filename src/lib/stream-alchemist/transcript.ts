import type { ParsedTranscript, Segment } from "./types";

// Speaking rate used to estimate durations the transcript doesn't state.
export const WORDS_PER_SECOND = 2.5;

const TS = String.raw`(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?`;
const CUE_RE = new RegExp(String.raw`^\s*${TS}\s*-->\s*${TS}`);
// "[01:23] text", "(1:23) text", "00:01:23 - text", or a bare "0:04" on its own line.
const LEADING_TS_RE = new RegExp(String.raw`^\s*[\[(]?${TS}[\])]?\s*[-–—:|]?\s*(.*)$`);
// "Host (00:12:03): text" / "Speaker 1 [0:45] text"
const SPEAKER_BRACKET_TS_RE = new RegExp(String.raw`^\s*([^\[\(\d][^\[\(]{0,39}?)\s*[\[(]${TS}[\])]\s*:?\s*(.*)$`);
// Otter/Descript style header: "Speaker 1  0:03" with the paragraph on the next lines.
const SPEAKER_TRAILING_TS_RE = new RegExp(String.raw`^\s*([^\d\s].{0,39}?)\s+${TS}\s*$`);
const SKIP_RE = /^(WEBVTT|NOTE\b|Kind:|Language:|STYLE\b|REGION\b)/;

function toSeconds(h?: string, m?: string, s?: string, ms?: string): number {
  return (
    Number(h ?? 0) * 3600 +
    Number(m ?? 0) * 60 +
    Number(s ?? 0) +
    (ms ? Number(ms.padEnd(3, "0")) / 1000 : 0)
  );
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "") // VTT inline tags
    .replace(/[<>]/g, "") // leftovers from nested or broken tags, e.g. "<<b>script>"
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Split prose into sentences; unpunctuated runs are chunked so no piece is huge. */
export function splitSentences(text: string): string[] {
  const rough = text
    .split(/(?<=[.!?…])\s+(?=["'“‘(\[]?[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const sentence of rough) {
    const words = sentence.split(/\s+/);
    if (words.length <= 40) {
      out.push(sentence);
      continue;
    }
    for (let i = 0; i < words.length; i += 25) out.push(words.slice(i, i + 25).join(" "));
  }
  return out;
}

interface Draft {
  start: number | null;
  end: number | null;
  parts: string[];
}

export function parseTranscript(raw: string): ParsedTranscript {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  const drafts: Draft[] = [];
  let cur: Draft | null = null;
  let inCue = false;

  const flush = () => {
    if (cur && cur.parts.length) drafts.push(cur);
    cur = null;
    inCue = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (inCue) flush();
      continue;
    }
    if (SKIP_RE.test(line)) continue;
    // SRT cue index: a bare integer directly above a cue line.
    if (/^\d+$/.test(line) && CUE_RE.test(lines[i + 1] ?? "")) continue;

    const cue = line.match(CUE_RE);
    if (cue) {
      flush();
      cur = {
        start: toSeconds(cue[1], cue[2], cue[3], cue[4]),
        end: toSeconds(cue[5], cue[6], cue[7], cue[8]),
        parts: [],
      };
      inCue = true;
      continue;
    }

    const speaker = line.match(SPEAKER_BRACKET_TS_RE);
    const leading = speaker ? null : line.match(LEADING_TS_RE);
    const header = speaker || leading ? null : line.match(SPEAKER_TRAILING_TS_RE);
    if (speaker || leading || header) {
      flush();
      let start: number;
      let rest = "";
      if (speaker) {
        start = toSeconds(speaker[2], speaker[3], speaker[4], speaker[5]);
        rest = speaker[6];
      } else if (leading) {
        start = toSeconds(leading[1], leading[2], leading[3], leading[4]);
        rest = leading[5];
      } else {
        start = toSeconds(header![2], header![3], header![4], header![5]);
      }
      cur = { start, end: null, parts: [] };
      const text = cleanText(rest);
      if (text) cur.parts.push(text);
      continue;
    }

    const text = cleanText(line);
    if (!text) continue;
    if (cur) cur.parts.push(text);
    else drafts.push({ start: null, end: null, parts: [text] });
  }
  flush();

  // Merge identical consecutive cues (YouTube auto-captions repeat rolling lines).
  const merged: Segment[] = [];
  for (const d of drafts) {
    const text = d.parts.join(" ");
    const prev = merged[merged.length - 1];
    if (prev && prev.text === text) {
      prev.end = d.end ?? prev.end;
      continue;
    }
    merged.push({ start: d.start, end: d.end, text });
  }

  const timedCount = merged.filter((s) => s.start !== null).length;
  const hasTimestamps = timedCount >= 2;

  let segments: Segment[];
  if (!hasTimestamps) {
    const prose = merged.map((s) => s.text).join(" ");
    segments = splitSentences(prose).map((text) => ({ start: null, end: null, text }));
  } else {
    // Fill missing ends from the next timed segment, or estimate from word count.
    for (let i = 0; i < merged.length; i++) {
      const seg = merged[i];
      if (seg.start === null || seg.end !== null) continue;
      const next = merged.slice(i + 1).find((s) => s.start !== null && s.start > seg.start!);
      seg.end = next?.start ?? seg.start + Math.max(2, countWords(seg.text) / WORDS_PER_SECOND);
    }
    // Long timed paragraphs become sentence-level segments with interpolated times,
    // so clip boundaries can land mid-paragraph.
    segments = [];
    for (const seg of merged) {
      const sentences = splitSentences(seg.text);
      if (seg.start === null || seg.end === null || sentences.length < 2 || countWords(seg.text) < 30) {
        segments.push(seg);
        continue;
      }
      const total = countWords(seg.text);
      const span = seg.end - seg.start;
      let cursor = seg.start;
      for (const s of sentences) {
        const len = (countWords(s) / total) * span;
        segments.push({ start: round1(cursor), end: round1(cursor + len), text: s });
        cursor += len;
      }
    }
  }

  return {
    segments,
    hasTimestamps,
    wordCount: segments.reduce((n, s) => n + countWords(s.text), 0),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** 83 → "1:23", 3723 → "1:02:03". */
export function formatTime(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return "";
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
