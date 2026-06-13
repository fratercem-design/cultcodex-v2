import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { LoreCard } from "@/components/archive/lore-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SortFilterBar } from "@/components/archive/sort-filter-bar";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getLoreEntries, getLoreCount } from "@/lib/queries/lore";
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
import { collectionPageJsonLd, jsonLdScript } from "@/lib/seo";

export const revalidate = 600;

export const metadata = {
  title: "Lore — CULT CODEX",
  description: "The concepts, doctrines, myths, and memes of the Cult of Psyche — every recurring idea, belief system, and inside reference catalogued and connected to the archive.",
  alternates: { canonical: "/lore" },
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

  const [totalCount, aggregates, lastUpdated] = await Promise.all([
    getLoreCount({ canon: canonFilter }),
    getLoreAggregates(),
    getArchiveLastUpdated(),
  ]);
  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const entries = await getLoreEntries({ take, skip, canon: canonFilter });

  const sorted = [...entries].sort((a, b) => {
    if (currentSort === "za") {
      return b.title.localeCompare(a.title);
    }
    return a.title.localeCompare(b.title);
  });

  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  const glanceItems = [
    { icon: <IconScroll size={14} />, label: `${aggregates.total} lore entries` },
    ...(aggregates.canonical > 0 ? [{ icon: <IconCanonical size={14} />, label: `${aggregates.canonical} canonical` }] : []),
    ...(aggregates.speculative > 0 ? [{ icon: <IconSpeculative size={14} />, label: `${aggregates.speculative} speculative` }] : []),
    ...(aggregates.communityMyth > 0 ? [{ icon: <IconCommunity size={14} />, label: `${aggregates.communityMyth} community myth${aggregates.communityMyth !== 1 ? "s" : ""}` }] : []),
    ...(lastUpdated ? [{ icon: "\uD83D\uDD04", label: `Updated ${formatRelativeDate(lastUpdated)}` }] : []),
  ];

  return (
    <>
    {page === 1 && sorted.length > 0 && (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            collectionPageJsonLd({
              name: "Lore — CultCodex",
              description: metadata.description,
              path: "/lore",
              items: sorted.map((e) => ({ name: e.title, path: `/lore/${e.slug}` })),
            })
          ),
        }}
      />
    )}
    <PageHero
      title="LORE ARCHIVE"
      subtitle="Concepts, doctrines, myths, and memes"
      backgroundImage="/lore-header.jpg"
    
      label="lore_archive"
    />
    <EntityGlanceBar items={glanceItems} />
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
      {/* Psychenomicon Gateway */}
      <Link
        href="/lore/psychenomicon"
        className="group mb-8 block"
      >
        <div className="relative rounded-lg border border-accent-gold/30 bg-gradient-to-r from-[#1a0033]/80 via-void to-[#1a0033]/80 p-6 sm:p-8 transition-all hover:border-accent-gold/50 hover:shadow-lg hover:shadow-accent-gold/10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(200,169,107,0.08),transparent_60%)]" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="flex-shrink-0 text-4xl sm:text-5xl opacity-80 group-hover:opacity-100 transition-opacity">
              📜
            </div>
            <div className="text-center sm:text-left flex-1">
              <h3 className="font-display text-lg sm:text-xl font-bold text-accent-gold mb-1">
                THE PSYCHENOMICON
              </h3>
              <p className="text-sm text-text-muted leading-relaxed max-w-xl">
                &ldquo;In the beginning, there was static. Then a voice cut through the noise.&rdquo;
                <span className="block mt-1 text-xs text-accent-gold/60">
                  The forbidden chronicle of every soul, saga, and spectacle from the Panelverse.
                </span>
              </p>
            </div>
            <div className="flex-shrink-0 font-mono text-xs text-accent-gold/50 group-hover:text-accent-gold transition-colors">
              Enter →
            </div>
          </div>
        </div>
      </Link>

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
          <div className="grid gap-3 sm:grid-cols-2">
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
    </main>
    </>
  );
}
