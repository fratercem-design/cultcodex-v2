
import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { PersonCard } from "@/components/archive/person-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SortFilterBar } from "@/components/archive/sort-filter-bar";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getPeople, getPersonCount, getSpecialMentions } from "@/lib/queries/people";
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
import { PERSON_TYPE_DOT } from "@/lib/people/person-type";
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

  const [totalCount, aggregates, lastUpdated, specialMentions] = await Promise.all([
    getPersonCount(typeFilter),
    getPeopleAggregates(),
    getArchiveLastUpdated(),
    // Only fetch special mentions on the unfiltered default view
    typeFilter ? Promise.resolve([]) : getSpecialMentions(),
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
    ...(lastUpdated ? [{ icon: "🔄", label: `Updated ${formatRelativeDate(lastUpdated)}` }] : []),
  ];

  const mentionsPreview = specialMentions.slice(0, MENTIONS_PREVIEW);
  const mentionsOverflow = specialMentions.length - mentionsPreview.length;

  return (
    <>
    {page === 1 && sorted.length > 0 && (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            collectionPageJsonLd({
              name: "People — CultCodex",
              description: metadata.description,
              path: "/people",
              items: sorted.map((p) => ({ name: p.displayName, path: `/people/${p.slug}` })),
            })
          ),
        }}
      />
    )}
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

      {/* Special Mentions — compact strip, only on default (unfiltered) view */}
      {!typeFilter && mentionsPreview.length > 0 && (
        <section className="mt-10 border-t border-border pt-8">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
                {"/// special_mentions"}
              </p>
              <p className="mt-1 font-mono text-[11px] text-text-muted/60">
                {specialMentions.length} celebrities, one-off guests &amp; name-drops — no standalone profiles.
              </p>
            </div>
            <Link
              href="/people/the-rest"
              className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-accent-gold transition-colors"
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
                  className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2.5 py-1 font-mono text-[10px] text-text-muted"
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
                className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2.5 py-1 font-mono text-[10px] text-text-muted hover:text-accent-gold hover:border-accent-gold/30 transition-colors"
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
