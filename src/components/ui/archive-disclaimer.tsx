import Link from "next/link";
import { IconScroll } from "@/components/graphics/codex-icons";

interface ArchiveDisclaimerProps {
  variant?: "full" | "compact";
  className?: string;
}

export function ArchiveDisclaimer({ variant = "compact", className }: ArchiveDisclaimerProps) {
  if (variant === "full") {
    return (
      <aside className={`rounded-lg border border-border bg-surface/50 p-5 text-xs text-text-muted leading-relaxed space-y-2 ${className ?? ""}`}>
        <div className="flex items-center gap-2 text-accent-gold-text font-mono text-[12px] uppercase tracking-wider font-bold">
          <IconScroll size={14} />
          About This Archive
        </div>
        <p>
          The Cult Codex is a community-maintained archive of the Cult of Psyche.
          Episode summaries, guest identifications, topic tags, and lore entries are
          generated using a combination of AI analysis and human curation.
        </p>
        <p>
          Descriptions aim for neutral, factual language. If you believe any content
          is inaccurate, misattributed, or needs correction, please{" "}
          <Link href="/corrections" className="text-accent-gold-text hover:underline">
            submit a correction
          </Link>.
        </p>
        <p className="text-text-muted">
          This archive does not represent the views of any individual mentioned.
          All content is sourced from publicly available streams and recordings.
        </p>
        <div className="flex items-center gap-3 pt-1">
          <Link href="/about/methodology" className="font-mono text-[12px] text-accent-gold-text/80 hover:text-accent-gold-text hover:underline">
            Methodology
          </Link>
          <Link href="/content-policy" className="font-mono text-[12px] text-accent-gold-text/80 hover:text-accent-gold-text hover:underline">
            Content Policy
          </Link>
          <Link href="/corrections" className="font-mono text-[12px] text-accent-gold-text/80 hover:text-accent-gold-text hover:underline">
            Corrections
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <p className={`text-[12px] text-text-muted font-mono leading-relaxed ${className ?? ""}`}>
      Content is AI-assisted and community-curated. Details may be approximate.{" "}
      <Link href="/corrections" className="text-accent-gold-text/80 hover:text-accent-gold-text hover:underline">
        Suggest corrections →
      </Link>
    </p>
  );
}
