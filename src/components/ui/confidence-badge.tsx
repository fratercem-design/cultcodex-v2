import { cn } from "@/lib/utils";
import {
  type ConfidenceTier,
  CONFIDENCE_TIER_CONFIG,
} from "@/lib/format/confidence-tier";

interface ConfidenceBadgeProps {
  tier: ConfidenceTier;
  /** Show full label (default) or short label */
  short?: boolean;
  className?: string;
  /** Hide the "none" tier entirely (useful on cards) */
  hideNone?: boolean;
}

/**
 * Inline badge showing how confident the AI summary is.
 * Derives colors from CONFIDENCE_TIER_CONFIG so the logic stays in one place.
 */
export function ConfidenceBadge({
  tier,
  short = false,
  className,
  hideNone = false,
}: ConfidenceBadgeProps) {
  if (hideNone && tier === "none") return null;

  const cfg = CONFIDENCE_TIER_CONFIG[tier];

  return (
    <span
      title={cfg.tooltip}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[12px] uppercase tracking-wider cursor-help",
        cfg.bg,
        cfg.border,
        cfg.color,
        className
      )}
    >
      <span className="text-[12px] leading-none tracking-tighter" aria-hidden="true">
        {cfg.glyph}
      </span>
      {short ? cfg.shortLabel : cfg.label}
    </span>
  );
}
