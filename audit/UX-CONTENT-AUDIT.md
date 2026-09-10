# UX, Information Architecture, Content & Brand Audit — CultCodex.me

---

## First impression: what is this?

Approaching cold, the homepage answers the question well. The wordmark, the strapline — *"The searchable archive of the Cult of Psyche — episodes, transcripts, lore, and the Oracle"* — and a live corpus counter (`TRANSCRIBED 99% · 2,993/3,018 eps`) establish scope, subject and credibility within one viewport. The terminal aesthetic is committed and coherent rather than decorative.

The sidebar answers "where do I begin?" explicitly, with a `DISCOVER` group containing **START HERE**, **EXPLORE**, **THIS WEEK** and **YOUR RANK**. Many archive sites never answer this at all.

**The identity is a genuine asset and should be preserved.** Nothing in this audit recommends making CultCodex look like a generic content site. The recommendations are about making the existing identity *legible* and its content *reachable*.

## The archive is the moat

| Entity | Count |
|---|---|
| Episodes | 3,018 |
| Transcript segments | 5,103,266 |
| Topics | 13,742 |
| Lore entries | 10,452 |
| People | 1,537 |
| Quotes | 4,438 |

Nothing comparable exists in this niche. Every strategic recommendation follows from one observation: **the corpus is far stronger than the paths through it.**

---

## UX-01 — 48 routes are unreachable by clicking · OPEN

Building a link graph from all 367 crawled pages, these are never linked from anywhere:

```
/auth/error      /auth/verify        /cards/vault      /claps
/codex/quotes    /codex/signals      /codex/transmissions
/dossier         /favorites          /from-youtube     /gift/gospel
/handbook        /live               /media-kit        /mythic-map
/nightmare-frequencies               /oracle/share     /posts
/psychenomicon/archetypes            /search/deep      /settings/notifications
/signal          /start-here/guided  /start-here/results
/stats           /stormborn          /subscribe        /welcome/initiate
/welcome/oracle
```

Some are legitimately unlinked (auth callbacks, post-action result pages). But several look like real destinations that were built and stranded:

- **`/mythic-map`**, **`/stats`**, **`/media-kit`**, **`/live`** — all four in the sitemap, submitted to Google, **zero** internal links. A media kit that press cannot find is not a media kit.
- **`/handbook`**, **`/dossier`**, **`/nightmare-frequencies`**, **`/stormborn`**, **`/posts`** — substantial-sounding destinations with no route in.

**Caveat, stated honestly:** this graph is built from server-rendered HTML only. Links revealed by client-side interaction would be missed. Confidence Medium — worth a manual pass before deleting anything.

**Fix.** Triage into three buckets: (a) link it from a relevant hub, (b) keep it unlinked but remove it from the sitemap, (c) delete it. Doing nothing is the worst option — Google is currently told `/media-kit` and `/stats` matter while the site says they do not.

## UX-02 — The document does not scroll · OPEN, deliberate design

Measured: `document.documentElement.scrollHeight === clientHeight === 812`. All content scrolls inside `div#main-content.terminal-main` (`scrollHeight` 5,932 vs `clientHeight` 696).

Clearly deliberate — it produces the fixed-chrome terminal frame that defines the site. The costs are real and worth naming:

| Cost | Effect |
|---|---|
| Mobile URL bar never collapses | Permanent loss of ~60–100px of vertical space on every phone |
| No native scroll restoration | Back-navigation loses position unless manually implemented |
| Viewport `position: sticky` breaks | Sticky elements must anchor to the inner container |
| Scroll-depth analytics break | Standard measurement reads a non-scrolling document |
| Pull-to-refresh disabled | — |
| AT virtual-cursor behaviour | Untested; inner-scroll patterns can behave unexpectedly |

The mobile screenshot shows the cost directly: the content column is noticeably cramped because the browser chrome never yields.

**Recommendation — not a demand to change it.** Keep the aesthetic, but verify (a) scroll restoration works on back-navigation, (b) analytics scroll-depth reads the inner container, and (c) test with a screen reader. If the terminal frame could be achieved with `position: sticky` chrome over a normally-scrolling document, that would recover the mobile viewport space at no visual cost.

## UX-03 — Ten dead links on the commercial page · OPEN

All 10 `/shop` product links return 404.

**In fairness, this is disclosed.** The page states plainly:

> *"Coming soon — the designs below are final, but the store is not open yet. Prices are provisional and the product links go live when the shop opens."*

That is honest, and the page is well-written — ten designs in three "houses" (House of Signal / Shadow / Archive) with provisional prices ($16–$78). This is **not** a trust violation, and an earlier draft of this audit that called it one was wrong.

It is still a UX problem: a visitor who reads the notice and clicks anyway — many will — lands on a Fourthwall 404 with no way back. **Fix (tiny):** render the products as non-interactive cards until the store opens. Keep the copy exactly as it is.

## UX-04 — The corrections channel does not work · OPEN

