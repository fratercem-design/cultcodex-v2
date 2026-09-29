# The 30-Day Initiation (workbook)

A 44-page printable workbook hosted by Madame Sulphur. It follows the
video's "digital product" step, adapted to the Codex: one rite a day across
five gates, with optional tasks that send people into the archive.

**Download:** [`the-30-day-initiation.pdf`](./the-30-day-initiation.pdf) (US Letter)

| Pages | What |
|---|---|
| 1 | Cover (glyph ring; add Madame's portrait as `cover.jpg` and rebuild) |
| 2–4 | Welcome letter + disclaimer, map of the five gates, fridge tracker |
| 5–39 | Five gate dividers + 30 daily pages (rule, Madame's note, rite, optional Codex task, writing lines) |
| 40 | Seal of Initiation certificate |
| 41–43 | Bonuses: archetype Field Guide (gift / shadow / practice), three journaling spreads |
| 44 | What comes next: free quiz, Oracle, search, Initiate+ |

Every link in the PDF is clickable and carries
`utm_source=workbook&utm_medium=pdf&utm_campaign=initiation30`.

## Editing and rebuilding

- Words: `content.mjs` (days, gates, field guide, spreads)
- Look: `workbook.css` (Sacred Terminal palette, Space Grotesk / JetBrains Mono / EB Garamond)
- Build: `node docs/marketing/ai-personas/workbook/build.mjs`

The build needs Playwright + Chromium (local or global) and `curl`. Fonts are
downloaded at build time and embedded in the PDF. Output goes to
`the-30-day-initiation.pdf`, plus an `initiation-workbook.html` preview, which is
gitignored.

## Content rules

- Reflection only: observation, writing and conversation. No fasting, sleep
  changes, health claims or "predictions". Day 20 explicitly treats the card draw
  as a writing prompt, not a prophecy.
- Madame Sulphur is labelled as an AI character on the cover and the welcome page, which
  also carries the fan-project and not-therapy disclaimer.
- Archetype "gift" lines paraphrase `src/lib/archetypes.ts` so they agree with the quiz.

## How to use it

Pick one of these (or test both):
1. **Lead magnet:** free in exchange for an email (the `Subscriber` list). Madame's
   bio link becomes "free 30-day workbook", and every copy leads to Initiate+.
2. **Paid:** about $12, as in the video, sold as a one-off Stripe payment link.
3. **Initiate+ bonus:** "Subscribe and get the workbook", to lift conversion on `/premium`.
