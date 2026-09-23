import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { fixThumbnailUrl } from "@/lib/format/thumbnail";

interface EpisodeHeroProps {
  title: string;
  subtitle: string;
  thumbnailUrl?: string | null;
  episodeNumber?: number | null;
  contentType: string;
  series?: { title: string; slug: string } | null;
}

export function EpisodeHero({
  title,
  subtitle,
  thumbnailUrl,
  episodeNumber,
  contentType,
  series,
}: EpisodeHeroProps) {
  const bgSrc = fixThumbnailUrl(thumbnailUrl) || "/wiki-page-header.jpg";
  const epNum = episodeNumber
    ? `EP.${String(episodeNumber).padStart(3, "0")}`
    : null;

  return (
    <section className="relative flex min-h-[220px] items-end overflow-hidden">
      <Image
        src={bgSrc}
        alt=""
        fill
        priority
        unoptimized
        sizes="100vw"
        className={`object-cover ${thumbnailUrl ? "blur-sm scale-105" : ""}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-void via-black/70 to-black/50" />

      {/* Title area. The EP badge sits in the flow above the eyebrow — it was
          absolutely positioned and collided with "// transmission" on phones
          (2026-09 audit, MO-03). */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-6 pt-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {epNum && (
            <span className="rounded-full border border-line-strong px-3 py-1 font-mono text-[13px] font-bold text-brand-ink">
              {epNum}
            </span>
          )}
          {contentType !== "original" && (
            <StatusBadge
              label={contentType.toUpperCase()}
              variant={contentType === "livestream" ? "purple" : "muted"}
            />
          )}
          <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-3">
            {"///"} transmission
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-[68ch] font-display text-[17px] leading-relaxed text-ink-2">{subtitle}</p>
        )}
        {series && (
          <Link
            href={`/series/${series.slug}`}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-accent-purple/30 bg-accent-purple-dim px-2.5 py-0.5 font-mono text-[12px] text-accent-violet-text transition-colors hover:border-accent-purple/50"
          >
            {series.title}
          </Link>
        )}
      </div>
    </section>
  );
}
