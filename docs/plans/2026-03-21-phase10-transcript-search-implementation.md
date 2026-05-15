# Phase 10: Transcript Search & Episode Deep-Dive — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Surface transcript data through full-text search, upgrade the transcript viewer with interactive features, reorganize episode detail pages with tabs, and add a dedicated `/transcripts` index page.

**Architecture:** Four independent feature slices: (1) transcript search queries + global search integration, (2) transcript viewer upgrade as a self-contained client component rewrite, (3) episode detail page tab layout refactor, (4) new `/transcripts` route. Each slice can be built and committed independently.

**Tech Stack:** Next.js 16 (App Router, Server Components), React 19, Tailwind CSS v4, Prisma 7, TypeScript

---

## Context for All Tasks

- **Project root:** `C:\Users\John Bates\Projects\cultcodex-v2`
- **Prisma schema:** `prisma/schema.prisma` — `TranscriptSegment` model has `id`, `episodeId`, `startSeconds`, `endSeconds`, `speakerLabel`, `text`, `searchText`
- **Existing transcript viewer:** `src/components/media/transcript-viewer.tsx` — basic list with collapse/expand and timestamp click-to-seek
- **Episode detail page:** `src/app/episodes/[slug]/page.tsx` — currently one long vertical scroll with all sections stacked
- **Global search:** `src/lib/queries/search.ts` — searches episodes, people, lore, topics, quotes. Does NOT search transcript segments.
- **Search page:** `src/app/search/page.tsx` — renders results by entity type with filter pills
- **Site header nav:** `src/components/layout/site-header.tsx` — `navItems` array controls nav links
- **Pagination:** `src/lib/pagination.ts` — `DEFAULT_PAGE_SIZE`, `parsePage`, `paginationArgs`, `buildPaginationMeta`
- **Format helpers:** `src/lib/format/duration.ts` — `formatSeconds(seconds: number): string`
- **UI components:** `SectionCard`, `PageHero`, `EntityGlanceBar`, `PaginationControls`, `EmptyState`, `TerminalPanel`, `StatusBadge`
- **Dark theme colors:** `bg-void`, `text-text-primary`, `text-text-muted`, `accent-gold`, `accent-green`, `accent-cyan`, `accent-purple`, `bg-surface`, `bg-elevated`, `border-border`
- **Build command:** `npx next build` (Turbopack)
- **TypeScript check:** `npx tsc --noEmit`
- **No tests required** — project has no test infrastructure beyond a few legacy test files

---

### Task 1: Transcript Search Queries

**Files:**
- Modify: `src/lib/queries/search.ts`

**What:** Add `searchTranscripts` and `countTranscripts` functions to the existing search module. Add transcript results to the `GlobalSearchResults` type and wire them into `globalSearch()`.

**Code to add at the end of the file, before the count helpers section:**

```typescript
// ── Transcript search result type (add to the type section at top) ──

export interface SearchResultTranscript {
  id: string;
  text: string;
  speakerLabel: string | null;
  startSeconds: number;
  episodeTitle: string;
  episodeSlug: string;
  episodeNumber: number | null;
}
```

Add to `GlobalSearchResults` interface:
```typescript
  transcripts: SearchResultTranscript[];
  transcriptsTotalCount: number;
```

Add to the `globalSearch` function's `Promise.all`:
```typescript
  shouldSearch("transcripts") ? searchTranscripts(query) : Promise.resolve([] as SearchResultTranscript[]),
  // ...in counts:
  shouldSearch("transcripts") ? countTranscripts(query) : Promise.resolve(0),
```

