import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type { CanonStatus } from "@/generated/prisma/client";

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
}

const canonVariant: Record<CanonStatus, "green" | "purple" | "gold" | "muted"> = {
  canonical: "gold",
  speculative: "purple",
  community_myth: "green",
  disputed: "muted",
  humorous: "muted",
};

const canonBorder: Record<CanonStatus, string> = {
  canonical: "border-l-accent-gold/50",
  speculative: "border-l-accent-purple/50",
  community_myth: "border-l-accent-green/50",
  disputed: "border-l-border",
  humorous: "border-l-border",
};

export function LoreCard({ lore }: LoreCardProps) {
  return (
    <Link
      href={`/lore/${lore.slug}`}
      className={`group block rounded-lg border border-border border-l-[3px] ${canonBorder[lore.canonStatus]} bg-surface p-4 transition-colors hover:border-accent-gold/30 hover:bg-elevated`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-gold transition-colors">
          {lore.title}
        </h3>
        <StatusBadge
          label={lore.canonStatus.replace("_", " ")}
          variant={canonVariant[lore.canonStatus]}
        />
      </div>
      {lore.category && (
        <p className="mt-1 font-mono text-[10px] text-text-muted uppercase">
          {lore.category}
        </p>
      )}
      {lore.summary && (
        <p className="mt-2 text-xs text-text-muted line-clamp-3">
          {lore.summary}
        </p>
      )}
      {(lore.episodeCount != null && lore.episodeCount > 0) ||
       (lore.personCount != null && lore.personCount > 0) ? (
        <div className="mt-2 flex gap-3 font-mono text-[10px] text-text-muted">
          {lore.episodeCount != null && lore.episodeCount > 0 && (
            <span>{lore.episodeCount} episode{lore.episodeCount !== 1 ? "s" : ""}</span>
          )}
          {lore.personCount != null && lore.personCount > 0 && (
            <span>{lore.personCount} {lore.personCount !== 1 ? "people" : "person"}</span>
          )}
        </div>
      ) : null}
    </Link>
  );
}
