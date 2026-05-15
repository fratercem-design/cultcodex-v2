# Person Sigils Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current initial-in-circle avatar fallback for all 577 `Person` records with a deterministic alchemical-sigil SVG component.

**Architecture:** One new pure-JSX React component (`PersonSigil`) renders an inline SVG sigil deterministically from `person.slug`. It is wired into 4 existing call sites (`PersonCard`, `GuestGrid`, `QuoteHighlightCard`, `EntityHero`) using the existing `avatarUrl ? <img/> : <fallback/>` pattern. No schema change, no HTTP, no DB writes — `avatarUrl` remains the escape hatch for any future uploaded photo.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4 with CSS-variable-driven `accent-gold`/`accent-purple`/`accent-green`/`accent-cyan` classes, Prisma 7.4.2 (for `PersonType` enum type-import).

**No unit tests.** Per the spec, verification is type-check + visual QA on `/people`. The component is pure and deterministic — same slug always renders the same sigil — so a live browser pass is sufficient.

**Spec:** `docs/superpowers/specs/2026-04-24-person-sigils-design.md`

---

## File Structure

**New file (1):**
- `src/components/ui/person-sigil.tsx` — the sigil component (hash + primitives + composition + accessibility)

**Modified files (8):**
- `src/components/archive/person-card.tsx` — swap fallback branch
- `src/components/episodes/guest-grid.tsx` — swap fallback branch
- `src/components/episodes/quote-highlight-card.tsx` — add `speakerSlug` + `speakerType` props, swap fallback branch
- `src/components/ui/entity-hero.tsx` — add optional `fallbackAvatar?: React.ReactNode` prop
- `src/app/people/[slug]/page.tsx` — pass `<PersonSigil>` into `EntityHero.fallbackAvatar`, thread slug/type into `QuoteHighlightCard`
- `src/app/episodes/[slug]/page.tsx` — thread `speakerSlug` + `speakerType` into `QuoteHighlightCard`
- `src/app/page.tsx` — thread `speakerSlug` + `speakerType` into `QuoteHighlightCard`
- `src/app/quotes/page.tsx` — thread `speakerSlug` + `speakerType` into `QuoteHighlightCard`

---

## Task 1: Create `PersonSigil` component

**Files:**
- Create: `src/components/ui/person-sigil.tsx`

- [ ] **Step 1: Create the file with the full component**

Create `src/components/ui/person-sigil.tsx` with this content:

