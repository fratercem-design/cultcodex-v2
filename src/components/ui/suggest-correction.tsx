import { IconScroll } from "@/components/graphics/codex-icons";
import Link from "next/link";

interface SuggestCorrectionProps {
  entityType: "person" | "lore" | "episode" | "topic";
  entityTitle: string;
  className?: string;
}

export function SuggestCorrection({ entityType, entityTitle, className }: SuggestCorrectionProps) {
  const correctionHref = `/corrections?type=${entityType}&title=${encodeURIComponent(entityTitle)}`;

  return (
    <aside className={`rounded-lg border border-border/50 bg-surface/30 p-4 ${className ?? ""}`}>
      <div className="flex items-start gap-3">
        <IconScroll size={16} className="text-accent-gold-text/60 mt-0.5 flex-shrink-0" />
        <div className="space-y-1.5">
          <p className="font-mono text-[10px] text-accent-gold-text/80 uppercase tracking-wider font-bold">
            Content Notice
          </p>
          <p className="text-[11px] text-text-muted leading-relaxed">
            This page is auto-generated from stream content and AI analysis.
            Details may be approximate or reflect in-show discussion rather than fact.
          </p>
          <Link
            href={correctionHref}
            className="inline-block font-mono text-[10px] text-accent-gold-text hover:text-accent-gold-text/80 hover:underline transition-colors"
          >
            Suggest a correction &rarr;
          </Link>
        </div>
      </div>
    </aside>
  );
}
