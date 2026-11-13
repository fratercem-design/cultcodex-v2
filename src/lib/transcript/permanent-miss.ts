/**
 * Decides whether a failed transcript fetch is permanent (stamp the
 * "no_captions" sentinel so future syncs skip the episode) or transient (leave
 * it pending so the next run retries it).
 *
 * `reason` is the string built by the fetchers in
 * src/app/api/admin/sync-transcripts/route.ts, e.g. "supadata_404: {...json...}",
 * "supadata_404: 404 Not Found", "supadata_timeout", "yt_no_captions".
 *
 * A wrong "permanent" silently drops an episode from every future sync; a wrong
 * "transient" only costs a retry. So only answers where Supadata itself looked
 * and found nothing count as permanent.
 */
export function isPermanentMiss(reason: string): boolean {
  // Supadata answered with no content. mode=auto would have generated a
  // transcript from the audio if there were any, so there is nothing to get.
  if (reason === "supadata_empty" || reason === "supadata_empty_job") return true;

  // A 404 carrying Supadata's JSON error body means it looked up the video and
  // it isn't there. A bare "404 Not Found" means the request URL was wrong,
  // which says nothing about the video (the old POST fallback hit exactly that).
  const NOT_FOUND = "supadata_404:";
  if (reason.startsWith(NOT_FOUND)) return reason.slice(NOT_FOUND.length).trimStart().startsWith("{");

  // Everything else may be ours or temporary: 403 (age gate, but also a bad key
  // or plan, which would hit every episode), timeouts, failed jobs, and yt_*
  // (Fly's datacenter IP gets bot-blocked by YouTube).
  return false;
}
