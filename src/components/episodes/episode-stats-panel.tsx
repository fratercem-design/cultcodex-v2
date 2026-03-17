import { SectionCard } from "@/components/ui/section-card";

interface EpisodeStatsPanelProps {
  guestCount: number;
  quoteCount: number;
  segmentCount: number;
  reactionTotal: number;
  commentCount: number;
}

const STATS = [
  { icon: "\uD83C\uDFA4", label: "Guests" },
  { icon: "\uD83D\uDCAC", label: "Quotes" },
  { icon: "\uD83D\uDCDD", label: "Transcript" },
  { icon: "\uD83D\uDD25", label: "Reactions" },
  { icon: "\uD83D\uDDE8\uFE0F", label: "Comments" },
] as const;

export function EpisodeStatsPanel({
  guestCount,
  quoteCount,
  segmentCount,
  reactionTotal,
  commentCount,
}: EpisodeStatsPanelProps) {
  const values = [guestCount, quoteCount, segmentCount, reactionTotal, commentCount];
  const hasAnyData = values.some((v) => v > 0);

  if (!hasAnyData) return null;

  return (
    <SectionCard title="At a Glance">
      <div className="space-y-2">
        {STATS.map((stat, i) => {
          const count = values[i];
          if (count === 0) return null;
          return (
            <div key={stat.label} className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono text-xs text-text-muted">
                <span className="text-sm">{stat.icon}</span>
                {stat.label}
              </span>
              <span className="font-mono text-xs font-semibold text-text-primary">
                {count}{stat.label === "Transcript" ? " segments" : ""}
              </span>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
