import Link from "next/link";
import { formatDate } from "@/lib/format/date";
import { StatusBadge } from "@/components/ui/status-badge";
import type { EpisodeCardData } from "@/lib/queries/episodes";

interface EpisodeCardProps {
  episode: EpisodeCardData;
}

export function EpisodeCard({ episode }: EpisodeCardProps) {
  const epNum = episode.episodeNumber
    ? `EP.${String(episode.episodeNumber).padStart(3, "0")}`
    : null;

  return (
    <Link
      href={`/episodes/${episode.slug}`}
      className="group block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-green/30 hover:bg-elevated"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            {epNum && (
              <span className="font-mono text-[10px] text-accent-green font-bold">
                {epNum}
              </span>
            )}
            <span className="font-mono text-[10px] text-text-muted">
              {formatDate(episode.airDate)}
            </span>
          </div>
          <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-green transition-colors truncate">
            {episode.title}
          </h3>
          {episode.summaryShort && (
            <p className="mt-1 text-xs text-text-muted line-clamp-2">
              {episode.summaryShort}
            </p>
          )}
        </div>
      </div>

      {(episode.guestNames.length > 0 || episode.topicNames.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {episode.guestNames.map((name) => (
            <StatusBadge key={name} label={name} variant="purple" />
          ))}
          {episode.topicNames.map((name) => (
            <StatusBadge key={name} label={name} variant="muted" />
          ))}
        </div>
      )}
    </Link>
  );
}
