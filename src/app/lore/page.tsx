import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { LoreCard } from "@/components/archive/lore-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SortFilterBar } from "@/components/archive/sort-filter-bar";
import { SectionGroup } from "@/components/archive/section-group";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getLoreEntries, getLoreCount, getLoreByCanon, getLoreCanonCounts } from "@/lib/queries/lore";
import { getLoreAggregates, getArchiveLastUpdated } from "@/lib/queries/stats";
import { formatRelativeDate } from "@/lib/format/date";
import { IconScroll, IconCanonical, IconSpeculative, IconCommunity } from "@/components/graphics/codex-icons";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";
import type { CanonStatus } from "@/generated/prisma/client";

export const revalidate = 600;

export const metadata = {
  title: "Lore — CULT CODEX",
  description: "Concepts, doctrines, and myths of the Cult of Psyche",
};

const SORT_OPTIONS = [
  { label: "A → Z", value: "az" },
  { label: "Z → A", value: "za" },
];

const FILTER_OPTIONS = [
  { label: "Canonical", value: "canonical" },
  { label: "Speculative", value: "speculative" },
  { label: "Community Myth", value: "community_myth" },
];

interface LorePageProps {
  searchParams: Promise<{ sort?: string; filter?: string; page?: string }>;
}

export default async function LorePage({ searchParams }: LorePageProps) {
  const params = await searchParams;
  const currentSort = params.sort ?? "az";
  const currentFilter = params.filter;

  const canonFilter =
    currentFilter && currentFilter !== "all"
      ? (currentFilter as CanonStatus)
      : undefined;

  const isSectionsView = !canonFilter;

  const [totalCount, aggregates, lastUpdated] = await Promise.all([
    getLoreCount({ canon: canonFilter }),
    getLoreAggregates(),
    getArchiveLastUpdated(),
  ]);
  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const entries = await getLoreEntries({ take, skip, canon: canonFilter });

  const sorted = [...entries].sort((a, b) =>
    currentSort === "za"
      ? b.title.localeCompare(a.title)
      : a.title.localeCompare(b.title),
  );

  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  const glanceItems = [
    { icon: <IconScroll size={14} />, label: `${aggregates.total} lore entries` },
    ...(aggregates.canonical > 0
      ? [{ icon: <IconCanonical size={14} />, label: `${aggregates.canonical} canonical` }]
      : []),
    ...(aggregates.speculative > 0
      ? [{ icon: <IconSpeculative size={14} />, label: `${aggregates.speculative} speculative` }]
      : []),
    ...(aggregates.communityMyth > 0
      ? [
          {
            icon: <IconCommunity size={14} />,
            label: `${aggregates.communityMyth} community myth${aggregates.communityMyth !== 1 ? "s" : ""}`,
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
        title="LORE ARCHIVE"
        subtitle="Concepts, doctrines, myths, and memes"
        backgroundImage="/lore-header.jpg"
      />
      <EntityGlanceBar items={glanceItems} />

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
        {/* Psychenomicon gateway */}
        <Link href="/lore/psychenomicon" className="group mb-8 block">
          <div className="relative overflow-hidden rounded-lg border border-accent-gold/30 bg-gradient-to-r from-[#1a0033]/80 via-void to-[#1a0033]/80 p-6 sm:p-8 transition-all hover:border-accent-gold/50 hover:shadow-lg hover:shadow-accent-gold/10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(200,169,107,0.08),transparent_60%)]" />
            <div className="relative z-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
              <div className="flex-shrink-0 text-4xl opacity-80 transition-opacity group-hover:opacity-100 sm:text-5xl">
                📜
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="mb-1 font-display text-lg font-bold text-accent-gold sm:text-xl">
                  THE PSYCHENOMICON
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  &ldquo;In the beginning, there was static. Then a voice cut through the
                  noise.&rdquo;
                  <span className="mt-1 block text-xs text-accent-gold/60">
                    The forbidden chronicle of every soul, saga, and spectacle from
                    the Panelverse.
                  </span>
                </p>
              </div>
              <div className="flex-shrink-0 font-mono text-xs text-accent-gold/50 transition-colors group-hover:text-accent-gold">
                Enter →
              </div>
            </div>
          </div>
        </Link>

        {/* Canon-status sections (visible when no filter active) */}
        {isSectionsView && (
          <LoreSections sort={currentSort} counts={aggregates} />
        )}

        {/* ── Divider + full paginated list ── */}
        <div className="mt-10">
          <div className="mb-5 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/50">
              {canonFilter
                ? `${totalCount} ${canonFilter.replace("_", " ")} entries`
                : "Browse all lore"}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          <SortFilterBar
            basePath="/lore"
            sortOptions={SORT_OPTIONS}
            currentSort={currentSort}
            filterLabel="Canon"
            filterOptions={FILTER_OPTIONS}
            currentFilter={currentFilter}
          />

          {sorted.length === 0 ? (
            <EmptyState message="No lore entries match the current filters" />
          ) : (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {sorted.map((entry) => (
                  <LoreCard
                    key={entry.id}
                    lore={{
                      title: entry.title,
                      slug: entry.slug,
                      category: entry.category,
                      summary: entry.summary,
                      canonStatus: entry.canonStatus,
                      episodeCount: entry.episodes.length,
                      personCount: entry.people.length,
                    }}
                  />
                ))}
              </div>
              <PaginationControls meta={paginationMeta} basePath="/lore" />
            </>
          )}
        </div>
      </main>
    </>
  );
}

// ── Canon sections ────────────────────────────────────────────────────────────

async function LoreSections({
  sort,
  counts,
}: {
  sort: string;
  counts: { canonical: number; speculative: number; communityMyth: number };
}) {
  const [canonicalEntries, speculativeEntries, mythEntries] = await Promise.all([
    getLoreByCanon("canonical", 6),
    getLoreByCanon("speculative", 6),
    getLoreByCanon("community_myth", 6),
  ]);

  const sortEntries = <T extends { title: string }>(arr: T[]) =>
    sort === "za"
      ? [...arr].sort((a, b) => b.title.localeCompare(a.title))
      : [...arr].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="space-y-10">
      {/* Canonical — gold */}
      {canonicalEntries.length > 0 && (
        <SectionGroup
          title="Canonical"
          accent="gold"
          count={counts.canonical}
          description="Confirmed facts, established mythology, and documented events."
          viewAllHref="/lore?filter=canonical"
          viewAllLabel={`All ${counts.canonical} canonical →`}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {sortEntries(canonicalEntries).map((e) => (
              <LoreCard
                key={e.id}
                lore={e}
                accentOverride="gold"
              />
            ))}
          </div>
        </SectionGroup>
      )}

      {/* Speculative — violet */}
      {speculativeEntries.length > 0 && (
        <SectionGroup
          title="Speculative"
          accent="violet"
          count={counts.speculative}
          description="Theories, interpretations, and unconfirmed lore from the archive."
          viewAllHref="/lore?filter=speculative"
          viewAllLabel={`All ${counts.speculative} speculative →`}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {sortEntries(speculativeEntries).map((e) => (
              <LoreCard
                key={e.id}
                lore={e}
                accentOverride="violet"
              />
            ))}
          </div>
        </SectionGroup>
      )}

      {/* Community Myth — cyan */}
      {mythEntries.length > 0 && (
        <SectionGroup
          title="Community Myth"
          accent="cyan"
          count={counts.communityMyth}
          description="Fan-created lore, running jokes, and community-born mythology."
          viewAllHref="/lore?filter=community_myth"
          viewAllLabel={`All ${counts.communityMyth} community myths →`}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {sortEntries(mythEntries).map((e) => (
              <LoreCard
                key={e.id}
                lore={e}
                accentOverride="cyan"
              />
            ))}
          </div>
        </SectionGroup>
      )}
    </div>
  );
}
