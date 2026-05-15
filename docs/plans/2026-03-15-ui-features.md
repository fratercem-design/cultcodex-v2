# UI Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add YouTube video embedding, improved transcript display, quotes index page, and series index + detail pages to CultCodex v2.

**Architecture:** Four independent UI features built as Next.js App Router pages and components. Each follows existing patterns: server components for data fetching, client components only for interactivity (YouTube embed, transcript toggle). All queries go through `src/lib/queries/`, all pages use `PageShell`, and all components follow the project's dark terminal aesthetic.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma 7.4.2, Tailwind CSS v4, Vitest

---

### Task 1: YouTube embed component

**Files:**
- Create: `src/components/media/youtube-embed.tsx`
- Modify: `src/app/episodes/[slug]/page.tsx`

**Step 1: Create the YouTube embed component**

```typescript
// src/components/media/youtube-embed.tsx
"use client";

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  startSeconds?: number;
}

export function YouTubeEmbed({ videoId, title, startSeconds }: YouTubeEmbedProps) {
  const src = `https://www.youtube-nocookie.com/embed/${videoId}${startSeconds ? `?start=${startSeconds}` : ""}`;

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-accent-green/20 bg-void aspect-video">
      <iframe
        src={src}
        title={title || "YouTube video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
```

**Step 2: Add embed to episode detail page**

In `src/app/episodes/[slug]/page.tsx`, add the import and render the embed above the summary inside the main content area:

Add import:
```typescript
import { YouTubeEmbed } from "@/components/media/youtube-embed";
```

Add the embed as the first child inside `<div className="lg:col-span-2 space-y-6">`:
```tsx
{/* Video embed */}
{episode.youtubeVideoId && (
  <YouTubeEmbed
    videoId={episode.youtubeVideoId}
    title={episode.title}
  />
)}
```

**Step 3: Verify visually**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npm run dev`
Navigate to an episode page and verify the YouTube embed appears.

**Step 4: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add src/components/media/youtube-embed.tsx src/app/episodes/[slug]/page.tsx
git commit -m "feat: add YouTube video embed to episode detail pages"
```

---

### Task 2: Improved transcript display with collapsible section

**Files:**
- Create: `src/components/media/transcript-viewer.tsx`
- Modify: `src/app/episodes/[slug]/page.tsx`

**Step 1: Create the transcript viewer component**

```typescript
// src/components/media/transcript-viewer.tsx
"use client";

import { useState } from "react";
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
}

const COLLAPSED_COUNT = 20;

