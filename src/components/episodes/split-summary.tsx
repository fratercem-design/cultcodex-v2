/**
 * SplitSummaryCard
 *
 * Renders the fact/interpretation split for episodes enriched with the
 * new two-field format (summaryFacts + summaryThemes).
 *
 * Visual contract:
 *   ◈ WHAT HAPPENED  — gold, factual, transcript-grounded
 *   ── separator ──
 *   ⬡ INTERPRETIVE LAYER  — violet, clearly flagged as AI interpretation
 *
 * Falls back gracefully when summaryThemes is absent (shows facts only).
 */

import { renderWithTimestamps } from "@/lib/format/render-timestamps";
import { AiNotice } from "@/components/ui/ai-notice";
import { HumanReviewBadge } from "@/components/ui/human-review-badge";
import type { ConfidenceTier } from "@/lib/format/confidence-tier";

interface SplitSummaryProps {
  summaryFacts: string;
  summaryThemes?: string | null;
  youtubeVideoId?: string | null;
  confidenceTier: ConfidenceTier;
  isHumanReviewed?: boolean;
  humanReviewedAt?: Date | null;
}

export function SplitSummaryCard({
  summaryFacts,
  summaryThemes,
  youtubeVideoId,
  confidenceTier,
  isHumanReviewed,
  humanReviewedAt,
}: SplitSummaryProps) {
  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-elevated">
        <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-text-muted">
          Summary
        </p>
        {isHumanReviewed && (
          <HumanReviewBadge reviewedAt={humanReviewedAt} variant="short" />
        )}
      </div>

      {/* Facts zone */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-accent-gold-text">
            ◈ What Happened
          </span>
        </div>
        <p className="text-sm text-text-primary leading-relaxed">
          {renderWithTimestamps(summaryFacts, youtubeVideoId)}
        </p>
      </div>

      {/* Separator + themes zone */}
      {summaryThemes && (
        <>
          <div className="mx-4 flex items-center gap-2 py-1">
            <div className="h-px flex-1 border-t border-dashed border-border/60" />
            <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-text-muted/50 select-none">
              interpretation
            </span>
            <div className="h-px flex-1 border-t border-dashed border-border/60" />
          </div>

          <div className="px-4 pt-1 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-accent-violet-text">
                ⬡ Interpretive Layer
              </span>
              <span className="font-mono text-[8px] text-text-muted/60">
                · AI interpretation
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed italic">
              {summaryThemes}
            </p>
          </div>
        </>
      )}

      {/* Notice footer */}
      <div className="border-t border-border/60 px-4 py-2.5">
        <AiNotice tier={confidenceTier} />
      </div>
    </div>
  );
}
