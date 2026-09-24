# Brand Book Audit — Cult of Psyche vs. cultcodex-v2

*Source: `cult_of_psyche_brand_book_by_pomelli.pdf` (7pp, Pomelli). Audited against `src/app/globals.css`, `src/app/layout.tsx`, and `/dossier` on 16 Aug 2026.*

---

## Headline: the site already has a rival design system, and it won on purpose

The repo does not merely *drift* from the brand book — it **deliberately replaced it**. `globals.css` documents a system called **Sacred Terminal**, sourced from an in-repo "Visual Audit Dossier" (`/dossier`), complete with allocation rules (70% void/ink, 20% bone, 7% ember, 2% sulphur, 1% phosphor) and usage doctrine.

The smoking gun is in the CSS comments:

```css
--color-accent-gold: #C8392E;   /* was gold #C8A96B — now Ember */
--color-accent-violet: #4A2D6E; /* was violet #9B6ED0 — now Bruise */
--color-accent-cyan: #62E4C8;   /* was cyan #5DB7D8 — now Phosphor */
```

`#C8A96B` is **exactly** the brand book's Warm Gold. The site used to be on brand and was moved off it by an intentional, documented decision.

**So this isn't a cleanup job — it's a choice.** See "The decision you actually have to make" at the bottom. Nothing has been repainted; the extracted tokens ship as an inert file you can opt into.

---

## 1. Color

### Brand book palette

| Name | Hex | RGB | HSL |
|---|---|---|---|
| Jet Black | `#030303` | 3, 3, 3 | 0, 0%, 1% |
| Warm Gold | `#C8A96B` | 200, 169, 107 | 40, 46%, 60% |
| Capri Blue | `#22D3EE` | 34, 211, 238 | 188, 86%, 53% |
| Vivid Violet | `#6A0DE1` | 106, 13, 225 | 266, 89%, 47% |
| Coral Red | `#F87171` | 248, 113, 113 | 0, 91%, 71% |

### What the site actually ships

| Role | Site token | Hex | Brand-book counterpart | Match? |
|---|---|---|---|---|
| Background | `--color-void` | `#07060A` | Jet Black `#030303` | Near — site is a touch blue-violet, not neutral |
| Surface / elevated | `--color-surface` / `--color-elevated` | `#0C0B11` / `#141219` | *(none defined)* | Site-only extension |
| Body text | `--color-text-primary` | `#EBE3D2` (Bone) | *(none defined)* | Site-only extension |
| Muted text | `--color-text-muted` | `#9A907D` | *(none defined)* | Site-only extension |
| Primary accent / CTA | `--color-accent-gold` | `#C8392E` (Ember) | Warm Gold `#C8A96B` | **Conflict** — same token name, different hue family |
| Mystical / Oracle | `--color-accent-violet` | `#4A2D6E` (Bruise) | Vivid Violet `#6A0DE1` | **Conflict** — far darker, far less saturated |
| System-state pips | `--color-accent-cyan` | `#62E4C8` (Phosphor) | Capri Blue `#22D3EE` | **Conflict** — green-cyan vs. blue-cyan |
| Danger / warning | `--color-accent-crimson` | `#A94A4A` | Coral Red `#F87171` | **Conflict** — muted vs. bright |
| Rare accent | `--color-accent-sulphur` | `#D6A017` | *(none defined)* | Site-only extension |

**Net: one near-match (background), four direct conflicts, five site-only tokens the brand book has no answer for.**

### Accessibility notes (worth knowing before you choose)

Contrast against the site's near-black background, `#07060A`:

| Brand book color | Ratio | Verdict |
|---|---|---|
| Capri Blue `#22D3EE` | 11.18 | Excellent |
| Warm Gold `#C8A96B` | 8.99 | Excellent |
| Coral Red `#F87171` | 7.30 | Good |
| **Vivid Violet `#6A0DE1`** | **2.65** | **Fails AA for text and for UI (needs 3.0)** |