Add search + count functions:
```typescript
async function searchTranscripts(query: string): Promise<SearchResultTranscript[]> {
  const segments = await prisma.transcriptSegment.findMany({
    where: { text: { contains: query, mode: "insensitive" } },
    select: {
      id: true,
      text: true,
      speakerLabel: true,
      startSeconds: true,
      episode: { select: { title: true, slug: true, episodeNumber: true, status: true } },
    },
    orderBy: { startSeconds: "asc" },
    take: SEARCH_LIMIT,
  });
  return segments
    .filter((s) => s.episode.status === "published")
    .map((s) => ({
      id: s.id,
      text: s.text,
      speakerLabel: s.speakerLabel,
      startSeconds: s.startSeconds,
      episodeTitle: s.episode.title,
      episodeSlug: s.episode.slug,
      episodeNumber: s.episode.episodeNumber,
    }));
}

async function countTranscripts(query: string): Promise<number> {
  return prisma.transcriptSegment.count({
    where: {
      text: { contains: query, mode: "insensitive" },
      episode: { status: "published" },
    },
  });
}
```

Update `totalCount` computation to include `transcriptsTotalCount`.

**Verify:** `npx tsc --noEmit` passes.

**Commit:** `feat: add transcript segment search to global search queries`

---

### Task 2: Transcript Search Results on Search Page

**Files:**
- Modify: `src/app/search/page.tsx`

**What:** Add "Transcripts" filter pill and transcript result cards to the search results page.

**Changes:**

1. Add `"transcripts"` to the filter pill array on line 60:
```typescript
{["episodes", "people", "lore", "topics", "quotes", "transcripts"].map((t) => {
```

2. Add a new results section after the Quotes section (around line 306). Import `formatSeconds` from `@/lib/format/duration`:

```tsx
{/* ── Transcripts ───────────────────────── */}
{results.transcripts.length > 0 && (
  <SectionCard title={`Transcripts (${results.transcriptsTotalCount > results.transcripts.length ? `${results.transcripts.length} of ${results.transcriptsTotalCount}` : results.transcripts.length})`}>
    <ul className="divide-y divide-border">
      {results.transcripts.map((seg) => (
        <li key={seg.id} className="py-3 px-1">
          <Link
            href={`/episodes/${seg.episodeSlug}?tab=transcript&t=${seg.startSeconds}`}
            className="group block transition-colors hover:bg-elevated rounded p-1"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] text-accent-green">
                {formatSeconds(seg.startSeconds)}
              </span>
              {seg.speakerLabel && (
                <span className="font-mono text-[10px] text-accent-purple font-bold uppercase">
                  {seg.speakerLabel}
                </span>
              )}
            </div>
            <p className="text-sm text-text-primary line-clamp-2">
              <HighlightMatch text={seg.text} query={query} />
            </p>
            <div className="mt-1 font-mono text-[10px] text-text-muted">
              {seg.episodeNumber != null && (
                <span className="text-accent-green font-bold mr-1">
                  EP.{String(seg.episodeNumber).padStart(3, "0")}
                </span>
              )}
              <span className="group-hover:text-accent-green transition-colors">
                {seg.episodeTitle}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  </SectionCard>
)}
```

3. Add `import { formatSeconds } from "@/lib/format/duration";` to the imports.

**Verify:** `npx tsc --noEmit` passes.

**Commit:** `feat: add transcript results to global search page`

---

### Task 3: Upgraded Transcript Viewer

**Files:**
- Rewrite: `src/components/media/transcript-viewer.tsx`

**What:** Full rewrite of the transcript viewer with: in-transcript search, speaker color-coding, active segment tracking, keyboard navigation, copy-to-clipboard.

**Complete replacement code:**

