# Phase 3: Visual Richness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance episode pages with 5 visual component upgrades using existing data — no schema changes.

**Architecture:** Create new presentational components (`EpisodeStatsPanel`, `GuestGrid`, `QuoteHighlightCard`, `EpisodeHero`, `EpisodeGlanceBar`) and integrate them into the existing episode detail page at `src/app/episodes/[slug]/page.tsx`. All data is already loaded via `getEpisodeBySlug()` and supporting queries.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, TypeScript, Vitest

**Design tokens reference:** obsidian `#0A0A0F`, parchment `#F3EEDF`, gold `#C8A96B` (alias `accent-gold`), violet `#6E4BAE` (alias `accent-purple`), cyan (alias `accent-cyan`), green (alias `accent-green`). Fonts: Space Grotesk (`font-display`), Inter (`font-sans`), IBM Plex Mono (`font-mono`).

---

### Task 1: Episode Stats Panel

**Files:**
- Create: `src/components/episodes/episode-stats-panel.tsx`
- Modify: `src/app/episodes/[slug]/page.tsx`

**Step 1: Create the EpisodeStatsPanel component**

Create `src/components/episodes/episode-stats-panel.tsx`:

```tsx
import { SectionCard } from "@/components/ui/section-card";

interface EpisodeStatsPanelProps {
  guestCount: number;
  quoteCount: number;
  segmentCount: number;
  reactionTotal: number;
  commentCount: number;
}

const STATS = [
  { icon: "\uD83C\uDFA4", label: "Guests" },
  { icon: "\uD83D\uDCAC", label: "Quotes" },
  { icon: "\uD83D\uDCDD", label: "Transcript" },
  { icon: "\uD83D\uDD25", label: "Reactions" },
  { icon: "\uD83D\uDDE8\uFE0F", label: "Comments" },
] as const;

export function EpisodeStatsPanel({
  guestCount,
  quoteCount,
  segmentCount,
  reactionTotal,
  commentCount,
}: EpisodeStatsPanelProps) {
  const values = [guestCount, quoteCount, segmentCount, reactionTotal, commentCount];
  const hasAnyData = values.some((v) => v > 0);

  if (!hasAnyData) return null;

  return (
    <SectionCard title="At a Glance">
      <div className="space-y-2">
        {STATS.map((stat, i) => {
          const count = values[i];
          if (count === 0) return null;
          return (
            <div key={stat.label} className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono text-xs text-text-muted">
                <span className="text-sm">{stat.icon}</span>
                {stat.label}
              </span>
              <span className="font-mono text-xs font-semibold text-text-primary">
                {count}{stat.label === "Transcript" ? " segments" : ""}
              </span>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
```

**Step 2: Integrate into episode page**

In `src/app/episodes/[slug]/page.tsx`, import the component:

```tsx
import { EpisodeStatsPanel } from "@/components/episodes/episode-stats-panel";
```

Add it in the sidebar (after the Metadata `SectionCard`, before Guests):

```tsx
<EpisodeStatsPanel
  guestCount={episode.guests.length}
  quoteCount={episode.quotes.length}
  segmentCount={episode.segments.length}
  reactionTotal={reactionCounts.fire + reactionCounts.eye + reactionCounts.moon + reactionCounts.skull + reactionCounts.wildcard}
  commentCount={commentsData.totalCount}
/>
```

**Step 3: Verify build passes**

Run: `npx next build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add src/components/episodes/episode-stats-panel.tsx src/app/episodes/[slug]/page.tsx
git commit -m "feat: add episode stats panel to sidebar"
```

---

### Task 2: Guest Photo Grid

**Files:**
- Create: `src/components/episodes/guest-grid.tsx`
- Modify: `src/app/episodes/[slug]/page.tsx`

**Step 1: Create the GuestGrid component**

Create `src/components/episodes/guest-grid.tsx`:

```tsx
import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";

interface Guest {
  displayName: string;
  slug: string;
  avatarUrl: string | null;
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
              <img
                src={guest.avatarUrl}
                alt={guest.displayName}
                className="h-10 w-10 rounded-full border-2 border-transparent object-cover transition-colors group-hover:border-accent-gold"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-transparent bg-accent-gold/20 text-sm font-bold text-accent-gold transition-colors group-hover:border-accent-gold">
                {guest.displayName[0]?.toUpperCase()}
              </div>
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

**Step 2: Replace EntityChipList for guests in episode page**

In `src/app/episodes/[slug]/page.tsx`, import `GuestGrid`:

```tsx
import { GuestGrid } from "@/components/episodes/guest-grid";
```

Replace the guests `SectionCard` + `EntityChipList` block:

```tsx
{/* OLD — remove this block */}
<SectionCard>
  <EntityChipList
    title="Guests"
    entities={episode.guests.map((g) => ({
      label: g.person.displayName,
      slug: g.person.slug,
      type: "person" as const,
    }))}
  />
