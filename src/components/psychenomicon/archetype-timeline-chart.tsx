"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface ArchetypeEvent {
  chapterNumber: number;
  primaryArchetype: string;
  confidenceScore: number;
  secondaryArchetypes: string[];
}

interface Props {
  events: ArchetypeEvent[];
  entityName: string;
}

const ARCHETYPE_COLORS = [
  "#a78bfa", // violet
  "#fbbf24", // gold
  "#22d3ee", // cyan
  "#f87171", // red
  "#34d399", // green
  "#fb923c", // orange
  "#e879f9", // pink
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-accent-violet/30 bg-void/95 backdrop-blur-sm px-3 py-2 shadow-xl">
      <p className="font-mono text-[9px] text-text-muted mb-1">CH.{String(label).padStart(3, "0")}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span className="font-mono text-[10px] text-text-primary">{p.name}</span>
          <span className="font-mono text-[10px] text-text-muted ml-auto pl-3">{Math.round(p.value * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

export function ArchetypeTimelineChart({ events, entityName }: Props) {
  if (events.length === 0) return null;

  // Collect all archetype names
  const allArchetypes = Array.from(
    new Set(events.flatMap((e) => [e.primaryArchetype, ...e.secondaryArchetypes]))
  );

  // Build chart data: one row per chapter, each archetype gets a confidence value
  const chapters = Array.from(new Set(events.map((e) => e.chapterNumber))).sort((a, b) => a - b);

  const data = chapters.map((ch) => {
    const event = events.find((e) => e.chapterNumber === ch);
    const row: Record<string, number | string> = { chapter: ch };
    if (event) {
      row[event.primaryArchetype] = event.confidenceScore;
      // secondary archetypes share the remaining confidence
      const secondaryShare = (1 - event.confidenceScore) / (event.secondaryArchetypes.length || 1);
      event.secondaryArchetypes.forEach((sa) => {
        row[sa] = parseFloat(secondaryShare.toFixed(2));
      });
    }
    return row;
  });

  return (
    <div className="space-y-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">{"/// archetype_evolution — "}{entityName}</p>
      <div className="rounded-lg border border-border bg-surface p-4">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="chapter"
              tickFormatter={(v) => `CH.${String(v).padStart(3, "0")}`}
              tick={{ fontFamily: "monospace", fontSize: 9, fill: "rgba(255,255,255,0.4)" }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
              tick={{ fontFamily: "monospace", fontSize: 9, fill: "rgba(255,255,255,0.4)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.5)" }}
            />
            {allArchetypes.map((archetype, i) => (
              <Line
                key={archetype}
                type="monotone"
                dataKey={archetype}
                stroke={ARCHETYPE_COLORS[i % ARCHETYPE_COLORS.length]}
                strokeWidth={1.5}
                dot={{ r: 3, fill: ARCHETYPE_COLORS[i % ARCHETYPE_COLORS.length], strokeWidth: 0 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
