import Link from "next/link";

// ── Archetype color theming ───────────────────────────────────────────────────
const THEME: Record<string, { border: string; text: string; fill: string; dot: string }> = {
  Mirror:    { border: "border-l-violet-500/60",  text: "text-violet-300", fill: "rgba(139,92,246,0.18)", dot: "#a78bfa" },
  Gravity:   { border: "border-l-violet-500/60",  text: "text-violet-300", fill: "rgba(139,92,246,0.18)", dot: "#a78bfa" },
  Siren:     { border: "border-l-pink-500/60",    text: "text-pink-300",   fill: "rgba(236,72,153,0.15)", dot: "#f472b6" },
  Chaos:     { border: "border-l-red-500/60",     text: "text-red-400",    fill: "rgba(239,68,68,0.15)",  dot: "#f87171" },
  Echo:      { border: "border-l-orange-500/60",  text: "text-orange-400", fill: "rgba(249,115,22,0.15)", dot: "#fb923c" },
  Flame:     { border: "border-l-amber-500/60",   text: "text-amber-300",  fill: "rgba(245,158,11,0.15)", dot: "#fbbf24" },
  Contested: { border: "border-l-emerald-500/60", text: "text-emerald-400",fill: "rgba(16,185,129,0.13)", dot: "#6ee7b7" },
  Fractured: { border: "border-l-slate-500/50",   text: "text-slate-400",  fill: "rgba(148,163,184,0.12)",dot: "#94a3b8" },
  Silent:    { border: "border-l-slate-500/50",   text: "text-slate-400",  fill: "rgba(148,163,184,0.12)",dot: "#64748b" },
  Seekers:   { border: "border-l-cyan-500/60",    text: "text-cyan-400",   fill: "rgba(6,182,212,0.13)",  dot: "#67e8f9" },
  Loyalist:  { border: "border-l-indigo-500/60",  text: "text-indigo-400", fill: "rgba(99,102,241,0.15)", dot: "#818cf8" },
};

const DEFAULT_THEME = { border: "border-l-violet-500/40", text: "text-violet-300", fill: "rgba(139,92,246,0.15)", dot: "#a78bfa" };

function getTheme(archetype: string | null) {
  if (!archetype) return DEFAULT_THEME;
  for (const [key, theme] of Object.entries(THEME)) {
    if (archetype.includes(key)) return theme;
  }
  return DEFAULT_THEME;
}

// ── Radar data types and parsing ──────────────────────────────────────────────
interface RadarValues {
  influence: number;
  volatility: number;
  manipulation: number;
  control: number;
  emotionalIntensity: number;
}

function parseRadar(raw: unknown): RadarValues | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const keys: (keyof RadarValues)[] = ["influence", "volatility", "manipulation", "control", "emotionalIntensity"];
  const out: Partial<RadarValues> = {};
  let filled = 0;
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "number" && isFinite(v)) {
      out[k] = Math.max(0, Math.min(10, v));
      filled++;
    }
  }
  return filled >= 3 ? (out as RadarValues) : null;
}

// ── Radar SVG ─────────────────────────────────────────────────────────────────
// Pentagon with 5 axes. viewBox 0 0 160 150, center (80, 82), R=42.
const CX = 80;
const CY = 82;
const R = 42;
const LABEL_R = R + 15;

const AXES = [
  { key: "influence" as const,         label: "INFL", angleDeg: -90 },
  { key: "volatility" as const,        label: "VLTL", angleDeg: -18 },
  { key: "manipulation" as const,      label: "MNPL", angleDeg:  54 },
  { key: "control" as const,           label: "CTRL", angleDeg: 126 },
  { key: "emotionalIntensity" as const, label: "EMOT", angleDeg: 198 },
];