```tsx
import type { PersonType } from "@/generated/prisma/client";

interface PersonSigilProps {
  slug: string;
  name: string;
  personType: PersonType;
  size?: number;
  className?: string;
}

// 32-bit FNV-1a hash — deterministic, fast, pure.
function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

const TINT_CLASS: Record<PersonType, string> = {
  host: "text-accent-gold",
  recurring: "text-accent-purple",
  guest: "text-accent-green",
  mentioned: "text-accent-cyan",
};

// 8 compass positions for the accent mark, on a ring of radius 18.
// Angles in degrees, 0° = top, clockwise.
const COMPASS_POINTS: Array<{ x: number; y: number }> = Array.from(
  { length: 8 },
  (_, i) => {
    const angle = (i * 45 - 90) * (Math.PI / 180);
    return {
      x: 20 + 18 * Math.cos(angle),
      y: 20 + 18 * Math.sin(angle),
    };
  },
);

function renderPrimary(
  index: number,
  crescentRot: number,
  stroke: number,
): JSX.Element {
  const s = stroke;
  switch (index % 6) {
    case 0: // vertical bar
      return <line x1={20} y1={8} x2={20} y2={32} strokeWidth={s} />;
    case 1: // horizontal bar
      return <line x1={8} y1={20} x2={32} y2={20} strokeWidth={s} />;
    case 2: // cross
      return (
        <g>
          <line x1={20} y1={8} x2={20} y2={32} strokeWidth={s} />
          <line x1={8} y1={20} x2={32} y2={20} strokeWidth={s} />
        </g>
      );
    case 3: // crescent (quarter-arc), rotatable
      return (
        <path
          d="M 20 12 A 8 8 0 0 1 28 20"
          strokeWidth={s}
          fill="none"
          transform={`rotate(${crescentRot * 90} 20 20)`}
        />
      );
    case 4: // upright triangle
      return (
        <polygon
          points="20,10 30,28 10,28"
          strokeWidth={s}
          fill="none"
          strokeLinejoin="round"
        />
      );
    case 5: // inverted triangle
      return (
        <polygon
          points="10,12 30,12 20,30"
          strokeWidth={s}
          fill="none"
          strokeLinejoin="round"
        />
      );
    default:
      return <line x1={20} y1={8} x2={20} y2={32} strokeWidth={s} />;
  }
}

function renderAccent(
  index: number,
  cornerIdx: number,
  stroke: number,
): JSX.Element | null {
  const { x, y } = COMPASS_POINTS[cornerIdx % 8];
  const s = stroke;
  switch (index % 2) {
    case 0: {
      // dot triad — three small filled dots around (x, y)
      const r = 1.2;
      return (
        <g fill="currentColor" stroke="none">
          <circle cx={x - 1.5} cy={y - 1.0} r={r} />
          <circle cx={x + 1.5} cy={y - 1.0} r={r} />
          <circle cx={x} cy={y + 1.5} r={r} />
        </g>
      );
    }
    case 1: {
      // hatch cluster — four short diagonal strokes in 2x2
      return (
        <g>
          <line x1={x - 2} y1={y - 2} x2={x} y2={y} strokeWidth={s * 0.8} />
          <line x1={x + 1} y1={y - 2} x2={x + 3} y2={y} strokeWidth={s * 0.8} />
          <line x1={x - 2} y1={y + 1} x2={x} y2={y + 3} strokeWidth={s * 0.8} />
          <line
            x1={x + 1}
            y1={y + 1}
            x2={x + 3}
            y2={y + 3}
            strokeWidth={s * 0.8}
          />
        </g>
      );
    }
    default:
      return null;
  }
}

export function PersonSigil({
  slug,
  name,
  personType,
  size = 40,
  className,
}: PersonSigilProps): JSX.Element {
  const hashKey = slug || name || "void";
  const hash = fnv1a(hashKey);

  const primaryIdx = hash & 0x7;
  const hasInnerRing = (hash & 0x8) !== 0;
  const accentCorner = (hash >> 4) & 0x7;
  const accentIdx = (hash >> 7) & 0x1;
  const crescentRot = (hash >> 11) & 0x3;

  // Size-based draw rules.
  const drawInnerRing = hasInnerRing && size >= 24;
  const drawAccent = size >= 24;
  const drawPrimary = size >= 16;
  const stroke = Math.max(1.5, size / 60);

  const tint = TINT_CLASS[personType] ?? TINT_CLASS.guest;

  return (
    <svg
      role="img"
      aria-label={name}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={`${tint} ${className ?? ""}`.trim()}
      stroke="currentColor"
      fill="none"
    >
      <circle cx={20} cy={20} r={18} strokeWidth={stroke} />
      {drawInnerRing && (
        <circle
          cx={20}
          cy={20}
          r={14}
          strokeWidth={stroke * 0.5}
          strokeOpacity={0.5}
        />
      )}
      {drawPrimary && renderPrimary(primaryIdx, crescentRot, stroke)}
      {drawAccent && renderAccent(accentIdx, accentCorner, stroke)}
    </svg>
  );
}
```

- [ ] **Step 2: Type-check the new file**

Run: `pnpm lint src/components/ui/person-sigil.tsx`
Expected: no errors. If eslint complains about unused imports or `any`, fix inline.

- [ ] **Step 3: Deterministic-output sanity check**

Run the following one-liner to verify the hash is deterministic and varies across slugs:

```bash
npx tsx -e "
const fnv1a = (str) => { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; };
for (const s of ['psyche', 'trix', 'mr-rude', 'bea', 'alexandra-mayers', 'alexander-mcqueen']) {
  const h = fnv1a(s);
  console.log(s.padEnd(20), h.toString(16).padStart(8, '0'), 'primary=' + (h & 0x7), 'innerRing=' + ((h & 0x8) !== 0), 'accentCorner=' + ((h >> 4) & 0x7), 'accentIdx=' + ((h >> 7) & 0x1));
}
"
```