```tsx
"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { formatSeconds } from "@/lib/format/duration";

interface Segment {
  id: string;
  startSeconds: number;
  endSeconds: number;
  speakerLabel: string | null;
  text: string;
}

interface TranscriptViewerProps {
  segments: Segment[];
  hasVideoEmbed?: boolean;
  initialSearchQuery?: string;
  initialTimestamp?: number;
}

const SPEAKER_COLORS = [
  "text-accent-gold",
  "text-accent-green",
  "text-accent-cyan",
  "text-accent-purple",
];

export function TranscriptViewer({
  segments,
  hasVideoEmbed,
  initialSearchQuery,
  initialTimestamp,
}: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery ?? "");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Build speaker color map
  const speakerColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const uniqueSpeakers = [...new Set(segments.map((s) => s.speakerLabel).filter(Boolean))] as string[];
    uniqueSpeakers.forEach((speaker, i) => {
      map.set(speaker, SPEAKER_COLORS[i % SPEAKER_COLORS.length]);
    });
    return map;
  }, [segments]);

  // Filter segments by search
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return segments;
    const q = searchQuery.toLowerCase();
    return segments.filter(
      (s) =>
        s.text.toLowerCase().includes(q) ||
        (s.speakerLabel && s.speakerLabel.toLowerCase().includes(q))
    );
  }, [segments, searchQuery]);

  // Scroll to initial timestamp
  useEffect(() => {
    if (initialTimestamp != null) {
      const idx = segments.findIndex(
        (s) => s.startSeconds <= initialTimestamp && s.endSeconds > initialTimestamp
      );
      if (idx >= 0) {
        setActiveIndex(idx);
        setTimeout(() => {
          segmentRefs.current.get(idx)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    }
  }, [initialTimestamp, segments]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = Math.min(prev + 1, filtered.length - 1);
          segmentRefs.current.get(next)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          segmentRefs.current.get(next)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          return next;
        });
      } else if (e.key === "Enter" && activeIndex >= 0 && hasVideoEmbed) {
        e.preventDefault();
        const seg = filtered[activeIndex];
        if (seg) seekTo(seg.startSeconds);
      }
    },
    [activeIndex, filtered, hasVideoEmbed]
  );

  function seekTo(seconds: number) {
    const iframe = document.querySelector<HTMLIFrameElement>(
      'iframe[src*="youtube-nocookie.com"]'
    );
    if (iframe) {
      const baseUrl = iframe.src.split("?")[0];
      iframe.src = `${baseUrl}?start=${seconds}&autoplay=1`;
    }
  }

  async function copySegment(seg: Segment) {
    const text = `[${formatSeconds(seg.startSeconds)}]${seg.speakerLabel ? ` ${seg.speakerLabel}:` : ""} ${seg.text}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(seg.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function highlightText(text: string, query: string) {
    if (!query.trim()) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-accent-green/20 text-accent-green rounded-sm px-0.5">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }

  return (
    <div onKeyDown={handleKeyDown} tabIndex={0} className="outline-none">
      {/* Search bar */}
      <div className="mb-3 flex items-center gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setActiveIndex(-1);
          }}
          placeholder="Search transcript..."
          className="flex-1 rounded border border-border bg-elevated px-3 py-1.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent-green focus:outline-none"
        />
        {searchQuery && (
          <span className="font-mono text-[10px] text-text-muted whitespace-nowrap">
            {filtered.length} of {segments.length}
          </span>
        )}
      </div>

      {/* Segment list */}
      <div ref={containerRef} className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
        {filtered.map((seg, idx) => {
          const isActive = idx === activeIndex;
          const globalIdx = segments.indexOf(seg);
          return (
            <div
              key={seg.id}
              ref={(el) => {
                if (el) segmentRefs.current.set(idx, el);
              }}
              className={`group flex gap-3 rounded px-2 py-1.5 transition-colors ${
                isActive
                  ? "border-l-2 border-accent-green bg-accent-green/5"
                  : "border-l-2 border-transparent hover:bg-elevated"
              }`}
              onClick={() => setActiveIndex(idx)}
            >
              {/* Timestamp */}
              {hasVideoEmbed ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    seekTo(seg.startSeconds);
                  }}
                  className="shrink-0 font-mono text-[10px] text-accent-green/60 w-14 text-right pt-0.5 hover:text-accent-green transition-colors cursor-pointer"
                  title={`Jump to ${formatSeconds(seg.startSeconds)}`}
                >
                  {formatSeconds(seg.startSeconds)}
                </button>
              ) : (
                <span className="shrink-0 font-mono text-[10px] text-accent-green/60 w-14 text-right pt-0.5">
                  {formatSeconds(seg.startSeconds)}
                </span>
              )}

              {/* Content */}
              <div className="min-w-0 flex-1">
                {seg.speakerLabel && (
                  <span
                    className={`font-mono text-[10px] font-bold uppercase ${
                      speakerColorMap.get(seg.speakerLabel) ?? "text-accent-purple"
                    }`}
                  >
                    {seg.speakerLabel}
                  </span>
                )}
                <p className="text-sm text-text-primary">
                  {searchQuery ? highlightText(seg.text, searchQuery) : seg.text}
                </p>
              </div>

              {/* Copy button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copySegment(seg);
                }}
                className="shrink-0 self-start pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy segment"
              >
                <span className="font-mono text-[10px] text-text-muted hover:text-accent-green transition-colors">
                  {copiedId === seg.id ? "✓" : "⎘"}
                </span>
              </button>
            </div>
          );
        })}

        {filtered.length === 0 && searchQuery && (
          <p className="py-4 text-center font-mono text-xs text-text-muted">
            No segments match &ldquo;{searchQuery}&rdquo;
          </p>
        )}
      </div>

      {/* Keyboard hint */}
      <p className="mt-2 font-mono text-[9px] text-text-muted/50">
        ↑↓ navigate{hasVideoEmbed ? " · Enter seek" : ""} · Click to select
      </p>
    </div>
  );
}
```

**Verify:** `npx tsc --noEmit` passes.

**Commit:** `feat: upgrade transcript viewer with search, speaker colors, keyboard nav, and copy`

---

### Task 4: Episode Detail Tab Layout

**Files:**
- Create: `src/components/episodes/episode-tab-layout.tsx`
- Modify: `src/app/episodes/[slug]/page.tsx`

**What:** Create a client-side tab component and refactor the episode detail page to use tabs (Overview, Transcript, Quotes, Discussion). YouTube embed stays above tabs. Sidebar stays in all tabs.

**Step 1: Create `src/components/episodes/episode-tab-layout.tsx`:**

```tsx
"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, type ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface EpisodeTabLayoutProps {
  tabs: Tab[];
  children: Record<string, ReactNode>;
}