export function TranscriptViewer({ segments, hasVideoEmbed }: TranscriptViewerProps) {
  const [expanded, setExpanded] = useState(segments.length <= COLLAPSED_COUNT);

  const visible = expanded ? segments : segments.slice(0, COLLAPSED_COUNT);

  return (
    <div>
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {visible.map((seg) => (
          <div key={seg.id} className="flex gap-3">
            {hasVideoEmbed ? (
              <a
                href={`?t=${seg.startSeconds}`}
                onClick={(e) => {
                  e.preventDefault();
                  const iframe = document.querySelector("iframe");
                  if (iframe) {
                    const baseUrl = iframe.src.split("?")[0];
                    iframe.src = `${baseUrl}?start=${seg.startSeconds}&autoplay=1`;
                  }
                }}
                className="shrink-0 font-mono text-[10px] text-accent-green/60 w-12 text-right pt-0.5 hover:text-accent-green transition-colors cursor-pointer"
                title={`Jump to ${formatSeconds(seg.startSeconds)}`}
              >
                {formatSeconds(seg.startSeconds)}
              </a>
            ) : (
              <span className="shrink-0 font-mono text-[10px] text-accent-green/60 w-12 text-right pt-0.5">
                {formatSeconds(seg.startSeconds)}
              </span>
            )}
            <div>
              {seg.speakerLabel && (
                <span className="font-mono text-[10px] text-accent-purple font-bold uppercase">
                  {seg.speakerLabel}
                </span>
              )}
              <p className="text-sm text-text-primary">{seg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {segments.length > COLLAPSED_COUNT && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 w-full rounded border border-border px-4 py-2 font-mono text-xs text-text-muted hover:text-accent-green hover:border-accent-green/30 transition-colors"
        >
          {expanded
            ? "Collapse transcript"
            : `Show all ${segments.length} segments`}
        </button>
      )}
    </div>
  );
}
```

**Step 2: Replace inline transcript in episode detail page**

In `src/app/episodes/[slug]/page.tsx`, add import:
```typescript
import { TranscriptViewer } from "@/components/media/transcript-viewer";
```

Replace the entire transcript section (the `{episode.segments.length > 0 && (...)}` block) with:
```tsx
{/* Transcript segments */}
{episode.segments.length > 0 && (
  <TerminalPanel header="TRANSCRIPT">
    <TranscriptViewer
      segments={episode.segments}
      hasVideoEmbed={!!episode.youtubeVideoId}
    />
  </TerminalPanel>
)}
```

**Step 3: Verify visually**

Run dev server, navigate to an episode with transcript segments. Verify:
- Segments show first 20, then "Show all N segments" button
- Clicking a timestamp jumps the YouTube embed to that time

**Step 4: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add src/components/media/transcript-viewer.tsx src/app/episodes/[slug]/page.tsx
git commit -m "feat: add collapsible transcript viewer with clickable timestamps"
```

---

### Task 3: Quotes query functions

**Files:**
- Create: `src/lib/queries/quotes.ts`

**Step 1: Create the quotes query module**

```typescript
// src/lib/queries/quotes.ts
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export function buildQuoteInclude() {
  return {
    speaker: true,
    episode: true,
  } satisfies Prisma.QuoteInclude;
}

export type QuoteWithRelations = Prisma.QuoteGetPayload<{
  include: ReturnType<typeof buildQuoteInclude>;
}>;

export async function getQuotes(options?: {
  speakerSlug?: string;
  take?: number;
  skip?: number;
}) {
  const { speakerSlug, take = 24, skip = 0 } = options ?? {};

  return prisma.quote.findMany({
    where: speakerSlug
      ? { speaker: { slug: speakerSlug } }
      : undefined,
    include: buildQuoteInclude(),
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });
}

export async function getQuoteCount(speakerSlug?: string) {
  return prisma.quote.count({
    where: speakerSlug
      ? { speaker: { slug: speakerSlug } }
      : undefined,
  });
}
```

**Step 2: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add src/lib/queries/quotes.ts
git commit -m "feat: add quotes query functions"
```

---

### Task 4: Quotes index page and quote card

**Files:**
- Create: `src/components/archive/quote-card.tsx`
- Create: `src/app/quotes/page.tsx`

**Step 1: Create the quote card component**

```typescript
// src/components/archive/quote-card.tsx
import Link from "next/link";
import { formatSeconds } from "@/lib/format/duration";
import type { QuoteWithRelations } from "@/lib/queries/quotes";

interface QuoteCardProps {
  quote: QuoteWithRelations;
}

export function QuoteCard({ quote }: QuoteCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <blockquote className="border-l-2 border-accent-gold/50 pl-4">
        <p className="text-sm text-text-primary italic">
          &ldquo;{quote.text}&rdquo;
        </p>
      </blockquote>

      <div className="mt-3 flex items-center gap-3 font-mono text-[10px] text-text-muted">
        {quote.speaker && (
          <Link
            href={`/people/${quote.speaker.slug}`}
            className="text-accent-gold hover:text-accent-green transition-colors"
          >
            — {quote.speaker.displayName}
          </Link>
        )}
        {quote.episode && (
          <Link
            href={`/episodes/${quote.episode.slug}`}
            className="hover:text-accent-green transition-colors"
          >
            {quote.episode.title}
          </Link>
        )}
        {quote.timestampSeconds != null && (
          <span className="text-accent-green/60">
            {formatSeconds(quote.timestampSeconds)}
          </span>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create the quotes index page**

```typescript
// src/app/quotes/page.tsx
import { PageShell } from "@/components/ui/page-shell";
import { QuoteCard } from "@/components/archive/quote-card";
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

  return (
    <PageShell
      title="QUOTES"
      subtitle={
        totalCount > 0
          ? `${totalCount} notable quotes from the archive`
          : "Notable quotes from the archive"
      }
    >
      {quotes.length === 0 ? (
        <EmptyState
          message="No quotes archived yet"
          suggestion="Quotes will be extracted during AI enrichment"
        />
      ) : (
        <>
          <div className="grid gap-3">
            {quotes.map((quote) => (
              <QuoteCard key={quote.id} quote={quote} />
            ))}
          </div>
          <PaginationControls meta={paginationMeta} basePath="/quotes" />
        </>
      )}
    </PageShell>
  );
}
```

**Step 3: Verify visually**

Run dev server, navigate to `/quotes`. Should show empty state with message.

**Step 4: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add src/components/archive/quote-card.tsx src/app/quotes/page.tsx
git commit -m "feat: add quotes index page with quote cards"
```

---

### Task 5: Series query functions

**Files:**
- Create: `src/lib/queries/series.ts`

**Step 1: Create the series query module**

```typescript
// src/lib/queries/series.ts
import { prisma } from "@/lib/db";
import type { Prisma, ContentStatus } from "@/generated/prisma/client";

export function buildSeriesInclude() {
  return {
    _count: { select: { episodes: true } },
  } satisfies Prisma.SeriesInclude;
}

export type SeriesWithCount = Prisma.SeriesGetPayload<{
  include: ReturnType<typeof buildSeriesInclude>;
}>;

export async function getSeries() {
  return prisma.series.findMany({
    include: buildSeriesInclude(),
    orderBy: { sortOrder: "asc" },
  });
}

export async function getSeriesBySlug(slug: string) {
  return prisma.series.findUnique({
    where: { slug },
    include: buildSeriesInclude(),
  });
}

export async function getSeriesEpisodes(seriesId: string, options?: {
  take?: number;
  skip?: number;
  status?: ContentStatus;
}) {
  const { take = 24, skip = 0, status = "published" } = options ?? {};

  return prisma.episode.findMany({
    where: { seriesId, status },
    orderBy: { episodeNumber: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      episodeNumber: true,
      airDate: true,
      summaryShort: true,
      status: true,
      guests: { include: { person: true } },
      topics: { include: { topic: true } },
    },
    take,
    skip,
  });
}

export async function getSeriesEpisodeCount(seriesId: string, status?: ContentStatus) {
  return prisma.episode.count({
    where: { seriesId, status: status ?? "published" },
  });
}
```

**Step 2: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add src/lib/queries/series.ts
git commit -m "feat: add series query functions"
```

---

### Task 6: Series index page and card

**Files:**
- Create: `src/components/archive/series-card.tsx`
- Create: `src/app/series/page.tsx`

**Step 1: Create the series card component**

```typescript
// src/components/archive/series-card.tsx
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
      className="group block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-green/30 hover:bg-elevated"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge
              label={series.type.replace("_", " ")}
              variant={typeVariant[series.type] ?? "muted"}
            />
            <span className="font-mono text-[10px] text-text-muted">
              {series._count.episodes} episodes
            </span>
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
      </div>
    </Link>
  );
}
```

**Step 2: Create the series index page**

```typescript
// src/app/series/page.tsx
import { PageShell } from "@/components/ui/page-shell";
import { SeriesCard } from "@/components/archive/series-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getSeries } from "@/lib/queries/series";

export const metadata = {
  title: "Series — CULT CODEX",
  description: "Browse Cult of Psyche series and collections",
};

export default async function SeriesPage() {
  const series = await getSeries();

  return (
    <PageShell
      title="SERIES"
      subtitle={
        series.length > 0
          ? `${series.length} series in the archive`
          : "Series and collections"
      }
    >
      {series.length === 0 ? (
        <EmptyState
          message="No series catalogued yet"
          suggestion="Series will appear here once they are created"
        />
      ) : (
        <div className="grid gap-3">
          {series.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
```

**Step 3: Verify visually**

Navigate to `/series`. Should show the seed series "The Cult of Psyche" or empty state.

**Step 4: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add src/components/archive/series-card.tsx src/app/series/page.tsx
git commit -m "feat: add series index page with series cards"
```

---

### Task 7: Series detail page

**Files:**
- Create: `src/app/series/[slug]/page.tsx`

**Step 1: Create the series detail page**

```typescript
// src/app/series/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { PageShell } from "@/components/ui/page-shell";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetaRow } from "@/components/ui/meta-row";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  getSeriesBySlug,
  getSeriesEpisodes,
  getSeriesEpisodeCount,
} from "@/lib/queries/series";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";
import { formatDate } from "@/lib/format/date";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);

  if (!series) {
    return buildMetadata({
      title: "Series Not Found",
      description: "This series could not be found.",
      path: `/series/${slug}`,
    });
  }

  return buildMetadata({
    title: series.title,
    description: series.description || null,
    path: `/series/${series.slug}`,
  });
}

export default async function SeriesDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const series = await getSeriesBySlug(slug);

  if (!series) notFound();

  const totalCount = await getSeriesEpisodeCount(series.id);
  const page = parsePage(sp.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const episodes = await getSeriesEpisodes(series.id, { take, skip });
  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  return (
    <PageShell
      title={series.title}
      subtitle={`${totalCount} episodes in this series`}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content — episode list */}
        <div className="lg:col-span-2">
          {episodes.length === 0 ? (
            <EmptyState message="No episodes in this series yet" />
          ) : (
            <>
              <div className="grid gap-3">
                {episodes.map((ep) => {
                  const epNum = ep.episodeNumber
                    ? `EP.${String(ep.episodeNumber).padStart(3, "0")}`
                    : null;
                  return (
                    <Link
                      key={ep.id}
                      href={`/episodes/${ep.slug}`}
                      className="group block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-green/30 hover:bg-elevated"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {epNum && (
                          <span className="font-mono text-[10px] text-accent-green font-bold">
                            {epNum}
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-text-muted">
                          {formatDate(ep.airDate)}
                        </span>
                      </div>
                      <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-green transition-colors truncate">
                        {ep.title}
                      </h3>
                      {ep.summaryShort && (
                        <p className="mt-1 text-xs text-text-muted line-clamp-2">
                          {ep.summaryShort}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
              <PaginationControls meta={paginationMeta} basePath={`/series/${slug}`} />
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SectionCard title="Series Info">
            <div className="space-y-0">
              <MetaRow
                label="Type"
                value={
                  <StatusBadge
                    label={series.type.replace("_", " ")}
                    variant="green"
                  />
                }
              />
              <MetaRow label="Episodes" value={String(totalCount)} />
              <MetaRow
                label="Status"
                value={<StatusBadge label={series.status} variant="green" />}
              />
            </div>
          </SectionCard>

          {series.description && (
            <SectionCard title="Description">
              <p className="text-sm text-text-primary leading-relaxed">
                {series.description}
              </p>
            </SectionCard>
          )}
        </div>
      </div>
    </PageShell>
  );
}
```

**Step 2: Verify visually**

Navigate to `/series/the-cult-of-psyche` (or whatever the seed series slug is).

**Step 3: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add src/app/series/[slug]/page.tsx
git commit -m "feat: add series detail page with paginated episode list"
```

---

### Task 8: Run all tests and final verification

**Step 1: Run all tests**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npm test`
Expected: All tests pass

**Step 2: Run the dev server and verify all pages**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npm run dev`

Verify each page loads:
- `/episodes` — episode index with 1,173 episodes
- `/episodes/{any-slug}` — detail page with YouTube embed at top
- `/quotes` — empty state with message
- `/series` — shows seed series card
- `/series/the-cult-of-psyche` — detail page

**Step 3: Final commit if any cleanup needed**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git status
# Only commit if there are changes
```
