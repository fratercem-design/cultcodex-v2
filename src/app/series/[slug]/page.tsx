import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { EntityHero } from "@/components/ui/entity-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { EntityStatsPanel } from "@/components/ui/entity-stats-panel";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetaRow } from "@/components/ui/meta-row";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EpisodeListItem } from "@/components/archive/episode-list-item";
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
import { fixThumbnailUrl } from "@/lib/format/thumbnail";
import type { Metadata } from "next";

export const revalidate = 600;

export async function generateStaticParams() {
  const series = await prisma.series.findMany({
    select: { slug: true },
    take: 50,
    orderBy: { updatedAt: "desc" },
  });
  return series.map((s) => ({ slug: s.slug }));
}

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

const SERIES_TYPE_ICONS: Record<string, string> = {
  recurring_series: "\uD83D\uDD01",
  mini_series: "\uD83D\uDCDA",
  one_off: "\u2B50",
  other: "\uD83C\uDFAC",
};

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

  const typeLabel = series.type.replace("_", " ");
  const typeIcon = SERIES_TYPE_ICONS[series.type] ?? "\uD83C\uDFAC";

  // Date range from episodes on this page
  const dates = episodes
    .map((ep) => ep.airDate?.getTime())
    .filter((d): d is number => d != null)
    .sort();
  const firstDate = dates.length > 0 ? new Date(dates[0]) : null;
  const lastDate = dates.length > 0 ? new Date(dates[dates.length - 1]) : null;

  const glanceItems = [
    { icon: typeIcon, label: typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1) },
    { icon: "\uD83C\uDFAC", label: `${totalCount} episode${totalCount !== 1 ? "s" : ""}` },
    { icon: "\u2705", label: series.status.charAt(0).toUpperCase() + series.status.slice(1) },
  ];

  return (
    <>
      <EntityHero
        title={series.title}
        subtitle={`${totalCount} episodes in this series`}
        backgroundImage={series.coverImageUrl || "/wiki-page-header.jpg"}
        badges={[
          { label: typeLabel.toUpperCase(), variant: "green" },
          { label: series.status.toUpperCase(), variant: series.status === "published" ? "green" : "muted" },
        ]}
      />
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: "Series", href: "/series" },
        { label: series.title },
      ]} />
      <EntityGlanceBar items={glanceItems} />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content — episode list */}
          <div className="lg:col-span-2">
            {episodes.length === 0 ? (
              <EmptyState message="No episodes in this series yet" />
            ) : (
              <>
                <div className="grid gap-3">
                  {episodes.map((ep) => (
                    <EpisodeListItem
                      key={ep.id}
                      slug={ep.slug}
                      title={ep.title}
                      episodeNumber={ep.episodeNumber}
                      airDate={ep.airDate}
                      summaryShort={ep.summaryShort}
                      thumbnailUrl={fixThumbnailUrl(ep.thumbnailUrl)}
                    />
                  ))}
                </div>
                <PaginationControls meta={paginationMeta} basePath={`/series/${slug}`} />
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <EntityStatsPanel
              stats={[
                { icon: "\uD83C\uDFAC", label: "Episodes", value: totalCount },
              ]}
            />

            <SectionCard title="Series Info">
              <div className="space-y-0">
                <MetaRow
                  label="Type"
                  value={
                    <StatusBadge
                      label={typeLabel}
                      variant="green"
                    />
                  }
                />
                <MetaRow label="Episodes" value={String(totalCount)} />
                <MetaRow
                  label="Status"
                  value={<StatusBadge label={series.status} variant="green" />}
                />
                {firstDate && lastDate && (
                  <MetaRow
                    label="Date Range"
                    value={`${formatDate(firstDate)} — ${formatDate(lastDate)}`}
                  />
                )}
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
      </main>
    </>
  );
}