export function EpisodeTabLayout({ tabs, children }: EpisodeTabLayoutProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = searchParams.get("tab") ?? tabs[0]?.id ?? "overview";

  const setTab = useCallback(
    (tabId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tabId === tabs[0]?.id) {
        params.delete("tab");
      } else {
        params.set("tab", tabId);
      }
      // Preserve t param when switching to transcript tab
      if (tabId !== "transcript") {
        params.delete("t");
      }
      const qs = params.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname, tabs]
  );

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-border mb-6 -mx-1 px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`shrink-0 px-4 py-2.5 font-mono text-xs uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-accent-green text-accent-green"
                : "border-transparent text-text-muted hover:text-text-primary hover:border-border"
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className="ml-1.5 text-[10px] opacity-60">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>{children[activeTab] ?? children[tabs[0]?.id]}</div>
    </div>
  );
}
```

**Step 2: Refactor `src/app/episodes/[slug]/page.tsx`.**

The page currently renders everything in a single vertical stack inside a 2-column grid (`lg:col-span-2` main + sidebar). Restructure so:

1. The YouTube embed + Watch on YouTube + ReactionBar stay **above** the tab layout (always visible).
2. The `EpisodeTabLayout` renders four tab panels:
   - **overview** (default): short synopsis, summaryLong, related episodes, random button
   - **transcript**: TerminalPanel with TranscriptViewer (pass `initialTimestamp` from `?t=` search param)
   - **quotes**: all QuoteHighlightCards
   - **discussion**: CommentSection
3. The sidebar stays outside the tab layout (always visible).

