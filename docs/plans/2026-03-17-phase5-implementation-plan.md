# Phase 5: Homepage & List Page Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the homepage into a rich dashboard and polish all 6 index pages with stats bars, enhanced cards, and visual consistency with the Phase 3-4 detail pages.

**Architecture:** Server components with aggregate queries. Two new client components (ArchiveStatsBar, ViewToggle). Three existing card components enhanced with optional props. All index pages get EntityGlanceBar stats rows.

**Tech Stack:** Next.js 16, Tailwind CSS v4, Prisma 7, existing component library from Phases 3-4.

---

### Task 1: ArchiveStatsBar Component (animated counters)

**Files:**
- Create: `src/components/archive/archive-stats-bar.tsx`

**Step 1: Create the component**

```tsx
// src/components/archive/archive-stats-bar.tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface StatItem {
  icon: string;
  label: string;
  value: number;
}

interface ArchiveStatsBarProps {
  stats: StatItem[];
}

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (value === 0) return;
    const duration = 1200;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [value]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

export function ArchiveStatsBar({ stats }: ArchiveStatsBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-border bg-surface p-4 text-center transition-colors hover:border-accent-green/30"
        >
          <span className="text-lg">{stat.icon}</span>
          <p className="mt-1 font-mono text-2xl font-bold text-accent-green">
            <AnimatedCounter value={stat.value} />
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npx next build`
Expected: Clean compile, no errors.

**Step 3: Commit**

```bash
git add src/components/archive/archive-stats-bar.tsx
git commit -m "feat: add ArchiveStatsBar with animated counters"
```

---

### Task 2: ViewToggle Component

**Files:**
- Create: `src/components/archive/view-toggle.tsx`

**Step 1: Create the component**

```tsx
// src/components/archive/view-toggle.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface ViewToggleProps {
  basePath: string;
  currentView: string;
}

export function ViewToggle({ basePath, currentView }: ViewToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setView = useCallback(
    (view: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (view === "card") {
        params.delete("view");
      } else {
        params.set("view", view);
      }
      const qs = params.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath);
    },
    [router, searchParams, basePath],
  );

  return (
    <div className="flex rounded border border-border overflow-hidden">
      <button
        onClick={() => setView("card")}
        className={`px-2.5 py-1.5 transition-colors ${
          currentView !== "list"
            ? "bg-accent-green/15 text-accent-green"
            : "text-text-muted hover:text-text-primary hover:bg-elevated"
        }`}
        title="Card view"
        aria-label="Card view"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />
          <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />
          <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />
          <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
        </svg>
      </button>
      <button
        onClick={() => setView("list")}
        className={`px-2.5 py-1.5 transition-colors ${
          currentView === "list"
            ? "bg-accent-green/15 text-accent-green"
            : "text-text-muted hover:text-text-primary hover:bg-elevated"
        }`}
        title="List view"
        aria-label="List view"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <line x1="4" y1="6" x2="20" y2="6" strokeWidth="2" strokeLinecap="round" />
          <line x1="4" y1="12" x2="20" y2="12" strokeWidth="2" strokeLinecap="round" />
          <line x1="4" y1="18" x2="20" y2="18" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npx next build`
Expected: Clean compile.

**Step 3: Commit**

```bash
git add src/components/archive/view-toggle.tsx
git commit -m "feat: add ViewToggle component for list/card view switching"
```

---

### Task 3: Enhance EpisodeCard with thumbnailUrl

**Files:**
- Modify: `src/components/archive/episode-card.tsx`
- Modify: `src/lib/queries/episodes.ts` (EpisodeCardData interface + formatEpisodeForCard)

**Step 1: Add thumbnailUrl to EpisodeCardData**

In `src/lib/queries/episodes.ts`, add `thumbnailUrl` to the `EpisodeCardData` interface and `formatEpisodeForCard`:

Change the interface from:
```tsx
export interface EpisodeCardData {
  id: string;
  title: string;
  slug: string;
  episodeNumber: number | null;
  airDate: Date | null;
  summaryShort: string | null;
  status: ContentStatus;
  guestNames: string[];
  topicNames: string[];
}
```
To:
```tsx
export interface EpisodeCardData {
  id: string;
  title: string;
  slug: string;
  episodeNumber: number | null;
  airDate: Date | null;
  summaryShort: string | null;
  thumbnailUrl: string | null;
  status: ContentStatus;
  guestNames: string[];
  topicNames: string[];
}
```

In `formatEpisodeForCard`, add `thumbnailUrl: episode.thumbnailUrl,` after the `summaryShort` line.

**Step 2: Add thumbnail to EpisodeCard**

Replace the entire content of `src/components/archive/episode-card.tsx` with:

