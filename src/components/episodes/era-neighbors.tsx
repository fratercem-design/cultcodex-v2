import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/format/date";
import { fixThumbnailUrl } from "@/lib/format/thumbnail";
import type { EraNeighborEpisode } from "@/lib/queries/episodes";

interface Props {
  era: {
    id: string;
    label: string;
    sigil: string;
    color: "gold" | "violet" | "cyan" | "crimson" | "muted";
  };
  previous: EraNeighborEpisode | null;
  next: EraNeighborEpisode | null;
}

const ACCENT_CLASS: Record<string, string> = {
  gold:    "text-accent-gold-text border-accent-gold/30 hover:border-accent-gold/60 hover:bg-accent-gold/5",
  violet:  "text-accent-violet-text border-accent-violet/30 hover:border-accent-violet/60 hover:bg-accent-violet/5",
  cyan:    "text-accent-cyan border-accent-cyan/30 hover:border-accent-cyan/60 hover:bg-accent-cyan/5",
  crimson: "text-accent-crimson-text border-accent-crimson/30 hover:border-accent-crimson/60 hover:bg-accent-crimson/5",
  muted:   "text-text-muted border-border hover:border-border/60",
};

export function EraNeighbors({ era, previous, next }: Props) {
  if (!previous && !next) return null;

  const accent = ACCENT_CLASS[era.color] ?? ACCENT_CLASS.muted;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">
          {"/// within "}{era.sigil}{" "}{era.label}
        </p>
        <Link
          href={`/eras/${era.id}`}
          className={`font-mono text-[12px] uppercase tracking-widest transition-colors ${accent.split(" ")[0]} hover:opacity-80`}
        >
          Browse era →
        </Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {previous ? (
          <EraNeighborCard
            episode={previous}
            direction="previous"
            accent={accent}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-border/60 bg-surface/30 p-4 flex items-center justify-center">
            <p className="font-mono text-[12px] text-text-muted uppercase tracking-widest">
              ← era origin
            </p>
          </div>
        )}
        {next ? (
          <EraNeighborCard
            episode={next}
            direction="next"
            accent={accent}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-border/60 bg-surface/30 p-4 flex items-center justify-center">
            <p className="font-mono text-[12px] text-text-muted uppercase tracking-widest">
              era edge →
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

interface EraNeighborCardProps {
  episode: EraNeighborEpisode;
  direction: "previous" | "next";
  accent: string;
}

function EraNeighborCard({ episode, direction, accent }: EraNeighborCardProps) {
  const arrow = direction === "previous" ? "←" : "→";
  const label =
    direction === "previous" ? "earlier in era" : "later in era";
  return (
    <Link
      href={`/episodes/${episode.slug}`}
      className={`group flex items-center gap-3 rounded-lg border bg-surface px-3 py-3 transition-colors ${accent}`}
    >
      {direction === "previous" && (
        <span className="font-mono text-[12px] opacity-50 group-hover:opacity-100 transition-opacity shrink-0">
          {arrow}
        </span>
      )}
      {episode.thumbnailUrl && (
        <Image
          src={fixThumbnailUrl(episode.thumbnailUrl)!}
          alt=""
          width={64}
          height={36}
          unoptimized
          className="w-16 h-9 rounded object-cover shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
        />
      )}
      <div className={`min-w-0 flex-1 ${direction === "next" ? "text-right" : ""}`}>
        <p className="font-mono text-[12px] uppercase tracking-widest opacity-60">
          {label}
        </p>
        <p className="font-sans text-xs text-text-primary leading-snug line-clamp-2 mt-0.5">
          {episode.title}
        </p>
        <p className="font-mono text-[12px] text-text-muted mt-0.5">
          {episode.episodeNumber != null
            ? `EP.${String(episode.episodeNumber).padStart(3, "0")} · `
            : ""}
          {formatDate(episode.airDate)}
        </p>
      </div>
      {direction === "next" && (
        <span className="font-mono text-[12px] opacity-50 group-hover:opacity-100 transition-opacity shrink-0">
          {arrow}
        </span>
      )}
    </Link>
  );
}
