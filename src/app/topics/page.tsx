import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { TopicCard } from "@/components/archive/topic-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SortFilterBar } from "@/components/archive/sort-filter-bar";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getTopics, getTopicCount } from "@/lib/queries/topics";
import { getTopicAggregates } from "@/lib/queries/stats";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";

export const metadata = {
  title: "Topics — CULT CODEX",
  description: "Explore the key topics and themes of the Cult of Psyche",
};

const SORT_OPTIONS = [
  { label: "A → Z", value: "az" },
  { label: "Z → A", value: "za" },
];

interface TopicsPageProps {
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export default async function TopicsPage({ searchParams }: TopicsPageProps) {
  const params = await searchParams;
  const currentSort = params.sort ?? "az";

  const [totalCount, aggregates] = await Promise.all([
    getTopicCount(),
    getTopicAggregates(),
  ]);
  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const topics = await getTopics({ take, skip });

  const sorted = [...topics].sort((a, b) => {
    if (currentSort === "za") {
      return b.title.localeCompare(a.title);
    }
    return a.title.localeCompare(b.title);
  });

  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  const glanceItems = [
    { icon: "\uD83C\uDFF7\uFE0F", label: `${aggregates.total} topics` },
    ...(aggregates.linkedEpisodes > 0 ? [{ icon: "\uD83D\uDD17", label: `${aggregates.linkedEpisodes} episode links` }] : []),
  ];

  return (
    <>
    <PageHero
      title="TOPICS"
      subtitle="Key themes and recurring subjects"
      backgroundImage="/long-form-background.jpg"
    />
    <EntityGlanceBar items={glanceItems} />
    <main className="mx-auto max-w-7xl px-4 py-8">
      <SortFilterBar
        basePath="/topics"
        sortOptions={SORT_OPTIONS}
        currentSort={currentSort}
      />

      {sorted.length === 0 ? (
        <EmptyState message="No topics in the archive yet" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={{
                  title: topic.title,
                  slug: topic.slug,
                  description: topic.description,
                  episodeCount: topic.episodes.length,
                  personCount: topic.people.length,
                  loreCount: topic.lore.length,
                }}
              />
            ))}
          </div>
          <PaginationControls meta={paginationMeta} basePath="/topics" />
        </>
      )}
    </main>
    </>
  );
}
