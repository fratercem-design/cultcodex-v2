import type { ArchiveStats } from "@/types";

interface ArchiveStatsProps {
  stats: ArchiveStats;
}

const statItems = [
  { key: "episodes" as const, label: "Episodes" },
  { key: "people" as const, label: "People" },
  { key: "loreEntries" as const, label: "Lore Entries" },
  { key: "quotes" as const, label: "Quotes" },
  { key: "series" as const, label: "Series" },
  { key: "topics" as const, label: "Topics" },
];

export function ArchiveStatsDisplay({ stats }: ArchiveStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {statItems.map((item) => (
        <div
          key={item.key}
          className="rounded-lg border border-border bg-surface p-3 text-center"
        >
          <p className="font-mono text-2xl font-bold text-accent-green">
            {stats[item.key]}
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
