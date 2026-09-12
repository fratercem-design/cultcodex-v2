/**
 * Transcript segments arrive as raw YouTube caption cues: ~31 characters and
 * ~4 seconds each, frequently breaking mid-word. A long episode is 12,000+ of
 * them, and rendering one row per cue is what makes an episode page an 85,000
 * node document.
 *
 * Grouping cues into paragraph-sized blocks keeps every word in the
 * server-rendered HTML — the transcript is the archive's SEO engine and must
 * stay fully indexable — while cutting the row count roughly tenfold. It also
 * gives Google (and readers) sentences instead of fragments.
 */

export interface GroupableSegment {
  id: string;
  startSeconds: number;
  endSeconds: number;
  speakerLabel: string | null;
  text: string;
}

export interface TranscriptBlock {
  /** id of the first cue in the block — stable across renders. */
  id: string;
  startSeconds: number;
  endSeconds: number;
  speakerLabel: string | null;
  text: string;
  /** Start times of every cue folded in, for signal-map lookups. */
  cueStarts: number[];
}

export interface GroupOptions {
  /** Close a block once it spans this many seconds. */
  maxDurationSeconds?: number;
  /** Hard ceiling so a gapless monologue can't produce one giant block. */
  maxChars?: number;
  /** A silence at least this long ends the block early. */
  gapSeconds?: number;
}

const DEFAULTS = {
  maxDurationSeconds: 25,
  maxChars: 900,
  gapSeconds: 3,
} satisfies Required<GroupOptions>;

/**
 * Fold consecutive cues into blocks. Pure and order-preserving: the
 * concatenated text of all blocks equals the concatenated text of all input
 * segments, so nothing indexable is lost.
 */
export function groupSegments(
  segments: readonly GroupableSegment[],
  options: GroupOptions = {}
): TranscriptBlock[] {
  const { maxDurationSeconds, maxChars, gapSeconds } = { ...DEFAULTS, ...options };

  const blocks: TranscriptBlock[] = [];
  let current: TranscriptBlock | null = null;

  for (const seg of segments) {
    const text = seg.text.trim();
    if (!text) continue;

    const speakerChanged = current !== null && current.speakerLabel !== seg.speakerLabel;
    const tooLong = current !== null && seg.endSeconds - current.startSeconds >= maxDurationSeconds;
    const tooBig = current !== null && current.text.length + text.length + 1 > maxChars;
    // Guard against a malformed row (endSeconds behind startSeconds) producing
    // a negative gap that silently suppresses the break.
    const gap = current === null ? 0 : seg.startSeconds - current.endSeconds;
    const silence = current !== null && gap >= gapSeconds;

    if (current === null || speakerChanged || tooLong || tooBig || silence) {
      current = {
        id: seg.id,
        startSeconds: seg.startSeconds,
        endSeconds: seg.endSeconds,
        speakerLabel: seg.speakerLabel,
        text,
        cueStarts: [seg.startSeconds],
      };
      blocks.push(current);
      continue;
    }

    current.text = `${current.text} ${text}`;
    current.endSeconds = Math.max(current.endSeconds, seg.endSeconds);
    current.cueStarts.push(seg.startSeconds);
  }

  return blocks;
}