`/corrections` — the page establishing editorial accountability — links to `https://github.com/fratercem-design/cultcodex-v2/issues`, which returns **404** to anonymous visitors because the repository is private.

For a site whose credibility rests on distinguishing sourced fact from lore and interpretation, a corrections mechanism the public cannot use undercuts the whole posture. **Fix (tiny):** point it at an email address, a form, or a public tracker.

---

## Trust and credibility

The trust-signal inventory is **strong** — better than most independent archives:

| Signal | Present |
|---|---|
| About page | ✅ `/about` |
| Methodology | ✅ `/about/methodology` and `/methodology` |
| Content policy | ✅ |
| Corrections policy | ✅ (but see UX-04) |
| Contact | ✅ |
| Privacy policy | ✅ discloses both Google Analytics **and** Vercel Analytics |
| Terms / Refund | ✅ |
| Provenance labelling | ✅ "⬡ Interpretive Layer" badges distinguish interpretation from record |

Having a **methodology page and a provenance badge system at all** is unusual and exactly the right response to the "unusual subject matter" problem. The site does not ask to be taken on faith; it shows its working.

Two things weakened it, one now fixed:

1. The corrections link is dead (UX-04, open).
2. ~~The provenance badges rendered in `--accent-violet` at **1.77:1** — the very labels establishing epistemic honesty were the hardest text on the page to read.~~ **Fixed** — those labels now render at 8.67:1. The accessibility fix and the credibility fix turned out to be the same fix.

---

## Content quality by type

| Type | Volume | Median chars | Assessment |
|---|---|---|---|
| Episodes | 2,982 | 6,830 | **Strong.** Summary, guests, topics, duration, series, breadcrumb, `VideoObject` |
| Lore | 10,453 | — | Healthy; 2/25 thin |
| People | 1,539 | — | Healthy; 1/25 thin |
| **Topics** | **13,743** | **1,676** | **Weak** — 15/24 sampled under 2,000, much of it shared chrome |
| Chapters | 2,990 | ~1,470 | Sealed shells — **now de-indexed** |

**Topics is the strategic problem.** It is the largest content type, the one carrying `DefinedTerm` structured data, and the thinnest. A topic page listing three episodes and a one-line definition is a navigation node presented as a destination.

**What the archive already contains that would fix it** — no new writing required:

- Transcript excerpts where the topic is actually discussed (5.1M segments available)
- First and last appearance dates — a topic's arc over time
- Which people discuss it most (1,537 people, already linked)
- Co-occurring topics (derivable from episode overlap)
- Representative quotes (4,438 available)

That turns a stub into something with a reason to exist, using only data already in the database.

## Discovery and internal linking

**What works:** the sidebar is comprehensive and grouped sensibly (MAIN / DISCOVER / ORACLE); breadcrumbs are present and marked up on episodes, lore, people, topics and series; episode pages link out to topics, people and series; `/explore`, `/start-here`, `/graph` and `/timeline` are genuine discovery surfaces.

**Gaps:**

1. **No "continue exploring" module** at the end of content pages. A reader finishing an episode has the sidebar, not a recommendation.
2. **Topic↔topic relationships are unexpressed.** With 13,742 topics and 3,018 episodes, co-occurrence is computable and would create the lateral paths the site lacks.
3. **48 orphans** (UX-01).
4. **The lexicon is a single 2,873-line page** rather than linkable per-term entries — so a term can never be *cited* from an episode page. Individual routes would create thousands of natural contextual links (and would fix PERF-02 at the same time).

## Conversion and retention

Primary actions appear to be: sign in / become Initiate+, subscribe, and explore the archive. The Oracle, cards, quests, rank and leaderboard form a well-developed engagement layer.

- ~~The **Sign In** button rendered at **3.73:1** — the primary conversion control was among the least legible elements.~~ **Fixed.**
- The sealed chapters are a *good* conversion mechanic (a clear Initiate+ value proposition) that was also an SEO liability. They are now de-indexed, which resolves the SEO half. Serving a **real free excerpt** would improve both: better conversion (readers can judge the value) and a legitimate path back to indexability via `isAccessibleForFree` markup.
- `/subscribe` is **orphaned** — the email capture page has no internal links.

## Brand consistency

The visual identity is deliberate and unusually coherent: terminal chrome, CRT grain, monospace, glyph iconography, an "Ember/Bruise/Phosphor" palette consciously repainted from an earlier gold/violet/cyan scheme (the `globals.css` comments document the change).

Two inconsistencies:

1. **Token names no longer describe their values.** `--accent-gold` is `#C8392E` (red); `--accent-violet` is `#4A2D6E` (dark bruise). Comments explain why, but ~1,300 call sites now read `text-accent-gold` while rendering red. Renaming to `--accent-ember` / `--accent-bruise` is mechanical and would repay itself. **(MNT-05, open.)**
2. ~~The palette was applied without a contrast tier.~~ **Fixed** — the `-text` variants are now adopted across 1,318 call sites, and the opacity band raised to its floor. Hue is unchanged throughout; only lightness moved.
