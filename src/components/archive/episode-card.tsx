import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/format/date";
import { StatusBadge } from "@/components/ui/status-badge";
import { TranscriptBadge } from "@/components/ui/transcript-badge";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { HumanReviewBadge } from "@/components/ui/human-review-badge";
import { EraTag } from "@/components/ui/era-tag";
import { getEraForEpisode } from "@/lib/eras";
import { getConfidenceTier } from "@/lib/format/confidence-tier";
import type { EpisodeCardData } from "@/lib/queries/episodes";

interface EpisodeCardProps {
  episode: EpisodeCardData;
  hideDescription?: boolean;
}

export function EpisodeCard({ episode, hideDescription = false }: EpisodeCardProps) {
  const epNum = episode.episodeNumber
    ? `EP.${String(episode.episodeNumber).padStart(3, "0")}`
    : null;
  const era = getEraForEpisode(episode.airDate);
  const confidenceTier = getConfidenceTier(episode.segmentCount, episode.hasSummary);

  return (
    <Link
      href={`/episodes/${episode.slug}`}
      className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-gold/30 hover:bg-elevated"
    >
      {/* 16:9 thumbnail — matches YouTube aspect ratio */}
      <div className="relative h-[63px] w-[112px] flex-shrink-0 rounded overflow-hidden bg-gradient-to-br from-accent-gold/10 to-accent-violet/10">
        {episode.thumbnailUrl && (
          <Image
            src={episode.thumbnailUrl}
            alt={`Thumbnail for ${episode.title}`}
            fill
            unoptimized
            sizes="112px"
            className="object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          {epNum && (
            <span className="font-mono text-[10px] text-accent-gold-text font-bold">
              {epNum}
            </span>
          )}
          {epNum && episode.airDate && (
            <span className="text-text-muted" aria-hidden="true">·</span>
          )}
          {episode.airDate && (
            <time dateTime={episode.airDate.toISOString()} className="font-mono text-[10px] text-text-muted">
              {formatDate(episode.airDate)}
            </time>
          )}
        </div>
        <h2 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-gold-text transition-colors line-clamp-2">
          {episode.title}
        </h2>
        {!hideDescription && episode.summaryShort && (
          <p className="mt-1 text-xs text-text-muted line-clamp-2">
            {episode.summaryShort}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {era && <EraTag era={era} />}
          {episode.status === "unavailable" && (
            <StatusBadge label="Unavailable" variant="muted" />
          )}
          {!episode.hasVideo && episode.status !== "unavailable" && (
            <StatusBadge label="No Video" variant="muted" />
          )}
          <TranscriptBadge segmentCount={episode.segmentCount} />
          <ConfidenceBadge tier={confidenceTier} short hideNone />
          {episode.isHumanReviewed && (
            <HumanReviewBadge reviewedAt={episode.humanReviewedAt} variant="short" />
          )}
          {episode.guestNames.slice(0, 3).map((name) => (
            <StatusBadge key={name} label={name} variant="gold" />
          ))}
          {episode.guestNames.length > 3 && (
            <span className="font-mono text-[9px] text-accent-gold-text/80">
              +{episode.guestNames.length - 3} more
            </span>
          )}
          {episode.topicNames.slice(0, 3).map((name) => (
            <StatusBadge key={name} label={name} variant="cyan" />
          ))}
          {episode.topicNames.length > 3 && (
            <span className="font-mono text-[9px] text-text-muted">
              +{episode.topicNames.length - 3} topics
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
