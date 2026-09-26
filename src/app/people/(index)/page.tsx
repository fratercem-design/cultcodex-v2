
import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { PersonCard } from "@/components/archive/person-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SortFilterBar } from "@/components/archive/sort-filter-bar";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getPeopleCards, getPersonCount, getSpecialMentions, type PeopleSort } from "@/lib/queries/people";
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
import { PERSON_TYPE_DOT, PERSON_TYPE_EDGE, PERSON_TYPE_SECTION, PERSON_TYPE_TINT } from "@/lib/people/person-type";
import type { PersonType } from "@/generated/prisma/client";
import { collectionPageJsonLd, jsonLdScript } from "@/lib/seo";

export const revalidate = 3600;

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

const FILTER_OPTIONS = [
  { label: "Host", value: "host" },
  { label: "Recurring", value: "recurring" },
  { label: "Guest (profiled)", value: "guest" },
];

// How many special mentions to show inline before truncating
const MENTIONS_PREVIEW = 40;

// Default view is sectioned by role. Hosts and recurring cast are small sets
// shown whole; guests are a long tail, so only the most-seen show here and
// the rest are one click away under the Guest filter.
const SECTION_TAKE = { host: 50, recurring: 200, guest: 24 } as const;
const SECTIONS = ["host", "recurring", "guest"] as const;

type PersonCardRow = Awaited<ReturnType<typeof getPeopleCards>>[number];

