import Link from "next/link";
import { formatDate } from "@/lib/format/date";
import { formatDuration } from "@/lib/format/duration";

interface EpisodeGlanceBarProps {
  contentType: string;
  series?: { title: string; slug: string } | null;
  airDate: Date | null;
  duration: string | null;
  guestCount: number;
}

const CONTENT_TYPE_ICONS: Record<string, string> = {
  livestream: "\uD83C\uDFA4",
  original: "\uD83C\uDFAC",
  short: "\u26A1",
  clip: "\u2702\uFE0F",
};

export function EpisodeGlanceBar({
  contentType,
  series,
  airDate,
  duration,
  guestCount,
}: EpisodeGlanceBarProps) {
  const icon = CONTENT_TYPE_ICONS[contentType] ?? "\uD83C\uDFAC";

  return (
    <div className="mx-auto max-w-7xl px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Content type */}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[10px] text-text-muted">
          <span className="text-xs">{icon}</span>
          {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
        </span>

        {/* Series */}
        {series && (
          <Link
            href={`/series/${series.slug}`}
            className="inline-flex items-center rounded-full border border-accent-purple/30 bg-accent-purple-dim px-2.5 py-1 font-mono text-[10px] text-accent-purple transition-colors hover:border-accent-purple/50"
          >
            {series.title}
          </Link>
        )}

        {/* Air date */}
        <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[10px] text-text-muted">
          {formatDate(airDate)}
        </span>

        {/* Duration */}
        {duration && (
          <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[10px] text-text-muted">
            {formatDuration(duration)}
          </span>
        )}

        {/* Guest count */}
        {guestCount > 0 && (
          <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[10px] text-text-muted">
            {guestCount} guest{guestCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
