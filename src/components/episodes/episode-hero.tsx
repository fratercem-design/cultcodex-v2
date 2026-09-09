import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { SacredGeometryOverlay } from "@/components/graphics/sacred-geometry";
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
      <SacredGeometryOverlay />

      {/* Top badges */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between">
        {epNum && (
          <span className="rounded-full border border-accent-gold/40 bg-accent-gold/15 px-3 py-1 font-mono text-xs font-bold text-accent-gold-text backdrop-blur-sm">
            {epNum}
          </span>
        )}
        {contentType !== "original" && (
          <StatusBadge
            label={contentType.toUpperCase()}
            variant={contentType === "livestream" ? "purple" : "muted"}
          />
        )}
      </div>

      {/* Title area */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-6">
        <p
          className="mb-1 font-mono text-[10px] uppercase tracking-[0.4em]"
          style={{ color: "var(--neon)", textShadow: "var(--glow-neon)" }}
        >
          {"// transmission"}
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-accent-gold drop-shadow-md">
          {title}
        </h1>
        <p className="mt-1 font-mono text-sm text-accent-cyan">{subtitle}</p>
        {series && (
          <Link
            href={`/series/${series.slug}`}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-accent-purple/30 bg-accent-purple-dim px-2.5 py-0.5 font-mono text-[10px] text-accent-purple transition-colors hover:border-accent-purple/50"
          >
            {series.title}
          </Link>
        )}
      </div>
    </section>
  );
}
