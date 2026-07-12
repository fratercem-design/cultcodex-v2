"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Props {
  months: Array<Record<string, string | number>>;
  topics: Array<{ id: string; title: string; slug: string }>;
}

const TOPIC_COLORS = [
  "#C8392E", // gold
  "#a855f7", // violet
  "#00d9ff", // cyan
  "#ef4444", // crimson
  "#10b981", // emerald
  "#f97316", // orange
];

function formatMonth(m: string) {
  const [year, month] = m.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded px-3 py-2 font-mono text-xs shadow-lg space-y-1">
      <div className="text-text-muted text-[10px]">{formatMonth(label as string)}</div>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-text-primary">{p.name}</span>
          <span className="ml-auto text-text-muted">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function TopicPulseChart({ months, topics }: Props) {
  if (months.length === 0) return (
    <p className="text-center font-mono text-xs text-text-muted py-8">No data yet</p>
  );

  return (
    <div style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={months} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {topics.map((t, i) => (
              <linearGradient key={t.id} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={TOPIC_COLORS[i] ?? "#6b7280"} stopOpacity={0.4} />
                <stop offset="95%" stopColor={TOPIC_COLORS[i] ?? "#6b7280"} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            tick={{ fontSize: 9, fontFamily: "monospace", fill: "#6b7280" }}
            axisLine={{ stroke: "#2a2a3e" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fontFamily: "monospace", fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "9px", fontFamily: "monospace", color: "#6b7280" }}
          />
          {topics.map((t, i) => (
            <Area
              key={t.id}
              type="monotone"
              dataKey={t.title}
              stackId="1"
              stroke={TOPIC_COLORS[i] ?? "#6b7280"}
              strokeWidth={1.5}
              fill={`url(#grad-${i})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
