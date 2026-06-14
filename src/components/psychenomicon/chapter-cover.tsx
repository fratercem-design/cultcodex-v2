/**
 * ChapterCover — tiny lazy-loaded cover thumbnail for a Psychenomicon
 * chapter. `artImageUrls` is a JSON blob shaped { cover, scene_01, ... };
 * we render the cover when present. Renders nothing if there's no art.
 *
 * Uses a plain <img> (not next/image) because the Supabase Storage host
 * isn't in next.config remotePatterns; lazy-loaded so offscreen rows in
 * long chapter lists don't fetch.
 */
export function coverUrl(art: unknown): string | null {
  if (art && typeof art === "object" && !Array.isArray(art)) {
    const c = (art as Record<string, unknown>).cover;
    if (typeof c === "string" && c.startsWith("http")) return c;
  }
  return null;
}

export function ChapterCover({ art, size = 36 }: { art: unknown; size?: number }) {
  const url = coverUrl(art);
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className="flex-shrink-0 rounded border border-accent-violet/20 object-cover"
      style={{ width: size, height: size }}
    />
  );
}
