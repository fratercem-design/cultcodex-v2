import Link from "next/link";
import { getCounts, fmtEpisodeCount } from "@/lib/queries/stats";
import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { EpisodeCard } from "@/components/archive/episode-card";
import { EpisodeListItem } from "@/components/archive/episode-list-item";
import { EmptyState } from "@/components/ui/empty-state";
import { SortFilterBar } from "@/components/archive/sort-filter-bar";
import { ViewToggle } from "@/components/archive/view-toggle";
import { RandomEpisodeButton } from "@/components/archive/random-episode-button";
import { TimelineView } from "@/components/archive/timeline-view";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { EraTag } from "@/components/ui/era-tag";
import {
  getEpisodeCards,
  getEpisodeCount,
} from "@/lib/queries/episodes";
import { getEpisodeAggregates, getArchiveLastUpdated } from "@/lib/queries/stats";
import { getEraById } from "@/lib/eras";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";
import { formatDate, formatRelativeDate } from "@/lib/format/date";

export const revalidate = 3600;

export async function generateMetadata() {
  const counts = await getCounts().catch(() => null);
  return {
    alternates: { canonical: "/episodes" },
    title: "Episodes — CULT CODEX",
    description: `Browse ${fmtEpisodeCount(counts?.episodes ?? 0)} Cult of Psyche transmissions — sortable by era, type, topic, and guest. Full transcripts, AI breakdowns, and behavioral profiles for every session.`,
  };
}

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
  searchParams: Promise<{ sort?: string; page?: string; filter?: string; view?: string; era?: string; person?: string; topic?: string }>;
}

function resolveSort(sort?: string): {
  orderBy: "episodeNumber" | "airDate" | "title";
  order: "asc" | "desc";
} {
  switch (sort) {
    case "oldest":
      return { orderBy: "airDate", order: "asc" };
    case "az":
      return { orderBy: "title", order: "asc" };
    default:
      // Default "newest" — sort by airDate desc for proper chronological order
      return { orderBy: "airDate", order: "desc" };
  }
}

export default async function EpisodesPage({
  searchParams,
}: EpisodesPageProps) {
  const params = await searchParams;
  const currentSort = params.sort ?? "newest";
  const currentView = params.view ?? "card";
  const { orderBy, order } = resolveSort(currentSort);
  const activeEraId = params.era && getEraById(params.era) ? params.era : undefined;
  const activeEra = activeEraId ? getEraById(activeEraId) : null;
  // /people/[slug] caps its appearance list; this is the full paginated view.
  const personSlug = params.person?.trim() || undefined;
  const topicSlug = params.topic?.trim() || undefined;

  const [aggregates, totalCount, lastUpdated] = await Promise.all([
    getEpisodeAggregates(),
    getEpisodeCount(undefined, activeEraId, personSlug, topicSlug),
    getArchiveLastUpdated(),
  ]);

  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const cards = await getEpisodeCards({ take, skip, orderBy, order, eraId: activeEraId, personSlug, topicSlug });

  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  const glanceItems = [
    { icon: "\uD83C\uDFAC", label: `${aggregates.total} episode${aggregates.total !== 1 ? "s" : ""}` },
    ...(aggregates.earliestDate && aggregates.latestDate
      ? [{ icon: "\uD83D\uDCC5", label: `${formatDate(aggregates.earliestDate)} — ${formatDate(aggregates.latestDate)}` }]
      : []),
    ...(aggregates.totalGuests > 0
      ? [{ icon: "\uD83C\uDFA4", label: `${aggregates.totalGuests} guest appearance${aggregates.totalGuests !== 1 ? "s" : ""}` }]
      : []),
    ...(lastUpdated
      ? [{ icon: "\uD83D\uDD04", label: `Updated ${formatRelativeDate(lastUpdated)}` }]
      : []),
  ];

  return (
    <>
    <PageHero
      title="EPISODES"
      subtitle={`${totalCount} transmissions in the archive`}
      backgroundImage="/articles-bacgkground.jpg"
    
      label="archive"
    />
    <EntityGlanceBar items={glanceItems} />
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
      {topicSlug && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-border bg-elevated px-4 py-3">
          <p className="font-mono text-xs text-text-muted">
            Filtered to the topic{" "}
            <Link href={`/topics/${topicSlug}`} className="text-text-primary underline">
              {topicSlug.replace(/-/g, " ")}
            </Link>{" "}
            · {totalCount} episode{totalCount !== 1 ? "s" : ""}
          </p>
          <Link
            href="/episodes"
            className="font-mono text-[12px] text-text-muted hover:text-text-primary transition-colors"
          >
            Clear ×
          </Link>
        </div>
      )}
      {personSlug && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-border bg-elevated px-4 py-3">
          <p className="font-mono text-xs text-text-muted">
            Filtered to appearances by{" "}
            <Link href={`/people/${personSlug}`} className="text-text-primary underline">
              {personSlug.replace(/-/g, " ")}
            </Link>{" "}
            · {totalCount} episode{totalCount !== 1 ? "s" : ""}
          </p>
          <Link
            href="/episodes"
            className="font-mono text-[12px] text-text-muted hover:text-text-primary transition-colors"
          >
            Clear ×
          </Link>
        </div>
      )}
      {activeEra && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-border bg-elevated px-4 py-3">
          <div className="flex items-center gap-3">
            <EraTag era={activeEra} size="sm" />
            <p className="font-mono text-xs text-text-muted">{activeEra.subtitle} · {totalCount} episode{totalCount !== 1 ? "s" : ""}</p>
          </div>
          <Link
            href="/episodes"
            className="font-mono text-[12px] text-text-muted hover:text-text-primary transition-colors"
          >
            Clear ×
          </Link>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <SortFilterBar
          basePath="/episodes"
          sortOptions={SORT_OPTIONS}
          currentSort={currentSort}
          filterLabel="Type"
          filterOptions={FILTER_OPTIONS}
          currentFilter={params.filter}
        />
        <div className="flex items-center gap-2">
          {!activeEra && (
            <Link
              href="/eras"
              className="font-mono text-[12px] text-text-muted border border-border rounded px-2.5 py-1.5 hover:border-accent-gold/40 hover:text-accent-gold-text transition-colors"
            >
              Browse by Era
            </Link>
          )}
          <RandomEpisodeButton />
          <ViewToggle basePath="/episodes" currentView={currentView} />
        </div>
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
                  segmentCount={ep.segmentCount}
                />
              ))}
            </div>
          ) : currentView === "timeline" ? (
            <TimelineView
              episodes={cards.map((c) => ({
                id: c.id,
                slug: c.slug,
                title: c.title,
                episodeNumber: c.episodeNumber,
                airDate: c.airDate,
                summaryShort: c.summaryShort,
                thumbnailUrl: c.thumbnailUrl,
              }))}
            />
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
