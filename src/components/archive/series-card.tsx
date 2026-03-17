import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type { SeriesWithCount } from "@/lib/queries/series";

interface SeriesCardProps {
  series: SeriesWithCount;
}

const typeVariant: Record<string, "green" | "purple" | "gold" | "muted"> = {
  panel: "green",
  tarot: "purple",
  story: "gold",
  music_video: "purple",
  documentary: "green",
  other: "muted",
};

export function SeriesCard({ series }: SeriesCardProps) {
  return (
    <Link
      href={`/series/${series.slug}`}
      className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-green/30 hover:bg-elevated"
    >
      {series.coverImageUrl ? (
        <img
          src={series.coverImageUrl}
          alt=""
          className="h-16 w-16 flex-shrink-0 rounded object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded bg-gradient-to-br from-accent-green/10 to-accent-gold/10 text-2xl">
          📚
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <StatusBadge
            label={series.type.replace("_", " ")}
            variant={typeVariant[series.type] ?? "muted"}
          />
          <span className="font-mono text-[10px] text-text-muted">
            {series._count.episodes} episode{series._count.episodes !== 1 ? "s" : ""}
          </span>
          <StatusBadge
            label={series.status}
            variant={series.status === "published" ? "green" : "muted"}
          />
        </div>
        <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-green transition-colors">
          {series.title}
        </h3>
        {series.description && (
          <p className="mt-1 text-xs text-text-muted line-clamp-2">
            {series.description}
          </p>
        )}
      </div>
    </Link>
  );
}