Expected: six different 8-hex-digit hashes; `primary` values should span at least 3 different indices across the six slugs. Run twice and confirm byte-identical output both times.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/person-sigil.tsx
git commit -m "feat(sigil): add PersonSigil component for deterministic alchemical avatars"
```

---

## Task 2: Wire `PersonSigil` into `PersonCard`

**Files:**
- Modify: `src/components/archive/person-card.tsx:23-41`

- [ ] **Step 1: Replace the fallback branch**

Open `src/components/archive/person-card.tsx`. Replace the imports section (currently at the top) and the conditional block at lines 31-41. After edit, the file should read:

```tsx
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { PersonSigil } from "@/components/ui/person-sigil";
import type { PersonType } from "@/generated/prisma/client";

interface PersonCardProps {
  person: {
    displayName: string;
    slug: string;
    shortBio: string | null;
    avatarUrl?: string | null;
    personType: PersonType;
    appearanceCount: number;
  };
}

const typeVariant: Record<PersonType, "green" | "purple" | "gold" | "muted"> = {
  host: "gold",
  recurring: "purple",
  guest: "green",
  mentioned: "muted",
};

export function PersonCard({ person }: PersonCardProps) {
  return (
    <Link
      href={`/people/${person.slug}`}
      className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-gold/30 hover:bg-elevated"
    >
      {person.avatarUrl ? (
        <img
          src={person.avatarUrl}
          alt={person.displayName}
          className="h-10 w-10 flex-shrink-0 rounded-full object-cover border border-accent-gold/20"
        />
      ) : (
        <PersonSigil
          slug={person.slug}
          name={person.displayName}
          personType={person.personType}
          size={40}
          className="flex-shrink-0 rounded-full border border-accent-gold/20 p-0.5"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-gold transition-colors truncate">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-gold/60 mr-1.5 align-middle" />
            {person.displayName}
          </h3>
          <StatusBadge label={person.personType} variant={typeVariant[person.personType]} />
        </div>
        {person.shortBio && (
          <p className="mt-1 text-xs text-text-muted line-clamp-2">
            {person.shortBio}
          </p>
        )}
        <p className="mt-1.5 font-mono text-[10px] text-text-muted">
          {person.appearanceCount} appearance{person.appearanceCount !== 1 ? "s" : ""}
        </p>
      </div>
    </Link>
  );
}
```

(The unused `initial` local variable is removed; `PersonSigil` replaces the initial-in-circle fallback.)

- [ ] **Step 2: Type-check**

Run: `pnpm lint src/components/archive/person-card.tsx`
Expected: no errors.

- [ ] **Step 3: Visual check**

Run: `pnpm dev` (in a background shell if not already running). Browse `http://localhost:3000/people` and confirm:
- Every person tile now renders an SVG sigil (circle + glyph) instead of a letter-in-circle.
- Sigils vary across tiles (not all identical).
- Tints differ by person type — hosts and guests currently share the same hex (`#C8A96B`) so they'll look identical; recurring (purple `#6E4BAE`) and mentioned (cyan `#5DB7D8`) should stand out.

- [ ] **Step 4: Commit**

```bash
git add src/components/archive/person-card.tsx
git commit -m "feat(sigil): replace initial-in-circle fallback on PersonCard"
```

---

## Task 3: Wire `PersonSigil` into `GuestGrid`

**Files:**
- Modify: `src/components/episodes/guest-grid.tsx:1-48`

- [ ] **Step 1: Replace the fallback branch**

Rewrite `src/components/episodes/guest-grid.tsx` to:

```tsx
import Link from "next/link";
import Image from "next/image";
import { SectionCard } from "@/components/ui/section-card";
import { PersonSigil } from "@/components/ui/person-sigil";
import type { PersonType } from "@/generated/prisma/client";

interface Guest {
  displayName: string;
  slug: string;
  avatarUrl: string | null;
  personType: PersonType;
}

interface GuestGridProps {
  guests: Guest[];
}

export function GuestGrid({ guests }: GuestGridProps) {
  if (guests.length === 0) return null;

  return (
    <SectionCard title={`Guests (${guests.length})`}>
      <div className="grid grid-cols-4 gap-3">
        {guests.map((guest) => (
          <Link
            key={guest.slug}
            href={`/people/${guest.slug}`}
            className="group flex flex-col items-center gap-1.5"
          >
            {guest.avatarUrl ? (
              <Image
                src={guest.avatarUrl}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-transparent object-cover transition-colors group-hover:border-accent-gold"
              />
            ) : (
              <PersonSigil
                slug={guest.slug}
                name={guest.displayName}
                personType={guest.personType}
                size={40}
                className="rounded-full border-2 border-transparent transition-colors group-hover:border-accent-gold"
              />
            )}
            <span className="w-full truncate text-center font-mono text-[10px] text-text-muted transition-colors group-hover:text-accent-gold">
              {guest.displayName}
            </span>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}
```

Note the new `personType: PersonType` field on the `Guest` interface.

- [ ] **Step 2: Ensure callers pass `personType`**

`GuestGrid` is used in 4 places. Each caller builds a `Guest` object from a Prisma `Person` relation — they all already have `personType` available but may not currently be selecting it.

Check each caller and confirm `personType` is both selected and passed:

```bash
pnpm lint src/app/episodes/\[slug\]/page.tsx src/app/lore/\[slug\]/page.tsx src/app/page.tsx src/app/topics/\[slug\]/page.tsx
```

For any file that errors with "Property 'personType' is missing," open the file, find the mapping that builds the `GuestGrid` `guests` array, and add `personType: g.person.personType` (or equivalent) to the mapped object. Also ensure `personType: true` is in the Prisma `select` block if not already there (most likely it is, since the card query is usually `select: { displayName: true, slug: true, avatarUrl: true, personType: true, ... }`).

- [ ] **Step 3: Type-check the whole repo**

Run: `pnpm lint`
Expected: no errors. If there are type errors in GuestGrid callers, fix by following step 2.

- [ ] **Step 4: Visual check**

With `pnpm dev` running, open an episode detail page that has guests without avatars — e.g. `http://localhost:3000/episodes/<any-slug-with-guests>`. Confirm the guest grid renders sigils for any guest without an `avatarUrl`.

- [ ] **Step 5: Commit**

```bash
git add src/components/episodes/guest-grid.tsx src/app/episodes/\[slug\]/page.tsx src/app/lore/\[slug\]/page.tsx src/app/page.tsx src/app/topics/\[slug\]/page.tsx
git commit -m "feat(sigil): replace initial-in-circle fallback on GuestGrid"
```

(Only stage the caller files that actually needed a `personType` addition — `git status` first to see which changed.)

---

## Task 4: Extend `QuoteHighlightCard` + wire sigil fallback

**Files:**
- Modify: `src/components/episodes/quote-highlight-card.tsx:1-66`

- [ ] **Step 1: Add new props and replace the fallback branch**

Rewrite `src/components/episodes/quote-highlight-card.tsx` to:

```tsx
import { QuoteShareButton } from "@/components/quotes/share-button";
import { PersonSigil } from "@/components/ui/person-sigil";
import { formatSeconds } from "@/lib/format/duration";
import type { PersonType } from "@/generated/prisma/client";

interface QuoteHighlightCardProps {
  id: string;
  text: string;
  speakerName?: string | null;
  speakerAvatarUrl?: string | null;
  speakerSlug?: string | null;
  speakerType?: PersonType | null;
  timestampSeconds?: number | null;
}

export function QuoteHighlightCard({
  id,
  text,
  speakerName,
  speakerAvatarUrl,
  speakerSlug,
  speakerType,
  timestampSeconds,
}: QuoteHighlightCardProps) {
  return (
    <div className="relative rounded-lg border border-border bg-elevated p-5 border-l-[3px] border-l-red-400/50">
      {/* Decorative quote mark */}
      <span
        className="pointer-events-none absolute top-3 left-4 font-serif text-5xl leading-none text-red-400/15 select-none"
        aria-hidden="true"
      >
        {"\u201C"}
      </span>

      {/* Quote text */}
      <p className="relative z-10 pl-4 text-base italic leading-relaxed text-text-primary">
        &ldquo;{text}&rdquo;
      </p>

      {/* Attribution + share */}
      <div className="mt-4 flex items-center justify-between pl-4">
        <div className="flex items-center gap-2">
          {speakerName && (
            <>
              {speakerAvatarUrl ? (
                <img
                  src={speakerAvatarUrl}
                  alt=""
                  className="h-6 w-6 rounded-full border border-accent-gold/30"
                />
              ) : speakerSlug ? (
                <PersonSigil
                  slug={speakerSlug}
                  name={speakerName}
                  personType={speakerType ?? "guest"}
                  size={24}
                  className="rounded-full border border-accent-gold/30"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-gold/20 text-[10px] font-bold text-accent-gold">
                  {speakerName[0]?.toUpperCase()}
                </div>
              )}
              <span className="font-mono text-xs font-medium text-accent-gold">
                {speakerName}
              </span>
            </>
          )}
          {timestampSeconds != null && (
            <span className="font-mono text-[10px] text-text-muted">
              at {formatSeconds(timestampSeconds)}
            </span>
          )}
        </div>
        <QuoteShareButton quoteId={id} quoteText={text} />
      </div>
    </div>
  );
}
```

The old letter-in-circle fallback is kept as a last-resort path for callers that haven't threaded `speakerSlug` yet — this means Task 4 ships safely on its own without breaking any existing caller. Task 5 then threads the new props through all four callers so the sigil path becomes active everywhere.

- [ ] **Step 2: Type-check**

Run: `pnpm lint src/components/episodes/quote-highlight-card.tsx`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/episodes/quote-highlight-card.tsx
git commit -m "feat(sigil): add speakerSlug/speakerType props + sigil fallback on QuoteHighlightCard"
```

---

## Task 5: Thread `speakerSlug` + `speakerType` through all 4 `QuoteHighlightCard` callers

**Files:**
- Modify: `src/app/episodes/[slug]/page.tsx:373-381` (approximate)
- Modify: `src/app/page.tsx:295-305` (approximate)
- Modify: `src/app/people/[slug]/page.tsx:183-190` (approximate)
- Modify: `src/app/quotes/page.tsx:165-175` (approximate)

- [ ] **Step 1: Locate each `<QuoteHighlightCard` usage**

Run: `grep -rn "speakerAvatarUrl" src/app`

Expected output — 4 lines, one per caller:
```
src/app/episodes/[slug]/page.tsx:N:                          speakerAvatarUrl={q.speaker?.avatarUrl}
src/app/page.tsx:N:                  speakerAvatarUrl={q.speaker?.avatarUrl}
src/app/people/[slug]/page.tsx:N:                      speakerAvatarUrl={person.avatarUrl}
src/app/quotes/page.tsx:N:                        speakerAvatarUrl={quote.speaker?.avatarUrl}
```

- [ ] **Step 2: Add `speakerSlug` + `speakerType` to each JSX usage**

For each of the three `q.speaker` / `quote.speaker` callers, add the two extra props right after `speakerAvatarUrl`. Example for `src/app/episodes/[slug]/page.tsx`:

```tsx
<QuoteHighlightCard
  key={q.id}
  id={q.id}
  text={q.text}
  speakerName={q.speaker?.displayName}
  speakerAvatarUrl={q.speaker?.avatarUrl}
  speakerSlug={q.speaker?.slug}
  speakerType={q.speaker?.personType}
  timestampSeconds={q.timestampSeconds}
/>
```

Apply the same two-line addition in:
- `src/app/page.tsx` (homepage, `q.speaker?.slug` / `q.speaker?.personType`)
- `src/app/quotes/page.tsx` (`quote.speaker?.slug` / `quote.speaker?.personType`)

For `src/app/people/[slug]/page.tsx`, the speaker IS the person being viewed — it passes `person.avatarUrl` directly rather than via a relation. Change:

```tsx
speakerAvatarUrl={person.avatarUrl}
```

to:

```tsx
speakerAvatarUrl={person.avatarUrl}
speakerSlug={person.slug}
speakerType={person.personType}
```

- [ ] **Step 3: Verify each Prisma `select` already includes `slug` + `personType`**

For the three non-person-page callers, confirm the Prisma query that produces `q.speaker` (or `quote.speaker`) selects `slug: true` and `personType: true`. Run:

```bash
grep -rn "speaker: {" src/app src/lib 2>/dev/null
```

For each matched block, confirm `select: { displayName: true, slug: true, avatarUrl: true, personType: true, ... }` is present. If any are missing `slug` or `personType`, add them — they are both scalar fields so this is a one-line addition per `select` block with no DB cost.

- [ ] **Step 4: Type-check the whole repo**

Run: `pnpm lint`
Expected: no errors. If there are errors about `slug` or `personType` missing on the speaker object, step 3 missed a `select` block — fix and re-run.

- [ ] **Step 5: Visual check**

With `pnpm dev` running:
- Browse `http://localhost:3000/` — scroll to the quote section, confirm sigils render for quote speakers without photos.
- Browse an episode page with quotes — confirm sigils there.
- Browse `http://localhost:3000/quotes` — confirm sigils.
- Browse a person detail page (`http://localhost:3000/people/<slug>`) — confirm the inline quote cards show the same sigil as that person.

- [ ] **Step 6: Commit**

```bash
git add src/app/episodes/\[slug\]/page.tsx src/app/page.tsx src/app/people/\[slug\]/page.tsx src/app/quotes/page.tsx src/lib/queries
git commit -m "feat(sigil): thread speakerSlug/speakerType into QuoteHighlightCard callers"
```

(Only stage the files that actually changed — `git status` first.)

---

## Task 6: Add `EntityHero.fallbackAvatar` prop + wire sigil on person detail

**Files:**
- Modify: `src/components/ui/entity-hero.tsx:1-72`
- Modify: `src/app/people/[slug]/page.tsx` (EntityHero call site)

- [ ] **Step 1: Add the optional `fallbackAvatar` prop to `EntityHero`**

Open `src/components/ui/entity-hero.tsx`. Add `fallbackAvatar?: React.ReactNode` to the props interface and render it when `avatarUrl` is null. Full rewrite:

```tsx
import Image from "next/image";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/ui/status-badge";

interface HeroBadge {
  label: string;
  variant: "green" | "purple" | "gold" | "muted";
}

interface EntityHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage: string;
  avatarUrl?: string | null;
  fallbackAvatar?: ReactNode;
  badges?: HeroBadge[];
}

export function EntityHero({
  title,
  subtitle,
  backgroundImage,
  avatarUrl,
  fallbackAvatar,
  badges,
}: EntityHeroProps) {
  return (
    <section className="relative flex min-h-[160px] sm:min-h-[200px] items-end overflow-hidden">
      <Image
        src={backgroundImage}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-void via-black/70 to-black/50" />

      {/* Top-right badges */}
      {badges && badges.length > 0 && (
        <div className="absolute top-4 right-4 z-10 flex items-start gap-2">
          {badges.map((b) => (
            <StatusBadge key={b.label} label={b.label} variant={b.variant} />
          ))}
        </div>
      )}

      {/* Title area */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-6">
        <div className="flex items-end gap-4">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={80}
              height={80}
              className="h-14 w-14 sm:h-20 sm:w-20 rounded-full border-2 border-accent-gold/40 object-cover shadow-lg"
            />
          ) : (
            fallbackAvatar
          )}
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-accent-gold drop-shadow-md">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 font-mono text-sm text-accent-cyan">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
```

This is a **backwards-compatible change**: all existing callers (episode, lore, topic, series heroes) pass no `fallbackAvatar`, get `undefined`, and React renders nothing — identical to current behavior when `avatarUrl` is null.

- [ ] **Step 2: Pass a large `PersonSigil` into `EntityHero.fallbackAvatar` on the person detail page**

Open `src/app/people/[slug]/page.tsx` and find the `<EntityHero` block (earlier grep showed it around line 130 area). Ensure `import { PersonSigil } from "@/components/ui/person-sigil";` is at the top of the file, then add `fallbackAvatar` to the JSX:

```tsx
<EntityHero
  title={person.displayName}
  subtitle={/* existing */}
  backgroundImage={/* existing */}
  avatarUrl={person.avatarUrl}
  fallbackAvatar={
    <PersonSigil
      slug={person.slug}
      name={person.displayName}
      personType={person.personType}
      size={80}
      className="h-14 w-14 sm:h-20 sm:w-20 rounded-full border-2 border-accent-gold/40 shadow-lg"
    />
  }
  badges={/* existing */}
/>
```

Keep every existing prop as-is; just add the new `fallbackAvatar` prop.

- [ ] **Step 3: Type-check**

Run: `pnpm lint src/components/ui/entity-hero.tsx src/app/people/\[slug\]/page.tsx`
Expected: no errors.

- [ ] **Step 4: Visual check**

With `pnpm dev` running, browse a person detail page for someone without an uploaded photo (e.g., `http://localhost:3000/people/psyche`). Confirm the hero now renders a large (80px) sigil in the same position where the 56×56 / 80×80 avatar image would be. Also browse an episode detail page (`/episodes/...`) and a lore page to confirm **no visual change** on those — `fallbackAvatar` is undefined there, so the hero looks exactly the same as before.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/entity-hero.tsx src/app/people/\[slug\]/page.tsx
git commit -m "feat(sigil): add fallbackAvatar slot to EntityHero + render large sigil on person hero"
```

---

## Task 7: Full-site verification + production build + push

- [ ] **Step 1: Run the production build**

Run: `pnpm build`
Expected: clean build, no type errors, no missing env var warnings (this will also run `prisma migrate deploy` — it should report nothing to apply if the schema is up to date).

- [ ] **Step 2: Visual QA checklist**

With `pnpm dev` running (or a local `pnpm start` after the build), click through every call site and confirm sigils render correctly:

- [ ] `/` (homepage) — quote-speaker sigils in "Featured Signals" / quote cards
- [ ] `/people` — all 577 tiles show varied sigils, no letter-in-circle fallbacks remain
- [ ] `/people/psyche` — large sigil in hero; inline quote cards show small sigil
- [ ] `/people/<any-guest-slug>` — medium sigil matches the one shown in their card
- [ ] `/episodes` — timeline / list / grid views render (no regression)
- [ ] `/episodes/<any-slug>` — guest grid sigils + quote speaker sigils
- [ ] `/episodes/<any-slug>` hero — **unchanged** (no sigil on episode hero — correct, `fallbackAvatar` not passed)
- [ ] `/lore/<any-slug>` hero — **unchanged**
- [ ] `/topics/<any-slug>` hero — **unchanged**
- [ ] `/series/<any-slug>` hero — **unchanged**
- [ ] `/quotes` — sigils on quote speakers
- [ ] Check 2-3 sigils at different scales (24px inline, 40px grid, 80px hero) — strokes should scale proportionally, shapes should stay legible

- [ ] **Step 3: Sanity-check determinism**

Hard-refresh the same person's page twice (Ctrl+Shift+R). Confirm the sigil is byte-identical — same glyph, same rotation, same accent position.

- [ ] **Step 4: Push to master**

```bash
git push origin master
```

Expected: Vercel auto-deploy triggers (~50s). Watch the Vercel deploy page or check `https://cultcodex.me/people` after deploy finishes — confirm sigils appear on production.

- [ ] **Step 5: Update spec status**

After successful deploy, edit `docs/superpowers/specs/2026-04-24-person-sigils-design.md` and change the status line from:

```markdown
**Status:** approved, ready for implementation plan
```

to:

```markdown
**Status:** shipped 2026-04-24
```

Commit:

```bash
git add docs/superpowers/specs/2026-04-24-person-sigils-design.md
git commit -m "docs(sigil): mark spec as shipped"
git push
```

---

## Done

All 577 person records now render a deterministic alchemical sigil in every call site where their avatar appears. No schema change, no external dependencies, no DB writes. Any future manually-uploaded photo will automatically win over the sigil via the existing `avatarUrl ? <img/> : <fallback/>` conditional.
