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

export const revalidate = 60;

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

  const [aggregates, totalCount] = await Promise.all([
    getEpisodeAggregates(),
    getEpisodeCount(),
  ]);

  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const episodes = await getEpisodes({ take, skip, orderBy, order });
  const cards = episodes.map(formatEpisodeForCard);

  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  const glanceItems = [
    { icon: "\uD83C\uDFAC", label: `${aggregates.total} episode${aggregates.total !== 1 ? "s" : ""}` },
    ...(aggregates.earliestDate && aggregates.latestDate
      ? [{ icon: "\uD83D\uDCC5", label: `${formatDate(aggregates.earliestDate)} — ${formatDate(aggregates.latestDate)}` }]
      : []),
    ...(aggregates.totalGuests > 0
      ? [{ icon: "\uD83C\uDFA4", label: `${aggregates.totalGuests} guest appearance${aggregates.totalGuests !== 1 ? "s" : ""}` }]
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
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
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
