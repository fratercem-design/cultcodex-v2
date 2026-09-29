/** One line (or cue) of a transcript. Times are seconds; null when the source had none. */
export interface Segment {
  start: number | null;
  end: number | null;
  text: string;
}

export interface ParsedTranscript {
  segments: Segment[];
  hasTimestamps: boolean;
  wordCount: number;
}

export interface Clip {
  rank: number;
  /** 0–100, relative strength within this transcript. */
  score: number;
  start: number | null;
  end: number | null;
  /** First words of the clip so an editor can find it with Ctrl-F when there are no timestamps. */
  excerpt: string;
  title: string;
  hook: string;
  shortsDescription: string;
  tiktokCaption: string;
  thumbnailText: string[];
  hashtags: string[];
  why: string[];
}

/** A clip hidden behind the paywall: enough to show it exists, not enough to use it. */
export interface LockedClip {
  rank: number;
  score: number;
  start: number | null;
  end: number | null;
}

export type AnalysisMode = "demo" | "ai";

export interface AnalysisResult {
  mode: AnalysisMode;
  hasTimestamps: boolean;
  clips: Clip[];
  locked: LockedClip[];
  /** Shown above results, e.g. when AI mode fell back to the demo engine. */
  notice?: string;
}
