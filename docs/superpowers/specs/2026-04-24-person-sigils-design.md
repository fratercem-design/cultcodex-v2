# Person Sigils — Design

**Status:** shipped 2026-04-24
**Date:** 2026-04-24

## Goal

Replace the current initial-in-gold-circle fallback for people without an `avatarUrl` with a deterministic alchemical-style SVG sigil. All 577 person records currently have `avatarUrl = null`; this gives every person a distinctive, on-brand visual identity without sourcing real photos or requiring manual work.

## Constraints

- **No schema change.** `Person.avatarUrl` stays `null` for every record. When/if a real photo is ever uploaded, the existing conditional (`avatarUrl ? <img/> : <fallback/>`) causes it to win automatically.
- **No HTTP requests, no DB writes, no caching layer.** Sigils are pure inline SVG rendered in React. Stateless, SSR-compatible.
- **Deterministic.** Same slug → same sigil across every render, every deploy, every user.
- **Themed.** Matches the existing purple-dark + gold/green/cyan/muted palette and feels like part of the show's mystical aesthetic, not a generic identicon.

## Architecture

### New component: `src/components/ui/person-sigil.tsx`

Server-renderable (pure markup, no `"use client"`, no hooks, no state).

```ts
interface PersonSigilProps {
  slug: string;              // primary hash key (stable across renames)
  name: string;              // aria-label only
  personType: PersonType;    // tint selector (host | recurring | guest | mentioned)
  size?: number;             // default 40 — controls viewBox scale
  className?: string;        // allows callers to add rounded border etc.
}

export function PersonSigil({ slug, name, personType, size = 40, className }: PersonSigilProps): JSX.Element;
```

### Hash function

Simple 32-bit FNV-1a (or equivalent) over the slug string. Pure function, inline in the component file. Returns a `number`; downstream selectors read different bit ranges:

- Bits 0-2: primary glyph index (3 bits → 8 primitives)
- Bit 3: inner ring present?
- Bits 4-6: accent mark corner (N/NE/E/SE/S/SW/W/NW)
- Bits 7-9: accent primitive index
- Bit 10: primary glyph rotation flag (0° vs 180°)
- Bits 11-12: crescent rotation (0°/90°/180°/270°) when primary is crescent

### Tint map

| personType | Tailwind class (existing in palette) |
|---|---|
| host | `text-accent-gold` |
| recurring | `text-accent-purple` |
| guest | `text-accent-green` |
| mentioned | `text-accent-cyan` |

All SVG strokes use `stroke="currentColor"`. The root wrapper sets the tint class, so both the ring and glyphs share the tier color. This matches the existing `StatusBadge` palette so the design system stays coherent.

### Primitive vocabulary (SVG on `viewBox="0 0 40 40"`)

Eight primitives. The hash picks one primary (indices 0-5) and one accent (indices 6-7).

1. **Vertical bar** — centered line, y=8 to y=32
2. **Horizontal bar** — centered line, x=8 to x=32
3. **Cross** — vertical + horizontal combined
4. **Crescent** — quarter-arc, radius 8, rotatable in 90° increments
5. **Upright triangle** — equilateral, centered
6. **Inverted triangle** — equilateral, centered, flipped
7. **Dot triad** (accent only) — three 1.5px filled dots in a triangular arrangement
8. **Hatch cluster** (accent only) — four 3px diagonal strokes arranged in a 2x2 grid

### Composition rules

For every render:

1. **Outer ring** (always): `<circle cx=20 cy=20 r=18 stroke-width=1.5 fill=none />`.
2. **Inner ring** (if `hash & 0x8`): `<circle cx=20 cy=20 r=14 stroke-width=0.5 stroke-opacity=0.5 fill=none />`. Skipped at sizes below 24px.
3. **Primary glyph** (always, index from hash bits 0-2): one of primitives 1-6, centered at (20, 20), 1.5px stroke, rotation applied for crescents per bit 11-12.
4. **Accent mark** (if `size >= 24`): one of primitives 7-8, placed on the outer ring at a compass-point position picked from hash bits 4-6. Position on a circle of radius 18 (same radius as the outer ring), so the accent sits *on* the ring line, decorating it like runes on a sigil wheel.

### Size scaling

- `size < 24` (e.g. 16px inline contexts): render only outer ring + primary glyph. Drop inner ring and accent.
- `size` 24-79: full composition, 1.5px strokes.
- `size >= 80` (hero contexts, 120-160px): scale strokes proportionally (`Math.max(1.5, size / 60)`) so the sigil doesn't look anemic.

### Accessibility

