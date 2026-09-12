import Link from "next/link";
import type { ConfidenceTier } from "@/lib/format/confidence-tier";
import { CONFIDENCE_TIER_CONFIG } from "@/lib/format/confidence-tier";

interface AiNoticeProps {
  variant?: "inline" | "banner";
  /** When provided, renders the confidence tier inline with the notice. */
  tier?: ConfidenceTier;
  className?: string;
}

/**
 * Minimal AI-generated content disclaimer.
 * Inline: one line, placed beneath a summary or profile section.
 * Banner: slightly more prominent for whole-page AI content (e.g. Psychenomicon).
 */
export function AiNotice({ variant = "inline", tier, className = "" }: AiNoticeProps) {
  const tierCfg = tier ? CONFIDENCE_TIER_CONFIG[tier] : null;

  if (variant === "banner") {
    return (
      <div
        className={`flex items-start gap-2 rounded border border-border bg-surface/40 px-3 py-2 ${className}`}
        role="note"
        aria-label="AI-generated content notice"
      >
        <span className="shrink-0 text-[10px] text-accent-violet-text mt-0.5">◈</span>
        <p className="text-[11px] text-text-muted leading-snug">
          {tierCfg && (
            <span
              className={`mr-1.5 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${tierCfg.bg} ${tierCfg.border} ${tierCfg.color}`}
              title={tierCfg.tooltip}
            >
              <span className="text-[7px] leading-none">{tierCfg.glyph}</span>
              {tierCfg.shortLabel}
            </span>
          )}
          <span className="text-text-secondary font-medium">AI-generated interpretation.</span>{" "}
          Descriptions summarize on-stream discussion and performance personas — not verified
          real-world claims. Content may be inaccurate or incomplete.{" "}
          <Link
            href="/about/methodology"
            className="text-accent-violet-text hover:underline underline-offset-2"
          >
            How this works
          </Link>{" "}
          ·{" "}
          <Link
            href="/corrections"
            className="text-accent-violet-text hover:underline underline-offset-2"
          >
            Suggest a correction
          </Link>
        </p>
      </div>
    );
  }

  return (
    <p
      className={`text-[10px] text-text-muted font-mono leading-relaxed ${className}`}
      role="note"
    >
      <span className="text-accent-violet-text/70">◈</span>
      {tierCfg && tier !== "none" && (
        <span
          className={`mx-1 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[8px] uppercase tracking-wider ${tierCfg.bg} ${tierCfg.border} ${tierCfg.color}`}
          title={tierCfg.tooltip}
        >
          <span className="text-[7px] leading-none">{tierCfg.glyph}</span>
          {tierCfg.shortLabel}
        </span>
      )}{" "}
      AI-generated · summarizes on-stream discussion, not verified claims ·{" "}
      <Link
        href="/about/methodology"
        className="hover:text-accent-violet-text underline-offset-2 hover:underline"
      >
        methodology
      </Link>
    </p>
  );
}
