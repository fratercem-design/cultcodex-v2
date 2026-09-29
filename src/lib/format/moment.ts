/**
 * Links to a moment in a stream. The on-site link (`/episodes/slug?t=N`) is the
 * one to share: it opens the transcript at that line and starts whichever
 * player the episode has at that second.
 */

function wholeSeconds(seconds: number | null | undefined): number | null {
  return seconds != null && Number.isFinite(seconds) && seconds >= 0 ? Math.floor(seconds) : null;
}

/** Episode page scrolled to, and playing from, `seconds`. */
export function momentPath(slug: string, seconds?: number | null): string {
  const t = wholeSeconds(seconds);
  return t == null ? `/episodes/${slug}` : `/episodes/${slug}?t=${t}`;
}

/** Rumble player URL. `id` must be the player id (Episode.rumbleEmbedId). */
export function rumbleEmbedUrl(id: string, seconds?: number | null): string {
  const t = wholeSeconds(seconds);
  return `https://rumble.com/embed/${id}/${t ? `?start=${t}` : ""}`;
}

/** The same moment on YouTube, when the episode has a YouTube upload. */
export function youtubeMomentUrl(videoId: string, seconds?: number | null): string {
  const t = wholeSeconds(seconds);
  return `https://www.youtube.com/watch?v=${videoId}${t ? `&t=${t}s` : ""}`;
}
