import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { PageShell } from "@/components/ui/page-shell";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetaRow } from "@/components/ui/meta-row";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  getSeriesBySlug,
  getSeriesEpisodes,
  getSeriesEpisodeCount,
} from "@/lib/queries/series";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";
import { formatDate } from "@/lib/format/date";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);

  if (!series) {
    return buildMetadata({
      title: "Series Not Found",
      description: "This series could not be found.",
      path: `/series/${slug}`,
    });
  }

  return buildMetadata({
    title: series.title,
    description: series.description || null,
    path: `/series/${series.slug}`,
  });
}

export default async function SeriesDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const series = await getSeriesBySlug(slug);

  if (!series) notFound();

  const totalCount = await getSeriesEpisodeCount(series.id);
  const page = parsePage(sp.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const episodes = await getSeriesEpisodes(series.id, { take, skip });
  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  return (
    <PageShell
      title={series.title}
      subtitle={`${totalCount} episodes in this series`}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content — episode list */}
        <div className="lg:col-span-2">
          {episodes.length === 0 ? (
            <EmptyState message="No episodes in this series yet" />
          ) : (
            <>
              <div className="grid gap-3">
                {episodes.map((ep) => {
                  const epNum = ep.episodeNumber
                    ? `EP.${String(ep.episodeNumber).padStart(3, "0")}`
                    : null;
                  return (
                    <Link
                      key={ep.id}
                      href={`/episodes/${ep.slug}`}
                      className="group block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-green/30 hover:bg-elevated"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {epNum && (
                          <span className="font-mono text-[10px] text-accent-green font-bold">
                            {epNum}
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-text-muted">
                          {formatDate(ep.airDate)}
                        </span>
                      </div>
                      <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-green transition-colors truncate">
                        {ep.title}
                      </h3>
                      {ep.summaryShort && (
                        <p className="mt-1 text-xs text-text-muted line-clamp-2">
                          {ep.summaryShort}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
              <PaginationControls meta={paginationMeta} basePath={`/series/${slug}`} />
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SectionCard title="Series Info">
            <div className="space-y-0">
              <MetaRow
                label="Type"
                value={
                  <StatusBadge
                    label={series.type.replace("_", " ")}
                    variant="green"
                  />
                }
              />
              <MetaRow label="Episodes" value={String(totalCount)} />
              <MetaRow
                label="Status"
                value={<StatusBadge label={series.status} variant="green" />}
              />
            </div>
          </SectionCard>

          {series.description && (
            <SectionCard title="Description">
              <p className="text-sm text-text-primary leading-relaxed">
                {series.description}
              </p>
            </SectionCard>
          )}
        </div>
      </div>
    </PageShell>
  );
}
