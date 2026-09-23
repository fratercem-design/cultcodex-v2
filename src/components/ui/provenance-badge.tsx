import { cn } from "@/lib/utils";

type ProvenanceLevel = "transcript" | "inferred" | "manual";

interface ProvenanceBadgeProps {
  /** Whether the episode has transcript segments */
  hasTranscript: boolean;
  /** Whether the episode has an AI-generated summary */
  hasSummary: boolean;
  className?: string;
}

const CONFIG: Record<ProvenanceLevel, { label: string; title: string; style: string }> = {
  transcript: {
    label: "TRANSCRIPT-BACKED",
    title: "Summary was generated from a full transcript of this episode",
    style: "border-accent-gold/30 text-accent-gold-text bg-accent-gold-dim",
  },
  inferred: {
    label: "INFERRED",
    title: "Summary was generated from title and metadata only — no transcript was available",
    style: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  },
  manual: {
    label: "NO SUMMARY",
    title: "This episode has not been summarized yet",
    style: "border-border text-text-muted bg-surface",
  },
};

function resolveProvenance(hasTranscript: boolean, hasSummary: boolean): ProvenanceLevel {
  if (!hasSummary) return "manual";
  if (hasTranscript) return "transcript";
  return "inferred";
}

export function ProvenanceBadge({ hasTranscript, hasSummary, className }: ProvenanceBadgeProps) {
  const level = resolveProvenance(hasTranscript, hasSummary);
  const config = CONFIG[level];

  return (
    <span
      title={config.title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[12px] uppercase tracking-wider cursor-help",
        config.style,
        className,
      )}
    >
      {level === "transcript" && (
        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {level === "inferred" && (
        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      )}
      {config.label}
    </span>
  );
}
