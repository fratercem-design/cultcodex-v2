# Phase 4: Cross-Page Visual Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade all detail pages (People, Lore, Topics, Series) to match the episode page's visual richness — heroes, glance bars, stats panels, richer episode listings.

**Architecture:** Build 4 generic shared components (`EntityHero`, `EntityGlanceBar`, `EntityStatsPanel`, `EpisodeListItem`), then upgrade each page by swapping `PageShell` for the new components. Reuse existing Phase 3 components (`GuestGrid`, `QuoteHighlightCard`) where applicable.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Prisma 7, TypeScript

---

### Task 1: EntityHero Component

**Files:**
- Create: `src/components/ui/entity-hero.tsx`

**Step 1: Create the EntityHero component**

Create `src/components/ui/entity-hero.tsx`:

```tsx
import Image from "next/image";
import { StatusBadge } from "@/components/ui/status-badge";
import type { BadgeVariant } from "@/components/ui/status-badge";

interface HeroBadge {
  label: string;
  variant: "green" | "purple" | "gold" | "muted";
}

interface EntityHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage: string;
  avatarUrl?: string | null;
  badges?: HeroBadge[];
}

export function EntityHero({
  title,
  subtitle,
  backgroundImage,
  avatarUrl,
  badges,
}: EntityHeroProps) {
  return (
    <section className="relative flex min-h-[200px] items-end overflow-hidden">
      <Image
        src={backgroundImage}
        alt=""
        fill
        priority
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
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt=""
              className="h-20 w-20 rounded-full border-2 border-accent-gold/40 object-cover shadow-lg"
            />
          )}
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-accent-gold drop-shadow-md">
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

**Step 2: Export the BadgeVariant type from StatusBadge**

In `src/components/ui/status-badge.tsx`, the `BadgeVariant` type is not exported. Add the `export` keyword:

Change line 3 from:
```tsx
type BadgeVariant = "green" | "purple" | "gold" | "muted";
```
to:
```tsx
export type BadgeVariant = "green" | "purple" | "gold" | "muted";
```

**Step 3: Verify build passes**

Run: `npx next build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/ui/entity-hero.tsx src/components/ui/status-badge.tsx
git commit -m "feat: add generic EntityHero component for detail pages"
```

---

### Task 2: EntityGlanceBar Component

**Files:**
- Create: `src/components/ui/entity-glance-bar.tsx`

**Step 1: Create the EntityGlanceBar component**

Create `src/components/ui/entity-glance-bar.tsx`:

```tsx
import Link from "next/link";

interface GlanceItem {
  icon?: string;
  label: string;
  href?: string;
  variant?: "default" | "purple";
}

interface EntityGlanceBarProps {
  items: GlanceItem[];
}

