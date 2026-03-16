import { PageHero } from "@/components/ui/page-hero";
import { EpisodeCard } from "@/components/archive/episode-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SortFilterBar } from "@/components/archive/sort-filter-bar";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  getEpisodes,
  formatEpisodeForCard,
  getEpisodeCount,
} from "@/lib/queries/episodes";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";

export const metadata = {
  title: "Episodes — CULT CODEX",
  description: "Browse all Cult of Psyche episodes",
};

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "A → Z", value: "az" },
];

interface EpisodesPageProps {
  searchParams: Promise<{ sort?: string; page?: string }>;
}

function resolveSort(sort?: string): {
  orderBy: "episodeNumber" | "airDate";
  order: "asc" | "desc";
} {
  switch (sort) {
    case "oldest":
      return { orderBy: "episodeNumber", order: "asc" };
    case "az":
      return { orderBy: "episodeNumber", order: "desc" }; // sort client-side
    default:
      return { orderBy: "episodeNumber", order: "desc" };
  }
}

export default async function EpisodesPage({
  searchParams,
}: EpisodesPageProps) {
  const params = await searchParams;
  const currentSort = params.sort ?? "newest";
  const { orderBy, order } = resolveSort(currentSort);

  const totalCount = await getEpisodeCount("published");
  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const episodes = await getEpisodes({ take, skip: skip, orderBy, order });
  let cards = episodes.map(formatEpisodeForCard);

  if (currentSort === "az") {
    cards = cards.sort((a, b) => a.title.localeCompare(b.title));
  }

  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  return (
    <>
    <PageHero
      title="EPISODES"
      subtitle={`${totalCount} transmissions in the archive`}
      backgroundImage="/articles-bacgkground.jpg"
    />
    <main className="mx-auto max-w-7xl px-4 py-8">
      <SortFilterBar
        basePath="/episodes"
        sortOptions={SORT_OPTIONS}
        currentSort={currentSort}
      />

      {cards.length === 0 ? (
        <EmptyState
          message="No episodes in the archive yet"
          suggestion="Episodes will appear here once data is ingested"
        />
      ) : (
        <>
          <div className="grid gap-3">
            {cards.map((episode) => (
              <EpisodeCard key={episode.id} episode={episode} />
            ))}
          </div>
          <PaginationControls meta={paginationMeta} basePath="/episodes" />
        </>
      )}
    </main>
    </>
  );
}
