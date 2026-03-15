import { PageShell } from "@/components/ui/page-shell";
import { SeriesCard } from "@/components/archive/series-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getSeries } from "@/lib/queries/series";

export const metadata = {
  title: "Series — CULT CODEX",
  description: "Browse Cult of Psyche series and collections",
};

export default async function SeriesPage() {
  const series = await getSeries();

  return (
    <PageShell
      title="SERIES"
      subtitle={
        series.length > 0
          ? `${series.length} series in the archive`
          : "Series and collections"
      }
    >
      {series.length === 0 ? (
        <EmptyState
          message="No series catalogued yet"
          suggestion="Series will appear here once they are created"
        />
      ) : (
        <div className="grid gap-3">
          {series.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
