/**
 * Tarot cards with painted art in public/cards/art/{slug}.webp.
 * Cards not listed here fall back to the procedural SVG.
 */
const TAROT_ART_SLUGS = new Set<string>([
  "cop-maj-00", "cop-maj-01", "cop-maj-02", "cop-maj-03", "cop-maj-04", "cop-maj-05", "cop-maj-06", "cop-maj-07", "cop-maj-08", "cop-maj-09", "cop-maj-10", "cop-maj-11", "cop-maj-12", "cop-maj-13", "cop-maj-14", "cop-maj-15", "cop-maj-16", "cop-maj-17", "cop-maj-18", "cop-maj-19", "cop-maj-20", "cop-maj-21", "cop-maj-22", "cop-maj-23",
  "cop-sig-1", "cop-sig-2", "cop-sig-3", "cop-sig-4", "cop-sig-5", "cop-sig-6", "cop-sig-7", "cop-sig-8", "cop-sig-9", "cop-sig-10", "cop-sig-c1", "cop-sig-c2", "cop-sig-c3", "cop-sig-c4",
  "cop-mir-1", "cop-mir-2", "cop-mir-3", "cop-mir-4", "cop-mir-5", "cop-mir-6", "cop-mir-7", "cop-mir-8", "cop-mir-9", "cop-mir-10", "cop-mir-c1", "cop-mir-c2", "cop-mir-c3", "cop-mir-c4",
  "cop-rel-1", "cop-rel-2", "cop-rel-3", "cop-rel-4", "cop-rel-5", "cop-rel-6", "cop-rel-7", "cop-rel-8", "cop-rel-9", "cop-rel-10", "cop-rel-c1", "cop-rel-c2", "cop-rel-c3", "cop-rel-c4",
  "cop-gli-1", "cop-gli-2", "cop-gli-3", "cop-gli-4", "cop-gli-5", "cop-gli-6", "cop-gli-7", "cop-gli-8", "cop-gli-9", "cop-gli-10", "cop-gli-c1", "cop-gli-c2", "cop-gli-c3", "cop-gli-c4",
]);

export function tarotArtUrl(slug: string): string | null {
  return TAROT_ART_SLUGS.has(slug) ? `/cards/art/${slug}.webp` : null;
}
