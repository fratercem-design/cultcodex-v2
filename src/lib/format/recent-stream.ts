/** How long a stream with no transcript reads as "in the queue" rather than missing. */
export const RECENT_STREAM_DAYS = 7;

/**
 * True when an episode aired within the last `days` days (or is dated in the
 * future, e.g. a scheduled premiere). A missing transcript on such an episode
 * is the normal pipeline lag, not a gap in the archive.
 */
export function isRecentStream(
  airDate: Date | string | null | undefined,
  days = RECENT_STREAM_DAYS,
  now: Date = new Date(),
): boolean {
  if (!airDate) return false;
  const aired = typeof airDate === "string" ? new Date(airDate) : airDate;
  if (Number.isNaN(aired.getTime())) return false;
  return now.getTime() - aired.getTime() < days * 24 * 60 * 60 * 1000;
}
