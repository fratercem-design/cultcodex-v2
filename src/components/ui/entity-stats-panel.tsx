import { SectionCard } from "@/components/ui/section-card";

interface StatItem {
  icon: string;
  label: string;
  value: number;
  suffix?: string;
}

interface EntityStatsPanelProps {
  stats: StatItem[];
  title?: string;
}

export function EntityStatsPanel({
  stats,
  title = "At a Glance",
}: EntityStatsPanelProps) {
  const hasAnyData = stats.some((s) => s.value > 0);
  if (!hasAnyData) return null;

  return (
    <SectionCard title={title}>
      <div className="space-y-2">
        {stats.map((stat) => {
          if (stat.value === 0) return null;
          return (
            <div key={stat.label} className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono text-xs text-text-muted">
                <span className="text-sm">{stat.icon}</span>
                {stat.label}
              </span>
              <span className="font-mono text-xs font-semibold text-text-primary">
                {stat.value}{stat.suffix ?? ""}
              </span>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
