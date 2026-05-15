import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/format/date";

interface EpisodeListItemProps {
  slug: string;
  title: string;
  episodeNumber?: number | null;
  airDate?: Date | null;
  summaryShort?: string | null;
  thumbnailUrl?: string | null;
}

export function EpisodeListItem({
  slug,
  title,
  episodeNumber,
  airDate,
  summaryShort,
  thumbnailUrl,
}: EpisodeListItemProps) {
  const epNum = episodeNumber
    ? `EP.${String(episodeNumber).padStart(3, "0")}`
    : null;

  return (
    <Link
      href={`/episodes/${slug}`}
      className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent-gold/30 hover:bg-elevated"
    >
      {thumbnailUrl && (
        <Image
          src={thumbnailUrl}
          alt=""
          width={48}
          height={48}
          unoptimized
          className="h-12 w-12 flex-shrink-0 rounded object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          {epNum && (
            <span className="font-mono text-[10px] text-accent-gold font-bold">
              {epNum}
            </span>
          )}
          {epNum && airDate && (
            <span className="text-text-muted" aria-hidden="true">·</span>
          )}
          {airDate && (
            <time dateTime={airDate.toISOString()} className="font-mono text-[10px] text-text-muted">
              {formatDate(airDate)}
            </time>
          )}
        </div>
        <h2 className="text-sm font-medium text-text-primary group-hover:text-accent-gold transition-colors line-clamp-2">
          {title}
        </h2>
        {summaryShort && (
          <p className="mt-1 text-xs text-text-muted line-clamp-2">
            {summaryShort}
          </p>
        )}
      </div>
    </Link>
  );
}
