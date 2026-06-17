"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import type { GraphNode, GraphEdge } from "@/lib/queries/graph";

// ── SVG canvas dimensions ─────────────────────────────────────────────────────
const W = 1000;
const H = 560;
const PAD = 70;

// ── Colors ────────────────────────────────────────────────────────────────────
const ARCHETYPE_COLORS: Record<string, string> = {
  Mirror: "#a78bfa",
  Gravity: "#a78bfa",
  Siren: "#f472b6",
  Chaos: "#f87171",
  Echo: "#fb923c",
  Flame: "#fbbf24",
  Contested: "#6ee7b7",
  Fractured: "#94a3b8",
  Silent: "#64748b",
  Seekers: "#67e8f9",
  Loyalist: "#818cf8",
};

const TYPE_COLORS: Record<string, string> = {
  host: "#D4AF37",
  recurring: "#a78bfa",
  guest: "#5DB7D8",
  mentioned: "#475569",
};

function nodeColor(node: GraphNode): string {
  if (node.archetype) {
    for (const [key, color] of Object.entries(ARCHETYPE_COLORS)) {
      if (node.archetype.includes(key)) return color;
    }
  }
  return TYPE_COLORS[node.personType] ?? "#475569";
}

function nodeRadius(appearances: number): number {
  return 7 + Math.min(Math.log(appearances + 1) * 4.5, 16);
}

function clipId(id: string): string {
  return `rg-${id.replace(/[^a-z0-9]/gi, "").slice(0, 20)}`;
}

// ── Seeded RNG (LCG) ─────────────────────────────────────────────────────────
function makeRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = Math.imul(s, 1664525) + 1013904223;
    return (s >>> 0) / 0x100000000;
  };
}

// ── Force simulation (Fruchterman-Reingold) ───────────────────────────────────
interface SimNode {
  id: string;
  x: number;
  y: number;
}

function runSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  iterations = 300
): Map<string, { x: number; y: number }> {
  if (nodes.length === 0) return new Map();

  const rng = makeRng(nodes.length * 31 + edges.length * 17);
  const k = Math.sqrt((W * H) / Math.max(nodes.length, 1));

  // Initialize on a jittered circle
  const sim: SimNode[] = nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    const r = Math.min(W, H) * 0.28;
    return {
      id: n.id,
      x: W / 2 + r * Math.cos(angle) + (rng() - 0.5) * 80,
      y: H / 2 + r * Math.sin(angle) + (rng() - 0.5) * 80,
    };
  });

  const idxOf = new Map(sim.map((n, i) => [n.id, i]));

  for (let iter = 0; iter < iterations; iter++) {
    const temp = k * (1 - iter / iterations) * 0.9;
    const dx: number[] = new Array(sim.length).fill(0);
    const dy: number[] = new Array(sim.length).fill(0);

    // Repulsion between all pairs
    for (let i = 0; i < sim.length; i++) {
      for (let j = i + 1; j < sim.length; j++) {
        const ex = sim[i].x - sim[j].x;
        const ey = sim[i].y - sim[j].y;
        const dist = Math.sqrt(ex * ex + ey * ey) || 0.01;
        const f = (k * k) / dist;
        const fx = (ex / dist) * f;
        const fy = (ey / dist) * f;
        dx[i] += fx; dy[i] += fy;
        dx[j] -= fx; dy[j] -= fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const si = idxOf.get(edge.sourceId);
      const ti = idxOf.get(edge.targetId);
      if (si === undefined || ti === undefined) continue;
      const ex = sim[si].x - sim[ti].x;
      const ey = sim[si].y - sim[ti].y;
      const dist = Math.sqrt(ex * ex + ey * ey) || 0.01;
      const f = (dist * dist) / k;
      const fx = (ex / dist) * f;
      const fy = (ey / dist) * f;
      dx[si] -= fx; dy[si] -= fy;
      dx[ti] += fx; dy[ti] += fy;
    }

    // Apply displacement with temperature cap
    for (let i = 0; i < sim.length; i++) {
      const dLen = Math.sqrt(dx[i] ** 2 + dy[i] ** 2) || 0.01;
      const scale = Math.min(dLen, temp) / dLen;
      sim[i].x = Math.max(PAD, Math.min(W - PAD, sim[i].x + dx[i] * scale));
      sim[i].y = Math.max(PAD, Math.min(H - PAD, sim[i].y + dy[i] * scale));
    }
  }

  return new Map(sim.map((n) => [n.id, { x: n.x, y: n.y }]));
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function RelationshipGraph({ nodes, edges }: Props) {
  const maxPossibleWeight = Math.max(...edges.map((e) => e.weight), 1);

  const [minWeight, setMinWeight] = useState(2);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltipXpct, setTooltipXpct] = useState(50);
  const [tooltipYpct, setTooltipYpct] = useState(50);
  const [showAvatars, setShowAvatars] = useState(true);

  const filteredEdges = useMemo(
    () => edges.filter((e) => e.weight >= minWeight),
    [edges, minWeight]
  );

  const connectedIds = useMemo(() => {
    const s = new Set<string>();
    filteredEdges.forEach((e) => { s.add(e.sourceId); s.add(e.targetId); });
    return s;
  }, [filteredEdges]);

  const visibleNodes = useMemo(
    () => nodes.filter((n) => connectedIds.has(n.id)),
    [nodes, connectedIds]
  );

  const positions = useMemo(
    () => runSimulation(visibleNodes, filteredEdges),
    [visibleNodes, filteredEdges]
  );

  const selectedNeighbors = useMemo(() => {
    if (!selected) return null;
    const s = new Set<string>();
    filteredEdges.forEach((e) => {
      if (e.sourceId === selected) s.add(e.targetId);
      if (e.targetId === selected) s.add(e.sourceId);
    });
    return s;
  }, [selected, filteredEdges]);

  const maxWeight = Math.max(...filteredEdges.map((e) => e.weight), 1);

  const hoveredNode = hovered ? visibleNodes.find((n) => n.id === hovered) ?? null : null;
  const selectedNode = selected ? visibleNodes.find((n) => n.id === selected) ?? null : null;

  const handleNodeClick = useCallback((id: string, ev: React.MouseEvent) => {
    ev.stopPropagation();
    setSelected((prev) => (prev === id ? null : id));
  }, []);

  function handleNodeEnter(id: string, svgX: number, svgY: number) {
    setHovered(id);
    setTooltipXpct((svgX / W) * 100);
    setTooltipYpct((svgY / H) * 100);
  }

  function isNodeDimmed(id: string) {
    if (!selected) return false;
    return id !== selected && !selectedNeighbors?.has(id);
  }

  function isEdgeDimmed(e: GraphEdge) {
    if (!selected) return false;
    return e.sourceId !== selected && e.targetId !== selected;
  }

  return (
    <div className="space-y-3">
      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-2.5">
          <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted whitespace-nowrap">
            Min shared eps
          </label>
          <input
            type="range"
            min={2}
            max={Math.min(20, maxPossibleWeight)}
            value={minWeight}
            onChange={(e) => {
              setMinWeight(Number(e.target.value));
              setSelected(null);
            }}
            className="w-24 accent-accent-violet"
          />
          <span className="font-mono text-xs font-bold text-accent-violet w-5 tabular-nums">
            {minWeight}
          </span>
        </div>

        <button
          onClick={() => setShowAvatars((v) => !v)}
          className={`font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded border transition-colors ${
            showAvatars
              ? "border-accent-violet/50 text-accent-violet bg-accent-violet/10"
              : "border-border text-text-muted hover:border-border/60"
          }`}
        >
          Avatars {showAvatars ? "on" : "off"}
        </button>

        {selected && (
          <button
            onClick={() => setSelected(null)}
            className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded border border-accent-gold/30 text-accent-gold hover:bg-accent-gold/10 transition-colors"
          >
            Clear focus ×
          </button>
        )}

        <span className="ml-auto font-mono text-[10px] text-text-muted/50 tabular-nums">
          {visibleNodes.length} people · {filteredEdges.length} connections
        </span>
      </div>

      {/* ── Graph ───────────────────────────────────────────────────────── */}
      <div
        className="relative w-full rounded-xl border border-border bg-void overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(110,75,174,0.07) 0%, transparent 70%)",
        }}
      >
        <p className="absolute top-3 left-4 z-10 font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted/60 select-none">
          {"/// relationship_map"}
          {selected && selectedNode ? ` — ${selectedNode.name}` : ""}
        </p>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ aspectRatio: `${W} / ${H}` }}
          onClick={() => setSelected(null)}
        >
          <defs>
            {showAvatars &&
              visibleNodes.map((node) => {
                const pos = positions.get(node.id);
                if (!node.avatarUrl || !pos) return null;
                return (
                  <clipPath key={node.id} id={clipId(node.id)}>
                    <circle cx={pos.x} cy={pos.y} r={nodeRadius(node.appearances)} />
                  </clipPath>
                );
              })}
          </defs>

          {/* Edges */}
          {filteredEdges.map((edge, i) => {
            const src = positions.get(edge.sourceId);
            const tgt = positions.get(edge.targetId);
            if (!src || !tgt) return null;
            const dimmed = isEdgeDimmed(edge);
            const active =
              edge.sourceId === selected || edge.targetId === selected;
            const baseOpacity = 0.05 + (edge.weight / maxWeight) * 0.38;
            return (
              <line
                key={i}
                x1={src.x} y1={src.y}
                x2={tgt.x} y2={tgt.y}
                stroke={active ? "#a78bfa" : "rgba(255,255,255,0.5)"}
                strokeWidth={active ? 1.5 + (edge.weight / maxWeight) * 1.5 : 0.5 + (edge.weight / maxWeight) * 1.8}
                strokeOpacity={dimmed ? 0.04 : active ? 0.75 : baseOpacity}
              />
            );
          })}

          {/* Nodes */}
          {visibleNodes.map((node) => {
            const pos = positions.get(node.id);
            if (!pos) return null;
            const r = nodeRadius(node.appearances);
            const color = nodeColor(node);
            const dimmed = isNodeDimmed(node.id);
            const isHov = hovered === node.id;
            const isSel = selected === node.id;

            return (
              <g
                key={node.id}
                onClick={(e) => handleNodeClick(node.id, e)}
                onMouseEnter={() => handleNodeEnter(node.id, pos.x, pos.y)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  cursor: "pointer",
                  opacity: dimmed ? 0.18 : 1,
                  transition: "opacity 0.2s ease",
                }}
              >
                {/* Selection pulse ring */}
                {isSel && (
                  <circle
                    cx={pos.x} cy={pos.y} r={r + 9}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.5}
                    strokeOpacity={0.5}
                  />
                )}
                {/* Hover ring */}
                {isHov && !isSel && (
                  <circle
                    cx={pos.x} cy={pos.y} r={r + 5}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    strokeOpacity={0.35}
                  />
                )}
                {/* Base fill */}
                <circle
                  cx={pos.x} cy={pos.y} r={r}
                  fill={color}
                  fillOpacity={
                    node.avatarUrl && showAvatars
                      ? 0.2
                      : isSel ? 1 : isHov ? 0.88 : 0.65
                  }
                  stroke={color}
                  strokeWidth={isSel ? 2 : 1}
                  strokeOpacity={0.9}
                />
                {/* Avatar */}
                {node.avatarUrl && showAvatars && (
                  <image
                    href={node.avatarUrl}
                    x={pos.x - r} y={pos.y - r}
                    width={r * 2} height={r * 2}
                    clipPath={`url(#${clipId(node.id)})`}
                    preserveAspectRatio="xMidYMid slice"
                    style={{
                      opacity: dimmed ? 0.2 : isHov || isSel ? 1 : 0.78,
                      transition: "opacity 0.15s",
                    }}
                  />
                )}
                {/* Name label */}
                <text
                  x={pos.x} y={pos.y + r + 12}
                  textAnchor="middle"
                  fill={isSel || isHov ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.52)"}
                  fontSize={isSel ? 10 : 8}
                  fontFamily="monospace"
                  style={{ pointerEvents: "none", transition: "font-size 0.1s" }}
                >
                  {node.name.length > 17 ? node.name.slice(0, 16) + "…" : node.name}
                </text>
                {/* Archetype on selected */}
                {isSel && node.archetype && (
                  <text
                    x={pos.x} y={pos.y + r + 23}
                    textAnchor="middle"
                    fill={color}
                    fontSize={7}
                    fontFamily="monospace"
                    style={{ pointerEvents: "none" }}
                  >
                    {node.archetype}
                  </text>
                )}
                {/* Transparent hit target */}
                <circle cx={pos.x} cy={pos.y} r={r + 8} fill="transparent" />
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredNode && !selected && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: `${Math.min(tooltipXpct, 72)}%`,
              top: `${tooltipYpct}%`,
              transform: "translate(12px, -50%)",
            }}
          >
            <div className="rounded-lg border border-accent-violet/30 bg-void/95 backdrop-blur-sm px-3 py-2.5 space-y-1 min-w-[148px]">
              <p className="font-display text-xs font-bold text-text-primary leading-snug">
                {hoveredNode.name}
              </p>
              {hoveredNode.archetype && (
                <p className="font-mono text-[9px] text-accent-violet">{hoveredNode.archetype}</p>
              )}
              <p className="font-mono text-[9px] text-text-muted">
                {hoveredNode.appearances} appearances
              </p>
              <p className="font-mono text-[9px] text-text-muted/50 uppercase tracking-widest">
                click to focus
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {visibleNodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-mono text-sm text-text-muted/50">
              No connections at this threshold. Lower the minimum.
            </p>
          </div>
        )}
      </div>

      {/* ── Selected node detail ─────────────────────────────────────────── */}
      {selectedNode && (
        <div className="rounded-lg border border-accent-violet/20 bg-surface px-5 py-4 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-violet/60">
              {"/// focused"}
            </p>
            <p className="font-display text-base font-bold text-text-primary">
              {selectedNode.name}
            </p>
            {selectedNode.archetype && (
              <p className="font-mono text-[10px] text-accent-violet">{selectedNode.archetype}</p>
            )}
            <p className="font-mono text-[10px] text-text-muted">
              {selectedNode.appearances} appearances ·{" "}
              {selectedNeighbors?.size ?? 0} direct connections visible
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/people/${selectedNode.slug}`}
              className="inline-flex items-center gap-1 rounded border border-accent-gold/30 bg-surface px-3 py-1.5 font-mono text-[10px] text-accent-gold hover:bg-accent-gold/10 transition-colors"
            >
              View profile →
            </Link>
          </div>
        </div>
      )}

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className="block h-2.5 w-2.5 rounded-full border"
              style={{ backgroundColor: color, borderColor: color }}
            />
            <span className="font-mono text-[9px] capitalize text-text-muted/55">{type}</span>
          </div>
        ))}
        <span className="ml-auto font-mono text-[9px] text-text-muted/35">
          size = appearances · weight = shared episodes
        </span>
      </div>
    </div>
  );
}
