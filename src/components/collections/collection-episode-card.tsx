import { trustedSummary } from "@/lib/format/speculative-summary";
/**
 * CollectionEpisodeCard — An episode card styled to match the themed-
 * collection surface. Wraps the same EpisodeCardData shape used by the
 * archive, but:
 *   - accent-aware hover state
 *   - leans on the summary line instead of the chip dump
 *   - marks featured/pinned episodes with a small "PINNED" eyebrow
 *
 * Keeping it in /components/collections so changing the look here never
 * leaks into the full archive list.
 */
import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/format/date";
import { accentFor } from "./collection-accents";
import type { CollectionAccent } from "@/lib/collections/themed-collections";
import type { EpisodeCardData } from "@/lib/queries/episodes";

interface CollectionEpisodeCardProps {
  episode: EpisodeCardData;
  accent: CollectionAccent;
  pinned?: boolean;
}

export function CollectionEpisodeCard({
  episode,
  accent,
  pinned = false,
}: CollectionEpisodeCardProps) {
  const a = accentFor(accent);
  const epNum = episode.episodeNumber
    ? `EP.${String(episode.episodeNumber).padStart(3, "0")}`
    : null;

  return (
    <Link
      href={`/episodes/${episode.slug}`}
      className={`group flex items-start gap-4 rounded-lg border ${a.border} bg-surface p-4 transition-all ${a.hoverBorder} ${a.hoverBg} hover:-translate-y-0.5`}
    >
      {episode.thumbnailUrl ? (
        <Image
          src={episode.thumbnailUrl}
          alt=""
          width={96}
          height={96}
          unoptimized
          className="h-20 w-20 flex-shrink-0 rounded object-cover"
        />
      ) : (
        <div
          className={`h-20 w-20 flex-shrink-0 rounded ${a.bgDim}`}
          aria-hidden="true"
        />
      )}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          {pinned && (
            <span
              className={`font-mono text-[12px] uppercase tracking-widest ${a.eyebrow}`}
            >
              {"/// pinned"}
            </span>
          )}
          {epNum && (
            <span
              className={`font-mono text-[12px] font-bold ${a.eyebrow}`}
            >
              {epNum}
            </span>
          )}
          {episode.airDate && (
            <>
              {(epNum || pinned) && (
                <span className="text-text-muted" aria-hidden="true">
                  ·
                </span>
              )}
              <time
                dateTime={episode.airDate.toISOString()}
                className="font-mono text-[12px] text-text-muted"
              >
                {formatDate(episode.airDate)}
              </time>
            </>
          )}
        </div>
        <h3
          className={`font-sans text-sm font-medium text-text-primary group-hover:${a.title.replace("text-", "text-")} transition-colors line-clamp-2`}
        >
          {episode.title}
        </h3>
        {trustedSummary(episode.summaryShort) && (
          <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
            {trustedSummary(episode.summaryShort)}
          </p>
        )}
        {episode.topicNames.length > 0 && (
          <p className="font-mono text-[12px] text-text-muted truncate">
            {episode.topicNames.slice(0, 3).join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}
