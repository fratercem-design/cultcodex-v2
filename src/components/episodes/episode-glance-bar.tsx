import Link from "next/link";
import { formatDate } from "@/lib/format/date";
import { formatDuration } from "@/lib/format/duration";

interface EraChip {
  id: string;
  label: string;
  sigil: string;
  color: "gold" | "violet" | "cyan" | "crimson" | "muted";
}

interface EpisodeGlanceBarProps {
  contentType: string;
  series?: { title: string; slug: string } | null;
  airDate: Date | null;
  duration: string | null;
  guestCount: number;
  era?: EraChip | null;
}

const CONTENT_TYPE_ICONS: Record<string, string> = {
  livestream: "\uD83C\uDFA4",
  original: "\uD83C\uDFAC",
  short: "\u26A1",
  clip: "\u2702\uFE0F",
};

const ERA_CHIP_STYLE: Record<string, string> = {
  gold:    "border-accent-gold/40 bg-accent-gold/10 text-accent-gold-text hover:border-accent-gold/60",
  violet:  "border-accent-violet/40 bg-accent-violet/10 text-accent-violet-text hover:border-accent-violet/60",
  cyan:    "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan hover:border-accent-cyan/60",
  crimson: "border-accent-crimson/40 bg-accent-crimson/10 text-accent-crimson-text hover:border-accent-crimson/60",
  muted:   "border-border bg-surface text-text-muted",
};

export function EpisodeGlanceBar({
  contentType,
  series,
  airDate,
  duration,
  guestCount,
  era,
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

        {/* Duration — only show when we have a meaningful value */}
        {duration && formatDuration(duration) !== "—" && (
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

        {/* Era */}
        {era && (
          <Link
            href={`/eras/${era.id}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] transition-colors ${ERA_CHIP_STYLE[era.color] ?? ERA_CHIP_STYLE.muted}`}
            title={`Browse ${era.label}`}
          >
            <span className="text-xs leading-none">{era.sigil}</span>
            {era.label}
          </Link>
        )}
      </div>
    </div>
  );
}