Add to imports:
```typescript
import { EpisodeTabLayout } from "@/components/episodes/episode-tab-layout";
```

Update `PageProps` to include `searchParams`:
```typescript
interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; t?: string }>;
}
```

Pass `searchParams` into the component, extract `t` as `initialTimestamp`:
```typescript
const sp = await searchParams;
const initialTimestamp = sp.t ? parseInt(sp.t, 10) : undefined;
```

Replace the main content column (lines ~104-212) with the tab layout. The sidebar (lines ~216-284) stays unchanged.

The tab content sections use the existing components — no new components needed besides `EpisodeTabLayout`.

Pass `initialTimestamp` to `TranscriptViewer`:
```tsx
<TranscriptViewer
  segments={episode.segments}
  hasVideoEmbed={!!episode.youtubeVideoId}
  initialTimestamp={initialTimestamp}
/>
```

**Verify:** `npx tsc --noEmit` passes.

**Commit:** `feat: add tab layout to episode detail page (overview, transcript, quotes, discussion)`

---

### Task 5: Transcript Queries Module

**Files:**
- Create: `src/lib/queries/transcripts.ts`

**What:** Query functions for the `/transcripts` page: get episodes with transcripts (paginated), search within all transcripts (grouped by episode), and get aggregate stats.

```typescript
import { prisma } from "@/lib/db";

export interface EpisodeTranscriptSummary {
  id: string;
  title: string;
  slug: string;
  episodeNumber: number | null;
  airDate: Date | null;
  segmentCount: number;
  duration: string | null;
  speakers: string[];
}

export interface TranscriptSearchHit {
  segmentId: string;
  text: string;
  speakerLabel: string | null;
  startSeconds: number;
  episodeId: string;
  episodeTitle: string;
  episodeSlug: string;
  episodeNumber: number | null;
}

export interface TranscriptSearchResults {
  hits: TranscriptSearchHit[];
  totalCount: number;
}

export interface TranscriptStats {
  episodeCount: number;
  totalSegments: number;
}

/** Paginated list of published episodes that have transcript segments. */
export async function getEpisodesWithTranscripts(options: {
  take: number;
  skip: number;
}): Promise<EpisodeTranscriptSummary[]> {
  const episodes = await prisma.episode.findMany({
    where: {
      status: "published",
      segments: { some: {} },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      episodeNumber: true,
      airDate: true,
      duration: true,
      _count: { select: { segments: true } },
      segments: {
        select: { speakerLabel: true },
        distinct: ["speakerLabel"],
      },
    },
    orderBy: { episodeNumber: "desc" },
    take: options.take,
    skip: options.skip,
  });

  return episodes.map((ep) => ({
    id: ep.id,
    title: ep.title,
    slug: ep.slug,
    episodeNumber: ep.episodeNumber,
    airDate: ep.airDate,
    segmentCount: ep._count.segments,
    duration: ep.duration,
    speakers: ep.segments
      .map((s) => s.speakerLabel)
      .filter((l): l is string => l != null),
  }));
}

/** Count of published episodes that have transcript segments. */
export async function getEpisodesWithTranscriptsCount(): Promise<number> {
  return prisma.episode.count({
    where: {
      status: "published",
      segments: { some: {} },
    },
  });
}

/** Full-text search within transcript segments, returning hits with episode context. */
export async function searchWithinTranscripts(
  query: string,
  options: { take: number; skip: number }
): Promise<TranscriptSearchResults> {
  const where = {
    text: { contains: query, mode: "insensitive" as const },
    episode: { status: "published" as const },
  };

  const [hits, totalCount] = await Promise.all([
    prisma.transcriptSegment.findMany({
      where,
      select: {
        id: true,
        text: true,
        speakerLabel: true,
        startSeconds: true,
        episode: {
          select: { id: true, title: true, slug: true, episodeNumber: true },
        },
      },
      orderBy: { startSeconds: "asc" },
      take: options.take,
      skip: options.skip,
    }),
    prisma.transcriptSegment.count({ where }),
  ]);

  return {
    hits: hits.map((h) => ({
      segmentId: h.id,
      text: h.text,
      speakerLabel: h.speakerLabel,
      startSeconds: h.startSeconds,
      episodeId: h.episode.id,
      episodeTitle: h.episode.title,
      episodeSlug: h.episode.slug,
      episodeNumber: h.episode.episodeNumber,
    })),
    totalCount,
  };
}

/** Aggregate stats for the transcripts page header. */
export async function getTranscriptStats(): Promise<TranscriptStats> {
  const [episodeCount, totalSegments] = await Promise.all([
    prisma.episode.count({
      where: { status: "published", segments: { some: {} } },
    }),
    prisma.transcriptSegment.count({
      where: { episode: { status: "published" } },
    }),
  ]);
  return { episodeCount, totalSegments };
}
```

