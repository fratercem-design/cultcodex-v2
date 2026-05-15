/**
 * maxresdefault.jpg returns HTTP 200 with a 120×90 black placeholder when
 * hi-res doesn't exist for a video. hqdefault.jpg (480×360) always exists.
 */
export function fixThumbnailUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace(/\/maxresdefault(\.jpg)?(\?.*)?$/, "/hqdefault.jpg");
}
