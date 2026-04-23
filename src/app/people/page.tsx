import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { PersonCard } from "@/components/archive/person-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SortFilterBar } from "@/components/archive/sort-filter-bar";
import { AlphabetFilter } from "@/components/archive/alphabet-filter";
import { SectionGroup } from "@/components/archive/section-group";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  getPeople,
  getPersonCount,
  getPeopleByType,
  getPeopleTypeCounts,
} from "@/lib/queries/people";
import { getPeopleAggregates, getArchiveLastUpdated } from "@/lib/queries/stats";
import { formatRelativeDate } from "@/lib/format/date";
import {
  IconPerson,
  IconMicrophone,
  IconRecurring,
  IconMask,
} from "@/components/graphics/codex-icons";
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
  { label: "Most Appearances", value: "most" },
];

const FILTER_OPTIONS = [
  { label: "Host", value: "host" },
  { label: "Recurring", value: "recurring" },
  { label: "Guest", value: "guest" },
  { label: "Mentioned", value: "mentioned" },
];

interface PeoplePageProps {
  searchParams: Promise<{
    sort?: string;
    filter?: string;
    page?: string;
    letter?: string;
  }>;
}

export default async function PeoplePage({ searchParams }: PeoplePageProps) {
  const params = await searchParams;
  const currentSort = params.sort ?? "az";
  const currentFilter = params.filter;
  const currentLetter = params.letter?.toUpperCase();

  const isSectionsView = !currentFilter && !currentLetter;

  const typeFilter =
    currentFilter && currentFilter !== "all"
      ? (currentFilter as PersonType)
      : undefined;

  const [aggregates, lastUpdated] = await Promise.all([
    getPeopleAggregates(),
    getArchiveLastUpdated(),
  ]);

  const glanceItems = [
    { icon: <IconPerson size={14} />, label: `${aggregates.total} people` },
    ...(aggregates.hosts > 0
      ? [
          {
            icon: <IconMicrophone size={14} />,
            label: `${aggregates.hosts} host${aggregates.hosts !== 1 ? "s" : ""}`,
          },
        ]
      : []),
    ...(aggregates.recurring > 0
      ? [{ icon: <IconRecurring size={14} />, label: `${aggregates.recurring} recurring` }]
      : []),
    ...(aggregates.guests > 0
      ? [
          {
            icon: <IconMask size={14} />,
            label: `${aggregates.guests} guest${aggregates.guests !== 1 ? "s" : ""}`,
          },
        ]
      : []),
    ...(lastUpdated
      ? [{ icon: "🔄", label: `Updated ${formatRelativeDate(lastUpdated)}` }]
      : []),
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

        <div className="mt-3">
          <AlphabetFilter basePath="/people" currentLetter={currentLetter} />
        </div>

        {isSectionsView ? (
          <PeopleSections sort={currentSort} />
        ) : (
          <PeopleFlatList
            sort={currentSort}
            typeFilter={typeFilter}
            currentLetter={currentLetter}
            page={params.page}
          />
        )}
      </main>
    </>
  );
}

// ── Sections view (default — no filter or letter active) ─────────────────────