**Verify:** `npx tsc --noEmit` passes.

**Commit:** `feat: add transcript query functions for directory and search`

---

### Task 6: Transcripts Index Page

**Files:**
- Create: `src/app/transcripts/page.tsx`
- Create: `src/app/transcripts/loading.tsx`

**What:** A `/transcripts` route with:
- PageHero
- EntityGlanceBar with transcript stats
- Search box at top
- Two modes: directory (no query) shows paginated episode list, search mode shows matching segments

```tsx
// src/app/transcripts/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format/date";
import { formatSeconds } from "@/lib/format/duration";
import {
  getEpisodesWithTranscripts,
  getEpisodesWithTranscriptsCount,
  searchWithinTranscripts,
  getTranscriptStats,
} from "@/lib/queries/transcripts";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Transcripts — CULT CODEX",
  description: "Search and browse episode transcripts from the Cult of Psyche archive",
};

interface TranscriptsPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function TranscriptsPage({ searchParams }: TranscriptsPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const stats = await getTranscriptStats();

  const glanceItems = [
    { icon: "📜", label: `${stats.episodeCount} transcribed episodes` },
    { icon: "💬", label: `${stats.totalSegments.toLocaleString()} segments` },
  ];

  // Search mode
  if (query) {
    const PAGE_SIZE = 30;
    const totalForPagination = (await searchWithinTranscripts(query, { take: 0, skip: 0 })).totalCount;
    const page = parsePage(params.page, Math.ceil(totalForPagination / PAGE_SIZE));
    const { skip } = paginationArgs(page, PAGE_SIZE);
    const results = await searchWithinTranscripts(query, { take: PAGE_SIZE, skip });
    const paginationMeta = buildPaginationMeta(page, PAGE_SIZE, results.totalCount);

    return (
      <>
        <PageHero title="TRANSCRIPTS" subtitle="Search the spoken word" backgroundImage="/search-database-background.jpg" />
        <EntityGlanceBar items={glanceItems} />
        <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
          <SearchBox defaultValue={query} />

          <p className="mb-4 font-mono text-xs text-text-muted">
            {results.totalCount} segment{results.totalCount !== 1 ? "s" : ""} match &ldquo;{query}&rdquo;
          </p>

          {results.hits.length === 0 ? (
            <EmptyState message={`No transcript segments match "${query}"`} suggestion="Try different keywords" />
          ) : (
            <>
              <div className="space-y-2">
                {results.hits.map((hit) => (
                  <Link
                    key={hit.segmentId}
                    href={`/episodes/${hit.episodeSlug}?tab=transcript&t=${hit.startSeconds}`}
                    className="group block rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent-green/30 hover:bg-elevated"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] text-accent-green">
                        {formatSeconds(hit.startSeconds)}
                      </span>
                      {hit.speakerLabel && (
                        <span className="font-mono text-[10px] text-accent-purple font-bold uppercase">
                          {hit.speakerLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-primary line-clamp-2">{hit.text}</p>
                    <p className="mt-1 font-mono text-[10px] text-text-muted">
                      {hit.episodeNumber != null && (
                        <span className="text-accent-green font-bold mr-1">
                          EP.{String(hit.episodeNumber).padStart(3, "0")}
                        </span>
                      )}
                      <span className="group-hover:text-accent-green transition-colors">{hit.episodeTitle}</span>
                    </p>
                  </Link>
                ))}
              </div>
              <PaginationControls meta={paginationMeta} basePath={`/transcripts?q=${encodeURIComponent(query)}`} />
            </>
          )}
        </main>
      </>
    );
  }

  // Directory mode
  const totalCount = await getEpisodesWithTranscriptsCount();
  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);
  const episodes = await getEpisodesWithTranscripts({ take, skip });
  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  return (
    <>
      <PageHero title="TRANSCRIPTS" subtitle="Browse the spoken word" backgroundImage="/search-database-background.jpg" />
      <EntityGlanceBar items={glanceItems} />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
        <SearchBox defaultValue="" />

        {episodes.length === 0 ? (
          <EmptyState message="No transcribed episodes yet" suggestion="Transcripts are generated during AI enrichment" />
        ) : (
          <>
            <div className="space-y-2">
              {episodes.map((ep) => (
                <Link
                  key={ep.id}
                  href={`/episodes/${ep.slug}?tab=transcript`}
                  className="group block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-green/30 hover:bg-elevated"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {ep.episodeNumber != null && (
                      <span className="font-mono text-xs text-accent-green font-bold">
                        EP.{String(ep.episodeNumber).padStart(3, "0")}
                      </span>
                    )}
                    {ep.airDate && (
                      <span className="font-mono text-[10px] text-text-muted">
                        {formatDate(ep.airDate)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-text-primary group-hover:text-accent-green transition-colors">
                    {ep.title}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge label={`${ep.segmentCount} segments`} variant="green" />
                    {ep.speakers.length > 0 && (
                      <StatusBadge label={`${ep.speakers.length} speaker${ep.speakers.length !== 1 ? "s" : ""}`} variant="purple" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <PaginationControls meta={paginationMeta} basePath="/transcripts" />
          </>
        )}
      </main>
    </>
  );
}

// Client search input
function SearchBox({ defaultValue }: { defaultValue: string }) {
  return (
    <form action="/transcripts" method="get" className="mb-6">
      <input
        type="text"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search within transcripts..."
        className="w-full rounded-lg border border-border bg-elevated px-4 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-green focus:outline-none"
      />
    </form>
  );
}
```

