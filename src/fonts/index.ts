import localFont from "next/font/local";
import "./fallbacks.css";

// Site-wide typefaces, loaded by the root layout. Self-hosted rather than
// next/font/google: fetching Google Fonts at build time made CI fail
// intermittently. The files are the exact woff2s Google Fonts serves, so
// rendering is unchanged. Provenance and licenses (SIL OFL 1.1) are in the
// README next to this file.
//
// Only import this module from the root layout. Every localFont() call in a
// module is emitted (and preloaded) wherever the module is imported, so a
// page-specific face added here would ship on every route.
//
// Font loader options must be inline literals, hence the repeated strings:
// - `unicode-range` is the range Google Fonts attaches to each subset, so a
//   character outside it takes the same fallback path it took before.
// - Automatic fallback generation is off. next/font/local derives its metric
//   overrides from the font file, and they differ from the precomputed values
//   next/font/google used. Glyphs these subsets lack (→, ◆, ◈ …) are drawn
//   with the fallback face even after the web font loads, so different
//   overrides would shift the layout. fallbacks.css pins the Google values.

export const spaceGrotesk = localFont({
  src: [{ path: "./SpaceGrotesk-latin.woff2", weight: "300 700", style: "normal" }],
  variable: "--font-display",
  display: "swap",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
  adjustFontFallback: false,
  fallback: ["Space Grotesk Fallback"],
});

// JetBrains Mono — primary monospace for the neon-terminal aesthetic.
// Overrides --font-mono so all existing `font-mono` consumers pick it up
// without per-component changes. The greek file is kept because the footer
// glyph (and psychenomicon pages) render ψ. Both files share one declaration,
// so the range is latin + greek; greek is declared first so the latin file
// wins for every character it has, and is fetched only for glyphs latin lacks.
export const jetbrainsMono = localFont({
  src: [
    { path: "./JetBrainsMono-greek.woff2", weight: "300 700", style: "normal" },
    { path: "./JetBrainsMono-latin.woff2", weight: "300 700", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD, U+0370-0377, U+037A-037F, U+0384-038A, U+038C, U+038E-03A1, U+03A3-03FF",
    },
  ],
  adjustFontFallback: false,
  fallback: ["JetBrains Mono Fallback"],
});
