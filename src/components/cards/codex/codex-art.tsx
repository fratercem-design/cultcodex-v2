"use client";

/**
 * Generative card art for Codex cards. Deterministic per slug: the same card
 * always paints the same scene. Layers, back to front:
 *   gradient ground → nebula → field (rays/rings/grid/stars/waves) →
 *   astrolabe geometry → rarity effects → motif (bloom + crisp) → particles →
 *   vignette.
 * `silhouette` renders a sealed card: the motif as a black shape with a faint
 * rim, so you can tell what you're hunting without seeing it.
 */
import { useId, type ReactElement } from "react";
import type { Rarity } from "@/generated/prisma/client";
import { RARITY_ORDER } from "@/lib/cards/rarity";
import { hashSlug } from "@/lib/cards/codex/catalog";
import type { Motif, Palette } from "@/lib/cards/codex/types";

interface Colors { bg0: string; bg1: string; g: string; a: string; h: string; d: string }

export const PALETTES: Record<Palette, Colors> = {
  abyss:   { bg0: "#020b12", bg1: "#0a2a3a", g: "#1fd1ff", a: "#7fe9ff", h: "#e8fbff", d: "#031620" },
  ember:   { bg0: "#120403", bg1: "#3a1006", g: "#ff6a1f", a: "#ffb057", h: "#fff1d6", d: "#1c0703" },
  violet:  { bg0: "#08040f", bg1: "#2a1152", g: "#a45bff", a: "#d4a8ff", h: "#f5ebff", d: "#12081f" },
  gold:    { bg0: "#0c0802", bg1: "#33240a", g: "#f6c453", a: "#ffe39a", h: "#fffaf0", d: "#1a1204" },
  blood:   { bg0: "#0e0103", bg1: "#3d0610", g: "#ff2e4d", a: "#ff7a8c", h: "#ffe3e7", d: "#1a0206" },
  verdant: { bg0: "#020c06", bg1: "#0b3320", g: "#3ee895", a: "#9dffc9", h: "#effff6", d: "#04170c" },
  frost:   { bg0: "#040912", bg1: "#16304a", g: "#8fd3ff", a: "#d6f1ff", h: "#ffffff", d: "#08121e" },
  rose:    { bg0: "#10040c", bg1: "#3b1030", g: "#ff5fb0", a: "#ffb3d9", h: "#fff0f7", d: "#1c0716" },
  void:    { bg0: "#030304", bg1: "#1a1b20", g: "#aab4ad", a: "#e6ebe7", h: "#ffffff", d: "#0a0a0c" },
  toxic:   { bg0: "#040a01", bg1: "#1c3306", g: "#b6ff2e", a: "#ddff8f", h: "#f8ffe6", d: "#0a1402" },
  dusk:    { bg0: "#0b0410", bg1: "#3a1640", g: "#ff8a4c", a: "#ffc08f", h: "#fff0e3", d: "#170a1c" },
  sea:     { bg0: "#010a0e", bg1: "#06303a", g: "#2ee6c8", a: "#9ff5e6", h: "#ecfffb", d: "#031a1e" },
};

const W = 300;
const H = 260;
const CX = 150;
const CY = 128;

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 10_000) / 10_000;
  };
}

type Draw = (p: Colors, r: () => number) => ReactElement;
const SW = 2.2;