```tsx
// src/app/transcripts/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function TranscriptsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Skeleton className="mb-6 h-10 w-full max-w-md" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

**Verify:** `npx tsc --noEmit` passes.

**Commit:** `feat: add /transcripts page with directory and search modes`

---

### Task 7: Nav Update + Final Build + Deploy

**Files:**
- Modify: `src/components/layout/site-header.tsx`

**What:** Add "Transcripts" to the site navigation. Run final build. Deploy to Vercel.

**Change in `site-header.tsx`:** Add `{ label: "Transcripts", href: "/transcripts" }` to the `navItems` array after "Quotes":

```typescript
const navItems = [
  { label: "Live", href: "/live" },
  { label: "Episodes", href: "/episodes" },
  { label: "People", href: "/people" },
  { label: "Lore", href: "/lore" },
  { label: "Series", href: "/series" },
  { label: "Quotes", href: "/quotes" },
  { label: "Transcripts", href: "/transcripts" },
  { label: "Topics", href: "/topics" },
];
```

**Verify:**
1. `npx tsc --noEmit` passes
2. `npx next build` succeeds
3. All new routes appear in build output: `/transcripts`, updated `/episodes/[slug]`, updated `/search`

**Commit:** `feat: add Transcripts to site navigation`

**Deploy:** `npx vercel deploy --prod`
