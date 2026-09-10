# Accessibility Audit — CultCodex.me

**Method:** in-browser instrumentation against the live site. Contrast computed per WCAG 2.x with every colour resolved through a canvas, so `lab()` and `oklch()` values are measured as true sRGB rather than mis-parsed. Alpha composited against the real ancestor background stack.

**Standard:** WCAG 2.2 Level AA.

> **Correction on record:** the first contrast sweep parsed `lab()` values as RGB and produced a bogus 1.43:1. It was rebuilt through a canvas and re-run before any ratio was published. Every number here comes from the corrected method.

---

## Headline: the fix already existed

```css
/* src/app/globals.css */
--color-accent-gold:        #C8392E;  /* was gold #C8A96B — now Ember */
--color-accent-gold-text:   #E8776B;  /* readable tint of Ember for text (5:1) */
--color-accent-violet:      #4A2D6E;  /* was violet #9B6ED0 — now Bruise */
--color-accent-violet-text: #B79EE0;  /* Bruise is too dark to read on the void (8:1) */
```

Usage at audit time versus after remediation:

| Token | Measured | Before | After |
|---|---|---|---|
| `text-accent-violet` | **1.73:1** ❌ | 423 | **0** |
| `text-accent-violet-text` | 8.67:1 ✅ | 1 | **427** |
| `text-accent-gold` | **3.93:1** ❌ | 949 | 58 (verified large text / icons) |
| `text-accent-gold-text` | 7.03:1 ✅ | 0 | **891** |

Someone chose accessible tints that preserve the palette and wrote the ratios down in comments. The call sites were never migrated. The remediation was **adoption, not redesign** — hue unchanged, only lightness.

Measured against `--term-bg` `#04060a`:

| Token | Before | After |
|---|---|---|
| violet | 1.83:1 — failed at *every* size, graphics included | **8.67:1** |
| gold | 3.94:1 | **7.03:1** |
| crimson | 3.64:1 | **7.12:1** |

`--accent-crimson` was a third failing token this audit missed entirely; it was caught by the prior `59cc241` work and is now fixed too.

---

## Findings by severity

### Critical — all shipped

**A11Y-01 · `--accent-violet` at 1.73:1, 423 call sites.** Below the 3:1 floor even for large text and graphics — it failed at every size. It carried the topic chips, which are the site's primary lateral-navigation affordance, so users with any low vision could not see the way to the next page.

| Ratio | Size | Text |
|---|---|---|
| 1.73:1 | 10px | "Mythology & Lore" (topic chip) |
| 1.77:1 | 9px | "⬡ Interpretive Layer" (provenance label) |
| 1.77:1 | 11px | "The Ageless Wisdom" (related-topic chip) |

**A11Y-02 · `--accent-gold` at 3.93:1, 949 call sites.** Fails AA for normal text; passes only at ≥24px (or ≥18.66px bold). Two of the failures were conversion-critical: the **Sign In** button (3.73:1) and the consent banner's **Accept** (3.93:1).

The `<h1>` on every episode page measured 3.94:1 — technically a *pass* as large text, but rendering dark red on near-black and barely legible in the screenshot.

**A11Y-08 · Opacity-modified text (found while fixing A11Y-04).** 290 call sites carry an opacity modifier that composites the fixed tint back toward the ground:

| Class | Count | Ratio | Normal text |
|---|---|---|---|
| `gold/60` | 81 | 3.08 | FAIL |
| `violet/60` | 53 | 3.64 | FAIL |
| `gold/70` | 41 | 3.85 | FAIL |
| `gold/50` | 15 | 2.45 | FAIL (fails 3:1 too) |
| `violet/50` | 14 | 2.83 | FAIL (fails 3:1 too) |

**Shipped:** floors computed against `--term-bg-2` `#0b0f18` — the *lightest* surface this text sits on, so they hold on page, panel and card alike:

| Token | Floor | Ratio at floor |
|---|---|---|
| `accent-violet-text` | **/70** | 4.53:1 |
| `accent-gold-text` | **/80** | 4.60:1 |
| `accent-crimson-text` | **/80** | 4.67:1 |

233 occurrences raised. **274 of 290 now pass**; the other 16 are hand-reviewed decoration (the `mystical-divider` SVGs, standalone `✦ ◈ ψ ◑` glyphs, two watermarks already carrying `aria-hidden`, an 8rem decorative quotation mark, and an icon already clearing 3:1).

