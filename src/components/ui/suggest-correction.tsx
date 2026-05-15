import { IconScroll } from "@/components/graphics/codex-icons";

interface SuggestCorrectionProps {
  entityType: "person" | "lore" | "episode" | "topic";
  entityTitle: string;
  className?: string;
}

export function SuggestCorrection({ entityType, entityTitle, className }: SuggestCorrectionProps) {
  const subject = encodeURIComponent(`[Correction] ${entityType}: ${entityTitle}`);
  const body = encodeURIComponent(
    `I'd like to suggest a correction for the ${entityType} page "${entityTitle}" on CultCodex.\n\nWhat needs correcting:\n\nSuggested change:\n\nSource/context:\n`
  );
  const mailtoLink = `mailto:psychetarotchannel@gmail.com?subject=${subject}&body=${body}`;

  return (
    <aside className={`rounded-lg border border-border/50 bg-surface/30 p-4 ${className ?? ""}`}>
      <div className="flex items-start gap-3">
        <IconScroll size={16} className="text-accent-gold/60 mt-0.5 flex-shrink-0" />
        <div className="space-y-1.5">
          <p className="font-mono text-[10px] text-accent-gold/60 uppercase tracking-wider font-bold">
            Content Notice
          </p>
          <p className="text-[11px] text-text-muted leading-relaxed">
            This page is auto-generated from stream content and AI analysis.
            Details may be approximate or reflect in-show discussion rather than fact.
          </p>
          <a
            href={mailtoLink}
            className="inline-block font-mono text-[10px] text-accent-gold hover:text-accent-gold/80 hover:underline transition-colors"
          >
            Suggest a correction &rarr;
          </a>
        </div>
      </div>
    </aside>
  );
}
