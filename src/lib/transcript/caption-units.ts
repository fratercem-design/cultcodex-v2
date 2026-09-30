/**
 * youtube-transcript returns cue times in two units depending on which caption
 * format YouTube serves: milliseconds for srv3 (`<p t="ms" d="ms">`), seconds
 * for the classic format (`<text start="s" dur="s">`). Callers that always
 * divide by 1000 collapse a classic-format transcript into its first few
 * seconds.
 *
 * Real cues last a few seconds, so a median duration under 100 can only be
 * seconds. Returns the chunks with offset and duration in milliseconds.
 */
export function captionsToMs<T extends { offset: number; duration: number }>(chunks: readonly T[]): T[] {
  const durations = chunks
    .map((c) => c.duration)
    .filter((d) => Number.isFinite(d))
    .sort((a, b) => a - b);
  const median = durations[Math.floor(durations.length / 2)] ?? 0;
  if (median >= 100) return [...chunks];
  return chunks.map((c) => ({ ...c, offset: c.offset * 1000, duration: c.duration * 1000 }));
}
