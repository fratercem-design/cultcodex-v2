"use client";

import { useState } from "react";
import Link from "next/link";

export interface NetworkNode {
  id: string;
  slug: string;
  name: string;
  primaryArchetype: string | null;
  status: string;
  appearanceCount: number;
}

export interface NetworkEdge {
  sourceId: string;
  targetId: string;
  strength: number; // number of shared chapters
}

interface Props {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  width?: number;
  height?: number;
}

const ARCHETYPE_COLORS: Record<string, string> = {
  "The Mirror": "#a78bfa",
  "The Gravity Point": "#a78bfa",
  "The Siren Trickster": "#f472b6",
  "The Chaos Catalyst": "#f87171",
  "The Echo Jester": "#fb923c",
  "The Flame of Judgment": "#fbbf24",
  "The Contested One": "#6ee7b7",
  "The Fractured Ally": "#94a3b8",
  "The Silent Observer": "#64748b",
  "The Seekers": "#67e8f9",
  "The Loyalist": "#818cf8",
};

function nodeColor(archetype: string | null): string {
  if (!archetype) return "#475569";
  for (const [key, color] of Object.entries(ARCHETYPE_COLORS)) {
    if (archetype.includes(key.replace("The ", ""))) return color;
  }
  return ARCHETYPE_COLORS[archetype] ?? "#a78bfa";
}

function computeLayout(nodes: NetworkNode[], width: number, height: number) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.35;

  return nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    return {
      ...node,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      r: 6 + Math.min(node.appearanceCount * 3, 16),
      color: nodeColor(node.primaryArchetype),
    };
  });
}

export function EntityNetworkGraph({ nodes, edges, width = 600, height = 400 }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const positioned = computeLayout(nodes, width, height);
  const posMap = Object.fromEntries(positioned.map((n) => [n.id, n]));

  const maxStrength = Math.max(...edges.map((e) => e.strength), 1);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border bg-surface">
      <p className="absolute top-3 left-4 font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted z-10">
        /// entity_network
      </p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {/* Edges */}
        {edges.map((edge, i) => {
          const src = posMap[edge.sourceId];
          const tgt = posMap[edge.targetId];
          if (!src || !tgt) return null;
          const opacity = 0.08 + (edge.strength / maxStrength) * 0.35;
          const strokeWidth = 0.5 + (edge.strength / maxStrength) * 2;
          const isHighlighted =
            hovered === edge.sourceId || hovered === edge.targetId;
          return (
            <line
              key={i}
              x1={src.x} y1={src.y}
              x2={tgt.x} y2={tgt.y}
              stroke={isHighlighted ? "#a78bfa" : "rgba(255,255,255,0.3)"}
              strokeWidth={isHighlighted ? strokeWidth + 1 : strokeWidth}
              strokeOpacity={isHighlighted ? 0.6 : opacity}
            />
          );
        })}

        {/* Nodes */}
        {positioned.map((node) => {
          const isActive = hovered === node.id;
          return (
            <a
              key={node.id}
              href={`/psychenomicon/entities/${node.slug}`}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Glow ring when hovered */}
              {isActive && (
                <circle
                  cx={node.x} cy={node.y}
                  r={node.r + 6}
                  fill="none"
                  stroke={node.color}
                  strokeWidth={1}
                  strokeOpacity={0.4}
                />
              )}
              <circle
                cx={node.x} cy={node.y}
                r={node.r}
                fill={node.color}
                fillOpacity={isActive ? 0.9 : 0.6}
                stroke={node.color}
                strokeWidth={1}
                strokeOpacity={0.8}
                style={{ transition: "all 0.15s ease" }}
              />
              {/* Label */}
              <text
                x={node.x}
                y={node.y + node.r + 12}
                textAnchor="middle"
                fill={isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)"}
                fontSize={isActive ? 9 : 8}
                fontFamily="monospace"
                style={{ transition: "font-size 0.1s", pointerEvents: "none" }}
              >
                {node.name.length > 14 ? node.name.slice(0, 13) + "…" : node.name}
              </text>
              {/* Archetype label on hover */}
              {isActive && node.primaryArchetype && (
                <text
                  x={node.x}
                  y={node.y + node.r + 22}
                  textAnchor="middle"
                  fill={node.color}
                  fontSize={7}
                  fontFamily="monospace"
                  style={{ pointerEvents: "none" }}
                >
                  {node.primaryArchetype}
                </text>
              )}
              {/* Invisible larger hit target */}
              <circle
                cx={node.x} cy={node.y}
                r={node.r + 8}
                fill="transparent"
              />
            </a>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <span className="font-mono text-[8px] text-text-muted/50">node size = chapter appearances</span>
        <span className="font-mono text-[8px] text-text-muted/50">edge weight = shared chapters</span>
      </div>

      {/* Hovered entity quick-link */}
      {hovered && (() => {
        const node = posMap[hovered];
        if (!node) return null;
        return (
          <div className="absolute bottom-3 left-3">
            <Link
              href={`/psychenomicon/entities/${node.slug}`}
              className="inline-flex items-center gap-1.5 rounded border border-accent-violet/30 bg-void/90 px-3 py-1.5 font-mono text-[10px] text-accent-violet hover:bg-accent-violet/10 transition-colors"
            >
              {node.name} <span className="opacity-60">→</span>
            </Link>
          </div>
        );
      })()}
    </div>
  );
}
