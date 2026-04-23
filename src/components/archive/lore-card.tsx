import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type { CanonStatus } from "@/generated/prisma/client";
import type { SectionAccent } from "./section-group";

interface LoreCardProps {
  lore: {
    title: string;
    slug: string;
    category: string | null;
    summary: string | null;
    canonStatus: CanonStatus;
    episodeCount?: number;
    personCount?: number;
  };
  /** Override the border/hover accent — used by section views. */
  accentOverride?: SectionAccent;
}

const canonVariant: Record<CanonStatus, "green" | "purple" | "gold" | "muted"> = {
  canonical: "gold",
  speculative: "purple",
  community_myth: "green",
  disputed: "muted",
  humorous: "muted",
};

// Left border color derived from canonStatus (default path)
const CANON_BAR: Record<CanonStatus, string> = {
  canonical: "border-l-accent-gold/60",
  speculative: "border-l-accent-violet/60",
  community_myth: "border-l-accent-cyan/60",
  disputed: "border-l-accent-crimson/40",
  humorous: "border-l-border",
};

// Hover accent derived from section override
const ACCENT_HOVER: Record<SectionAccent, string> = {
  gold: "hover:border-accent-gold/40 group-hover:text-accent-gold",
  cyan: "hover:border-accent-cyan/40 group-hover:text-accent-cyan",
  violet: "hover:border-accent-violet/40 group-hover:text-accent-violet",
  crimson: "hover:border-accent-crimson/40 group-hover:text-accent-crimson",
  muted: "hover:border-border group-hover:text-text-primary",
};

// Default hover per canonStatus
const CANON_HOVER: Record<CanonStatus, string> = {
  canonical: ACCENT_HOVER.gold,
  speculative: ACCENT_HOVER.violet,
  community_myth: ACCENT_HOVER.cyan,
  disputed: ACCENT_HOVER.crimson,
  humorous: ACCENT_HOVER.muted,
};

export function LoreCard({ lore, accentOverride }: LoreCardProps) {
  const hover = accentOverride
    ? ACCENT_HOVER[accentOverride]
    : CANON_HOVER[lore.canonStatus];

  return (
    <Link
      href={`/lore/${lore.slug}`}
      className={`group block rounded-lg border border-border border-l-[3px] ${CANON_BAR[lore.canonStatus]} bg-surface p-4 transition-colors hover:bg-elevated ${hover.split(" ").filter((c) => c.startsWith("hover:")).join(" ")}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={`font-sans text-sm font-medium text-text-primary transition-colors ${hover.split(" ").filter((c) => c.startsWith("group-hover:")).join(" ")}`}
        >
          {lore.title}
        </h3>
        <StatusBadge
          label={lore.canonStatus.replace("_", " ")}
          variant={canonVariant[lore.canonStatus]}
        />
      </div>
      {lore.category && (
        <p className="mt-1 font-mono text-[10px] uppercase text-text-muted">
          {lore.category}
        </p>
      )}
      {lore.summary && (
        <p className="mt-2 text-xs text-text-muted line-clamp-3">{lore.summary}</p>
      )}
      {((lore.episodeCount ?? 0) > 0 || (lore.personCount ?? 0) > 0) && (
        <div className="mt-2 flex gap-3 font-mono text-[10px] text-text-muted">
          {(lore.episodeCount ?? 0) > 0 && (
            <span>
              {lore.episodeCount} episode{lore.episodeCount !== 1 ? "s" : ""}
            </span>
          )}
          {(lore.personCount ?? 0) > 0 && (
            <span>
              {lore.personCount} {lore.personCount !== 1 ? "people" : "person"}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
