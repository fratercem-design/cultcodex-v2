# Site fonts

Self-hosted for the root layout (`src/app/layout.tsx`) via `next/font/local`
in `index.ts`, so the build never fetches from Google Fonts.

Each file is the variable woff2 that Google Fonts serves for that subset:
byte-for-byte the file `next/font/google` downloaded before (SHA-256 checked
against what the dev server served). Only the subsets the site renders are kept:
latin for both families, plus greek for JetBrains Mono, where `ψ` is set.

| File | Family | Subset | Weights | Source |
| --- | --- | --- | --- | --- |
| `SpaceGrotesk-latin.woff2` | Space Grotesk | latin | 300–700 | https://fonts.gstatic.com/s/spacegrotesk/v22/V8mDoQDjQSkFtoMM3T6r8E7mPbF4C_k3HqU.woff2 |
| `JetBrainsMono-latin.woff2` | JetBrains Mono | latin | 300–700 | https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbV2o-flEEny0FZhsfKu5WU4xD7OwGtT0rU.woff2 |
| `JetBrainsMono-greek.woff2` | JetBrains Mono | greek | 300–700 | https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbV2o-flEEny0FZhsfKu5WU4xD4OwGtT0rU3BE.woff2 |

`fallbacks.css` defines the metric-matched `Arial` fallback faces with the
values `next/font/google` generated for these families. `index.ts` explains why.

## Updating

The URLs come from the stylesheet `next/font/google` requested, fetched with the
User-Agent in `node_modules/next/dist/compiled/@next/font/dist/google/fetch-resource.js`
(it decides the file format):

- `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap`
- `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap`

## License

Both families are licensed under the SIL Open Font License 1.1, which permits
bundling and redistributing them with software as long as the copyright notice
and license travel with them and the fonts are not sold on their own. Neither
declares a Reserved Font Name. The license texts are copied verbatim from
https://github.com/google/fonts/tree/main/ofl:

- `OFL-SpaceGrotesk.txt`
- `OFL-JetBrainsMono.txt`