function polar(angleDeg: number, r: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function polyPoints(vals: [number, number][]): string {
  return vals.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

function RadarChart({ data, dot }: { data: RadarValues; dot: string }) {
  const RINGS = [0.25, 0.5, 0.75, 1.0];

  const ringPolygons = RINGS.map((t) =>
    polyPoints(AXES.map((a) => polar(a.angleDeg, R * t)))
  );

  const dataPoints = AXES.map((a) =>
    polar(a.angleDeg, ((data[a.key] ?? 0) / 10) * R)
  );

  return (
    <svg viewBox="0 0 160 150" className="w-full max-w-[160px] mx-auto" aria-hidden="true">
      {/* Background rings */}
      {ringPolygons.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.6"
        />
      ))}

      {/* Axis spokes */}
      {AXES.map((a) => {
        const [x2, y2] = polar(a.angleDeg, R);
        return (
          <line
            key={a.key}
            x1={CX} y1={CY}
            x2={x2} y2={y2}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="0.6"
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={polyPoints(dataPoints)}
        fill={dot.replace("#", "").length === 6
          ? `rgba(${parseInt(dot.slice(1,3),16)},${parseInt(dot.slice(3,5),16)},${parseInt(dot.slice(5,7),16)},0.2)`
          : "rgba(139,92,246,0.2)"}
        stroke={dot}
        strokeWidth="1.5"
        strokeOpacity={0.85}
        strokeLinejoin="round"
      />

      {/* Data point dots */}
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill={dot} fillOpacity={0.9} />
      ))}

      {/* Axis labels */}
      {AXES.map((a) => {
        const [x, y] = polar(a.angleDeg, LABEL_R);
        return (
          <text
            key={a.key}
            x={x} y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.35)"
            fontSize="7"
            fontFamily="monospace"
          >
            {a.label}
          </text>
        );
      })}

      {/* Axis value hint — top axis score */}
      {AXES.map((a) => {
        const score = data[a.key];
        if (!score) return null;
        const [x, y] = polar(a.angleDeg, ((score / 10) * R) / 2);
        return (
          <text
            key={`v-${a.key}`}
            x={x} y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.0)"
            fontSize="6"
            fontFamily="monospace"
          />
        );
      })}
    </svg>
  );
}

// ── Status label ──────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  active:  "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
  dormant: "text-slate-400  border-slate-500/30   bg-slate-500/5",
  evolved: "text-accent-cyan border-accent-cyan/30 bg-accent-cyan/5",
};

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  entitySlug: string;
  primaryArchetype: string | null;
  status: string;
  radarData: unknown;
  behaviorPatterns: string[];
}

export function ArchetypeCard({
  entitySlug,
  primaryArchetype,
  status,
  radarData,
  behaviorPatterns,
}: Props) {
  const theme = getTheme(primaryArchetype);
  const radar = parseRadar(radarData);
  const patterns = behaviorPatterns.slice(0, 5);
  const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.active;

  return (
    <div
      className={`rounded-lg border border-border border-l-4 ${theme.border} bg-surface overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-elevated">
        <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-text-muted/70">
          ψ archetype_profile
        </p>
        <span
          className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest ${statusStyle}`}
        >
          {status}
        </span>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Primary archetype */}
        {primaryArchetype && (
          <div>
            <p className="font-mono text-[9px] text-text-muted/50 uppercase tracking-widest mb-1">
              Primary
            </p>
            <p className={`font-display text-base font-bold leading-snug ${theme.text}`}>
              {primaryArchetype}
            </p>
          </div>
        )}

        {/* Radar chart */}
        {radar && (
          <div className="space-y-1">
            <p className="font-mono text-[9px] text-text-muted/50 uppercase tracking-widest">
              Behavioral profile
            </p>
            <RadarChart data={radar} dot={theme.dot} />
            {/* Score breakdown — compact */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1">
              {AXES.map((a) => {
                const val = radar[a.key] ?? 0;
                const pct = (val / 10) * 100;
                return (
                  <div key={a.key} className="flex items-center gap-1.5">
                    <span className="font-mono text-[8px] text-text-muted/40 w-8 shrink-0">{a.label}</span>
                    <div className="flex-1 h-0.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: theme.dot, opacity: 0.7 }}
                      />
                    </div>
                    <span className="font-mono text-[8px] text-text-muted/50 w-4 text-right tabular-nums">
                      {val.toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Behavioral patterns */}
        {patterns.length > 0 && (
          <div className="space-y-1.5">
            <p className="font-mono text-[9px] text-text-muted/50 uppercase tracking-widest">
              Behavioral patterns
            </p>
            <ul className="space-y-1">
              {patterns.map((p, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className={`mt-0.5 shrink-0 font-mono text-[9px] ${theme.text} opacity-60`}>
                    ·
                  </span>
                  <span className="font-mono text-[10px] text-text-muted leading-snug">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Link */}
        <Link
          href={`/psychenomicon/entities/${entitySlug}`}
          className={`inline-flex items-center gap-1.5 font-mono text-[10px] ${theme.text} hover:opacity-80 transition-opacity`}
        >
          Full Psychenomicon entry
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
