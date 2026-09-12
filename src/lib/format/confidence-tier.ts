/**
 * Confidence tier — describes how reliable an AI-generated summary is,
 * derived entirely from existing DB fields (no migration needed).
 *
 * Tiers:
 *   high      — full transcript (≥50 segments) + AI summary present
 *   partial   — short transcript (1–49 segments) + AI summary present
 *   inferred  — AI summary present but no transcript (enriched from title/metadata only)
 *   none      — no AI summary (may or may not have transcript)
 */

export type ConfidenceTier = "high" | "partial" | "inferred" | "none";

interface TierConfig {
  label: string;
  shortLabel: string;
  tooltip: string;
  /** Tailwind color classes */
  color: string;
  bg: string;
  border: string;
  glyph: string;
}

export const CONFIDENCE_TIER_CONFIG: Record<ConfidenceTier, TierConfig> = {
  high: {
    label: "High Confidence",
    shortLabel: "HIGH",
    tooltip:
      "Summary generated from a full transcript — the most reliable AI interpretation available.",
    color: "text-accent-gold-text",
    bg: "bg-accent-gold/10",
    border: "border-accent-gold/30",
    glyph: "●●●",
  },
  partial: {
    label: "Partial Transcript",
    shortLabel: "PARTIAL",
    tooltip:
      "Summary generated from a partial transcript — some context may be missing.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    glyph: "●●○",
  },
  inferred: {
    label: "Inferred",
    shortLabel: "INFERRED",
    tooltip:
      "No transcript available — summary inferred from title and metadata only. Lower confidence.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    glyph: "●○○",
  },
  none: {
    label: "Not Summarized",
    shortLabel: "NONE",
    tooltip: "This episode has not been AI-enriched yet.",
    color: "text-text-muted",
    bg: "bg-surface",
    border: "border-border",
    glyph: "○○○",
  },
};

/**
 * Compute the confidence tier for an AI summary.
 *
 * @param segmentCount  Number of transcript segments stored for this episode.
 * @param hasSummary    Whether summaryLong is present.
 */
export function getConfidenceTier(
  segmentCount: number,
  hasSummary: boolean
): ConfidenceTier {
  if (!hasSummary) return "none";
  if (segmentCount >= 50) return "high";
  if (segmentCount > 0) return "partial";
  return "inferred";
}
