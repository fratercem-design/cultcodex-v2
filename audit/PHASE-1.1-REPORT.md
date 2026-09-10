# Phase 1.1 — Accessibility remediation

**Shipped** in [#157](https://github.com/fratercem-design/cultcodex-v2/pull/157), deployed as `81dcef0`.
Commits: `43d7ec5`, `b6ccde6`, `223c915`, `50857ff`, `5379537` (pre-squash SHAs).

---

## The first discovery: most of it was already written

The `audit-remediation` branch carried commit **`59cc241`** ("a11y: use the readable accent tints for text", 2026-08-30), which had already swapped 1,016 call sites — and reasoned about it *more carefully than my audit did*. It identified a **third** failing token my audit missed entirely (`--accent-crimson` at 3.64:1) and added `--accent-crimson-text` to fix it.

That commit sat 27 commits back on an unmerged branch, so it was cherry-picked in isolation rather than dragging the other 12 along. It applied cleanly.

**Lesson:** reconciling existing unmerged work should precede any new remediation.

## The second discovery: that sweep was incomplete

It covered only the 220 files it touched. **39 files were never reached** — including `src/app/page.tsx`, the homepage, last modified 2026-07-29, a *month before* the sweep ran. Not regression; a gap.

---

## Contrast

Computed from the real token values against `--term-bg` `#04060a`:

| Token | Before | After |
|---|---|---|
| violet | **1.83:1** — failed at *every* size | **8.67:1** |
| gold | 3.94:1 | **7.03:1** |
| crimson | 3.64:1 | **7.12:1** |

Final call-site counts:

| Token | bare (unreadable) | `-text` (readable) |
|---|---|---|
| violet | **0** | 427 |
| gold | **58** | 891 |
| crimson | **0** | 48 |

The 58 remaining gold uses are deliberate: **55 large headings** (≥24px, where 3:1 applies and gold passes) and **3 icons** (WCAG 1.4.11 graphical objects, also 3:1). Violet went everywhere including icons, because at 1.83:1 it is under the graphics floor too.

> **Independent corroboration:** the "55 large headings" figure was derived here from the size classes on each line, with no knowledge of the original commit's number. `59cc241`'s message states it kept 55. Two independent methods, identical exemption set.

## Opacity-modified text

The token swap alone did **not** finish the job. 290 call sites carry an opacity modifier that composites the tint back toward the ground — `gold/60` at 3.08:1, `violet/50` at 2.83:1.

Floors were computed against `--term-bg-2` `#0b0f18` — the *lightest* surface this text sits on, and therefore the worst case:

| Token | Floor | Ratio at floor |
|---|---|---|
| `accent-violet-text` | **/70** | 4.53:1 |
| `accent-gold-text` | **/80** | 4.60:1 |
| `accent-crimson-text` | **/80** | 4.67:1 |

**Result: 274 of 290 now pass** (was 41). The other 16 are hand-reviewed decoration.

**Two heuristics failed before this was right:**

1. *Opacity-based* ("≤45% must be decorative") wrongly exempted **"Suggest corrections →"** — a link at 1.98:1, and the site's own accountability channel.
2. *Same-line text scan* wrongly classified 240 items as decorative because JSX puts element text on the **next** line, so `<p className="…">` looked contentless.

The third pass used a 4-line lookahead and defaulted to *raise unless provably decorative*. All 25 flagged items were then reviewed by hand, and **9 forced back into the raise set** — a padded label, two colour-inheriting containers, a `$10/mo` pricing link, the transcript timestamp buttons, and two accent-map entries.

**Accepted trade-off:** gold's floor is `/80`, so `/50`, `/60`, `/65` and `/70` all collapse onto `/80` and stop reading as distinct tiers. Preserving that hierarchy would need dimmer *tokens* rather than alpha — a larger design change, not attempted.

## Heading outline — the root cause was worse than reported

The audit reported an `H1 → H3` skip. Measuring `/topics/consciousness` live revealed the real defect:

```
H1  consciousness
H3  Episodes (80)          <- SectionCard
H2  <episode title>  ×80   <- EpisodeListItem, nested INSIDE that H3
```

**Eighty list items each announced themselves a level above the section containing them.** Heading navigation reported 80 siblings of the page title instead of 80 children of one section.

Both components hardcoded their level, so no caller could express a correct outline. Each now takes an optional `headingLevel` defaulting to what it already rendered — nothing changes for callers that don't opt in. Applied to `episodes/[slug]`, `topics/[slug]`, `lore/[slug]`, `people/[slug]`, `people/the-rest`. Deliberately untouched: `/episodes` (items sit directly under the page `h1`) and `series/[slug]` (not nested).

## Touch targets

| Element | Before | After |
|---|---|---|
| Footer nav links (×26) | 58×16 | **58×24** |
| Social channels (×3) | 85×16 | **85×24** |
| Entry-banner dismiss | 11×18 | **24×24** |
| Wordmark | 104×19 | **104×24** |

**Under-24 targets: 34 → 4**, verified by applying the exact declarations to the live DOM and re-measuring, then confirming the built CSS emits `min-height:calc(var(--spacing) * 6)` with `--spacing:.25rem` = exactly 24px. The four remaining are exempt by rule.

---

## Verification

| Check | Result |
|---|---|
| Typecheck | exit 0 |
| Lint | 0 errors, 101 warnings — identical to baseline |
| Tests | **188 passing** (from 182) |
| Production build | exit 0, 200/200 static pages |
| Diff scope | 275 insertions / 275 deletions — exact 1:1 line swap |
| Non-text utilities | `bg-`/`border-`/`ring-`/`shadow-` accent classes: **148 before, 148 after** — untouched |
| Non-accent lines changed | **zero** |

**Not verified at the time:** rendered appearance. There was no local `DATABASE_URL`, so `next start` could not serve content pages. Everything was static analysis, unit tests, computed colour maths, and live-DOM measurement of the *same declarations*. That gap was closed by the deploy — the changes are now live.