</SectionCard>

{/* NEW — replace with */}
<GuestGrid
  guests={episode.guests.map((g) => ({
    displayName: g.person.displayName,
    slug: g.person.slug,
    avatarUrl: g.person.avatarUrl,
  }))}
/>
```

**Step 3: Verify build passes**

Run: `npx next build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/episodes/guest-grid.tsx src/app/episodes/[slug]/page.tsx
git commit -m "feat: add guest photo grid to episode sidebar"
```

---

### Task 3: Quote Highlight Cards

**Files:**
- Create: `src/components/episodes/quote-highlight-card.tsx`
- Modify: `src/app/episodes/[slug]/page.tsx`

**Step 1: Create the QuoteHighlightCard component**

Create `src/components/episodes/quote-highlight-card.tsx`:

```tsx
import { QuoteShareButton } from "@/components/quotes/share-button";
import { formatSeconds } from "@/lib/format/duration";

interface QuoteHighlightCardProps {
  id: string;
  text: string;
  speakerName?: string | null;
  speakerAvatarUrl?: string | null;
  timestampSeconds?: number | null;
}

export function QuoteHighlightCard({
  id,
  text,
  speakerName,
  speakerAvatarUrl,
  timestampSeconds,
}: QuoteHighlightCardProps) {
  return (
    <div className="relative rounded-lg border border-border bg-elevated p-5 border-l-[3px] border-l-accent-gold/50">
      {/* Decorative quote mark */}
      <span
        className="pointer-events-none absolute top-3 left-4 font-serif text-5xl leading-none text-accent-gold/15 select-none"
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
                  className="h-6 w-6 rounded-full"
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

**Step 2: Replace inline blockquotes in episode page**

In `src/app/episodes/[slug]/page.tsx`, import the component:

```tsx
import { QuoteHighlightCard } from "@/components/episodes/quote-highlight-card";
```

Replace the quotes section content:

```tsx
{/* OLD — remove the blockquote map */}
{episode.quotes.map((q) => (
  <blockquote ...>...</blockquote>
))}

{/* NEW — replace with */}
{episode.quotes.map((q) => (
  <QuoteHighlightCard
    key={q.id}
    id={q.id}
    text={q.text}
    speakerName={q.speaker?.displayName}
    speakerAvatarUrl={q.speaker?.avatarUrl}
    timestampSeconds={q.timestampSeconds}
  />
))}
```

**Step 3: Verify build passes**

Run: `npx next build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/episodes/quote-highlight-card.tsx src/app/episodes/[slug]/page.tsx
git commit -m "feat: add quote highlight cards with speaker avatars"
```

---

### Task 4: Enhanced Hero Section

**Files:**
- Create: `src/components/episodes/episode-hero.tsx`
- Modify: `src/app/episodes/[slug]/page.tsx`

**Step 1: Create the EpisodeHero component**

Create `src/components/episodes/episode-hero.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";

interface EpisodeHeroProps {
  title: string;
  subtitle: string;
  thumbnailUrl?: string | null;
  episodeNumber?: number | null;
  contentType: string;
  series?: { title: string; slug: string } | null;
}

export function EpisodeHero({
  title,
  subtitle,
  thumbnailUrl,
  episodeNumber,
  contentType,
  series,
}: EpisodeHeroProps) {
  const bgSrc = thumbnailUrl || "/wiki-page-header.jpg";
  const epNum = episodeNumber
    ? `EP.${String(episodeNumber).padStart(3, "0")}`
    : null;

  return (
    <section className="relative flex min-h-[220px] items-end overflow-hidden">
      <Image
        src={bgSrc}
        alt=""
        fill
        priority
        className={`object-cover ${thumbnailUrl ? "blur-sm scale-105" : ""}`}
        unoptimized={!!thumbnailUrl}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-void via-black/70 to-black/50" />

      {/* Top badges */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between">
        {epNum && (
          <span className="rounded-full border border-accent-gold/40 bg-accent-gold/15 px-3 py-1 font-mono text-xs font-bold text-accent-gold backdrop-blur-sm">
            {epNum}
          </span>
        )}
        {contentType !== "original" && (
          <StatusBadge
            label={contentType.toUpperCase()}
            variant={contentType === "livestream" ? "purple" : "muted"}
          />
        )}
      </div>

      {/* Title area */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-accent-gold drop-shadow-md">
          {title}
        </h1>
        <p className="mt-1 font-mono text-sm text-accent-cyan">{subtitle}</p>
        {series && (
          <Link
            href={`/series/${series.slug}`}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-accent-purple/30 bg-accent-purple-dim px-2.5 py-0.5 font-mono text-[10px] text-accent-purple transition-colors hover:border-accent-purple/50"
          >
            {series.title}
          </Link>
        )}
      </div>
    </section>
  );
}
```

**Step 2: Replace PageHero in episode page**

In `src/app/episodes/[slug]/page.tsx`, import `EpisodeHero`:

```tsx
import { EpisodeHero } from "@/components/episodes/episode-hero";
```

Replace the `<PageHero>` usage:

```tsx
{/* OLD — remove */}
<PageHero
  title={episode.title}
  subtitle={...}
  backgroundImage="/wiki-page-header.jpg"
/>

{/* NEW — replace with */}
<EpisodeHero
  title={episode.title}
  subtitle={[epNum, formatDate(episode.airDate), formatDuration(episode.duration)]
    .filter(Boolean)
    .join(" \u00b7 ")}
  thumbnailUrl={episode.thumbnailUrl}
  episodeNumber={episode.episodeNumber}
  contentType={episode.contentType}
  series={episode.series ? { title: episode.series.title, slug: episode.series.slug } : null}
/>
```

Also remove the `PageHero` import if no longer used in this file.

**Step 3: Verify build passes**

Run: `npx next build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/episodes/episode-hero.tsx src/app/episodes/[slug]/page.tsx
git commit -m "feat: add dynamic episode hero with thumbnail backgrounds and badges"
```

---

### Task 5: Episode "At a Glance" Bar

**Files:**
- Create: `src/components/episodes/episode-glance-bar.tsx`
- Modify: `src/app/episodes/[slug]/page.tsx`

**Step 1: Create the EpisodeGlanceBar component**

Create `src/components/episodes/episode-glance-bar.tsx`:

```tsx
import Link from "next/link";
import { formatDate } from "@/lib/format/date";
import { formatDuration } from "@/lib/format/duration";

interface EpisodeGlanceBarProps {
  contentType: string;
  series?: { title: string; slug: string } | null;
  airDate: Date | null;
  duration: string | null;
  guestCount: number;
}

const CONTENT_TYPE_ICONS: Record<string, string> = {
  livestream: "\uD83C\uDFA4",
  original: "\uD83C\uDFAC",
  short: "\u26A1",
  clip: "\u2702\uFE0F",
};

export function EpisodeGlanceBar({
  contentType,
  series,
  airDate,
  duration,
  guestCount,
}: EpisodeGlanceBarProps) {
  const icon = CONTENT_TYPE_ICONS[contentType] ?? "\uD83C\uDFAC";

  return (
    <div className="mx-auto max-w-7xl px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Content type */}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[10px] text-text-muted">
          <span className="text-xs">{icon}</span>
          {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
        </span>

        {/* Series */}
        {series && (
          <Link
            href={`/series/${series.slug}`}
            className="inline-flex items-center rounded-full border border-accent-purple/30 bg-accent-purple-dim px-2.5 py-1 font-mono text-[10px] text-accent-purple transition-colors hover:border-accent-purple/50"
          >
            {series.title}
          </Link>
        )}

        {/* Air date */}
        <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[10px] text-text-muted">
          {formatDate(airDate)}
        </span>

        {/* Duration */}
        {duration && (
          <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[10px] text-text-muted">
            {formatDuration(duration)}
          </span>
        )}

        {/* Guest count */}
        {guestCount > 0 && (
          <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[10px] text-text-muted">
            {guestCount} guest{guestCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Add the glance bar to episode page**

In `src/app/episodes/[slug]/page.tsx`, import:

```tsx
import { EpisodeGlanceBar } from "@/components/episodes/episode-glance-bar";
```

Insert between the breadcrumb nav / hero and the `<main>` grid:

```tsx
<EpisodeGlanceBar
  contentType={episode.contentType}
  series={episode.series ? { title: episode.series.title, slug: episode.series.slug } : null}
  airDate={episode.airDate}
  duration={episode.duration}
  guestCount={episode.guests.length}
/>
```

**Step 3: Remove duplicate metadata from hero subtitle**

Since the glance bar now shows air date, duration, and episode number, simplify the hero subtitle to just the episode number (or remove it entirely since the badge covers it). Update the `EpisodeHero` subtitle prop:

```tsx
<EpisodeHero
  ...
  subtitle={episode.summaryShort ?? ""}
  ...
/>
```

This puts the short synopsis in the hero subtitle instead of the metadata that's now in the glance bar.

**Step 4: Verify build passes**

Run: `npx next build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/components/episodes/episode-glance-bar.tsx src/app/episodes/[slug]/page.tsx
git commit -m "feat: add episode at-a-glance bar with content type and metadata pills"
```

---

### Task 6: Final Build Verification & Deploy

**Step 1: Run full build**

Run: `npx next build`
Expected: Build succeeds with all routes.

**Step 2: Deploy to production**

Run: `npx vercel --prod`
Expected: Deployed to `cultcodex.me`.

**Step 3: Commit any remaining changes**

```bash
git status
# If any uncommitted files, add and commit
```
