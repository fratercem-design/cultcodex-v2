import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { PersonCard } from "@/components/archive/person-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SortFilterBar } from "@/components/archive/sort-filter-bar";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getPeople, getPersonCount } from "@/lib/queries/people";
import { getPeopleAggregates, getArchiveLastUpdated } from "@/lib/queries/stats";
import { formatRelativeDate } from "@/lib/format/date";
import { IconPerson, IconMicrophone, IconRecurring, IconMask } from "@/components/graphics/codex-icons";
import Link from "next/link";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";
import type { PersonType } from "@/generated/prisma/client";

export const revalidate = 600;

export const metadata = {
  alternates: { canonical: "/people" },
  title: "People — CULT CODEX",
  description: "Hosts, recurring figures, and profiled guests from the Cult of Psyche archive. One-time appearances and unknowns are compiled at /people/the-rest.",
};

const SORT_OPTIONS = [
  { label: "A → Z", value: "az" },
  { label: "Z → A", value: "za" },
  { label: "Most Appearances", value: "most" },
  { label: "Most Lore", value: "lore" },
];

// Guests and mentioned now route to /people/the-rest — only show profiled types in filters
const FILTER_OPTIONS = [
  { label: "Host", value: "host" },
  { label: "Recurring", value: "recurring" },
  { label: "Guest (profiled)", value: "guest" },
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

  const [totalCount, aggregates, lastUpdated] = await Promise.all([
    getPersonCount(typeFilter),
    getPeopleAggregates(),
    getArchiveLastUpdated(),
  ]);
  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const people = await getPeople({ take, skip, type: typeFilter });

  const sorted = [...people].sort((a, b) => {
    if (currentSort === "za") {
      return b.displayName.localeCompare(a.displayName);
    }
    if (currentSort === "most") {
      const aCount = a.guestAppearances.length + a.mentions.length;
      const bCount = b.guestAppearances.length + b.mentions.length;
      return bCount - aCount;
    }
    if (currentSort === "lore") {
      return b.loreConnections.length - a.loreConnections.length;
    }
    return a.displayName.localeCompare(b.displayName);
  });

  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  const glanceItems = [
    { icon: <IconPerson size={14} />, label: `${aggregates.total} people` },
    ...(aggregates.hosts > 0 ? [{ icon: <IconMicrophone size={14} />, label: `${aggregates.hosts} host${aggregates.hosts !== 1 ? "s" : ""}` }] : []),
    ...(aggregates.recurring > 0 ? [{ icon: <IconRecurring size={14} />, label: `${aggregates.recurring} recurring` }] : []),
    ...(aggregates.guests > 0 ? [{ icon: <IconMask size={14} />, label: `${aggregates.guests} guest${aggregates.guests !== 1 ? "s" : ""}` }] : []),
    ...(lastUpdated ? [{ icon: "\uD83D\uDD04", label: `Updated ${formatRelativeDate(lastUpdated)}` }] : []),
  ];

  return (
    <>
    <PageHero
      title="PEOPLE"
      subtitle="Guests, hosts, and figures of the archive"
      backgroundImage="/wiki-page-header.jpg"
    
      label="voices"
    />
    <EntityGlanceBar items={glanceItems} />
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
      {/* Graph teaser */}
      <div className="mb-3 flex items-center justify-between gap-4 rounded-lg border border-accent-violet/20 bg-accent-violet/5 px-4 py-3">
        <p className="font-mono text-[11px] text-text-muted">
          <span className="text-accent-violet font-bold">Relationship Map</span>
          {" "}— see who appeared with whom across the entire archive, as a live network graph.
        </p>
        <Link
          href="/graph"
          className="shrink-0 inline-flex items-center gap-1 rounded border border-accent-violet/40 bg-surface px-3 py-1.5 font-mono text-[10px] font-bold text-accent-violet hover:bg-accent-violet/10 transition-colors whitespace-nowrap"
        >
          View map →
        </Link>
      </div>

      {/* The Rest callout */}
      <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3">
        <p className="font-mono text-[11px] text-text-muted">
          <span className="text-text-primary font-bold">THE REST</span>
          {" "}— one-time guests, unknowns, and mentioned figures without full profiles are compiled in a single collective entry.
        </p>
        <Link
          href="/people/the-rest"
          className="shrink-0 inline-flex items-center gap-1 rounded border border-border bg-elevated px-3 py-1.5 font-mono text-[10px] font-bold text-text-muted hover:text-text-primary hover:border-accent-gold/30 transition-colors whitespace-nowrap"
        >
          View entry →
        </Link>
      </div>

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
                  loreSummary: person.loreSummary,
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
