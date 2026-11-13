// How the daily transcript import reads a yt-dlp failure.
//
// GitHub runner IPs get YouTube's "Sign in to confirm you're not a bot" page
// even with a cookie jar. On 2026-11-12 the import fetched 0 of 115 missing
// transcripts that way and still finished green, so every episode since late
// September sat without a transcript, and enrichment skips episodes that have
// none.

export type YtDlpFailure = "gone" | "blocked" | "other";

/**
 * - gone: the video no longer exists or is private. No source will have it, so
 *   don't spend a paid Supadata request on it.
 * - blocked: YouTube refused this IP (bot check, age gate, rate limit). The
 *   captions exist; Supadata can usually fetch them.
 * - other: anything else, e.g. no captions yet. Worth one Supadata attempt.
 */
export function classifyYtDlpError(message: string): YtDlpFailure {
  if (/Video unavailable|This video is unavailable|removed by the uploader|Private video|account .* terminated/i.test(message)) {
    return "gone";
  }
  if (/Sign in to confirm|not a bot|HTTP Error 429|Too Many Requests/i.test(message)) {
    return "blocked";
  }
  return "other";
}