async function PeopleSections({ sort }: { sort: string }) {
  const [counts, hosts, recurring, guests, mentioned] = await Promise.all([
    getPeopleTypeCounts(),
    getPeopleByType("host", 20),
    getPeopleByType("recurring", 12),
    getPeopleByType("guest", 12),
    getPeopleByType("mentioned", 12),
  ]);

  const sortCards = (cards: typeof hosts) => {
    if (sort === "za") return [...cards].sort((a, b) => b.displayName.localeCompare(a.displayName));
    if (sort === "az") return [...cards].sort((a, b) => a.displayName.localeCompare(b.displayName));
    return cards; // "most" — already ordered by appearance count from DB
  };

  return (
    <div className="mt-8 space-y-10">
      {/* ── Hosts ── gold ─────────────────────────────────── */}
      {hosts.length > 0 && (
        <SectionGroup
          title="Hosts"
          accent="gold"
          count={counts.host ?? 0}
          description="The voices behind the transmissions."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortCards(hosts).map((p) => (
              <PersonCard key={p.id} person={p} accent="gold" />
            ))}
          </div>
        </SectionGroup>
      )}

      {/* ── Recurring ── cyan ─────────────────────────────── */}
      {recurring.length > 0 && (
        <SectionGroup
          title="Recurring"
          accent="cyan"
          count={counts.recurring ?? 0}
          description="Regulars who shaped the show."
          viewAllHref="/people?filter=recurring"
          viewAllLabel={`All ${counts.recurring ?? 0} recurring →`}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortCards(recurring).map((p) => (
              <PersonCard key={p.id} person={p} accent="cyan" />
            ))}
          </div>
        </SectionGroup>
      )}

      {/* ── Guests ── violet ──────────────────────────────── */}
      {guests.length > 0 && (
        <SectionGroup
          title="Guests"
          accent="violet"
          count={counts.guest ?? 0}
          description="One-time or infrequent visitors to the panel."
          viewAllHref="/people?filter=guest"
          viewAllLabel={`All ${counts.guest ?? 0} guests →`}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortCards(guests).map((p) => (
              <PersonCard key={p.id} person={p} accent="violet" />
            ))}
          </div>
        </SectionGroup>
      )}

      {/* ── Mentioned ── muted ────────────────────────────── */}
      {mentioned.length > 0 && (
        <SectionGroup
          title="Mentioned"
          accent="muted"
          count={counts.mentioned ?? 0}
          description="Figures discussed on the show but not direct guests."
          viewAllHref="/people?filter=mentioned"
          viewAllLabel={`All ${counts.mentioned ?? 0} mentioned →`}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortCards(mentioned).map((p) => (
              <PersonCard key={p.id} person={p} accent="muted" />
            ))}
          </div>
        </SectionGroup>
      )}
    </div>
  );
}

// ── Flat paginated list (when filter or letter active) ───────────────────────

async function PeopleFlatList({
  sort,
  typeFilter,
  currentLetter,
  page: pageParam,
}: {
  sort: string;
  typeFilter?: PersonType;
  currentLetter?: string;
  page?: string;
}) {
  const totalCount = await getPersonCount(typeFilter, currentLetter);
  const page = parsePage(pageParam, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const people = await getPeople({ take, skip, type: typeFilter, letter: currentLetter });

  const sorted = [...people].sort((a, b) => {
    if (sort === "za") return b.displayName.localeCompare(a.displayName);
    if (sort === "most") {
      const aCount = a.guestAppearances.length + a.mentions.length;
      const bCount = b.guestAppearances.length + b.mentions.length;
      return bCount - aCount;
    }
    return a.displayName.localeCompare(b.displayName);
  });

  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  if (currentLetter) {
    // small result count hint
    return (
      <div className="mt-4">
        <p className="mb-3 font-mono text-[11px] text-text-muted">
          {totalCount} {totalCount === 1 ? "person" : "people"} starting with{" "}
          <span className="font-bold text-accent-gold">{currentLetter}</span>
        </p>
        {sorted.length === 0 ? (
          <EmptyState message="No people match the current filters" />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {sorted.map((p) => (
                <PersonCard
                  key={p.id}
                  person={{
                    ...p,
                    appearanceCount: p.guestAppearances.length + p.mentions.length,
                  }}
                />
              ))}
            </div>
            <PaginationControls meta={paginationMeta} basePath="/people" />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6">
      {sorted.length === 0 ? (
        <EmptyState message="No people match the current filters" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {sorted.map((p) => (
              <PersonCard
                key={p.id}
                person={{
                  ...p,
                  appearanceCount: p.guestAppearances.length + p.mentions.length,
                }}
              />
            ))}
          </div>
          <PaginationControls meta={paginationMeta} basePath="/people" />
        </>
      )}
    </div>
  );
}