function PeopleGrid({ people }: { people: PersonCardRow[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {people.map((person) => (
        <PersonCard
          key={person.id}
          person={{
            displayName: person.displayName,
            slug: person.slug,
            shortBio: person.shortBio,
            loreSummary: person.loreSummary,
            avatarUrl: person.avatarUrl,
            personType: person.personType,
            appearanceCount: person._count.guestAppearances + person._count.mentions,
          }}
        />
      ))}
    </div>
  );
}

interface PeoplePageProps {
  searchParams: Promise<{ sort?: string; filter?: string; page?: string }>;
}

export default async function PeoplePage({ searchParams }: PeoplePageProps) {
  const params = await searchParams;
  // Default = Most Appearances: surfaces the actual cast, not the alphabet.
  const currentSort = params.sort ?? "most";
  const currentFilter = params.filter;

  const typeFilter =
    currentFilter && currentFilter !== "all"
      ? (currentFilter as PersonType)
      : undefined;

  const [totalCount, aggregates, lastUpdated, specialMentions] = await Promise.all([
    getPersonCount(typeFilter),
    getPeopleAggregates(),
    getArchiveLastUpdated(),
    // Only fetch special mentions on the unfiltered default view
    typeFilter ? Promise.resolve([]) : getSpecialMentions(),
  ]);
  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  // Sorting is DB-level (peopleOrderBy) so it spans the whole result set —
  // the old in-memory sort here only reordered the already-paginated slice.
  const validSorts = ["az", "za", "most", "lore"] as const;
  const sortMode = (validSorts as readonly string[]).includes(currentSort)
    ? (currentSort as PeopleSort)
    : "most";
  const [sorted, ...sectionRows] = await Promise.all([
    typeFilter ? getPeopleCards({ take, skip, type: typeFilter, sort: sortMode }) : Promise.resolve([]),
    ...SECTIONS.map((type) =>
      typeFilter ? Promise.resolve([]) : getPeopleCards({ take: SECTION_TAKE[type], type, sort: sortMode }),
    ),
  ]);
  // Counts use the same profiled filter as the lists, so "All N" matches what the filter shows.
  const [hostCount, recurringCount, guestCount] = typeFilter
    ? [0, 0, 0]
    : await Promise.all(SECTIONS.map((type) => getPersonCount(type)));
  const sectionCounts = { host: hostCount, recurring: recurringCount, guest: guestCount };

  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  // The archive always has people. Zero means it couldn't be read (wrong or
  // unreachable database), so say that instead of rendering an empty directory.
  const archiveUnavailable = aggregates.total === 0;

  const glanceItems = [
    ...(archiveUnavailable ? [] : [{ icon: <IconPerson size={14} />, label: `${aggregates.total} people` }]),
    ...(aggregates.hosts > 0 ? [{ icon: <IconMicrophone size={14} />, label: `${aggregates.hosts} host${aggregates.hosts !== 1 ? "s" : ""}` }] : []),
    ...(aggregates.recurring > 0 ? [{ icon: <IconRecurring size={14} />, label: `${aggregates.recurring} recurring` }] : []),
    ...(aggregates.guests > 0 ? [{ icon: <IconMask size={14} />, label: `${aggregates.guests} guest${aggregates.guests !== 1 ? "s" : ""}` }] : []),
    // Label the remainder so the category math visibly sums to the total
    ...(aggregates.mentioned > 0 ? [{ icon: <IconPerson size={14} />, label: `${aggregates.mentioned} mentioned` }] : []),
    ...(lastUpdated ? [{ icon: "🔄", label: `Updated ${formatRelativeDate(lastUpdated)}` }] : []),
  ];

  const mentionsPreview = specialMentions.slice(0, MENTIONS_PREVIEW);
  const mentionsOverflow = specialMentions.length - mentionsPreview.length;

  return (
    <>
    {page === 1 && (sorted.length > 0 || sectionRows.some((r) => r.length > 0)) && (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            collectionPageJsonLd({
              name: "People — CultCodex",
              description: metadata.description,
              path: "/people",
              items: (typeFilter ? sorted : sectionRows.flat()).map((p) => ({ name: p.displayName, path: `/people/${p.slug}` })),
            })
          ),
        }}
      />
    )}
    <PageHero
      title="PEOPLE"
      subtitle="Guests, hosts, and figures of the archive"
      backgroundImage="/images/people/hero.webp"
      label="voices"
    />
    <EntityGlanceBar items={glanceItems} />
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
      {/* Graph teaser */}
      <div className="mb-3 flex items-center justify-between gap-4 rounded-lg border border-accent-violet/20 bg-accent-violet/5 px-4 py-3">
        <p className="font-mono text-[12px] text-text-muted">
          <span className="text-accent-violet-text font-bold">Relationship Map</span>
          {" "}— see who appeared with whom across the entire archive, as a live network graph.
        </p>
        <Link
          href="/graph"
          className="shrink-0 inline-flex items-center gap-1 rounded border border-accent-violet/40 bg-surface px-3 py-1.5 font-mono text-[12px] font-bold text-accent-violet-text hover:bg-accent-violet/10 transition-colors whitespace-nowrap"
        >
          View map →
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

      {archiveUnavailable ? (
        <EmptyState
          message="The archive can't be read right now"
          suggestion="People will be back shortly. Try again in a few minutes."
        />
      ) : typeFilter ? (
        sorted.length === 0 ? (
          <EmptyState message="No people match the current filters" />
        ) : (
          <>
            <PeopleGrid people={sorted} />
            <PaginationControls meta={paginationMeta} basePath="/people" />
          </>
        )
      ) : (
        <>
          {/* Colour key: the same role colours run through cards, badges and the graph */}
          <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[12px] text-text-muted">
            {SECTIONS.map((type) => (
              <a key={type} href={`#${type}`} className="inline-flex items-center gap-1.5 hover:text-text-primary transition-colors">
                <span className={`h-2 w-2 rounded-full ${PERSON_TYPE_DOT[type]}`} />
                {PERSON_TYPE_SECTION[type].title}
              </a>
            ))}
            <a href="#mentions" className="inline-flex items-center gap-1.5 hover:text-text-primary transition-colors">
              <span className={`h-2 w-2 rounded-full ${PERSON_TYPE_DOT.mentioned}`} />
              Mentioned
            </a>
          </div>

          {SECTIONS.map((type, i) => {
            const rows = sectionRows[i];
            if (rows.length === 0) return null;
            const total = sectionCounts[type];
            return (
              <section key={type} id={type} className="mb-10 scroll-mt-24">
                <div className={`mb-4 flex items-end justify-between gap-4 border-l-2 pl-3 ${PERSON_TYPE_EDGE[type]}`}>
                  <div>
                    <h2 className={`font-mono text-sm font-bold uppercase tracking-[0.14em] ${PERSON_TYPE_TINT[type]}`}>
                      {PERSON_TYPE_SECTION[type].title}
                      <span className="ml-2 font-normal text-text-muted">{total}</span>
                    </h2>
                    <p className="mt-0.5 font-mono text-[12px] text-text-muted">{PERSON_TYPE_SECTION[type].blurb}</p>
                  </div>
                  {total > rows.length && (
                    <Link
                      href={`/people?filter=${type}&sort=${sortMode}`}
                      className="shrink-0 font-mono text-[12px] uppercase tracking-widest text-text-muted hover:text-accent-gold-text transition-colors"
                    >
                      All {total} →
                    </Link>
                  )}
                </div>
                <PeopleGrid people={rows} />
              </section>
            );
          })}
        </>
      )}

      {/* Special Mentions — compact strip, only on default (unfiltered) view */}
      {!typeFilter && mentionsPreview.length > 0 && (
        <section id="mentions" className="mt-10 scroll-mt-24 border-t border-border pt-8">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <div>
              <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">
                {"/// special_mentions"}
              </p>
              <p className="mt-1 font-mono text-[12px] text-text-muted">
                {specialMentions.length} celebrities, one-off guests &amp; name-drops — no standalone profiles.
              </p>
            </div>
            <Link
              href="/people/the-rest"
              className="shrink-0 font-mono text-[12px] uppercase tracking-widest text-text-muted hover:text-accent-gold-text transition-colors"
            >
              Full entry →
            </Link>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {mentionsPreview.map((p) => {
              const count = p._count.guestAppearances + p._count.mentions;
              return (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2.5 py-1 font-mono text-[12px] text-text-muted"
                  title={`${p.personType === "mentioned" ? "Mentioned" : "One-off guest"}${count > 0 ? ` · ${count} appearance${count !== 1 ? "s" : ""}` : ""}`}
                >
                  <span
                    className={`h-1 w-1 rounded-full flex-shrink-0 ${PERSON_TYPE_DOT[p.personType]}`}
                  />
                  {p.displayName}
                </span>
              );
            })}
            {mentionsOverflow > 0 && (
              <Link
                href="/people/the-rest"
                className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2.5 py-1 font-mono text-[12px] text-text-muted hover:text-accent-gold-text hover:border-accent-gold/30 transition-colors"
              >
                +{mentionsOverflow} more →
              </Link>
            )}
          </div>
        </section>
      )}
    </main>
    </>
  );
}
