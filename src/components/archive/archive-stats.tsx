import Link from "next/link";
import type { ArchiveStats } from "@/types";

interface ArchiveStatsProps {
  stats: ArchiveStats;
}

const statItems = [
  { key: "episodes" as const, label: "Episodes", href: "/episodes" },
  { key: "people" as const, label: "People", href: "/people" },
  { key: "loreEntries" as const, label: "Lore Entries", href: "/lore" },
  { key: "quotes" as const, label: "Quotes", href: "/quotes" },
  { key: "topics" as const, label: "Topics", href: "/topics" },
  { key: "series" as const, label: "Series", href: "/series" },
];

export function ArchiveStatsDisplay({ stats }: ArchiveStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {statItems.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className="rounded-lg border border-border bg-surface p-3 text-center transition-colors hover:border-accent-gold/50 hover:bg-surface-raised"
        >
          <p className="font-mono text-2xl font-bold text-accent-gold">
            {stats[item.key]}
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {item.label}
          </p>
        </Link>
      ))}
    </div>
  );
}