> **Two heuristics failed before this was right**, and both are instructive. An opacity-based rule ("≤45% must be decorative") wrongly exempted **"Suggest corrections →"** — a link at 1.98:1, and the site's own accountability channel. A same-line text scan then wrongly classified 240 items as decorative, because JSX puts element text on the *next* line. The third pass used a 4-line lookahead, defaulted to *raise unless provably decorative*, and all 25 flagged items were reviewed by hand — **9 were forced back into the raise set**, including a `$10/mo` pricing link and the transcript timestamp buttons.

**Known trade-off:** gold's floor is `/80`, so `/50`, `/60`, `/65` and `/70` all collapse onto `/80` and stop reading as distinct tiers. Preserving that hierarchy would need dimmer *tokens* rather than alpha — a larger design change, not attempted.

### Serious — shipped

**A11Y-05 · Touch targets.** At 375×812, **34 of 44** interactive targets were under 24×24 CSS px (WCAG 2.2 AA 2.5.8). The consistent failure was *height* — 16px of line box with no padding.

| Element | Before | After |
|---|---|---|
| Footer nav links (×26) | 58×16 | **58×24** |
| Social channels (×3) | 85×16 | **85×24** |
| Entry-banner dismiss | 11×18 | **24×24** |
| Wordmark | 104×19 | **104×24** |

**Under-24 targets: 34 → 4.** Verified by applying the exact declarations to the live DOM and re-measuring, then confirming the built CSS emits `min-height:calc(var(--spacing) * 6)` with `--spacing:.25rem` = exactly 24px. The remaining four are exempt by rule: the 1×1 skip link (visually-hidden-until-focused, the standard pattern), "Start here →" (inline in a sentence — 2.5.8 exempts inline links), and the 7×13 `ψ` glyph (the deliberately obscure `/basement` easter egg).

**A11Y-06 · Heading hierarchy.** Reported as an `H1 → H3` skip. Measuring `/topics/consciousness` live revealed something worse:

```
H1  consciousness
H3  Episodes (80)          <- SectionCard
H2  <episode title>  ×80   <- EpisodeListItem, nested INSIDE that H3
```

**Eighty list items each announced themselves a level above the section containing them.** Heading navigation reported 80 siblings of the page title instead of 80 children of one section.

Both components hardcoded their level, so no caller could express a correct outline. Each now takes an optional `headingLevel` defaulting to what it already rendered, so nothing changes for callers that don't opt in. Applied where nesting is confirmed: `episodes/[slug]`, `topics/[slug]`, `lore/[slug]`, `people/[slug]`, `people/the-rest`. Result: `h1 → h2 → h3`. Deliberately untouched: `/episodes` (items sit directly under the page `h1`) and `series/[slug]` (not nested).

### Moderate — open

**A11Y-07 · Missing `<main>`.** Of 134 static routes, **2** lack it: `/psychenomicon` and `/settings/notifications`. Both break the skip link, whose target is `#main-content`. A substantial improvement over the ~50 routes noted in earlier project history.

---

## Verified passes

Measured, not assumed:

| Check | Result |
|---|---|
| **Focus visibility** | **0 of 40** tested elements lacked a visible focus change |
| **Skip link** | Present and correctly wired: "Skip to main content" → `#main-content` |
| **Images without `alt`** | **0** across all 367 crawled pages |
| **Links / buttons without accessible name** | 0 |
| **Form fields without labels** | 0 |
| **Generic link text** ("click here", "read more") | 0 |
| **`lang` attribute** | 367/367 |
| **Horizontal scroll at 375px** | None — `scrollWidth` 375 = viewport |
| **Landmarks** | `main`, `nav`, `header`, `footer` present on content pages |
| **`prefers-reduced-motion`** | **Honoured** — 17 references; `AmbientVisualSystem`, CRT overlay and gameshow FX all gate on it |
| **CLS** | 0 |

The reduced-motion support deserves credit: for a site this animation-forward, `crt-overlay.tsx` and `AmbientVisualSystem.tsx` both check the media query rather than treating it as an afterthought.

---

## Not tested

- **Screen reader behaviour** with a real AT (NVDA/JAWS/VoiceOver). Programmatic checks are not a substitute, particularly given the inner-scroll-container architecture (UX-02), which is exactly the pattern that can behave unexpectedly with AT virtual cursors. **This is the highest-value remaining accessibility test.**
- **Keyboard traversal of modals and menus** — focus trapping and Escape handling not exercised.
- **400% zoom reflow** (WCAG 1.4.10).
- **Authenticated interfaces** — member, initiate and admin surfaces.
- **Real hardware** — viewport emulation only.
