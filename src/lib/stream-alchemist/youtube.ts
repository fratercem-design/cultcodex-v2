import { captionsToMs } from "@/lib/transcript/caption-units";
import { groupSegments } from "@/lib/transcript/group-segments";
import { formatTime } from "./transcript";

// Client-safe helpers for the YouTube import. The network fetch lives in
// youtube-fetch.ts so the browser bundle never pulls in the scraper.

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Accepts watch, youtu.be, /live/, /shorts/, /embed/ links, or a bare 11-character id. */
export function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (VIDEO_ID_RE.test(s)) return s;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id =
      url.pathname === "/watch"
        ? url.searchParams.get("v")
        : (url.pathname.match(/^\/(?:live|shorts|embed|v)\/([^/]+)/)?.[1] ?? null);
  }
  return id && VIDEO_ID_RE.test(id) ? id : null;
}

export interface CaptionChunk {
  text: string;
  offset: number;
  duration: number;
}

function toSeconds(chunks: CaptionChunk[]): Array<{ start: number; end: number; text: string }> {
  return captionsToMs(chunks).map((c) => ({ start: c.offset / 1000, end: (c.offset + c.duration) / 1000, text: c.text }));
}

/**
 * Turn caption cues (2–4 seconds, often mid-sentence) into "[m:ss] text"
 * lines of up to ~10 seconds, the format parseTranscript already reads.
 */
export function captionsToTranscript(chunks: CaptionChunk[]): string {
  const cues = toSeconds(chunks)
    .map((c, i) => ({
      id: String(i),
      startSeconds: c.start,
      endSeconds: c.end,
      speakerLabel: null,
      text: c.text.replace(/\s+/g, " ").trim(),
    }))
    .filter((c) => c.text);
  return groupSegments(cues, { maxDurationSeconds: 10, gapSeconds: 3 })
    .map((b) => `[${formatTime(b.startSeconds)}] ${b.text}`)
    .join("\n");
}
