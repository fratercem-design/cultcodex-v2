# Home page fonts

Self-hosted for the threshold hero on `src/app/(home)/page.tsx` via
`next/font/local`, so the build never fetches from Google Fonts.

Each file is the latin-subset variable woff2 that Google Fonts serves: byte-for-byte
the file `next/font/google` downloaded before (SHA-256 checked against what the dev
server served). Both styles are kept. The italic sets "the Codex."; the upright
face sets the `◣` sigil. That glyph isn't in any Bodoni Moda subset, so it is
drawn with the fallback face. But the upright face is still the element's first
available font, so its ascent and descent size the sigil's line box.

| File | Family | Style | Weights | Source |
| --- | --- | --- | --- | --- |
| `BodoniModa-Italic-latin.woff2` | Bodoni Moda | italic | 400–500 | https://fonts.gstatic.com/s/bodonimoda/v28/aFTB7PxzY382XsXX63LUYJSPUqb0pL6OQqxrZLnVbtxSXgOXEFZ8.woff2 |
| `BodoniModa-latin.woff2` | Bodoni Moda | normal | 400–500 | https://fonts.gstatic.com/s/bodonimoda/v28/aFTH7PxzY382XsXX63LUYL6GYFcan6NJrKp-VPj1KOxQVAS1Eg.woff2 |

`fallbacks.css` defines the metric-matched `Times New Roman` fallback face with
the values `next/font/google` generated for this family.

The URLs come from
`https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,500;1,400;1,500&display=swap`,
fetched with the User-Agent in
`node_modules/next/dist/compiled/@next/font/dist/google/fetch-resource.js`.

## License

Bodoni Moda is licensed under the SIL Open Font License 1.1, which permits
bundling and redistributing it with software as long as the copyright notice and
license travel with it and the font is not sold on its own. It declares no
Reserved Font Name. `OFL-BodoniModa.txt` is copied verbatim from
https://github.com/google/fonts/tree/main/ofl/bodonimoda.
