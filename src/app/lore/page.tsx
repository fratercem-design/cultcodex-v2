import { PageShell } from "@/components/ui/page-shell";
import { LoreCard } from "@/components/archive/lore-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SortFilterBar } from "@/components/archive/sort-filter-bar";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getLoreEntries, getLoreCount } from "@/lib/queries/lore";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";
import type { CanonStatus } from "@/generated/prisma/client";

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

  const totalCount = await getLoreCount({ canon: canonFilter });
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

  return (
    <PageShell
      title="LORE ARCHIVE"
      subtitle="Concepts, doctrines, myths, and memes"
    >
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
                }}
              />
            ))}
          </div>
          <PaginationControls meta={paginationMeta} basePath="/lore" />
        </>
      )}
    </PageShell>
  );
}
