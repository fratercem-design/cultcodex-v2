import { trustedSummary } from "@/lib/format/speculative-summary";
import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/format/date";
import { TranscriptBadge } from "@/components/ui/transcript-badge";

interface EpisodeListItemProps {
  slug: string;
  title: string;
  episodeNumber?: number | null;
  airDate?: Date | null;
  summaryShort?: string | null;
  thumbnailUrl?: string | null;
  segmentCount?: number;
  /**
   * Heading level for the item title. Defaults to 2, which is correct on the
   * archive index where these sit directly under the page `<h1>`. Pass 3 when
   * the list is nested inside a titled section — otherwise each item outranks
   * the section heading that contains it.
   */
  headingLevel?: 2 | 3 | 4;
}

export function EpisodeListItem({
  slug,
  title,
  episodeNumber,
  airDate,
  summaryShort,
  thumbnailUrl,
  segmentCount,
  headingLevel = 2,
}: EpisodeListItemProps) {
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const epNum = episodeNumber
    ? `EP.${String(episodeNumber).padStart(3, "0")}`
    : null;

  return (
    <Link
      href={`/episodes/${slug}`}
      className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent-gold/30 hover:bg-elevated"
    >
      {/* 16:9 thumbnail */}
      <div className="relative h-[47px] w-[84px] flex-shrink-0 rounded overflow-hidden bg-gradient-to-br from-accent-gold/10 to-accent-violet/10">
        {thumbnailUrl && (
          <Image
            src={thumbnailUrl}
            alt=""
            fill
            unoptimized
            sizes="84px"
            className="object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          {epNum && (
            <span className="font-mono text-[12px] text-accent-gold-text font-bold">
              {epNum}
            </span>
          )}
          {epNum && airDate && (
            <span className="text-text-muted" aria-hidden="true">·</span>
          )}
          {airDate && (
            <time dateTime={airDate.toISOString()} className="font-mono text-[12px] text-text-muted">
              {formatDate(airDate)}
            </time>
          )}
          {segmentCount !== undefined && (
            <TranscriptBadge segmentCount={segmentCount} />
          )}
        </div>
        <Heading className="text-sm font-medium text-text-primary group-hover:text-accent-gold-text transition-colors line-clamp-2">
          {title}
        </Heading>
        {trustedSummary(summaryShort) && (
          <p className="mt-1 text-xs text-text-muted line-clamp-2">
            {trustedSummary(summaryShort)}
          </p>
        )}
      </div>
    </Link>
  );
}
