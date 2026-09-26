# The Ten Mahāvidyās

A 40-page, 6 × 9 in book on the ten wisdom goddesses, from Kālī to Kamalā. It
is an original plain-English retelling of the fourteen-part Daśa Mahāvidyā
series by Shri Ravi on [manblunder.com](https://manblunder.com/articles/dasa-mahavidya)
(September 2014 – January 2015), and the book credits it as its source throughout.

**Download:** [`the-ten-mahavidyas.pdf`](./the-ten-mahavidyas.pdf)

| Pages | What |
|---|---|
| 1 | Cover (yantra, Devanagari title) |
| 2–4 | Title page, a note on the book, contents |
| 5–7 | *Before the Ten*: Śiva and Śakti, what a Mahāvidyā is, Tantra, how the ten appeared |
| 8–34 | One chapter per goddess: name, stories, form, teaching, seed syllable, where she sits in the body, and a closing question |
| 35–36 | *After the Ten*: why ten, four layers of consciousness, from mantra to silence |
| 37–39 | The ten at a glance (table), glossary |
| 40 | Colophon |

The source gives full mantras, and this book does not. Seed syllables are
discussed only for what they mean. Readers are pointed back to the series for
the mantras.

**Rights:** manblunder.com marks its content "all rights reserved". The wording
here is new, but the book follows that series closely, so get Shri Ravi's
permission before selling it or distributing it widely.

## Editing and rebuilding

- Words: `content.mjs` (front note, intro, ten chapters, epilogue, glossary)
- Look: `book.css` (EB Garamond + Noto Serif Devanagari, page numbers via `@page` margin boxes)
- Build: `node docs/books/ten-mahavidyas/build.mjs`

The build needs Playwright + Chromium (local or global), `curl`, and `pdf-lib`
(already a repo dependency). It renders twice: the first pass reads chapter
page numbers from the PDF outline, and the second writes them into the
contents page. Output is `the-ten-mahavidyas.pdf`, plus a gitignored
`the-ten-mahavidyas.html` preview.
