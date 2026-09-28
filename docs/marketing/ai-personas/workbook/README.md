# The 30-Day Initiation (workbook)

A 44-page printable workbook hosted by Madame Sulphur. It follows the
video's "digital product" step, adapted to the Codex: one rite a day across
five gates, with optional tasks that send people into the archive.

**Live at:** [cultcodex.me/initiation](https://cultcodex.me/initiation), free in exchange for an email.
The PDF itself is `src/assets/workbook/the-30-day-initiation.pdf` and is never public (see below).

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
downloaded at build time and embedded in the PDF. It writes:

- `src/assets/workbook/the-30-day-initiation.pdf`, the file readers download
- `public/initiation/{cover,day,tracker}.jpg`, the previews on the landing page
- `initiation-workbook.html`, a local preview (gitignored)

Commit the PDF and the previews together after a rebuild.

## Content rules

- Reflection only: observation, writing and conversation. No fasting, sleep
  changes, health claims or "predictions". Day 20 explicitly treats the card draw
  as a writing prompt, not a prophecy.
- Madame Sulphur is labelled as an AI character on the cover and the welcome page, which
  also carries the fan-project and not-therapy disclaimer.
- Archetype "gift" lines paraphrase `src/lib/archetypes.ts` so they agree with the quiz.

## How delivery works

1. A reader enters their email at `/initiation` (form: `src/components/marketing/workbook-signup.tsx`).
2. `POST /api/workbook` saves them as an **unconfirmed** `Subscriber` (source
   `gift:initiation30`, plus the page's `utm_campaign` when there is one) and emails a
   signed link. It sends at most 2 emails per address per hour and gives the same
   answer whether or not the address is already on the list.
3. The link opens `/initiation/download`, which **confirms** the address and offers the PDF
   through `GET /api/workbook/download`. Both check the signed token. A broken or old link
   shows a "send me a new one" page.

Clicking the link proves the reader owns the inbox, so this is the double opt-in. Nobody
can get the file, or sign someone else up, without that inbox. The workbook isn't part of
the Gospel email drip (`giftStage` stays 0).

To see where leads came from, check the "By source" table on `/admin/leads`: `gift:initiation30:persona_sulphur`
means the lead came from Madame Sulphur's bio link.
