"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RadarData {
  influence?: number;
  volatility?: number;
  manipulation?: number;
  control?: number;
  emotionalIntensity?: number;
}

interface Props {
  radarData: RadarData;
  accentColor?: string;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { trait: string; value: number } }> }) {
  if (!active || !payload?.length) return null;
  const { trait, value } = payload[0].payload;
  return (
    <div className="rounded border border-accent-violet/30 bg-void/95 px-2.5 py-1.5 shadow-xl">
      <p className="font-mono text-[9px] text-text-muted">{trait}</p>
      <p className="font-mono text-[11px] text-accent-violet-text font-bold">{value}/10</p>
    </div>
  );
}

export function ArchetypeRadarChart({ radarData, accentColor = "#a78bfa" }: Props) {
  const data = [
    { trait: "Influence", value: radarData.influence ?? 0 },
    { trait: "Volatility", value: radarData.volatility ?? 0 },
    { trait: "Manipulation", value: radarData.manipulation ?? 0 },
    { trait: "Control", value: radarData.control ?? 0 },
    { trait: "Emotion", value: radarData.emotionalIntensity ?? 0 },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis
          dataKey="trait"
          tick={{ fontFamily: "monospace", fontSize: 8, fill: "rgba(255,255,255,0.4)" }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Radar
          dataKey="value"
          stroke={accentColor}
          fill={accentColor}
          fillOpacity={0.15}
          strokeWidth={1.5}
          dot={{ r: 2.5, fill: accentColor, strokeWidth: 0 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