```tsx
import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/format/date";
import { StatusBadge } from "@/components/ui/status-badge";
import type { EpisodeCardData } from "@/lib/queries/episodes";

interface EpisodeCardProps {
  episode: EpisodeCardData;
}

export function EpisodeCard({ episode }: EpisodeCardProps) {
  const epNum = episode.episodeNumber
    ? `EP.${String(episode.episodeNumber).padStart(3, "0")}`
    : null;

  return (
    <Link
      href={`/episodes/${episode.slug}`}
      className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-green/30 hover:bg-elevated"
    >
      {episode.thumbnailUrl ? (
        <Image
          src={episode.thumbnailUrl}
          alt=""
          width={64}
          height={64}
          className="h-16 w-16 flex-shrink-0 rounded object-cover"
          unoptimized
        />
      ) : (
        <div className="h-16 w-16 flex-shrink-0 rounded bg-gradient-to-br from-accent-green/10 to-accent-purple/10" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          {epNum && (
            <span className="font-mono text-[10px] text-accent-green font-bold">
              {epNum}
            </span>
          )}
          <span className="font-mono text-[10px] text-text-muted">
            {formatDate(episode.airDate)}
          </span>
        </div>
        <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-green transition-colors truncate">
          {episode.title}
        </h3>
        {episode.summaryShort && (
          <p className="mt-1 text-xs text-text-muted line-clamp-2">
            {episode.summaryShort}
          </p>
        )}
        {(episode.guestNames.length > 0 || episode.topicNames.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {episode.guestNames.map((name) => (
              <StatusBadge key={name} label={name} variant="purple" />
            ))}
            {episode.topicNames.map((name) => (
              <StatusBadge key={name} label={name} variant="muted" />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
```

**Step 3: Verify build**

Run: `npx next build`
Expected: Clean compile.

**Step 4: Commit**

```bash
git add src/lib/queries/episodes.ts src/components/archive/episode-card.tsx
git commit -m "feat: add thumbnail support to EpisodeCard"
```

---

### Task 4: Enhance PersonCard with avatar

**Files:**
- Modify: `src/components/archive/person-card.tsx`

**Step 1: Update PersonCard**

Replace the entire content of `src/components/archive/person-card.tsx` with:

```tsx
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
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
  host: "green",
  recurring: "purple",
  guest: "muted",
  mentioned: "muted",
};

export function PersonCard({ person }: PersonCardProps) {
  const initial = person.displayName[0]?.toUpperCase() ?? "?";

  return (
    <Link
      href={`/people/${person.slug}`}
      className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-purple/30 hover:bg-elevated"
    >
      {person.avatarUrl ? (
        <img
          src={person.avatarUrl}
          alt=""
          className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent-purple/15 font-mono text-sm font-bold text-accent-purple">
          {initial}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-purple transition-colors truncate">
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

**Step 2: Update People index page to pass avatarUrl**

In `src/app/people/page.tsx`, update the `PersonCard` usage to include `avatarUrl`:

Change:
```tsx
<PersonCard
  key={person.id}
  person={{
    displayName: person.displayName,
    slug: person.slug,
    shortBio: person.shortBio,
    personType: person.personType,
    appearanceCount:
      person.guestAppearances.length + person.mentions.length,
  }}
/>
```

To:
```tsx
<PersonCard
  key={person.id}
  person={{
    displayName: person.displayName,
    slug: person.slug,
    shortBio: person.shortBio,
    avatarUrl: person.avatarUrl,
    personType: person.personType,
    appearanceCount:
      person.guestAppearances.length + person.mentions.length,
  }}
/>
```

Also change the grid from 3 columns to 2 columns. Change:
```tsx
<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
```
To:
```tsx
<div className="grid gap-3 sm:grid-cols-2">
```

**Step 3: Verify build**

Run: `npx next build`
Expected: Clean compile.

**Step 4: Commit**

```bash
git add src/components/archive/person-card.tsx src/app/people/page.tsx
git commit -m "feat: add avatar support to PersonCard, update people grid layout"
```

---

### Task 5: Enhance LoreCard with canon border + metadata

**Files:**
- Modify: `src/components/archive/lore-card.tsx`

**Step 1: Update LoreCard**

Replace the entire content of `src/components/archive/lore-card.tsx` with:

```tsx
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type { CanonStatus } from "@/generated/prisma/client";

interface LoreCardProps {
  lore: {
    title: string;
    slug: string;
    category: string | null;
    summary: string | null;
    canonStatus: CanonStatus;
    episodeCount?: number;
    personCount?: number;
  };
}