- `role="img"` on the root `<svg>`.
- `aria-label={name}` (so screen readers announce the person's name, not "image").
- Decorative only — no `<title>` or `<desc>` elements beyond the aria-label.

## Call sites

Four existing components conditionally render `avatarUrl`. Each gets the same `avatarUrl ? <img/> : <PersonSigil/>` pattern.

| File | Current fallback | Change |
|---|---|---|
| `src/components/archive/person-card.tsx` (line 31-41) | gold circle with first letter | replace fallback branch with `<PersonSigil slug={person.slug} name={person.displayName} personType={person.personType} size={40} className="border border-accent-gold/20" />` |
| `src/components/episodes/guest-grid.tsx` (line 27-39) | gold circle with first letter | same swap, same size |
| `src/components/episodes/quote-highlight-card.tsx` (line 39-49) | gold circle with first letter, 24×24 | same swap, `size={24}`. Requires adding `speakerSlug?: string | null` and `speakerType?: PersonType \| null` props (see "Prop threading" below). |
| `src/components/ui/entity-hero.tsx` (line 48-56) | no fallback (image disappears when null) | add optional `fallbackAvatar?: React.ReactNode` prop. Person detail page passes `<PersonSigil size={80} />`; other detail pages (episodes, lore, topics, series) leave it undefined so nothing changes for them. |

### Prop threading for `QuoteHighlightCard`

`QuoteHighlightCard` currently receives `speakerName` + `speakerAvatarUrl`. It needs two new optional props to render a sigil fallback: `speakerSlug` and `speakerType`. Four callers pass `q.speaker?.avatarUrl` today; all four already query the full `speaker` relation (confirmed via Prisma schema — `Quote.speaker` is a `Person` relation). Updating each call site to also pass `speakerSlug={q.speaker?.slug}` and `speakerType={q.speaker?.personType}` is a one-line addition per site.

Callers to update:
- `src/app/episodes/[slug]/page.tsx:379`
- `src/app/page.tsx:300`
- `src/app/people/[slug]/page.tsx:187` (passes `person.avatarUrl` directly — also needs person.slug + person.personType)
- `src/app/quotes/page.tsx:171`

If `speakerSlug` is missing at render (defensive — shouldn't happen in normal flow), `PersonSigil` renders its "void" variant (outer ring only, no glyph).

### `EntityHero` fallback slot

`EntityHero` is shared across all entity detail pages. We cannot hardcode a person sigil in it because episode/lore/topic/series heroes also use this component and would get inappropriate sigils.

Change: add `fallbackAvatar?: React.ReactNode` prop. Render it inside the existing avatar `<div>` when `avatarUrl` is null. Only the person detail page at `src/app/people/[slug]/page.tsx` passes a sigil into the slot:

```tsx
<EntityHero
  title={person.displayName}
  avatarUrl={person.avatarUrl}
  fallbackAvatar={
    <PersonSigil
      slug={person.slug}
      name={person.displayName}
      personType={person.personType}
      size={80}
      className="h-14 w-14 sm:h-20 sm:w-20 rounded-full border-2 border-accent-gold/40"
    />
  }
  {...rest}
/>
```

All other pages using `EntityHero` leave `fallbackAvatar` undefined — their behavior is identical to today.

## Edge cases

1. **Slug missing at render time** — fall back to `hash(name)`. Both missing → render void variant (outer ring only, no glyph).
2. **Unknown `personType`** — default to `guest` tint (green).
3. **Very small sizes (`< 24px`)** — render only outer ring + primary glyph; drop inner ring and accent for legibility. No primary glyph becomes a pure ring if size is tiny (`< 16`).
4. **Very large sizes (`>= 80px`)** — scale stroke widths proportionally so the glyph reads at hero scale.
5. **SSR** — pure JSX, no `useState`, no `useEffect`, no `window`. Renders identically on server and client.
6. **Hash collisions across 577 records** — 32-bit hash space is ~4×10⁹; probability of any two of 577 slugs colliding is vanishingly small and irrelevant (even a collision would just mean two different people share a sigil — not a correctness bug).

## What this design does NOT include

Explicit YAGNI exclusions:

- No admin UI for preview / regeneration / manual override.
- No writing generated SVGs to `avatarUrl` field or elsewhere in the DB.
- No photo-upload workflow (separate concern, separate phase if ever wanted).
- No animation or interactivity.
- No per-sigil manual overrides beyond the existing `avatarUrl` escape hatch.
- No unit tests — visual verification on `/people` is sufficient given the component's purity and determinism.

## File summary

**New files (1):**
- `src/components/ui/person-sigil.tsx`

**Modified files (8):**
- `src/components/archive/person-card.tsx` — swap fallback branch
- `src/components/episodes/guest-grid.tsx` — swap fallback branch
- `src/components/episodes/quote-highlight-card.tsx` — swap fallback branch + add 2 props
- `src/components/ui/entity-hero.tsx` — add `fallbackAvatar?` prop
- `src/app/people/[slug]/page.tsx` — pass sigil into `EntityHero.fallbackAvatar` + thread slug/type into `QuoteHighlightCard`
- `src/app/episodes/[slug]/page.tsx` — thread `speakerSlug` + `speakerType` into `QuoteHighlightCard`
- `src/app/page.tsx` — thread `speakerSlug` + `speakerType` into `QuoteHighlightCard`
- `src/app/quotes/page.tsx` — thread `speakerSlug` + `speakerType` into `QuoteHighlightCard`

## Verification

1. Run `pnpm dev`, browse `/people`.
2. Confirm all 577 tiles show sigils instead of letter-in-circle fallbacks.
3. Spot-check tier tints: hosts look gold, recurring purple, guests green, mentioned cyan.
4. Spot-check that no two adjacent tiles render identical sigils by chance.
5. Browse a few person detail pages — hero shows large sigil.
6. Browse episode detail, quotes page, homepage — quote cards render small sigils for speakers without photos.
7. Confirm no regression on entity detail pages that don't use the sigil (episode/lore/topic/series heroes look identical to before).
