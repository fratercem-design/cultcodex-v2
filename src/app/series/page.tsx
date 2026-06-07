export const dynamic = "force-dynamic";

import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { SeriesCard } from "@/components/archive/series-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getSeries } from "@/lib/queries/series";
import { getSeriesAggregates } from "@/lib/queries/stats";
import { IconSeries, IconTransmission } from "@/components/graphics/codex-icons";

export const revalidate = 600;

export const metadata = {
  alternates: { canonical: "/series" },
  title: "Series — CULT CODEX",
  description: "Browse Cult of Psyche series and collections",
};

export default async function SeriesPage() {
  const [series, aggregates] = await Promise.all([
    getSeries(),
    getSeriesAggregates(),
  ]);

  const glanceItems = [
    { icon: <IconSeries size={14} />, label: `${aggregates.total} series` },
    ...(aggregates.totalEpisodes > 0
      ? [{ icon: <IconTransmission size={14} />, label: `${aggregates.totalEpisodes} episodes across all series` }]
      : []),
  ];

  return (
    <>
    <PageHero
      title="SERIES"
      subtitle={
        series.length > 0
          ? `${series.length} series in the archive`
          : "Series and collections"
      }
      backgroundImage="/wiki-page-header.jpg"
      label="series"
    />
    <EntityGlanceBar items={glanceItems} />
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
      {series.length === 0 ? (
        <EmptyState
          message="No series catalogued yet"
          suggestion="Series will appear here once they are created"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {series.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      )}
    </main>
    </>
  );
}