// ── Motifs: drawn in a ±64 box around the origin ─────────────────────────────
const MOTIFS: Record<Motif, Draw> = {
  antenna: (p) => (
    <g fill="none" stroke={p.a} strokeWidth={SW} strokeLinecap="round">
      <path d="M0 -44 L-30 62 M0 -44 L30 62 M-20 26 L20 26 M-12 -4 L12 -4 M-25 46 L25 46 M-20 26 L12 -4 M20 26 L-12 -4 M-25 46 L20 26 M25 46 L-20 26" />
      {[1, 2, 3].map((i) => (
        <path key={i} d={`M ${-8 - i * 10} ${-50 - i * 5} A ${10 + i * 11} ${10 + i * 11} 0 0 1 ${8 + i * 10} ${-50 - i * 5}`} stroke={p.h} opacity={1 - i * 0.22} />
      ))}
      <circle cy={-48} r={4.5} fill={p.h} stroke="none" />
    </g>
  ),
  radio: (p) => (
    <g strokeWidth={SW} stroke={p.a}>
      <path d="M28 -26 L56 -66" strokeLinecap="round" />
      <circle cx={56} cy={-66} r={3} fill={p.h} stroke="none" />
      <rect x={-54} y={-26} width={108} height={64} rx={10} fill={p.d} />
      {[6, 11, 16, 21].map((r) => <circle key={r} cx={-20} cy={6} r={r} fill="none" opacity={0.4 + r / 40} />)}
      <circle cx={26} cy={-2} r={10} fill="none" stroke={p.h} />
      <path d="M26 -2 L32 -9" stroke={p.h} strokeLinecap="round" />
      <path d="M12 22 H44" strokeDasharray="3 3" />
      <circle cx={16} cy={30} r={2.5} fill={p.g} stroke="none" /><circle cx={40} cy={30} r={2.5} fill={p.g} stroke="none" />
    </g>
  ),
  bars: (p, r) => (
    <g>
      {Array.from({ length: 11 }, (_, i) => {
        const w = 40 + r() * 90;
        const x = -w / 2 + (r() - 0.5) * 40;
        const y = -60 + i * 11;
        return (
          <g key={i}>
            <rect x={x - 3} y={y} width={w} height={6} fill={p.g} opacity={0.55} />
            <rect x={x + 3} y={y} width={w} height={6} fill="#35f4ff" opacity={0.35} />
            <rect x={x} y={y} width={w} height={6} fill={i % 3 === 0 ? p.h : p.a} opacity={0.9} />
          </g>
        );
      })}
    </g>
  ),
  candle: (p) => (
    <g strokeWidth={SW}>
      <ellipse cx={0} cy={56} rx={34} ry={8} fill={p.d} stroke={p.a} />
      <path d="M-14 -8 L-14 52 L14 52 L14 -8 C8 -4 6 6 2 -2 C -2 -8 -8 -2 -14 -8 Z" fill={p.d} stroke={p.a} />
      <path d="M0 -8 L0 -18" stroke={p.h} />
      <path d="M0 -62 C12 -44 10 -30 0 -20 C-10 -30 -12 -44 0 -62 Z" fill={p.g} />
      <path d="M0 -48 C6 -38 5 -30 0 -24 C-5 -30 -6 -38 0 -48 Z" fill={p.h} />
    </g>
  ),
  moth: (p) => {
    const wing = (
      <g>
        <path d="M4 -10 C28 -58 76 -48 66 -10 C60 12 26 8 4 0 Z" fill={p.d} stroke={p.a} strokeWidth={SW} />
        <path d="M4 4 C32 10 56 32 40 54 C24 64 8 38 4 14 Z" fill={p.d} stroke={p.a} strokeWidth={SW} />
        <circle cx={40} cy={-18} r={9} fill="none" stroke={p.g} strokeWidth={SW} />
        <circle cx={40} cy={-18} r={3.5} fill={p.h} />
        <path d="M10 -6 C28 -26 44 -32 58 -28 M10 8 C24 18 34 28 36 44" fill="none" stroke={p.a} opacity={0.5} />
      </g>
    );
    return (
      <g>
        {wing}
        <g transform="scale(-1 1)">{wing}</g>
        <ellipse rx={5} ry={28} cy={6} fill={p.a} />
        <path d="M-2 -20 C-10 -40 -20 -50 -30 -52 M2 -20 C10 -40 20 -50 30 -52" fill="none" stroke={p.a} strokeWidth={1.6} />
      </g>
    );
  },
  ring: (p, r) => (
    <g>
      <circle r={56} fill="none" stroke={p.h} strokeWidth={5} strokeDasharray="1.5 3.5" strokeLinecap="round" />
      <circle r={46} fill="none" stroke={p.a} strokeWidth={1} opacity={0.6} />
      {Array.from({ length: 24 }, (_, i) => {
        const t = (i / 24) * Math.PI * 2;
        return <rect key={i} x={Math.cos(t) * (60 + r() * 6) - 1.5} y={Math.sin(t) * (60 + r() * 6) - 1.5} width={3} height={3} fill={p.a} opacity={0.4 + r() * 0.6} transform={`rotate(${r() * 90} ${Math.cos(t) * 62} ${Math.sin(t) * 62})`} />;
      })}
      <path d="M0 -34 L29 17 L-29 17 Z M0 22 L-29 -12 L29 -12 Z" fill="none" stroke={p.g} strokeWidth={SW} />
      <circle r={5} fill={p.h} />
    </g>
  ),
  key: (p) => (
    <g transform="rotate(-24)" strokeWidth={SW} stroke={p.a}>
      <circle cy={-40} r={20} fill={p.d} />
      <path d="M0 -52 C8 -48 8 -32 0 -28 C-8 -32 -8 -48 0 -52 Z M-12 -40 C-8 -48 8 -48 12 -40 C8 -32 -8 -32 -12 -40 Z" fill="none" stroke={p.g} />
      <path d="M0 -20 L0 58 M0 36 H16 V44 M0 50 H22 V58 H6" fill="none" strokeLinecap="round" />
      <path d="M0 -4 C4 4 -4 12 0 18" fill="none" stroke={p.h} opacity={0.6} />
    </g>
  ),
  moon: (p, r) => (
    <g>
      <path d="M 6 -54 A 54 54 0 1 0 6 54 A 40 54 0 1 1 6 -54 Z" fill={p.a} />
      <path d="M 6 -54 A 54 54 0 1 0 6 54 A 40 54 0 1 1 6 -54 Z" fill="none" stroke={p.h} strokeWidth={1.2} />
      {Array.from({ length: 5 }, (_, i) => <circle key={i} cx={-40 + r() * 24} cy={-30 + i * 14} r={2 + r() * 4} fill={p.d} opacity={0.35} />)}
    </g>
  ),
  eye: (p) => (
    <g strokeWidth={SW}>
      {Array.from({ length: 9 }, (_, i) => {
        const t = Math.PI + (i + 1) * (Math.PI / 10);
        return <path key={i} d={`M ${Math.cos(t) * 52} ${Math.sin(t) * 30 - 4} L ${Math.cos(t) * 66} ${Math.sin(t) * 44 - 8}`} stroke={p.a} strokeLinecap="round" />;
      })}
      <path d="M-64 0 Q0 -46 64 0 Q0 46 -64 0 Z" fill={p.d} stroke={p.a} />
      <circle r={22} fill={p.g} />
      <circle r={22} fill="none" stroke={p.h} strokeWidth={1} strokeDasharray="2 3" />
      <circle r={9} fill="#000" />
      <circle cx={-7} cy={-8} r={4} fill={p.h} />
    </g>
  ),
  spiral: (p) => {
    const pts: string[] = [];
    for (let t = 0; t < Math.PI * 7; t += 0.12) {
      const rad = 2 + t * 2.9;
      pts.push(`${(Math.cos(t) * rad).toFixed(1)} ${(Math.sin(t) * rad).toFixed(1)}`);
    }
    return (
      <g fill="none" strokeLinecap="round">
        <path d={`M ${pts.join(" L ")}`} stroke={p.a} strokeWidth={SW + 0.8} />
        <path d={`M ${pts.join(" L ")}`} stroke={p.h} strokeWidth={0.8} transform="rotate(12)" opacity={0.6} />
        <circle r={4} fill={p.h} />
      </g>
    );
  },
  wave: (p, r) => (
    <g strokeLinecap="round">
      {Array.from({ length: 23 }, (_, i) => {
        const x = -66 + i * 6;
        const env = Math.sin((i / 22) * Math.PI);
        const h = 6 + env * (30 + r() * 34);
        return <path key={i} d={`M ${x} ${-h} V ${h}`} stroke={i % 4 === 0 ? p.h : p.a} strokeWidth={3} />;
      })}
      <path d="M-70 0 H70" stroke={p.g} strokeWidth={1} opacity={0.7} />
    </g>
  ),
  bird: (p) => (
    <g strokeWidth={SW}>
      <path d="M-58 14 C-36 -4 -12 -20 10 -22 C22 -24 30 -32 40 -30 L58 -24 L40 -18 C38 -6 30 8 14 16 C30 24 46 38 54 54 C32 44 10 34 -8 32 C-26 30 -44 24 -58 14 Z" fill={p.d} stroke={p.a} />
      <path d="M-40 16 C-20 6 0 4 14 16 M-30 24 C-12 18 4 20 20 26" fill="none" stroke={p.a} opacity={0.5} />
      <circle cx={38} cy={-25} r={3} fill={p.h} />
      <path d="M-20 42 L-26 62 M-8 44 L-10 62" stroke={p.a} strokeLinecap="round" />
    </g>
  ),
  mirror: (p) => (
    <g strokeWidth={SW}>
      <rect x={-7} y={36} width={14} height={34} rx={4} fill={p.d} stroke={p.a} />
      <ellipse cy={-12} rx={40} ry={52} fill={p.d} stroke={p.a} strokeWidth={5} />
      <ellipse cy={-12} rx={32} ry={44} fill={p.g} opacity={0.22} />
      <path d="M-8 -30 Q0 -38 8 -30 Q0 -22 -8 -30 Z" fill={p.h} />
      <path d="M-20 -48 Q-10 -56 -2 -54" stroke={p.h} fill="none" opacity={0.7} />
      {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={Math.cos((i / 6) * Math.PI * 2) * 46} cy={-12 + Math.sin((i / 6) * Math.PI * 2) * 58} r={2.5} fill={p.h} />)}
    </g>
  ),
  hand: (p) => (
    <g strokeWidth={SW}>
      <path d="M-30 52 L-34 -8 Q-34 -18 -28 -18 Q-22 -18 -22 -8 L-22 -30 Q-22 -40 -14 -40 Q-6 -40 -6 -30 L-6 -46 Q-6 -54 0 -54 Q6 -54 6 -46 L6 -30 Q6 -40 14 -40 Q22 -40 22 -30 L22 -8 Q22 -18 28 -18 Q34 -18 34 -8 L30 52 Q0 66 -30 52 Z" fill={p.d} stroke={p.a} />
      <path d="M-16 20 Q0 8 16 20 Q0 32 -16 20 Z" fill="none" stroke={p.g} />
      <circle cy={20} r={4} fill={p.h} />
      <path d="M-18 42 Q0 50 18 42" fill="none" stroke={p.a} opacity={0.5} />
    </g>
  ),
  tower: (p) => (
    <g stroke={p.a} strokeWidth={1.8} fill="none" strokeLinecap="round">
      <path d="M-6 -50 L-30 64 M6 -50 L30 64" strokeWidth={SW} />
      {[-30, -8, 14, 36].map((y, i) => {
        const w1 = 6 + ((y + 50) / 114) * 24;
        const w2 = 6 + ((y + 72) / 114) * 24;
        return <path key={i} d={`M ${-w1} ${y} L ${w2} ${y + 22} M ${w1} ${y} L ${-w2} ${y + 22} M ${-w1} ${y} H ${w1}`} opacity={0.8} />;
      })}
      {[1, 2, 3].map((i) => (
        <path key={i} d={`M ${-10 - i * 9} ${-60 + i * 2} A ${12 + i * 10} ${12 + i * 10} 0 0 1 ${10 + i * 9} ${-60 + i * 2}`} stroke={p.g} opacity={1 - i * 0.25} />
      ))}
      <circle cy={-56} r={5} fill={p.g} stroke="none" />
      <circle cy={-56} r={2} fill={p.h} stroke="none" />
    </g>
  ),
  serpent: (p) => (
    <g>
      <circle r={48} fill="none" stroke={p.d} strokeWidth={14} />
      <circle r={48} fill="none" stroke={p.a} strokeWidth={12} strokeDasharray="5 3" transform="rotate(-80)" pathLength={100} strokeDashoffset={0} />
      <circle r={48} fill="none" stroke={p.h} strokeWidth={1} opacity={0.5} />
      <path d="M-10 -58 C-4 -66 14 -64 18 -54 C20 -46 8 -40 -4 -42 Z" fill={p.a} stroke={p.h} strokeWidth={1.2} />
      <circle cx={8} cy={-54} r={2} fill="#000" />
      <path d="M-12 -46 L-22 -50" stroke={p.g} strokeWidth={2} strokeLinecap="round" />
    </g>
  ),
  hourglass: (p) => (
    <g strokeWidth={SW}>
      <rect x={-40} y={-64} width={80} height={8} rx={2} fill={p.d} stroke={p.a} />
      <rect x={-40} y={52} width={80} height={8} rx={2} fill={p.d} stroke={p.a} />
      <path d="M-32 -56 L32 -56 L4 -2 L32 52 L-32 52 L-4 -2 Z" fill={p.d} stroke={p.a} />
      <path d="M-18 -30 L18 -30 L2 -4 L-2 -4 Z" fill={p.g} opacity={0.9} />
      <path d="M-26 52 Q0 22 26 52 Z" fill={p.g} />
      <path d="M0 -2 V 40" stroke={p.h} strokeDasharray="1 4" strokeLinecap="round" />
    </g>
  ),
  chalice: (p) => (
    <g strokeWidth={SW}>
      <path d="M-38 -42 Q-38 4 0 12 Q38 4 38 -42 Z" fill={p.d} stroke={p.a} />
      <ellipse cy={-42} rx={38} ry={8} fill={p.g} stroke={p.a} />
      <path d="M-6 12 L-4 44 L-26 58 L26 58 L4 44 L6 12" fill={p.d} stroke={p.a} />
      <circle cy={-10} r={7} fill="none" stroke={p.h} />
      <circle cy={-10} r={2.5} fill={p.h} />
      <path d="M-30 -38 Q-28 -6 -8 4" fill="none" stroke={p.h} opacity={0.4} />
    </g>
  ),
  comet: (p) => (
    <g strokeLinecap="round">
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M ${-30 + i * 3} ${30 - i * 5} L ${58 - i * 2} ${-54 + i * 5}`} stroke={i === 2 ? p.h : p.a} strokeWidth={4 - Math.abs(i - 2)} opacity={1 - Math.abs(i - 2) * 0.3} />
      ))}
      <circle cx={-32} cy={34} r={16} fill={p.g} opacity={0.5} />
      <circle cx={-32} cy={34} r={9} fill={p.h} />
    </g>
  ),
  lotus: (p) => {
    const petal = "M0 0 C16 -22 16 -50 0 -66 C-16 -50 -16 -22 0 0 Z";
    return (
      <g strokeWidth={SW} transform="translate(0 28)">
        {[-70, -35, 35, 70].map((a) => <path key={a} d={petal} transform={`rotate(${a}) scale(0.9)`} fill={p.d} stroke={p.a} />)}
        {[-20, 20].map((a) => <path key={a} d={petal} transform={`rotate(${a})`} fill={p.d} stroke={p.a} />)}
        <path d={petal} fill={p.g} stroke={p.h} transform="scale(0.9 1.05)" />
        <path d="M-60 8 Q-30 0 0 8 Q30 16 60 8" fill="none" stroke={p.a} opacity={0.6} />
        <circle cy={-40} r={4} fill={p.h} />
      </g>
    );
  },
  door: (p) => (
    <g strokeWidth={SW}>
      <path d="M-58 64 L-24 50 L24 50 L58 64 Z" fill={p.g} opacity={0.35} />
      <path d="M-40 52 L-40 -24 A40 40 0 0 1 40 -24 L40 52" fill="none" stroke={p.a} strokeWidth={4} />
      <path d="M-30 50 L-30 -22 A30 30 0 0 1 30 -22 L30 50 Z" fill="#000" stroke={p.a} />
      <path d="M-2 -50 L-2 50" stroke={p.g} strokeWidth={1.5} opacity={0.9} />
      <circle cx={20} cy={10} r={2.5} fill={p.h} />
      <path d="M-50 56 H50 M-54 60 H54" stroke={p.a} opacity={0.5} />
    </g>
  ),
  eyes: (p, r) => (
    <g>
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + r();
        const d = i === 0 ? 0 : 32 + r() * 22;
        const s = i === 0 ? 1.1 : 0.42 + r() * 0.3;
        return (
          <g key={i} transform={`translate(${i === 0 ? 0 : Math.cos(a) * d} ${i === 0 ? 0 : Math.sin(a) * d}) scale(${s})`}>
            <path d="M-34 0 Q0 -26 34 0 Q0 26 -34 0 Z" fill={p.d} stroke={p.a} strokeWidth={2.4} />
            <circle r={11} fill={p.g} />
            <circle r={5} fill="#000" />
            <circle cx={-3} cy={-4} r={2} fill={p.h} />
          </g>
        );
      })}
    </g>
  ),
  skull: (p) => (
    <g strokeWidth={SW}>
      {[1, 2].map((i) => <path key={i} d={`M ${40 + i * 8} ${-30 - i * 4} A ${16 + i * 8} ${16 + i * 8} 0 0 1 ${40 + i * 8} ${10 + i * 4}`} fill="none" stroke={p.g} opacity={1 - i * 0.3} />)}
      <path d="M-38 -10 C-38 -54 38 -54 38 -10 C38 8 30 14 24 20 L24 40 L-24 40 L-24 20 C-30 14 -38 8 -38 -10 Z" fill={p.d} stroke={p.a} />
      <ellipse cx={-15} cy={-4} rx={10} ry={12} fill="#000" stroke={p.a} strokeWidth={1} />
      <ellipse cx={15} cy={-4} rx={10} ry={12} fill="#000" stroke={p.a} strokeWidth={1} />
      <circle cx={-15} cy={-2} r={3} fill={p.g} /><circle cx={15} cy={-2} r={3} fill={p.g} />
      <path d="M0 10 L-5 20 L5 20 Z" fill="#000" stroke={p.a} strokeWidth={1} />
      <path d="M-16 40 V30 M-8 40 V30 M0 40 V30 M8 40 V30 M16 40 V30" stroke={p.a} strokeWidth={1.5} />
    </g>
  ),
  bell: (p) => (
    <g strokeWidth={SW}>
      {[1, 2, 3].map((i) => <ellipse key={i} cy={42} rx={40 + i * 12} ry={6 + i * 3} fill="none" stroke={p.g} opacity={0.6 - i * 0.15} />)}
      <path d="M-10 -58 A10 10 0 0 1 10 -58" fill="none" stroke={p.a} strokeWidth={3} />
      <path d="M-38 30 C-38 -10 -28 -48 0 -50 C28 -48 38 -10 38 30 Z" fill={p.d} stroke={p.a} />
      <rect x={-44} y={28} width={88} height={8} rx={3} fill={p.d} stroke={p.a} />
      <path d="M-20 -20 H20 M-26 0 H26" stroke={p.a} opacity={0.4} />
      <circle cy={46} r={7} fill={p.h} />
    </g>
  ),
  mask: (p) => (
    <g strokeWidth={SW}>
      <path d="M0 -58 C38 -58 46 -20 42 8 C38 40 16 60 0 60 C-16 60 -38 40 -42 8 C-46 -20 -38 -58 0 -58 Z" fill={p.a} opacity={0.92} stroke={p.h} />
      <path d="M-30 -6 Q-17 -18 -6 -6 Q-17 2 -30 -6 Z M30 -6 Q17 -18 6 -6 Q17 2 30 -6 Z" fill="#000" />
      <path d="M-18 -2 C-19 14 -16 26 -18 34" fill="none" stroke={p.g} strokeWidth={1.5} />
      <path d="M-10 36 Q0 40 10 36" fill="none" stroke={p.d} strokeWidth={2} />
      <path d="M0 -44 L6 -34 L0 -24 L-6 -34 Z" fill={p.g} />
    </g>
  ),
  sun: (p) => (
    <g>
      {Array.from({ length: 24 }, (_, i) => {
        const t = (i / 24) * Math.PI * 2;
        const long = i % 2 === 0;
        const r1 = 32, r2 = long ? 66 : 48, w = long ? 0.08 : 0.06;
        return <path key={i} d={`M ${Math.cos(t - w) * r1} ${Math.sin(t - w) * r1} L ${Math.cos(t) * r2} ${Math.sin(t) * r2} L ${Math.cos(t + w) * r1} ${Math.sin(t + w) * r1} Z`} fill={long ? p.a : p.g} />;
      })}
      <circle r={30} fill={p.g} />
      <circle r={24} fill={p.h} />
      <circle r={30} fill="none" stroke={p.a} strokeWidth={1.5} strokeDasharray="2 2" />
    </g>
  ),
  book: (p) => (
    <g strokeWidth={SW}>
      {[-14, 0, 14].map((x, i) => <path key={i} d={`M 0 -36 L ${x * 1.5} -80`} stroke={p.g} strokeWidth={1.2} opacity={0.6} />)}
      <path d="M0 -26 C-20 -36 -46 -36 -62 -30 L-62 34 C-46 28 -20 28 0 38 Z" fill={p.d} stroke={p.a} />
      <path d="M0 -26 C20 -36 46 -36 62 -30 L62 34 C46 28 20 28 0 38 Z" fill={p.d} stroke={p.a} />
      {[-14, -4, 6, 16].map((y) => (
        <g key={y} stroke={p.a} strokeWidth={1} opacity={0.55}>
          <path d={`M-52 ${y} C-38 ${y - 4} -20 ${y - 4} -8 ${y + 2}`} fill="none" />
          <path d={`M52 ${y} C38 ${y - 4} 20 ${y - 4} 8 ${y + 2}`} fill="none" />
        </g>
      ))}
      <path d="M0 -58 L7 -46 L0 -34 L-7 -46 Z" fill={p.h} />
    </g>
  ),
  pyramid: (p) => (
    <g strokeWidth={SW}>
      {Array.from({ length: 12 }, (_, i) => {
        const t = -Math.PI / 2 + ((i - 5.5) / 12) * Math.PI;
        return <path key={i} d={`M 0 -50 L ${Math.cos(t) * 90} ${-50 + Math.sin(t) * 90}`} stroke={p.g} strokeWidth={1} opacity={0.5} />;
      })}
      <path d="M0 -60 L22 -22 L-22 -22 Z" fill={p.g} stroke={p.h} />
      <path d="M-26 -14 L26 -14 L58 44 L-58 44 Z" fill={p.d} stroke={p.a} />
      {[2, 18, 32].map((y) => <path key={y} d={`M ${-30 - (y + 14) * 0.5} ${y} H ${30 + (y + 14) * 0.5}`} stroke={p.a} strokeWidth={1} opacity={0.4} />)}
      <path d="M-11 -42 Q0 -50 11 -42 Q0 -34 -11 -42 Z" fill={p.d} />
      <circle cy={-42} r={3} fill={p.h} />
    </g>
  ),
  flame: (p) => (
    <g>
      <path d="M0 -64 C26 -32 44 -6 30 24 C22 44 8 54 0 54 C-8 54 -22 44 -30 24 C-44 -6 -14 -26 0 -64 Z" fill={p.g} />
      <path d="M2 -34 C18 -12 26 6 18 26 C12 40 6 44 0 44 C-8 44 -18 34 -20 20 C-22 2 -6 -10 2 -34 Z" fill={p.a} />
      <path d="M0 -4 C8 8 12 18 8 28 C4 36 -4 36 -8 28 C-10 18 -4 10 0 -4 Z" fill={p.h} />
      <ellipse cy={60} rx={24} ry={4} fill={p.g} opacity={0.4} />
    </g>
  ),
  heart: (p) => (
    <g strokeWidth={SW}>
      <path d="M0 -40 C8 -52 10 -58 4 -66 C16 -58 14 -46 6 -38 Z" fill={p.h} />
      <path d="M0 46 C-40 20 -58 -10 -42 -30 C-30 -44 -8 -40 0 -24 C8 -40 30 -44 42 -30 C58 -10 40 20 0 46 Z" fill={p.d} stroke={p.a} />
      <path d="M0 34 C-28 14 -40 -6 -30 -20 C-22 -30 -8 -26 0 -14 C8 -26 22 -30 30 -20 C40 -6 28 14 0 34 Z" fill={p.g} opacity={0.75} />
      <path d="M-46 -4 L-36 -12 L-26 -2 L-14 -12 L-2 -2 L10 -12 L22 -2 L34 -12 L46 -4" fill="none" stroke={p.h} strokeWidth={1.5} />
    </g>
  ),
  star: (p) => (
    <g>
      <circle r={58} fill="none" stroke={p.a} strokeWidth={1} opacity={0.5} />
      <circle r={50} fill="none" stroke={p.a} strokeWidth={0.8} strokeDasharray="2 4" opacity={0.6} />
      {Array.from({ length: 8 }, (_, i) => {
        const t = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const len = i % 2 === 0 ? 66 : 36;
        const s = 0.28;
        return (
          <g key={i}>
            <path d={`M 0 0 L ${Math.cos(t - s) * 12} ${Math.sin(t - s) * 12} L ${Math.cos(t) * len} ${Math.sin(t) * len} Z`} fill={p.a} />
            <path d={`M 0 0 L ${Math.cos(t + s) * 12} ${Math.sin(t + s) * 12} L ${Math.cos(t) * len} ${Math.sin(t) * len} Z`} fill={p.g} />
          </g>
        );
      })}
      <circle r={5} fill={p.h} />
    </g>
  ),
  planet: (p) => (
    <g>
      <path d="M-64 18 A64 16 -18 0 1 64 -18" transform="rotate(-18)" fill="none" stroke={p.a} strokeWidth={3} opacity={0.6} />
      <circle r={34} fill={p.d} stroke={p.a} strokeWidth={SW} />
      <path d="M-30 -10 Q0 -20 30 -8 M-33 6 Q0 -2 33 8 M-26 20 Q0 14 26 22" fill="none" stroke={p.g} strokeWidth={2} opacity={0.6} />
      <path d="M-64 -18 A64 16 0 0 0 64 18" transform="rotate(-18)" fill="none" stroke={p.h} strokeWidth={3} />
      <circle cx={52} cy={-44} r={5} fill={p.h} /><circle cx={-50} cy={40} r={3} fill={p.a} />
    </g>
  ),
  tree: (p, r) => {
    const branches: ReactElement[] = [];
    const grow = (x: number, y: number, a: number, len: number, depth: number, dir: 1 | -1) => {
      if (depth === 0) {
        branches.push(<circle key={branches.length} cx={x} cy={y} r={1.8 + r() * 1.6} fill={dir === 1 ? p.h : p.g} />);
        return;
      }
      const x2 = x + Math.cos(a) * len;
      const y2 = y + Math.sin(a) * len * dir;
      branches.push(<path key={branches.length} d={`M ${x} ${y} L ${x2} ${y2}`} stroke={p.a} strokeWidth={depth * 0.8} strokeLinecap="round" />);
      const spread = 0.35 + r() * 0.25;
      grow(x2, y2, a - spread, len * 0.72, depth - 1, dir);
      grow(x2, y2, a + spread, len * 0.72, depth - 1, dir);
    };
    grow(0, 10, -Math.PI / 2, 26, 5, 1);
    grow(0, 14, -Math.PI / 2, 16, 4, -1);
    return <g>{branches}<path d="M-50 12 H50" stroke={p.g} strokeWidth={1} opacity={0.7} /></g>;
  },
  crown: (p) => (
    <g strokeWidth={SW}>
      <ellipse cy={-6} rx={64} ry={20} fill="none" stroke={p.g} strokeWidth={1.2} opacity={0.6} />
      <path d="M-48 24 L-54 -30 L-26 -4 L0 -48 L26 -4 L54 -30 L48 24 Z" fill={p.d} stroke={p.a} />
      <rect x={-50} y={22} width={100} height={16} rx={3} fill={p.d} stroke={p.a} />
      {[-54, 0, 54].map((x) => <circle key={x} cx={x} cy={x === 0 ? -50 : -32} r={5} fill={p.h} />)}
      {[-30, -10, 10, 30].map((x, i) => <circle key={x} cx={x} cy={30} r={3.5} fill={i % 2 ? p.g : p.h} />)}
      <path d="M0 -24 L6 -12 L0 0 L-6 -12 Z" fill={p.g} />
    </g>
  ),
};

type Field = "rays" | "rings" | "grid" | "stars" | "waves";
const FIELDS: Field[] = ["rays", "rings", "grid", "stars", "waves"];

function FieldLayer({ kind, p, r }: { kind: Field; p: Colors; r: () => number }) {
  switch (kind) {
    case "rays":
      return (
        <g opacity={0.35}>
          {Array.from({ length: 36 }, (_, i) => {
            const t = (i / 36) * Math.PI * 2;
            return <path key={i} d={`M ${CX} ${CY} L ${CX + Math.cos(t) * 260} ${CY + Math.sin(t) * 260}`} stroke={p.g} strokeWidth={i % 3 === 0 ? 1.2 : 0.5} opacity={0.3 + r() * 0.5} />;
          })}
        </g>
      );
    case "rings":
      return (
        <g fill="none" stroke={p.g} opacity={0.3}>
          {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={CX} cy={CY} r={20 + i * 18} strokeWidth={0.6 + (i % 3 === 0 ? 0.8 : 0)} strokeDasharray={i % 2 ? "2 5" : undefined} />)}
        </g>
      );
    case "grid": {
      const horizon = 186;
      return (
        <g stroke={p.g} strokeWidth={0.7} opacity={0.4}>
          {Array.from({ length: 8 }, (_, i) => <path key={`h${i}`} d={`M 0 ${horizon + Math.pow(i, 1.7) * 3} H ${W}`} />)}
          {Array.from({ length: 15 }, (_, i) => <path key={`v${i}`} d={`M ${CX} ${horizon} L ${CX + (i - 7) * 60} ${H}`} />)}
        </g>
      );
    }
    case "stars":
      return (
        <g>
          {Array.from({ length: 70 }, (_, i) => <circle key={i} cx={r() * W} cy={r() * H} r={r() * 1.3 + 0.2} fill={p.h} opacity={0.2 + r() * 0.7} />)}
        </g>
      );
    case "waves":
      return (
        <g fill="none" stroke={p.g} opacity={0.3}>
          {Array.from({ length: 10 }, (_, i) => {
            const y = 20 + i * 26;
            const amp = 6 + r() * 10;
            return <path key={i} d={`M 0 ${y} C 75 ${y - amp} 75 ${y + amp} 150 ${y} S 225 ${y - amp} 300 ${y}`} strokeWidth={0.8} />;
          })}
        </g>
      );
  }
}

/** Astrolabe ring: polygon + star polygon + ticked circle. */
function Geometry({ p, r }: { p: Colors; r: () => number }) {
  const n = 3 + Math.floor(r() * 6);
  const rot = r() * 360;
  const R = 86 + r() * 14;
  const poly = (radius: number, step: number) =>
    Array.from({ length: n }, (_, i) => {
      const t = ((i * step) / n) * Math.PI * 2;
      return `${(CX + Math.cos(t) * radius).toFixed(1)},${(CY + Math.sin(t) * radius).toFixed(1)}`;
    }).join(" ");
  return (
    <g fill="none" stroke={p.a} opacity={0.32} transform={`rotate(${rot} ${CX} ${CY})`}>
      <circle cx={CX} cy={CY} r={R} strokeWidth={0.9} />
      <circle cx={CX} cy={CY} r={R - 8} strokeWidth={0.5} />
      {Array.from({ length: 72 }, (_, i) => {
        const t = (i / 72) * Math.PI * 2;
        const len = i % 6 === 0 ? 8 : 3;
        return <path key={i} d={`M ${CX + Math.cos(t) * R} ${CY + Math.sin(t) * R} L ${CX + Math.cos(t) * (R - len)} ${CY + Math.sin(t) * (R - len)}`} strokeWidth={0.7} />;
      })}
      <polygon points={poly(R - 8, 1)} strokeWidth={0.8} />
      {n >= 5 && <polygon points={poly(R - 8, 2)} strokeWidth={0.6} />}
    </g>
  );
}

function RarityLayer({ rarity, p, r, uid }: { rarity: Rarity; p: Colors; r: () => number; uid: string }) {
  const tier = RARITY_ORDER[rarity];
  return (
    <g>
      {tier >= 4 && (
        <g fill={p.h}>
          {Array.from({ length: 24 }, (_, i) => {
            const t = (i / 24) * Math.PI * 2;
            return <circle key={i} cx={CX + Math.cos(t) * 112} cy={CY + Math.sin(t) * 112} r={i % 2 ? 1 : 1.8} opacity={0.7} />;
          })}
        </g>
      )}
      {tier >= 5 && (
        <g className="cx-spin" style={{ transformOrigin: `${CX}px ${CY}px` }}>
          {Array.from({ length: 16 }, (_, i) => {
            const t = (i / 16) * Math.PI * 2;
            return <path key={i} d={`M ${CX + Math.cos(t - 0.05) * 70} ${CY + Math.sin(t - 0.05) * 70} L ${CX + Math.cos(t) * 128} ${CY + Math.sin(t) * 128} L ${CX + Math.cos(t + 0.05) * 70} ${CY + Math.sin(t + 0.05) * 70} Z`} fill={`url(#${uid}-halo)`} />;
          })}
        </g>
      )}
      {tier >= 6 && (
        <g fill="none" stroke={p.a} strokeWidth={0.8} opacity={0.7}>
          <ellipse cx={CX} cy={CY} rx={124} ry={34} transform={`rotate(-16 ${CX} ${CY})`} />
          <circle cx={CX + 112} cy={CY - 42} r={4} fill={p.h} stroke="none" />
          <ellipse cx={CX} cy={CY} rx={34} ry={118} transform={`rotate(24 ${CX} ${CY})`} strokeDasharray="2 4" />
        </g>
      )}
      {tier >= 7 && (
        <g>
          {Array.from({ length: 7 }, (_, i) => {
            const y = r() * H;
            const h = 2 + r() * 8;
            const dx = (r() - 0.5) * 24;
            return (
              <g key={i}>
                <rect x={dx} y={y} width={W} height={h} fill="#ff1744" opacity={0.28} style={{ mixBlendMode: "screen" }} />
                <rect x={-dx} y={y + h} width={W} height={h / 2} fill="#00e5ff" opacity={0.18} style={{ mixBlendMode: "screen" }} />
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
}

export function CodexArt({
  slug,
  motif,
  palette,
  rarity,
  silhouette = false,
}: {
  slug: string;
  motif: Motif;
  palette: Palette;
  rarity: Rarity;
  silhouette?: boolean;
}) {
  const uid = "cx" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const p = PALETTES[palette] ?? PALETTES.void;
  const seed = hashSlug(slug);
  const r = rng(seed);
  const field = FIELDS[seed % FIELDS.length];
  const angle = Math.round(r() * 360);
  const nebula = Array.from({ length: 3 }, () => ({ x: 40 + r() * 220, y: 30 + r() * 200, rad: 70 + r() * 90 }));
  const motifScale = motif === "bars" || motif === "wave" ? 1 : 1.12;
  const drawMotif = MOTIFS[motif] ?? MOTIFS.eye;
  const motifEl = drawMotif(p, rng(seed ^ 0x9e3779b9));
  const particles = Array.from({ length: 26 }, () => ({ x: r() * W, y: r() * H, s: r() }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true" style={{ display: "block" }}>
      <defs>
        <linearGradient id={`${uid}-bg`} gradientTransform={`rotate(${angle} 0.5 0.5)`}>
          <stop offset="0%" stopColor={p.bg0} />
          <stop offset="100%" stopColor={p.bg1} />
        </linearGradient>
        <radialGradient id={`${uid}-neb`}>
          <stop offset="0%" stopColor={p.g} stopOpacity={0.45} />
          <stop offset="100%" stopColor={p.g} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${uid}-core`}>
          <stop offset="0%" stopColor={p.h} stopOpacity={0.5} />
          <stop offset="35%" stopColor={p.g} stopOpacity={0.35} />
          <stop offset="100%" stopColor={p.g} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${uid}-halo`}>
          <stop offset="0%" stopColor={p.h} stopOpacity={0.5} />
          <stop offset="100%" stopColor={p.g} stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`${uid}-vig`} cx="50%" cy="46%" r="72%">
          <stop offset="60%" stopColor="#000" stopOpacity={0} />
          <stop offset="100%" stopColor="#000" stopOpacity={0.85} />
        </radialGradient>
        <filter id={`${uid}-bloom`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={`${uid}-sil`} x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="1.6" result="thick" />
          <feFlood floodColor={p.a} floodOpacity="0.28" />
          <feComposite in2="thick" operator="in" result="rim" />
          <feFlood floodColor="#000" />
          <feComposite in2="SourceAlpha" operator="in" result="shape" />
          <feMerge><feMergeNode in="rim" /><feMergeNode in="shape" /></feMerge>
        </filter>
      </defs>

      {silhouette ? (
        <>
          <rect width={W} height={H} fill="#07070a" />
          <circle cx={CX} cy={CY} r={120} fill={`url(#${uid}-neb)`} opacity={0.25} />
          <g fill="none" stroke={p.a} opacity={0.12}>
            <circle cx={CX} cy={CY} r={96} /><circle cx={CX} cy={CY} r={88} strokeDasharray="2 4" />
          </g>
          <g filter={`url(#${uid}-sil)`} transform={`translate(${CX} ${CY}) scale(${motifScale})`}>{motifEl}</g>
        </>
      ) : (
        <>
          <rect width={W} height={H} fill={`url(#${uid}-bg)`} />
          {nebula.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r={n.rad} fill={`url(#${uid}-neb)`} />)}
          <FieldLayer kind={field} p={p} r={r} />
          <circle cx={CX} cy={CY} r={110} fill={`url(#${uid}-core)`} />
          <Geometry p={p} r={r} />
          <RarityLayer rarity={rarity} p={p} r={r} uid={uid} />
          <g transform={`translate(${CX} ${CY}) scale(${motifScale})`}>
            <g filter={`url(#${uid}-bloom)`} opacity={0.75}>{motifEl}</g>
            {motifEl}
          </g>
          {particles.map((pt, i) =>
            pt.s > 0.86 ? (
              <path key={i} d={`M ${pt.x - 4} ${pt.y} H ${pt.x + 4} M ${pt.x} ${pt.y - 4} V ${pt.y + 4}`} stroke={p.h} strokeWidth={0.8} opacity={0.9} />
            ) : (
              <circle key={i} cx={pt.x} cy={pt.y} r={0.5 + pt.s * 1.4} fill={p.a} opacity={0.25 + pt.s * 0.6} />
            ),
          )}
          <rect width={W} height={H} fill={`url(#${uid}-vig)`} />
        </>
      )}
    </svg>
  );
}
