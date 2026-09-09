/**
 * renderWithTimestamps
 *
 * Parses inline timestamp markers ([MM:SS] or [H:MM:SS]) in an AI summary
 * string and returns an array of React nodes where each marker is replaced
 * with either:
 *   - A clickable <a> that opens the YouTube video at that position (when
 *     youtubeVideoId is provided), or
 *   - A styled <span> so the timestamp is still visually distinct (fallback).
 *
 * The timestamp format produced by the enrichment prompt is [MM:SS] or
 * [H:MM:SS] / [HH:MM:SS]. Both are matched.
 *
 * Usage:
 *   <p>{renderWithTimestamps(episode.summaryLong, episode.youtubeVideoId)}</p>
 */

import type { ReactNode } from "react";

/** Matches [MM:SS] and [H:MM:SS] / [HH:MM:SS] */
const TIMESTAMP_RE = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;

/**
 * Convert a "MM:SS" or "H:MM:SS" string to total seconds.
 */
function toSeconds(ts: string): number {
  const parts = ts.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parts[0] * 60 + parts[1];
}

/**
 * Return React nodes with timestamp markers converted to interactive links.
 *
 * @param text          The AI-generated summary text (may contain [MM:SS] markers).
 * @param youtubeVideoId  The episode's YouTube video ID (optional).
 */
export function renderWithTimestamps(
  text: string,
  youtubeVideoId?: string | null
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state (global regex keeps lastIndex between calls).
  TIMESTAMP_RE.lastIndex = 0;

  while ((match = TIMESTAMP_RE.exec(text)) !== null) {
    // Capture plain text before this marker
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const ts = match[1];
    const seconds = toSeconds(ts);
    const key = `ts-${match.index}`;

    if (youtubeVideoId) {
      nodes.push(
        <a
          key={key}
          href={`https://www.youtube.com/watch?v=${youtubeVideoId}&t=${seconds}s`}
          target="_blank"
          rel="noopener noreferrer"
          title={`Jump to ${ts} on YouTube`}
          className="mx-0.5 inline-flex items-center rounded bg-accent-gold/10 border border-accent-gold/20 px-1 font-mono text-[11px] text-accent-gold-text hover:bg-accent-gold/20 hover:text-accent-gold-text transition-colors"
        >
          ▶ {ts}
        </a>
      );
    } else {
      // No video — render as a styled static badge
      nodes.push(
        <span
          key={key}
          title={`Timestamp: ${ts}`}
          className="mx-0.5 inline-flex items-center rounded bg-surface border border-border px-1 font-mono text-[11px] text-text-muted"
        >
          {ts}
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Trailing text after the last marker
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}
