import { SectionCard } from "@/components/ui/section-card";
import { IconMicrophone, IconQuote, IconTranscript, IconFlame, IconComment } from "@/components/graphics/codex-icons";

interface EpisodeStatsPanelProps {
  guestCount: number;
  quoteCount: number;
  segmentCount: number;
  reactionTotal: number;
  commentCount: number;
}

const STATS = [
  { icon: <IconMicrophone size={16} />, label: "Guests" },
  { icon: <IconQuote size={16} />, label: "Quotes" },
  { icon: <IconTranscript size={16} />, label: "Transcript" },
  { icon: <IconFlame size={16} />, label: "Reactions" },
  { icon: <IconComment size={16} />, label: "Comments" },
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
                {stat.icon}
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
