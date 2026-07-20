# 48-Hour Card Claim Test — Spec
**Date:** 2026-07-01
**Project:** cultcodex.me
**Status:** Ready to run — zero build required
**Gate:** Increment 1 build (Signal economy, reading engine, collection UI) does NOT start until this test returns a verdict. (Schema Increments 0/0.5 are already live on Xata, 2026-06-25.)

---

## What this tests

The single riskiest assumption in the Living Oracle Deck: **do engaged viewers actually want to collect these cards?** If they won't claim a *free* card, no amount of build quality fixes it. Cost to find out: one community post + one existing art asset + 48 hours.

## Setup (under 30 minutes)

1. **Pick the card.** Reuse one finished piece from the existing art pipeline — ideally the show's trickster or another fan-favorite archetype (the Buyer persona's impulse target). No new generation needed.
2. **Pick the lore question.** One question a real viewer of the show can answer but a drive-by cannot. Template: *"In episode [X], what did [character/entity] [do/say/reveal] when [moment]?"* Pull from a legendary stream incident — the INCIDENT card archetype list is a good source.
3. **Post it** (copy below) to the YouTube community tab (and/or open a stream segment with it).

## Post copy (community tab)

> 🃏 **The Psychenomicon is waking up.**
>
> The first artifact of the **Living Oracle Deck** has surfaced: **[CARD NAME]**.
>
> It cannot be bought. Ever. Cards from this deck are *earned* — and this one goes to initiates who know the lore.
>
> **Answer this in the comments:** [LORE QUESTION]
>
> Everyone who answers correctly in the next 48 hours claims a **Founder's Edition** — first-provenance, marked as claimed before the deck went live. When the Oracle awakens on cultcodex.me, your card will be waiting in your collection.
>
> [CARD IMAGE]

## Stream segment variant

Reveal the card on camera (pack-opening energy, 2–3 minutes), read the question aloud, point to the pinned comment. Card reveals as live segments is the long-term drop mechanic anyway — this doubles as its first rehearsal.

## Measurement (at 48h, count comments)

| Result | Verdict |
|--------|---------|
| **≥20 correct claims** | GREEN — deploy the schema increment, build Phase 1 per the reshaped spec |
| **5–19 correct claims** | WEAK — collect-desire exists but thin; shrink Phase 1 to cards-as-reading-engine only (no collection UI investment yet), re-test after 2–3 more stream reveals |
| **<5 correct claims** | HALT deck build — keep the lore-aware reading engine (the moat), drop the collection mechanic |

Secondary signals worth noting: claims from names you don't recognize (reach beyond regulars), replies asking "how do I get more" (pull-demand), any AI-art pushback in replies (sentiment check from the Researcher's warning).

## Obligations created by running this

Correct claimants MUST receive their Founder's Edition when (if) the deck ships — this is a public promise and the first trust-test of the "restraint is the scarcity mechanism" rule. Keep the claimant list (comment permalinks) in this file's follow-up notes.

## Follow-up notes

_(append results here after the 48h window)_

**2026-07-02 — STAGED:** Card: The Troll King (Chaos Architect). Image: `~/Downloads/troll-king-card.png` (copy of `public/cards/art/the-troll-king.png`). Copy: `~/Downloads/claim-test-post.txt`. Lore question: "Which chat legend earned the crown of Troll King — and name the moment that did it." Awaiting John's community-tab post; 48h window starts then. Record claimant permalinks below.

**2026-07-03 — POSTED (live).** The claim test went live on the @cultofpsyche community tab ~45 min before this note. Permalink: https://www.youtube.com/post/UgkxZG5RO1XWrpA6tRpYzNBtVmjDT9af1Aew — 48h window running from post time. ⚠️ IMAGE GAP: post is text-only; the Troll King card image (`~/Downloads/troll-king-card.png`) was NOT attached. Decision pending (John): leave text-only vs. delete+repost-with-image vs. drop the card art as a follow-up reply. YouTube community posts can't add media to an existing text post via edit. Count correct claims at 48h: ≥20 GREEN / 5–19 WEAK / <5 HALT. Record claimant comment permalinks below.

**2026-07-05 — DELETED + REPOSTED (clock reset).** The 07-03 permalink now 404s. A new Troll King post — **with the card image attached** (image gap resolved) — went up ~07-04. New permalink: https://www.youtube.com/post/Ugkx9cVvQ1UEOWe70PKjhtzoVdd-_Da6wukQ. The 48h window therefore restarts from ~07-04 and closes ~07-06. Verified via logged-in Chrome on 2026-07-05: **0 comments / 0 correct claims, 2 likes** at ~24–30h in. Trajectory tracks to HALT (<5) — a late surge to the ≥20 GREEN bar is not realistic from a zero base. Context: sibling community posts on this channel draw ~1–3 likes and ~0–3 comments, and vidiq shows a 7-day view/sub decline — the community-tab format may be under-powered for this test regardless of card desire. The spec's own stream-reveal variant (§"Stream segment variant") is the fairer, higher-reach test and has NOT been run. RECOMMENDATION: do not build collection UI; keep the lore-aware reading engine (the moat) per the RESHAPE verdict; if re-testing collect-desire, use an on-stream reveal, not another silent community post.

**2026-07-10 — VERDICT: HALT (0 claims at extended deadline).** John confirmed no one claimed the card. Per the gate: halt the collection build, keep the lore-aware reading engine (the moat). **John's distribution decision:** 10 Founder's Edition Troll King cards minted for hand distribution — №1 kept by John, №2–10 given personally to people of his choosing ("earned, never bought" honored: these are given, not sold). Mechanism shipped same day (`d4d51dd`): CardGift claim tokens + `/claim/card/[token]` + `mint-card-gifts` data-ops op. This doubles as the reshaped drop mechanic's first infrastructure — future on-stream reveals can mint and hand out links live.

**2026-07-05 — DEADLINE EXTENDED to Fri 2026-07-10 (John's call).** John is extending the answer window to July 10 and will **manually collect winners' emails** for Founder's Edition fulfillment (no automated claimant capture needed). NEW GATE INTERPRETATION: count correct claims at end of 2026-07-10, same thresholds (≥20 GREEN / 5–19 WEAK / <5 HALT). LIVE-POST EDIT DONE (John, manually from owner account, 2026-07-05) — deadline line updated to "by Friday, July 10". FIRST TEST RUN IS MANUAL: John collects correct-answer emails by hand and will hand-fulfill Founder's Editions; no automated claimant capture this round. NOTE: extending the window does not fix the reach problem (0 claims at ~30h); the on-stream reveal remains the higher-signal test.
