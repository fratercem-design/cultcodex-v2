import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { TopicCard } from "@/components/archive/topic-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SortFilterBar } from "@/components/archive/sort-filter-bar";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getTopics, getTopicCount } from "@/lib/queries/topics";
import { getTopicAggregates, getArchiveLastUpdated } from "@/lib/queries/stats";
import { formatRelativeDate } from "@/lib/format/date";
import { IconTopic, IconLink } from "@/components/graphics/codex-icons";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";

export const revalidate = 600;

export const metadata = {
  title: "Topics — CULT CODEX",
  description: "Explore the key topics and themes of the Cult of Psyche",
  alternates: { canonical: "/topics" },
};

const SORT_OPTIONS = [
  { label: "Most Connected", value: "connected" },
  { label: "A → Z", value: "az" },
  { label: "Z → A", value: "za" },
];

interface TopicsPageProps {
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export default async function TopicsPage({ searchParams }: TopicsPageProps) {
  const params = await searchParams;
  const currentSort = params.sort ?? "connected";

  const [totalCount, aggregates, lastUpdated] = await Promise.all([
    getTopicCount(),
    getTopicAggregates(),
    getArchiveLastUpdated(),
  ]);
  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const topics = await getTopics({ take, skip });

  const sorted = [...topics].sort((a, b) => {
    if (currentSort === "connected") {
      const aTotal = a._count.episodes + a._count.people + a._count.lore;
      const bTotal = b._count.episodes + b._count.people + b._count.lore;
      return bTotal - aTotal || a.title.localeCompare(b.title);
    }
    if (currentSort === "za") {
      return b.title.localeCompare(a.title);
    }
    return a.title.localeCompare(b.title);
  });

  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  const glanceItems = [
    { icon: <IconTopic size={14} />, label: `${aggregates.total} topic${aggregates.total !== 1 ? "s" : ""}` },
    ...(aggregates.linkedEpisodes > 0 ? [{ icon: <IconLink size={14} />, label: `${aggregates.linkedEpisodes} episode link${aggregates.linkedEpisodes !== 1 ? "s" : ""}` }] : []),
    ...(lastUpdated ? [{ icon: "\uD83D\uDD04", label: `Updated ${formatRelativeDate(lastUpdated)}` }] : []),
  ];

  return (
    <>
    <PageHero
      title="TOPICS"
      subtitle="Key themes and recurring subjects"
      backgroundImage="/long-form-background.jpg"
    
      label="signals"
    />
    <EntityGlanceBar items={glanceItems} />
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
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
                  episodeCount: topic._count.episodes,
                  personCount: topic._count.people,
                  loreCount: topic._count.lore,
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
