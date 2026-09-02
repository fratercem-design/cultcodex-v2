import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Fonts for `next/og` images.
 *
 * Why this exists: Satori covers a codepoint it has no glyph for by fetching a
 * matching font from Google Fonts at render time. The geometric symbols this
 * site uses as a design language — ◉ ✦ ◈ ▦ ◐ ◎ ❀ and friends — are not served
 * by any Google font for that lookup, so builds logged
 *
 *   Failed to load dynamic font for ◉✦◈ . Error: Failed to download dynamic font. Status: 400
 *
 * once per affected page, and the glyph fell back to whatever Satori had left.
 * A decorative symbol was never guaranteed to render in a social preview.
 *
 * The catch is that `fonts` REPLACES the default rather than adding to it
 * (`fonts: options.fonts || defaultFonts` inside @vercel/og), so a symbol font
 * alone would strip the typeface from all text. Geist-Regular below is the exact
 * file @vercel/og bundles as its default, so output stays visually identical —
 * the symbols are simply guaranteed now, with nothing fetched at render time.
 *
 * The symbol faces are subsets covering only the glyphs this repo actually uses
 * (93 of them, scanned out of src/). If you introduce a new symbol, regenerate:
 *
 *   curl -A "Mozilla/5.0 (Linux; U; Android 2.2)" \
 *     "https://fonts.googleapis.com/css2?family=Noto+Sans+Symbols+2&text=<glyphs>"
 *
 * then download the TTF it points at. The archaic User-Agent matters — a modern
 * one is served woff2, which Satori cannot read.
 *
 * ✅ (U+2705) is deliberately absent: it is emoji, and next/og resolves emoji
 * through its own Twemoji path rather than this list.
 */

const FONT_DIR = join(process.cwd(), "src", "assets", "fonts");

type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400;
  style: "normal";
};

// Order matters. Satori takes the first font that has the glyph, so the text
// face leads and the symbol faces only catch what it misses.
const FILES: Array<[name: string, file: string]> = [
  ["Geist", "Geist-Regular.ttf"],
  ["Noto Sans Symbols 2", "NotoSansSymbols2-og.ttf"],
  ["Noto Sans Symbols", "NotoSansSymbols-og.ttf"],
  ["Noto Sans Mono", "NotoSansMono-og.ttf"],
  ["Noto Sans Math", "NotoSansMath-og.ttf"],
];

let cached: OgFont[] | null = null;

/** Load the OG font set. Cached per process, so one disk read per lambda. */
export async function ogFonts(): Promise<OgFont[]> {
  if (cached) return cached;

  const loaded = await Promise.all(
    FILES.map(async ([name, file]) => {
      const buf = await readFile(join(FONT_DIR, file));
      const data = buf.buffer.slice(
        buf.byteOffset,
        buf.byteOffset + buf.byteLength,
      ) as ArrayBuffer;
      return { name, data, weight: 400 as const, style: "normal" as const };
    }),
  );

  cached = loaded;
  return cached;
}
