import { cn } from "@/lib/utils";

type TranscriptCoverage = "full" | "partial" | "none";

interface TranscriptBadgeProps {
  segmentCount: number;
  className?: string;
}

function getCoverage(segmentCount: number): TranscriptCoverage {
  if (segmentCount === 0) return "none";
  if (segmentCount >= 50) return "full";
  return "partial";
}

const coverageConfig: Record<TranscriptCoverage, { label: string; icon: string; style: string }> = {
  full: {
    label: "Full Transcript",
    icon: "\u2588\u2588\u2588",
    style: "border-accent-green/30 text-accent-green bg-accent-green-dim",
  },
  partial: {
    label: "Partial Transcript",
    icon: "\u2588\u2588\u2591",
    style: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  },
  none: {
    label: "No Transcript",
    icon: "\u2591\u2591\u2591",
    style: "border-border text-text-muted bg-surface",
  },
};

export function TranscriptBadge({ segmentCount, className }: TranscriptBadgeProps) {
  const coverage = getCoverage(segmentCount);
  const config = coverageConfig[coverage];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        config.style,
        className,
      )}
      title={`${segmentCount} transcript segments`}
    >
      <span className="text-[8px] leading-none tracking-tighter">{config.icon}</span>
      {config.label}
    </span>
  );
}