export function EntityGlanceBar({ items }: EntityGlanceBarProps) {
  if (items.length === 0) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => {
          const className =
            item.variant === "purple"
              ? "inline-flex items-center gap-1.5 rounded-full border border-accent-purple/30 bg-accent-purple-dim px-2.5 py-1 font-mono text-[10px] text-accent-purple transition-colors hover:border-accent-purple/50"
              : "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[10px] text-text-muted";

          const content = (
            <>
              {item.icon && <span className="text-xs">{item.icon}</span>}
              {item.label}
            </>
          );

          if (item.href) {
            return (
              <Link key={i} href={item.href} className={className}>
                {content}
              </Link>
            );
          }

          return (
            <span key={i} className={className}>
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Verify build passes**

Run: `npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/ui/entity-glance-bar.tsx
git commit -m "feat: add generic EntityGlanceBar component for detail pages"
```

---

### Task 3: EntityStatsPanel Component

**Files:**
- Create: `src/components/ui/entity-stats-panel.tsx`

**Step 1: Create the EntityStatsPanel component**

Create `src/components/ui/entity-stats-panel.tsx`:

```tsx
import { SectionCard } from "@/components/ui/section-card";

interface StatItem {
  icon: string;
  label: string;
  value: number;
  suffix?: string;
}

interface EntityStatsPanelProps {
  stats: StatItem[];
  title?: string;
}

export function EntityStatsPanel({
  stats,
  title = "At a Glance",
}: EntityStatsPanelProps) {
  const hasAnyData = stats.some((s) => s.value > 0);
  if (!hasAnyData) return null;

  return (
    <SectionCard title={title}>
      <div className="space-y-2">
        {stats.map((stat) => {
          if (stat.value === 0) return null;
          return (
            <div key={stat.label} className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono text-xs text-text-muted">
                <span className="text-sm">{stat.icon}</span>
                {stat.label}
              </span>
              <span className="font-mono text-xs font-semibold text-text-primary">
                {stat.value}{stat.suffix ?? ""}
              </span>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
```

**Step 2: Verify build passes**

Run: `npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/ui/entity-stats-panel.tsx
git commit -m "feat: add generic EntityStatsPanel component for detail pages"
```

---

### Task 4: EpisodeListItem Component

**Files:**
- Create: `src/components/archive/episode-list-item.tsx`

**Step 1: Create the EpisodeListItem component**

Create `src/components/archive/episode-list-item.tsx`:

```tsx
import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/format/date";

interface EpisodeListItemProps {
  slug: string;
  title: string;
  episodeNumber?: number | null;
  airDate?: Date | null;
  summaryShort?: string | null;
  thumbnailUrl?: string | null;
}

export function EpisodeListItem({
  slug,
  title,
  episodeNumber,
  airDate,
  summaryShort,
  thumbnailUrl,
}: EpisodeListItemProps) {
  const epNum = episodeNumber
    ? `EP.${String(episodeNumber).padStart(3, "0")}`
    : null;

  return (
    <Link
      href={`/episodes/${slug}`}
      className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent-green/30 hover:bg-elevated"
    >
      {thumbnailUrl && (
        <Image
          src={thumbnailUrl}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 flex-shrink-0 rounded object-cover"
          unoptimized
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          {epNum && (
            <span className="font-mono text-[10px] text-accent-green font-bold">
              {epNum}
            </span>
          )}
          {airDate && (
            <span className="font-mono text-[10px] text-text-muted">
              {formatDate(airDate)}
            </span>
          )}
        </div>
        <h4 className="text-sm font-medium text-text-primary group-hover:text-accent-green transition-colors line-clamp-2">
          {title}
        </h4>
        {summaryShort && (
          <p className="mt-1 text-xs text-text-muted line-clamp-2">
            {summaryShort}
          </p>
        )}
      </div>
    </Link>
  );
}
```

**Step 2: Verify build passes**

Run: `npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/archive/episode-list-item.tsx
git commit -m "feat: add EpisodeListItem component for richer episode listings"
```

---

### Task 5: Upgrade Person Detail Page

**Files:**
- Modify: `src/app/people/[slug]/page.tsx`

**Step 1: Rewrite the person detail page**

Replace the entire content of `src/app/people/[slug]/page.tsx` with:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPersonBySlug } from "@/lib/queries/people";
import { buildMetadata } from "@/lib/seo";
import { EntityHero } from "@/components/ui/entity-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { EntityStatsPanel } from "@/components/ui/entity-stats-panel";
import { SectionCard } from "@/components/ui/section-card";
import { MetaRow } from "@/components/ui/meta-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { EntityChipList } from "@/components/archive/entity-chip-list";
import { EpisodeListItem } from "@/components/archive/episode-list-item";
import { QuoteHighlightCard } from "@/components/episodes/quote-highlight-card";
import { formatDate } from "@/lib/format/date";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const person = await getPersonBySlug(slug);

  if (!person) {
    return buildMetadata({
      title: "Person Not Found",
      description: "This person could not be found.",
      path: `/people/${slug}`,
    });
  }

  return buildMetadata({
    title: person.displayName,
    description: person.shortBio || person.searchText || null,
    path: `/people/${person.slug}`,
  });
}

const PERSON_TYPE_LABELS: Record<string, string> = {
  host: "Host",
  recurring_guest: "Recurring Guest",
  guest: "Guest",
  mentioned: "Mentioned",
};

const PERSON_TYPE_VARIANTS: Record<string, "green" | "purple" | "gold" | "muted"> = {
  host: "green",
  recurring_guest: "purple",
  guest: "muted",
  mentioned: "muted",
};

export default async function PersonDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const person = await getPersonBySlug(slug);

  if (!person) notFound();

  const allEpisodes = [
    ...person.guestAppearances.map((g) => g.episode),
    ...person.mentions.map((m) => m.episode),
  ];

  // Deduplicate by id and sort newest first
  const uniqueEpisodes = Array.from(
    new Map(allEpisodes.map((e) => [e.id, e])).values()
  ).sort((a, b) => (b.airDate?.getTime() ?? 0) - (a.airDate?.getTime() ?? 0));

  const typeLabel = PERSON_TYPE_LABELS[person.personType] ?? person.personType;
  const typeVariant = PERSON_TYPE_VARIANTS[person.personType] ?? "muted";

  const glanceItems = [
    { icon: "\uD83C\uDFAD", label: typeLabel },
    ...(uniqueEpisodes.length > 0
      ? [{ icon: "\uD83C\uDFAC", label: `${uniqueEpisodes.length} appearance${uniqueEpisodes.length !== 1 ? "s" : ""}` }]
      : []),
    ...(person.quotes.length > 0
      ? [{ icon: "\uD83D\uDCAC", label: `${person.quotes.length} quote${person.quotes.length !== 1 ? "s" : ""}` }]
      : []),
    ...(person.firstAppearanceEpisode?.airDate
      ? [{ icon: "\uD83D\uDCC5", label: `First seen ${formatDate(person.firstAppearanceEpisode.airDate)}` }]
      : []),
    ...(person.topics.length > 0
      ? [{ icon: "\uD83C\uDFF7\uFE0F", label: `${person.topics.length} topic${person.topics.length !== 1 ? "s" : ""}` }]
      : []),
  ];

  return (
    <>
      <EntityHero
        title={person.displayName}
        subtitle={person.shortBio ?? undefined}
        backgroundImage="/wiki-page-header.jpg"
        avatarUrl={person.avatarUrl}
        badges={[{ label: typeLabel, variant: typeVariant }]}
      />
      <EntityGlanceBar items={glanceItems} />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Bio / Lore Summary */}
            {person.loreSummary && (
              <SectionCard title="Lore Summary">
                <p className="text-sm text-text-primary leading-relaxed">
                  {person.loreSummary}
                </p>
              </SectionCard>
            )}

            {/* Appearances */}
            <SectionCard title={`Appearances (${uniqueEpisodes.length})`}>
              {uniqueEpisodes.length > 0 ? (
                <div className="grid gap-3">
                  {uniqueEpisodes.map((ep) => (
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
                <p className="text-xs text-text-muted">No appearances recorded</p>
              )}
            </SectionCard>

            {/* Quotes */}
            {person.quotes.length > 0 && (
              <SectionCard title={`Quotes (${person.quotes.length})`}>
                <div className="space-y-4">
                  {person.quotes.map((q) => (
                    <QuoteHighlightCard
                      key={q.id}
                      id={q.id}
                      text={q.text}
                      speakerName={person.displayName}
                      speakerAvatarUrl={person.avatarUrl}
                      timestampSeconds={q.timestampSeconds}
                    />
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <EntityStatsPanel
              stats={[
                { icon: "\uD83C\uDFA4", label: "Appearances", value: person.guestAppearances.length },
                { icon: "\uD83D\uDCE2", label: "Mentions", value: person.mentions.length },
                { icon: "\uD83D\uDCAC", label: "Quotes", value: person.quotes.length },
                { icon: "\uD83C\uDFF7\uFE0F", label: "Topics", value: person.topics.length },
                { icon: "\uD83D\uDD17", label: "Lore Links", value: person.loreConnections.length },
              ]}
            />

            <SectionCard title="Dossier">
              <MetaRow
                label="Type"
                value={<StatusBadge label={typeLabel} variant={typeVariant} />}
              />
              {person.firstAppearanceEpisode && (
                <MetaRow
                  label="First Seen"
                  value={formatDate(person.firstAppearanceEpisode.airDate)}
                />
              )}
              {person.altNames.length > 0 && (
                <MetaRow label="Also Known As" value={person.altNames.join(", ")} />
              )}
            </SectionCard>

            <SectionCard>
              <EntityChipList
                title="Topics"
                entities={person.topics.map((t) => ({
                  label: t.topic.title,
                  slug: t.topic.slug,
                  type: "topic",
                }))}
              />
            </SectionCard>

            <SectionCard>
              <EntityChipList
                title="Lore Connections"
                entities={person.loreConnections.map((l) => ({
                  label: l.loreEntry.title,
                  slug: l.loreEntry.slug,
                  type: "lore",
                }))}
              />
            </SectionCard>
          </div>
        </div>
      </main>
    </>
  );
}
```

**Step 2: Verify build passes**

Run: `npx next build`
Expected: Build succeeds.

Note: The person query uses `include: buildPersonInclude()` which returns all scalar fields including `avatarUrl`, `shortBio`, `loreSummary`, and episode relations include all fields including `thumbnailUrl`, `summaryShort`, `airDate`, `episodeNumber`.

**Step 3: Commit**

```bash
git add src/app/people/[slug]/page.tsx
git commit -m "feat: upgrade person detail page with hero, glance bar, stats, and rich listings"
```

---

### Task 6: Upgrade Lore Detail Page

**Files:**
- Modify: `src/lib/queries/lore.ts`
- Modify: `src/app/lore/[slug]/page.tsx`

**Step 1: Add related lore includes to the query**

In `src/lib/queries/lore.ts`, update `buildLoreInclude()` to include related lore entries:

Change the function from:
```tsx
export function buildLoreInclude() {
  return {
    firstMentionEpisode: true,
    episodes: { include: { episode: true } },
    people: { include: { person: true } },
    topics: { include: { topic: true } },
  } satisfies Prisma.LoreEntryInclude;
}
```

To:
```tsx
export function buildLoreInclude() {
  return {
    firstMentionEpisode: true,
    episodes: { include: { episode: true } },
    people: { include: { person: true } },
    topics: { include: { topic: true } },
    relatedFrom: { include: { loreEntryB: true } },
    relatedTo: { include: { loreEntryA: true } },
  } satisfies Prisma.LoreEntryInclude;
}
```

**Step 2: Rewrite the lore detail page**

Replace the entire content of `src/app/lore/[slug]/page.tsx` with:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLoreBySlug } from "@/lib/queries/lore";
import { buildMetadata } from "@/lib/seo";
import { EntityHero } from "@/components/ui/entity-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { EntityStatsPanel } from "@/components/ui/entity-stats-panel";
import { SectionCard } from "@/components/ui/section-card";
import { MetaRow } from "@/components/ui/meta-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { EntityChipList } from "@/components/archive/entity-chip-list";
import { EpisodeListItem } from "@/components/archive/episode-list-item";
import { GuestGrid } from "@/components/episodes/guest-grid";
import { formatDate } from "@/lib/format/date";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getLoreBySlug(slug);

  if (!entry) {
    return buildMetadata({
      title: "Lore Entry Not Found",
      description: "This lore entry could not be found.",
      path: `/lore/${slug}`,
    });
  }

  return buildMetadata({
    title: entry.title,
    description: entry.summary || entry.searchText || null,
    path: `/lore/${entry.slug}`,
  });
}

const CANON_VARIANTS: Record<string, "green" | "purple" | "gold" | "muted"> = {
  canonical: "gold",
  speculative: "purple",
  community_myth: "green",
};

export default async function LoreDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await getLoreBySlug(slug);

  if (!entry) notFound();

  const canonLabel = entry.canonStatus.replace("_", " ");
  const canonVariant = CANON_VARIANTS[entry.canonStatus] ?? "muted";

  // Collect related lore entries (deduplicated)
  const relatedLore = Array.from(
    new Map([
      ...entry.relatedFrom.map((r) => [r.loreEntryB.id, r.loreEntryB] as const),
      ...entry.relatedTo.map((r) => [r.loreEntryA.id, r.loreEntryA] as const),
    ]).values()
  );

  const glanceItems = [
    { icon: "\uD83D\uDCDC", label: canonLabel.charAt(0).toUpperCase() + canonLabel.slice(1) },
    ...(entry.category ? [{ icon: "\uD83D\uDCC2", label: entry.category }] : []),
    ...(entry.firstMentionEpisode?.airDate
      ? [{ icon: "\uD83D\uDCC5", label: `First mention ${formatDate(entry.firstMentionEpisode.airDate)}` }]
      : []),
    ...(entry.episodes.length > 0
      ? [{ icon: "\uD83C\uDFAC", label: `${entry.episodes.length} episode${entry.episodes.length !== 1 ? "s" : ""}` }]
      : []),
    ...(entry.people.length > 0
      ? [{ icon: "\uD83D\uDC64", label: `${entry.people.length} ${entry.people.length !== 1 ? "people" : "person"}` }]
      : []),
    ...(entry.topics.length > 0
      ? [{ icon: "\uD83C\uDFF7\uFE0F", label: `${entry.topics.length} topic${entry.topics.length !== 1 ? "s" : ""}` }]
      : []),
  ];

  return (
    <>
      <EntityHero
        title={entry.title}
        subtitle={entry.category ?? undefined}
        backgroundImage="/lore-header.jpg"
        badges={[{ label: canonLabel.toUpperCase(), variant: canonVariant }]}
      />
      <EntityGlanceBar items={glanceItems} />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {entry.summary && (
              <SectionCard title="Summary">
                <p className="text-sm text-text-primary leading-relaxed">
                  {entry.summary}
                </p>
              </SectionCard>
            )}

            {entry.fullEntry && (
              <SectionCard title="Full Entry">
                <div className="prose prose-invert prose-sm max-w-none text-text-primary">
                  {entry.fullEntry}
                </div>
              </SectionCard>
            )}

            {/* Episode appearances */}
            {entry.episodes.length > 0 && (
              <SectionCard title={`Episodes (${entry.episodes.length})`}>
                <div className="grid gap-3">
                  {entry.episodes.map((e) => (
                    <EpisodeListItem
                      key={e.episode.id}
                      slug={e.episode.slug}
                      title={e.episode.title}
                      episodeNumber={e.episode.episodeNumber}
                      airDate={e.episode.airDate}
                      summaryShort={e.episode.summaryShort}
                      thumbnailUrl={e.episode.thumbnailUrl}
                    />
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Related lore */}
            {relatedLore.length > 0 && (
              <SectionCard title={`Related Lore (${relatedLore.length})`}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {relatedLore.map((lore) => (
                    <Link
                      key={lore.id}
                      href={`/lore/${lore.slug}`}
                      className="group block rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent-gold/30 hover:bg-elevated"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge
                          label={lore.canonStatus.replace("_", " ")}
                          variant={CANON_VARIANTS[lore.canonStatus] ?? "muted"}
                        />
                      </div>
                      <h4 className="text-sm font-medium text-text-primary group-hover:text-accent-gold transition-colors line-clamp-2">
                        {lore.title}
                      </h4>
                      {lore.summary && (
                        <p className="mt-1 text-xs text-text-muted line-clamp-2">
                          {lore.summary}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <EntityStatsPanel
              stats={[
                { icon: "\uD83C\uDFAC", label: "Episodes", value: entry.episodes.length },
                { icon: "\uD83D\uDC64", label: "People", value: entry.people.length },
                { icon: "\uD83C\uDFF7\uFE0F", label: "Topics", value: entry.topics.length },
                { icon: "\uD83D\uDD17", label: "Related Lore", value: relatedLore.length },
              ]}
            />

            <SectionCard title="Classification">
              <MetaRow
                label="Canon Status"
                value={<StatusBadge label={canonLabel} variant={canonVariant} />}
              />
              {entry.category && <MetaRow label="Category" value={entry.category} />}
              {entry.firstMentionEpisode && (
                <MetaRow
                  label="First Mention"
                  value={formatDate(entry.firstMentionEpisode.airDate)}
                />
              )}
            </SectionCard>

            {/* People — avatar grid */}
            <GuestGrid
              guests={entry.people.map((p) => ({
                displayName: p.person.displayName,
                slug: p.person.slug,
                avatarUrl: p.person.avatarUrl,
              }))}
            />

            <SectionCard>
              <EntityChipList
                title="Topics"
                entities={entry.topics.map((t) => ({
                  label: t.topic.title,
                  slug: t.topic.slug,
                  type: "topic",
                }))}
              />
            </SectionCard>
          </div>
        </div>
      </main>
    </>
  );
}
```

**Step 3: Verify build passes**

Run: `npx next build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/lib/queries/lore.ts src/app/lore/[slug]/page.tsx
git commit -m "feat: upgrade lore detail page with hero, glance bar, stats, related lore, and people grid"
```

---

### Task 7: Upgrade Topic Detail Page

**Files:**
- Modify: `src/app/topics/[slug]/page.tsx`

**Step 1: Rewrite the topic detail page**

Replace the entire content of `src/app/topics/[slug]/page.tsx` with:

```tsx
import { notFound } from "next/navigation";
import { getTopicBySlug } from "@/lib/queries/topics";
import { buildMetadata } from "@/lib/seo";
import { EntityHero } from "@/components/ui/entity-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { EntityStatsPanel } from "@/components/ui/entity-stats-panel";
import { SectionCard } from "@/components/ui/section-card";
import { EntityChipList } from "@/components/archive/entity-chip-list";
import { EpisodeListItem } from "@/components/archive/episode-list-item";
import { GuestGrid } from "@/components/episodes/guest-grid";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);

  if (!topic) {
    return buildMetadata({
      title: "Topic Not Found",
      description: "This topic could not be found.",
      path: `/topics/${slug}`,
    });
  }

  return buildMetadata({
    title: topic.title,
    description: topic.description || null,
    path: `/topics/${topic.slug}`,
  });
}

export default async function TopicDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);

  if (!topic) notFound();

  const glanceItems = [
    ...(topic.episodes.length > 0
      ? [{ icon: "\uD83C\uDFAC", label: `${topic.episodes.length} episode${topic.episodes.length !== 1 ? "s" : ""}` }]
      : []),
    ...(topic.people.length > 0
      ? [{ icon: "\uD83D\uDC64", label: `${topic.people.length} ${topic.people.length !== 1 ? "people" : "person"}` }]
      : []),
    ...(topic.lore.length > 0
      ? [{ icon: "\uD83D\uDCDC", label: `${topic.lore.length} lore entr${topic.lore.length !== 1 ? "ies" : "y"}` }]
      : []),
  ];

  return (
    <>
      <EntityHero
        title={topic.title}
        subtitle="Topic"
        backgroundImage="/wiki-page-header.jpg"
      />
      <EntityGlanceBar items={glanceItems} />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {topic.description && (
              <SectionCard title="Description">
                <p className="text-sm text-text-primary leading-relaxed">
                  {topic.description}
                </p>
              </SectionCard>
            )}

            <SectionCard title={`Episodes (${topic.episodes.length})`}>
              {topic.episodes.length > 0 ? (
                <div className="grid gap-3">
                  {topic.episodes.map((e) => (
                    <EpisodeListItem
                      key={e.episode.id}
                      slug={e.episode.slug}
                      title={e.episode.title}
                      episodeNumber={e.episode.episodeNumber}
                      airDate={e.episode.airDate}
                      summaryShort={e.episode.summaryShort}
                      thumbnailUrl={e.episode.thumbnailUrl}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted">No episodes linked yet</p>
              )}
            </SectionCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <EntityStatsPanel
              stats={[
                { icon: "\uD83C\uDFAC", label: "Episodes", value: topic.episodes.length },
                { icon: "\uD83D\uDC64", label: "People", value: topic.people.length },
                { icon: "\uD83D\uDCDC", label: "Lore Entries", value: topic.lore.length },
              ]}
            />

            {/* People — avatar grid */}
            <GuestGrid
              guests={topic.people.map((p) => ({
                displayName: p.person.displayName,
                slug: p.person.slug,
                avatarUrl: p.person.avatarUrl,
              }))}
            />

            <SectionCard>
              <EntityChipList
                title="Lore"
                entities={topic.lore.map((l) => ({
                  label: l.loreEntry.title,
                  slug: l.loreEntry.slug,
                  type: "lore",
                }))}
              />
            </SectionCard>
          </div>
        </div>
      </main>
    </>
  );
}
```

**Step 2: Verify build passes**

Run: `npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/app/topics/[slug]/page.tsx
git commit -m "feat: upgrade topic detail page with hero, glance bar, stats, and people grid"
```

---

### Task 8: Upgrade Series Detail Page

**Files:**
- Modify: `src/lib/queries/series.ts`
- Modify: `src/app/series/[slug]/page.tsx`

**Step 1: Add thumbnailUrl to series episode query**

In `src/lib/queries/series.ts`, update the `getSeriesEpisodes` select to include `thumbnailUrl`:

Change line 38-48 from:
```tsx
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
```

To:
```tsx
    select: {
      id: true,
      title: true,
      slug: true,
      episodeNumber: true,
      airDate: true,
      summaryShort: true,
      thumbnailUrl: true,
      status: true,
      guests: { include: { person: true } },
      topics: { include: { topic: true } },
    },
```

**Step 2: Rewrite the series detail page**

Replace the entire content of `src/app/series/[slug]/page.tsx` with:

```tsx
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { EntityHero } from "@/components/ui/entity-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { EntityStatsPanel } from "@/components/ui/entity-stats-panel";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetaRow } from "@/components/ui/meta-row";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { EpisodeListItem } from "@/components/archive/episode-list-item";
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

const SERIES_TYPE_ICONS: Record<string, string> = {
  recurring_series: "\uD83D\uDD01",
  mini_series: "\uD83D\uDCDA",
  one_off: "\u2B50",
  other: "\uD83C\uDFAC",
};

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

  const typeLabel = series.type.replace("_", " ");
  const typeIcon = SERIES_TYPE_ICONS[series.type] ?? "\uD83C\uDFAC";

  // Date range from episodes on this page (approximation — good enough)
  const dates = episodes
    .map((ep) => ep.airDate?.getTime())
    .filter((d): d is number => d != null)
    .sort();
  const firstDate = dates.length > 0 ? new Date(dates[0]) : null;
  const lastDate = dates.length > 0 ? new Date(dates[dates.length - 1]) : null;

  const glanceItems = [
    { icon: typeIcon, label: typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1) },
    { icon: "\uD83C\uDFAC", label: `${totalCount} episode${totalCount !== 1 ? "s" : ""}` },
    { icon: "\u2705", label: series.status.charAt(0).toUpperCase() + series.status.slice(1) },
  ];

  return (
    <>
      <EntityHero
        title={series.title}
        subtitle={`${totalCount} episodes in this series`}
        backgroundImage={series.coverImageUrl || "/wiki-page-header.jpg"}
        badges={[
          { label: typeLabel.toUpperCase(), variant: "green" },
          { label: series.status.toUpperCase(), variant: series.status === "published" ? "green" : "muted" },
        ]}
      />
      <EntityGlanceBar items={glanceItems} />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content — episode list */}
          <div className="lg:col-span-2">
            {episodes.length === 0 ? (
              <EmptyState message="No episodes in this series yet" />
            ) : (
              <>
                <div className="grid gap-3">
                  {episodes.map((ep) => (
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
                <PaginationControls meta={paginationMeta} basePath={`/series/${slug}`} />
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <EntityStatsPanel
              stats={[
                { icon: "\uD83C\uDFAC", label: "Episodes", value: totalCount },
              ]}
            />

            <SectionCard title="Series Info">
              <div className="space-y-0">
                <MetaRow
                  label="Type"
                  value={
                    <StatusBadge
                      label={typeLabel}
                      variant="green"
                    />
                  }
                />
                <MetaRow label="Episodes" value={String(totalCount)} />
                <MetaRow
                  label="Status"
                  value={<StatusBadge label={series.status} variant="green" />}
                />
                {firstDate && lastDate && (
                  <MetaRow
                    label="Date Range"
                    value={`${formatDate(firstDate)} — ${formatDate(lastDate)}`}
                  />
                )}
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
      </main>
    </>
  );
}
```

**Step 3: Verify build passes**

Run: `npx next build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/lib/queries/series.ts src/app/series/[slug]/page.tsx
git commit -m "feat: upgrade series detail page with hero, glance bar, stats, and thumbnail episode cards"
```

---

### Task 9: Final Build Verification & Deploy

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