| Current site color | Ratio | Verdict |
|---|---|---|
| Bone `#EBE3D2` | 15.83 | Excellent (body text) |
| Phosphor `#62E4C8` | 12.94 | Excellent |
| Sulphur `#D6A017` | 8.56 | Excellent |
| Ember `#C8392E` | 3.93 | Large text / UI only — fails AA for body copy |
| Bruise `#4A2D6E` | 1.82 | Background-only, as the CSS already states |

Both palettes have one color that can't carry text on the dark ground. The brand book's Vivid Violet is the weaker of the two and would need a lightened text tint — exactly the workaround the site already invented for Bruise (`--color-accent-violet-text: #B79EE0`).

A practical middle path: the brand book's **Warm Gold and Capri Blue are strictly better performers than Ember**, and Warm Gold reads as more "prestige archive" than Ember's alarm-red. If the goal is prestige CTAs, brand-book gold is arguably the stronger choice on its own merits.

---

## 2. Typography

| Role | Brand book | Site reality |
|---|---|---|
| Primary typeface | **Angkor** | **Not present anywhere in the repo.** |
| Secondary typeface | **IBM Plex Mono** | Loaded — but bound to `--font-mono-fallback` and *overridden* by JetBrains Mono on `--font-mono`. Effectively a fallback only. |

The site instead runs a **six-font** stack via `next/font/google`: Space Grotesk (`--font-display`), Inter (`--font-body`), Playfair Display (`--font-serif`), JetBrains Mono (`--font-mono`), VT323 (`--font-crt`), IBM Plex Mono (fallback) — plus Bodoni Moda, Cinzel and Cormorant Garamond loaded locally on `/` and `/dossier`.

**Findings:**

- Brand compliance on type is effectively **zero**: the primary face is absent and the secondary is demoted.
- Nine distinct families across the site is a real performance and coherence cost, independent of any brand question. `/dossier` already flags this ("Bodoni Moda + Cinzel are heavy — subset aggressively").
- Angkor is a Khmer-script display face with a limited Latin set and a single weight. It will not carry a UI on its own — realistically it's a logo/wordmark and hero-headline face, with something else doing the work below H1. Worth deciding consciously rather than by default.

---

## 3. Logo

Brand book specifies **25px clear space on all sides** and a **0.83in / 80px minimum width**. I found no logo-component constraint in the repo encoding either rule. Low priority, but if there's a header wordmark it's worth a min-width guard.

---

## 4. Voice, values, aesthetic

The brand book is unusually clear here, and this part **does not conflict** with anything in the repo:

- **Values:** Transformation, Awakening, Transparency, Community, Neutrality
- **Tone:** Mystic · Unfiltered · Analytical · Community-centric
- **Aesthetic:** Mystical Archive · Dark Academia · Digital Alchemy · Coded Esoterica · Sophisticated Mystery
- **Positioning line:** *"I do not ask for worship. I ask for awakening."*

Notably, the Sacred Terminal direction is a *faithful* expression of "Coded Esoterica" and "Digital Alchemy" — arguably more so than the brand book's own palette. The conflict is at the level of specific hex values, not intent.

The positioning line is also a near-perfect fit with the handbook's ethical spine — "awakening, not worship" is the same idea as keeping the exits lit.

---

## The decision you actually have to make

You can't hold both palettes; they use the same token names for different colors. Three coherent options:

1. **Brand book wins.** Repaint Sacred Terminal's accents to Warm Gold / Capri Blue / Vivid Violet / Coral Red. Cost: undoes the dossier work; needs a text-tint for Vivid Violet. Gain: the brand book becomes true, and gold outperforms ember on contrast.
2. **Sacred Terminal wins.** Treat the Pomelli book as superseded for color and type; keep it for voice, values and logo rules. Cost: the brand book is misleading to anyone you hand it to — worth annotating the PDF or noting it in `CLAUDE.md`. Gain: zero churn, keeps a more developed system.
3. **Split by surface** (my suggestion). Sacred Terminal keeps the *product* — the terminal/vault/archive UI it was designed for. Brand book governs *brand touchpoints* — logo, wordmark, social, thumbnails, merch, the deck. Cost: two documented palettes, needs a written boundary or it rots. Gain: both artifacts stay true, and the split matches how each was actually designed.

Whichever you pick, the voice and values section should be adopted wholesale — it's the strongest part of the book and it collides with nothing.
