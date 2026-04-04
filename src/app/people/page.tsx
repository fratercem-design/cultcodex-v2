import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { PersonCard } from "@/components/archive/person-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SortFilterBar } from "@/components/archive/sort-filter-bar";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getPeople, getPersonCount } from "@/lib/queries/people";
import { getPeopleAggregates } from "@/lib/queries/stats";
import { IconPerson, IconMicrophone, IconRecurring, IconMask } from "@/components/graphics/codex-icons";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";
import type { PersonType } from "@/generated/prisma/client";

export const revalidate = 600;

export const metadata = {
  title: "People — CULT CODEX",
  description: "Guests, hosts, and figures of the Cult of Psyche",
};

const SORT_OPTIONS = [
  { label: "A → Z", value: "az" },
  { label: "Z → A", value: "za" },
];

const FILTER_OPTIONS = [
  { label: "Host", value: "host" },
  { label: "Recurring", value: "recurring" },
  { label: "Guest", value: "guest" },
  { label: "Mentioned", value: "mentioned" },
];

interface PeoplePageProps {
  searchParams: Promise<{ sort?: string; filter?: string; page?: string }>;
}

export default async function PeoplePage({ searchParams }: PeoplePageProps) {
  const params = await searchParams;
  const currentSort = params.sort ?? "az";
  const currentFilter = params.filter;

  const typeFilter =
    currentFilter && currentFilter !== "all"
      ? (currentFilter as PersonType)
      : undefined;

  const [totalCount, aggregates] = await Promise.all([
    getPersonCount(typeFilter),
    getPeopleAggregates(),
  ]);
  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const people = await getPeople({ take, skip, type: typeFilter });

  const sorted = [...people].sort((a, b) => {
    if (currentSort === "za") {
      return b.displayName.localeCompare(a.displayName);
    }
    return a.displayName.localeCompare(b.displayName);
  });

  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  const glanceItems = [
    { icon: <IconPerson size={14} />, label: `${aggregates.total} people` },
    ...(aggregates.hosts > 0 ? [{ icon: <IconMicrophone size={14} />, label: `${aggregates.hosts} host${aggregates.hosts !== 1 ? "s" : ""}` }] : []),
    ...(aggregates.recurring > 0 ? [{ icon: <IconRecurring size={14} />, label: `${aggregates.recurring} recurring` }] : []),
    ...(aggregates.guests > 0 ? [{ icon: <IconMask size={14} />, label: `${aggregates.guests} guest${aggregates.guests !== 1 ? "s" : ""}` }] : []),
  ];

  return (
    <>
    <PageHero
      title="PEOPLE"
      subtitle="Guests, hosts, and figures of the archive"
      backgroundImage="/wiki-page-header.jpg"
    />
    <EntityGlanceBar items={glanceItems} />
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
      <SortFilterBar
        basePath="/people"
        sortOptions={SORT_OPTIONS}
        currentSort={currentSort}
        filterLabel="Type"
        filterOptions={FILTER_OPTIONS}
        currentFilter={currentFilter}
      />

      {sorted.length === 0 ? (
        <EmptyState message="No people match the current filters" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {sorted.map((person) => (
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
            ))}
          </div>
          <PaginationControls meta={paginationMeta} basePath="/people" />
        </>
      )}
    </main>
    </>
  );
}