const canonVariant: Record<CanonStatus, "green" | "purple" | "gold" | "muted"> = {
  canonical: "gold",
  speculative: "purple",
  community_myth: "green",
  disputed: "muted",
  humorous: "muted",
};

const canonBorder: Record<CanonStatus, string> = {
  canonical: "border-l-accent-gold/50",
  speculative: "border-l-accent-purple/50",
  community_myth: "border-l-accent-green/50",
  disputed: "border-l-border",
  humorous: "border-l-border",
};

export function LoreCard({ lore }: LoreCardProps) {
  return (
    <Link
      href={`/lore/${lore.slug}`}
      className={`group block rounded-lg border border-border border-l-[3px] ${canonBorder[lore.canonStatus]} bg-surface p-4 transition-colors hover:border-accent-gold/30 hover:bg-elevated`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-gold transition-colors">
          {lore.title}
        </h3>
        <StatusBadge
          label={lore.canonStatus.replace("_", " ")}
          variant={canonVariant[lore.canonStatus]}
        />
      </div>
      {lore.category && (
        <p className="mt-1 font-mono text-[10px] text-text-muted uppercase">
          {lore.category}
        </p>
      )}
      {lore.summary && (
        <p className="mt-2 text-xs text-text-muted line-clamp-3">
          {lore.summary}
        </p>
      )}
      {(lore.episodeCount != null && lore.episodeCount > 0) ||
       (lore.personCount != null && lore.personCount > 0) ? (
        <div className="mt-2 flex gap-3 font-mono text-[10px] text-text-muted">
          {lore.episodeCount != null && lore.episodeCount > 0 && (
            <span>{lore.episodeCount} episode{lore.episodeCount !== 1 ? "s" : ""}</span>
          )}
          {lore.personCount != null && lore.personCount > 0 && (
            <span>{lore.personCount} {lore.personCount !== 1 ? "people" : "person"}</span>
          )}
        </div>
      ) : null}
    </Link>
  );
}
```

**Step 2: Update Lore index page to pass counts**

In `src/app/lore/page.tsx`, update the `LoreCard` usage to include episode and person counts:

Change:
```tsx
<LoreCard
  key={entry.id}
  lore={{
    title: entry.title,
    slug: entry.slug,
    category: entry.category,
    summary: entry.summary,
    canonStatus: entry.canonStatus,
  }}
/>
```

To:
```tsx
<LoreCard
  key={entry.id}
  lore={{
    title: entry.title,
    slug: entry.slug,
    category: entry.category,
    summary: entry.summary,
    canonStatus: entry.canonStatus,
    episodeCount: entry.episodes.length,
    personCount: entry.people.length,
  }}
/>
```

**Step 3: Verify build**

Run: `npx next build`
Expected: Clean compile.

**Step 4: Commit**

```bash
git add src/components/archive/lore-card.tsx src/app/lore/page.tsx
git commit -m "feat: add canon status border and metadata counts to LoreCard"
```

---

### Task 6: Add stats queries for index pages

**Files:**
- Modify: `src/lib/queries/stats.ts`

**Step 1: Add aggregate queries**

Add the following functions to the end of `src/lib/queries/stats.ts`:

```tsx
export async function getEpisodeAggregates() {
  const [total, earliest, latest, guestCount] = await Promise.all([
    prisma.episode.count({ where: { status: "published" } }),
    prisma.episode.findFirst({
      where: { status: "published", airDate: { not: null } },
      orderBy: { airDate: "asc" },
      select: { airDate: true },
    }),
    prisma.episode.findFirst({
      where: { status: "published", airDate: { not: null } },
      orderBy: { airDate: "desc" },
      select: { airDate: true },
    }),
    prisma.episodeGuest.count(),
  ]);

  return {
    total,
    earliestDate: earliest?.airDate ?? null,
    latestDate: latest?.airDate ?? null,
    totalGuests: guestCount,
  };
}

export async function getPeopleAggregates() {
  const [total, hosts, recurring, guests] = await Promise.all([
    prisma.person.count(),
    prisma.person.count({ where: { personType: "host" } }),
    prisma.person.count({ where: { personType: "recurring" } }),
    prisma.person.count({ where: { personType: "guest" } }),
  ]);

  return { total, hosts, recurring, guests };
}

export async function getLoreAggregates() {
  const [total, canonical, speculative, communityMyth] = await Promise.all([
    prisma.loreEntry.count(),
    prisma.loreEntry.count({ where: { canonStatus: "canonical" } }),
    prisma.loreEntry.count({ where: { canonStatus: "speculative" } }),
    prisma.loreEntry.count({ where: { canonStatus: "community_myth" } }),
  ]);

  return { total, canonical, speculative, communityMyth };
}

export async function getTopicAggregates() {
  const [total, linkedEpisodes] = await Promise.all([
    prisma.topic.count(),
    prisma.episodeTopic.count(),
  ]);

  return { total, linkedEpisodes };
}

export async function getSeriesAggregates() {
  const [total, totalEpisodes] = await Promise.all([
    prisma.series.count(),
    prisma.episode.count({ where: { seriesId: { not: null }, status: "published" } }),
  ]);

  return { total, totalEpisodes };
}
```

**Step 2: Verify build**

Run: `npx next build`
Expected: Clean compile. Note: if `EpisodeGuest` or `EpisodeTopic` model names differ in the Prisma schema, adjust the count table names. Check with: `npx prisma generate` first.

**Step 3: Commit**

```bash
git add src/lib/queries/stats.ts
git commit -m "feat: add aggregate stat queries for index page glance bars"
```

---

### Task 7: Upgrade Homepage

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Rewrite the homepage**

Replace the entire content of `src/app/page.tsx` with:

```tsx
import Image from "next/image";
import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { EpisodeCard } from "@/components/archive/episode-card";
import { ArchiveStatsBar } from "@/components/archive/archive-stats-bar";
import { QuoteHighlightCard } from "@/components/episodes/quote-highlight-card";
import { GuestGrid } from "@/components/episodes/guest-grid";
import { SearchInput } from "@/components/search/search-input";
import { getEpisodes, formatEpisodeForCard } from "@/lib/queries/episodes";
import { getArchiveStats } from "@/lib/queries/stats";
import { getQuotes } from "@/lib/queries/quotes";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format/date";

export default async function HomePage() {
  const [stats, recentEpisodes, recentQuotes, liveStatus] = await Promise.all([
    getArchiveStats(),
    getEpisodes({ take: 6, orderBy: "episodeNumber", order: "desc" }),
    getQuotes({ take: 3 }),
    prisma.liveStatus.findUnique({ where: { id: "singleton" } }),
  ]);

  const recentCards = recentEpisodes.map(formatEpisodeForCard);
  const featured = recentEpisodes[0];
  const isLive = liveStatus?.isLive ?? false;

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[420px] items-center justify-center overflow-hidden">
        <Image
          src="/hero-bg.jpg"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-void" />

        {/* Live banner */}
        {isLive && (
          <Link
            href="/live"
            className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-full bg-red-600/90 px-4 py-1.5 font-mono text-xs font-bold text-white shadow-lg animate-pulse"
          >
            <span className="h-2 w-2 rounded-full bg-white" />
            LIVE NOW
          </Link>
        )}

        <div className="relative z-10 flex flex-col items-center gap-4 px-4 text-center">
          <Image
            src="/logo.jpg"
            alt="Cult of Psyche"
            width={120}
            height={120}
            className="rounded-full border-2 border-accent-gold shadow-lg shadow-accent-gold/20"
          />
          <h1 className="font-display text-4xl font-bold tracking-tight text-accent-gold drop-shadow-lg md:text-5xl">
            Cult of Psyche
          </h1>
          <p className="max-w-lg font-mono text-sm text-accent-cyan">
            The Living Archive of the Cult of Psyche
          </p>

          {/* Search bar */}
          <div className="mt-2 w-full max-w-md">
            <SearchInput />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-10">
        {/* Archive stats */}
        <ArchiveStatsBar
          stats={[
            { icon: "\uD83C\uDFAC", label: "Episodes", value: stats.episodes },
            { icon: "\uD83D\uDC64", label: "People", value: stats.people },
            { icon: "\uD83D\uDCDC", label: "Lore Entries", value: stats.loreEntries },
            { icon: "\uD83D\uDCAC", label: "Quotes", value: stats.quotes },
            { icon: "\uD83C\uDFF7\uFE0F", label: "Topics", value: stats.topics },
            { icon: "\uD83D\uDCDA", label: "Series", value: stats.series },
          ]}
        />

        {/* Featured episode */}
        {featured && (
          <SectionCard title="Featured Episode">
            <Link
              href={`/episodes/${featured.slug}`}
              className="group flex flex-col sm:flex-row items-start gap-4"
            >
              {featured.thumbnailUrl ? (
                <img
                  src={featured.thumbnailUrl}
                  alt=""
                  className="w-full sm:w-48 h-32 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-full sm:w-48 h-32 rounded-lg bg-gradient-to-br from-accent-green/10 to-accent-purple/10 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {featured.episodeNumber && (
                    <span className="font-mono text-[10px] text-accent-green font-bold">
                      EP.{String(featured.episodeNumber).padStart(3, "0")}
                    </span>
                  )}
                  {featured.airDate && (
                    <span className="font-mono text-[10px] text-text-muted">
                      {formatDate(featured.airDate)}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-medium text-text-primary group-hover:text-accent-green transition-colors">
                  {featured.title}
                </h3>
                {featured.summaryShort && (
                  <p className="mt-2 text-sm text-text-muted line-clamp-3">
                    {featured.summaryShort}
                  </p>
                )}
                <GuestGrid
                  guests={featured.guests.map((g) => ({
                    displayName: g.person.displayName,
                    slug: g.person.slug,
                    avatarUrl: g.person.avatarUrl,
                  }))}
                />
              </div>
            </Link>
          </SectionCard>
        )}

        {/* Recent Transmissions */}
        <SectionCard title="Recent Transmissions">
          {recentCards.length > 0 ? (
            <div className="grid gap-3">
              {recentCards.slice(1).map((ep) => (
                <EpisodeCard key={ep.id} episode={ep} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No transmissions yet.</p>
          )}
          <div className="mt-4">
            <Link
              href="/episodes"
              className="font-mono text-xs text-accent-green hover:underline"
            >
              View all episodes →
            </Link>
          </div>
        </SectionCard>

        {/* Recent Quotes */}
        {recentQuotes.length > 0 && (
          <SectionCard title="Notable Quotes">
            <div className="space-y-4">
              {recentQuotes.map((q) => (
                <QuoteHighlightCard
                  key={q.id}
                  id={q.id}
                  text={q.text}
                  speakerName={q.speaker?.displayName}
                  speakerAvatarUrl={q.speaker?.avatarUrl}
                  timestampSeconds={q.timestampSeconds}
                />
              ))}
            </div>
            <div className="mt-4">
              <Link
                href="/quotes"
                className="font-mono text-xs text-accent-green hover:underline"
              >
                Explore all quotes →
              </Link>
            </div>
          </SectionCard>
        )}

        {/* Quick Links */}
        <section>
          <h2 className="mb-4 font-display text-lg font-bold text-accent-gold">
            Explore the Archive
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: "/episodes", icon: "\uD83C\uDFAC", label: "Episodes", count: stats.episodes, desc: "Browse all transmissions" },
              { href: "/people", icon: "\uD83D\uDC64", label: "People", count: stats.people, desc: "Guests, hosts, and figures" },
              { href: "/lore", icon: "\uD83D\uDCDC", label: "Lore", count: stats.loreEntries, desc: "Concepts, doctrines, and myths" },
              { href: "/topics", icon: "\uD83C\uDFF7\uFE0F", label: "Topics", count: stats.topics, desc: "Key themes and subjects" },
              { href: "/series", icon: "\uD83D\uDCDA", label: "Series", count: stats.series, desc: "Collections and arcs" },
              { href: "/quotes", icon: "\uD83D\uDCAC", label: "Quotes", count: stats.quotes, desc: "Notable words and wisdom" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-green/30 hover:bg-elevated"
              >
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-green transition-colors">
                      {item.label}
                    </h3>
                    <span className="font-mono text-[10px] text-accent-green">
                      {item.count}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
```

**Step 2: Verify build**

Run: `npx next build`
Expected: Clean compile. If `featured.guests` is not available (since `formatEpisodeForCard` strips it), access the raw `recentEpisodes[0]` instead (which has full relations from `buildEpisodeInclude()`).

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: redesign homepage with featured episode, stats, quotes, and quick links"
```

---

### Task 8: Upgrade Episodes Index Page

**Files:**
- Modify: `src/app/episodes/page.tsx`

**Step 1: Rewrite the episodes index page**

Replace the entire content of `src/app/episodes/page.tsx` with:

```tsx
import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { EpisodeCard } from "@/components/archive/episode-card";
import { EpisodeListItem } from "@/components/archive/episode-list-item";
import { EmptyState } from "@/components/ui/empty-state";
import { SortFilterBar } from "@/components/archive/sort-filter-bar";
import { ViewToggle } from "@/components/archive/view-toggle";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  getEpisodes,
  formatEpisodeForCard,
  getEpisodeCount,
} from "@/lib/queries/episodes";
import { getEpisodeAggregates } from "@/lib/queries/stats";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";
import { formatDate } from "@/lib/format/date";

export const metadata = {
  title: "Episodes — CULT CODEX",
  description: "Browse all Cult of Psyche episodes",
};

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "A → Z", value: "az" },
];

const FILTER_OPTIONS = [
  { label: "Livestream", value: "livestream" },
  { label: "Original", value: "original" },
  { label: "Short", value: "short" },
  { label: "Clip", value: "clip" },
];

interface EpisodesPageProps {
  searchParams: Promise<{ sort?: string; page?: string; filter?: string; view?: string }>;
}

function resolveSort(sort?: string): {
  orderBy: "episodeNumber" | "airDate";
  order: "asc" | "desc";
} {
  switch (sort) {
    case "oldest":
      return { orderBy: "episodeNumber", order: "asc" };
    case "az":
      return { orderBy: "episodeNumber", order: "desc" };
    default:
      return { orderBy: "episodeNumber", order: "desc" };
  }
}

export default async function EpisodesPage({
  searchParams,
}: EpisodesPageProps) {
  const params = await searchParams;
  const currentSort = params.sort ?? "newest";
  const currentView = params.view ?? "card";
  const { orderBy, order } = resolveSort(currentSort);

  const [aggregates, totalCount] = await Promise.all([
    getEpisodeAggregates(),
    getEpisodeCount("published"),
  ]);

  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const episodes = await getEpisodes({ take, skip, orderBy, order });
  let cards = episodes.map(formatEpisodeForCard);

  if (currentSort === "az") {
    cards = cards.sort((a, b) => a.title.localeCompare(b.title));
  }

  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  const glanceItems = [
    { icon: "\uD83C\uDFAC", label: `${aggregates.total} episodes` },
    ...(aggregates.earliestDate && aggregates.latestDate
      ? [{ icon: "\uD83D\uDCC5", label: `${formatDate(aggregates.earliestDate)} — ${formatDate(aggregates.latestDate)}` }]
      : []),
    ...(aggregates.totalGuests > 0
      ? [{ icon: "\uD83C\uDFA4", label: `${aggregates.totalGuests} guest appearances` }]
      : []),
  ];

  return (
    <>
    <PageHero
      title="EPISODES"
      subtitle={`${totalCount} transmissions in the archive`}
      backgroundImage="/articles-bacgkground.jpg"
    />
    <EntityGlanceBar items={glanceItems} />
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <SortFilterBar
          basePath="/episodes"
          sortOptions={SORT_OPTIONS}
          currentSort={currentSort}
          filterLabel="Type"
          filterOptions={FILTER_OPTIONS}
          currentFilter={params.filter}
        />
        <ViewToggle basePath="/episodes" currentView={currentView} />
      </div>

      {cards.length === 0 ? (
        <EmptyState
          message="No episodes in the archive yet"
          suggestion="Episodes will appear here once data is ingested"
        />
      ) : (
        <>
          {currentView === "list" ? (
            <div className="grid gap-3">
              {cards.map((ep) => (
                <EpisodeListItem
                  key={ep.id}
                  slug={ep.slug}
                  title={ep.title}
                  episodeNumber={ep.episodeNumber}
                  airDate={ep.airDate}
                  summaryShort={ep.summaryShort}
                  thumbnailUrl={ep.thumbnailUrl}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-3">
              {cards.map((ep) => (
                <EpisodeCard key={ep.id} episode={ep} />
              ))}
            </div>
          )}
          <PaginationControls meta={paginationMeta} basePath="/episodes" />
        </>
      )}
    </main>
    </>
  );
}
```

**Step 2: Fix SortFilterBar mb-6 conflict**

The `SortFilterBar` component has `mb-6` built in. Since we're wrapping it in a flex container now, remove `mb-6` from the `SortFilterBar` component's root div.

In `src/components/archive/sort-filter-bar.tsx`, change:
```tsx
<div className="flex flex-wrap items-center gap-3 mb-6">
```
To:
```tsx
<div className="flex flex-wrap items-center gap-3">
```

**Step 3: Verify build**

Run: `npx next build`
Expected: Clean compile.

**Step 4: Commit**

```bash
git add src/app/episodes/page.tsx src/components/archive/sort-filter-bar.tsx
git commit -m "feat: upgrade episodes index with glance bar, view toggle, and content type filter"
```

---

### Task 9: Upgrade People Index Page with stats bar

**Files:**
- Modify: `src/app/people/page.tsx`

**Step 1: Add glance bar to people page**

Add the following imports at the top of `src/app/people/page.tsx`:

```tsx
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { getPeopleAggregates } from "@/lib/queries/stats";
```

Inside the component function, add the aggregates query. Change:
```tsx
  const totalCount = await getPersonCount(typeFilter);
```
To:
```tsx
  const [totalCount, aggregates] = await Promise.all([
    getPersonCount(typeFilter),
    getPeopleAggregates(),
  ]);
```

Add glance items after the paginationMeta calculation:
```tsx
  const glanceItems = [
    { icon: "\uD83D\uDC64", label: `${aggregates.total} people` },
    ...(aggregates.hosts > 0 ? [{ icon: "\uD83C\uDFA4", label: `${aggregates.hosts} host${aggregates.hosts !== 1 ? "s" : ""}` }] : []),
    ...(aggregates.recurring > 0 ? [{ icon: "\uD83D\uDD01", label: `${aggregates.recurring} recurring` }] : []),
    ...(aggregates.guests > 0 ? [{ icon: "\uD83C\uDFAD", label: `${aggregates.guests} guest${aggregates.guests !== 1 ? "s" : ""}` }] : []),
  ];
```

Add `<EntityGlanceBar items={glanceItems} />` between `PageHero` and `<main>`.

**Step 2: Verify build**

Run: `npx next build`
Expected: Clean compile.

**Step 3: Commit**

```bash
git add src/app/people/page.tsx
git commit -m "feat: add stats glance bar to people index page"
```

---

### Task 10: Upgrade Lore Index Page with stats bar

**Files:**
- Modify: `src/app/lore/page.tsx`

**Step 1: Add glance bar to lore page**

Add the following imports:
```tsx
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { getLoreAggregates } from "@/lib/queries/stats";
```

Change:
```tsx
  const totalCount = await getLoreCount({ canon: canonFilter });
```
To:
```tsx
  const [totalCount, aggregates] = await Promise.all([
    getLoreCount({ canon: canonFilter }),
    getLoreAggregates(),
  ]);
```

Add glance items:
```tsx
  const glanceItems = [
    { icon: "\uD83D\uDCDC", label: `${aggregates.total} lore entries` },
    ...(aggregates.canonical > 0 ? [{ icon: "\uD83D\uDFE1", label: `${aggregates.canonical} canonical` }] : []),
    ...(aggregates.speculative > 0 ? [{ icon: "\uD83D\uDFE3", label: `${aggregates.speculative} speculative` }] : []),
    ...(aggregates.communityMyth > 0 ? [{ icon: "\uD83D\uDFE2", label: `${aggregates.communityMyth} community myth${aggregates.communityMyth !== 1 ? "s" : ""}` }] : []),
  ];
```

Add `<EntityGlanceBar items={glanceItems} />` between `PageHero` and `<main>`.

**Step 2: Verify build**

Run: `npx next build`
Expected: Clean compile.

**Step 3: Commit**

```bash
git add src/app/lore/page.tsx
git commit -m "feat: add stats glance bar to lore index page"
```

---

### Task 11: Upgrade Topics Index Page with stats bar

**Files:**
- Modify: `src/app/topics/page.tsx`

**Step 1: Add glance bar to topics page**

Add imports:
```tsx
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { getTopicAggregates } from "@/lib/queries/stats";
```

Change:
```tsx
  const totalCount = await getTopicCount();
```
To:
```tsx
  const [totalCount, aggregates] = await Promise.all([
    getTopicCount(),
    getTopicAggregates(),
  ]);
```

Add glance items:
```tsx
  const glanceItems = [
    { icon: "\uD83C\uDFF7\uFE0F", label: `${aggregates.total} topics` },
    ...(aggregates.linkedEpisodes > 0 ? [{ icon: "\uD83D\uDD17", label: `${aggregates.linkedEpisodes} episode links` }] : []),
  ];
```

Add `<EntityGlanceBar items={glanceItems} />` between `PageHero` and `<main>`.

**Step 2: Verify build**

Run: `npx next build`
Expected: Clean compile.

**Step 3: Commit**

```bash
git add src/app/topics/page.tsx
git commit -m "feat: add stats glance bar to topics index page"
```

---

### Task 12: Upgrade Series Index Page

**Files:**
- Modify: `src/app/series/page.tsx`

**Step 1: Rewrite the series index page**

Replace the entire content of `src/app/series/page.tsx` with:

```tsx
import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { SeriesCard } from "@/components/archive/series-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getSeries } from "@/lib/queries/series";
import { getSeriesAggregates } from "@/lib/queries/stats";

export const metadata = {
  title: "Series — CULT CODEX",
  description: "Browse Cult of Psyche series and collections",
};

export default async function SeriesPage() {
  const [series, aggregates] = await Promise.all([
    getSeries(),
    getSeriesAggregates(),
  ]);

  const glanceItems = [
    { icon: "\uD83D\uDCDA", label: `${aggregates.total} series` },
    ...(aggregates.totalEpisodes > 0
      ? [{ icon: "\uD83C\uDFAC", label: `${aggregates.totalEpisodes} episodes across all series` }]
      : []),
  ];

  return (
    <>
    <PageHero
      title="SERIES"
      subtitle={
        series.length > 0
          ? `${series.length} series in the archive`
          : "Series and collections"
      }
      backgroundImage="/wiki-page-header.jpg"
    />
    <EntityGlanceBar items={glanceItems} />
    <main className="mx-auto max-w-7xl px-4 py-8">
      {series.length === 0 ? (
        <EmptyState
          message="No series catalogued yet"
          suggestion="Series will appear here once they are created"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {series.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      )}
    </main>
    </>
  );
}
```

**Step 2: Add status badge and coverImageUrl to SeriesCard**

In `src/components/archive/series-card.tsx`, add `coverImageUrl` thumbnail support. Replace the entire file with:

```tsx
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type { SeriesWithCount } from "@/lib/queries/series";

interface SeriesCardProps {
  series: SeriesWithCount;
}

const typeVariant: Record<string, "green" | "purple" | "gold" | "muted"> = {
  panel: "green",
  tarot: "purple",
  story: "gold",
  music_video: "purple",
  documentary: "green",
  other: "muted",
};

export function SeriesCard({ series }: SeriesCardProps) {
  return (
    <Link
      href={`/series/${series.slug}`}
      className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-green/30 hover:bg-elevated"
    >
      {series.coverImageUrl ? (
        <img
          src={series.coverImageUrl}
          alt=""
          className="h-16 w-16 flex-shrink-0 rounded object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded bg-gradient-to-br from-accent-green/10 to-accent-gold/10 text-2xl">
          📚
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <StatusBadge
            label={series.type.replace("_", " ")}
            variant={typeVariant[series.type] ?? "muted"}
          />
          <span className="font-mono text-[10px] text-text-muted">
            {series._count.episodes} episode{series._count.episodes !== 1 ? "s" : ""}
          </span>
          <StatusBadge
            label={series.status}
            variant={series.status === "published" ? "green" : "muted"}
          />
        </div>
        <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-green transition-colors">
          {series.title}
        </h3>
        {series.description && (
          <p className="mt-1 text-xs text-text-muted line-clamp-2">
            {series.description}
          </p>
        )}
      </div>
    </Link>
  );
}
```

**Step 3: Verify build**

Run: `npx next build`
Expected: Clean compile.

**Step 4: Commit**

```bash
git add src/app/series/page.tsx src/components/archive/series-card.tsx
git commit -m "feat: upgrade series index with PageHero, glance bar, and enhanced cards"
```

---

### Task 13: Upgrade Quotes Index Page

**Files:**
- Modify: `src/app/quotes/page.tsx`

**Step 1: Rewrite the quotes index page**

Replace the entire content of `src/app/quotes/page.tsx` with:

```tsx
import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { QuoteHighlightCard } from "@/components/episodes/quote-highlight-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getQuotes, getQuoteCount } from "@/lib/queries/quotes";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";

export const metadata = {
  title: "Quotes — CULT CODEX",
  description: "Notable quotes from Cult of Psyche episodes",
};

interface QuotesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const params = await searchParams;

  const totalCount = await getQuoteCount();
  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const quotes = await getQuotes({ take, skip });
  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  const glanceItems = [
    { icon: "\uD83D\uDCAC", label: `${totalCount} notable quote${totalCount !== 1 ? "s" : ""}` },
  ];

  return (
    <>
    <PageHero
      title="QUOTES"
      subtitle={
        totalCount > 0
          ? `${totalCount} notable quotes from the archive`
          : "Notable quotes from the archive"
      }
      backgroundImage="/long-form-background.jpg"
    />
    <EntityGlanceBar items={glanceItems} />
    <main className="mx-auto max-w-7xl px-4 py-8">
      {quotes.length === 0 ? (
        <EmptyState
          message="No quotes archived yet"
          suggestion="Quotes will be extracted during AI enrichment"
        />
      ) : (
        <>
          <div className="space-y-4">
            {quotes.map((quote) => (
              <QuoteHighlightCard
                key={quote.id}
                id={quote.id}
                text={quote.text}
                speakerName={quote.speaker?.displayName}
                speakerAvatarUrl={quote.speaker?.avatarUrl}
                timestampSeconds={quote.timestampSeconds}
              />
            ))}
          </div>
          <PaginationControls meta={paginationMeta} basePath="/quotes" />
        </>
      )}
    </main>
    </>
  );
}
```

**Step 2: Verify build**

Run: `npx next build`
Expected: Clean compile.

**Step 3: Commit**

```bash
git add src/app/quotes/page.tsx
git commit -m "feat: upgrade quotes index with QuoteHighlightCard and glance bar"
```

---

### Task 14: Final Build & Deploy

**Step 1: Full build verification**

Run: `npx next build`
Expected: All routes compile successfully with no TypeScript errors.

**Step 2: Deploy**

Run: `npx vercel --prod`
Expected: Production deployment to cultcodex.me.

**Step 3: Commit any remaining fixes**

If any fixes were needed during the build, commit them.
