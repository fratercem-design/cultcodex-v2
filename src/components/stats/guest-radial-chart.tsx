"use client";

import {
  RadialBarChart,
  RadialBar,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Link from "next/link";

interface Guest {
  displayName: string;
  slug: string;
  count: number;
}

interface Props {
  data: Guest[];
}

const COLORS = [
  "#C8392E", "#C8392E", "#C8392E",           // top 3 gold
  "#a855f7", "#a855f7", "#a855f7",            // next 3 violet
  "#00d9ff", "#00d9ff", "#00d9ff",            // next 3 cyan
  "#ef4444", "#ef4444",                        // crimson
  "#6b7280", "#6b7280", "#6b7280",            // muted
  "#6b7280", "#6b7280", "#6b7280", "#6b7280", "#6b7280",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as Guest;
  return (
    <div className="bg-surface border border-border rounded px-3 py-2 font-mono text-xs shadow-lg">
      <div className="text-text-primary font-bold">{d.displayName}</div>
      <div className="text-accent-gold-text">{d.count} appearances</div>
    </div>
  );
};

export function GuestRadialChart({ data }: Props) {
  // RadialBarChart needs data with a `value` key
  const chartData = data.map((g) => ({ ...g, value: g.count }));

  return (
    <div className="space-y-4">
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="15%"
            outerRadius="90%"
            data={chartData}
            startAngle={180}
            endAngle={-180}
          >
            <RadialBar dataKey="value" background={{ fill: "#1a1a2e" }} cornerRadius={3}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i] ?? "#6b7280"} />
              ))}
            </RadialBar>
            <Tooltip content={<CustomTooltip />} cursor={false} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {data.slice(0, 10).map((g, i) => (
          <Link
            key={g.slug}
            href={`/people/${g.slug}`}
            className="flex items-center gap-2 group min-w-0"
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: COLORS[i] ?? "#6b7280" }}
            />
            <span className="font-mono text-[10px] text-text-muted group-hover:text-accent-gold-text transition-colors truncate">
              {g.displayName}
            </span>
            <span className="font-mono text-[10px] text-text-muted/50 ml-auto shrink-0">
              {g.count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
