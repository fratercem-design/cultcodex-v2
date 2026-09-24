# AI Personas — Brand-Native Short-Form Plan

Three AI narrator characters who live inside the Cult of Psyche mythology and
point short-form viewers (Instagram Reels, TikTok, YouTube Shorts) back to
CultCodex. We are not inventing a product: the funnel already exists — the free
archetype quiz, 3 free Oracle questions a month, then Initiate+ ($10/mo) and
Oracle Tier ($25/mo).

| File | What's in it |
|---|---|
| [`personas.md`](./personas.md) | Character bibles, Higgsfield image/scene/voice prompts, bios |
| [`scripts.md`](./scripts.md) | First 18 scripts (6 per persona), ready to generate |

## The three characters

| Persona | Role in the mythology | Hook style | Sends viewers to |
|---|---|---|---|
| **The Archivist** | Keeper of the Codex. Remembers every transmission. | Receipts: "on this day", running-joke traces, "he said this in 2023" | `/oracle`, `/search`, `/timeline` |
| **Nyx** | Late-night operator of the Nightmare Frequencies | 3am atmosphere, eerie retellings, "a signal came in" | `/nightmare-frequencies`, `/cult-live` |
| **Madame Sulphur** | Reader of the eight archetypes | Identity and relationships: "signs you're a Mirror Walker", "which archetype you're dating" | `/archetype-quiz` → `/tarot` → Initiate+ |

Why three: the video's main lesson was that you can't predict the winner. His
favourite flopped, and the one he dropped went viral. Launch all three, post 10
each, then put the effort behind whichever one wins.

Our best guess is **Madame Sulphur**. Identity and compatibility content
("which one are you?") is the most shareable format on short-form. It also
maps onto the relationships niche, which did well in the video.

## Ground rules (non-negotiable)

1. **Every account says it's AI.** Bio line plus the platform's AI label on every
   post (Instagram "AI info", TikTok "AI-generated content" toggle, YouTube
   "altered or synthetic" disclosure). Both platforms require this for realistic
   synthetic people anyway.
2. **The characters are obviously mythic.** They have masks, sigils, glowing eyes
   and impossible rooms. Nobody should mistake them for a real person, and that
   is also the brand.
3. **Never depict, voice-clone or impersonate the real hosts or guests.** CultCodex
   is an independent fan archive. Personas can *quote* the transcripts, with the
   speaker's name and episode, but they never speak *as* a real person.
4. **Every factual claim about an episode is pulled from the archive.** Scripts
   marked `[PULL: …]` need a real quote/date from the Oracle or `/search`
   before generating. Don't let the video model invent lore.
5. **Fan-project disclaimer** in each bio link page (the site already carries
   it on `/about`).

## Links (use UTMs so we can crown a winner from real data)

```
https://cultcodex.me/oracle?utm_source=instagram&utm_medium=social&utm_campaign=persona_archivist
https://cultcodex.me/nightmare-frequencies?utm_source=instagram&utm_medium=social&utm_campaign=persona_nyx
https://cultcodex.me/archetype-quiz?utm_source=instagram&utm_medium=social&utm_campaign=persona_sulphur
```

Swap `utm_source` for `tiktok` / `youtube` when cross-posting. Each account's
bio link is the one line above for that persona.

## 7-day launch plan

| Day | Do | Tool |
|---|---|---|
| 1 | Generate character sheets + 4 scenes per persona (`personas.md` §Image prompts) | Higgsfield |
| 1 | Generate voice samples (`personas.md` §Voice) | Higgsfield Audio |
| 2 | Generate the 18 videos in `scripts.md`: 9:16, 1080p. Reference the character sheet as image 1 every time. | Higgsfield Cinema Studio |
| 2 | Burn in captions | CapCut / Instagram Edits |
| 3 | Create 3 Instagram accounts + matching TikTok handles, bios, profile pics, AI labels | Instagram, TikTok |
| 3–5 | Post 2 per persona per day, **same videos on IG + TikTok + Shorts**. The video skipped TikTok and regretted it. | — |
| 6 | Read the numbers (below). Crown a winner. | Instagram insights + site analytics |
| 7 | Script 10 more for the winner. Keep posting the other two at 1/day. | Claude |

**Budget:** Higgsfield plan (≈$99 at full price, the same number the video used).
Everything else is free. No store fees, because checkout is our own Stripe.

## How we pick the winner

Views are vanity. Rank by the last row first:

1. **Paid conversions** from `utm_campaign=persona_*` (Initiate+ / Oracle Tier checkouts)
2. **Quiz completions / Oracle questions asked** from that campaign
3. **Link clicks** (profile taps → bio link)
4. Saves + shares per 1k views
5. Views

If a persona gets views but zero clicks, the hook works and the call to action doesn't.
Rewrite the last line of the scripts before killing the character.

## What comes next (not in this pass)

- A **"30-Day Initiation" workbook** for the winning archetype, which is the video's digital product
  adapted for us. Sell it through the existing Stripe setup, or give it away
  free to anyone who signs up for Initiate+.
- Wire `utm_campaign` into the `Subscriber` / checkout records so the admin
  dashboard can show conversions by persona instead of reading analytics by hand.
