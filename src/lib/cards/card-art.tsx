/**
 * Deterministic procedural art engine for trading cards.
 * Each card gets a unique visual based on slug + type + rarity.
 * No external dependencies — renders as inline SVG React component.
 */
import type { CardType, Rarity } from "@/generated/prisma/client";

// ── Seeded PRNG (mulberry32 — fast, uniform, deterministic) ──────────────────
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}

function makeRng(seed: number) {
  let s = seed;
  return (): number => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Color palettes per rarity ────────────────────────────────────────────────
const RARITY_PALETTE: Record<Rarity, { primary: string; secondary: string; bg: string; glow: string }> = {
  STATIC:       { primary: "#9CBBAD", secondary: "#6a8a7a", bg: "#0a0f0c", glow: "rgba(156,187,173,0.3)" },
  SIGNAL:       { primary: "#00FF9C", secondary: "#00CC7A", bg: "#001a0e", glow: "rgba(0,255,156,0.4)" },
  TRANSMISSION: { primary: "#FFB800", secondary: "#CC8800", bg: "#1a0f00", glow: "rgba(255,184,0,0.4)" },
  ANOMALY:      { primary: "#FF2BD6", secondary: "#CC00AA", bg: "#1a001a", glow: "rgba(255,43,214,0.5)" },
  ORACLE:       { primary: "#FF3860", secondary: "#CC1040", bg: "#1a0008", glow: "rgba(255,56,96,0.5)" },
  LEGENDARY:    { primary: "#FFD700", secondary: "#FFA500", bg: "#1a1000", glow: "rgba(255,215,0,0.6)" },
  MYTHIC:       { primary: "#E040FB", secondary: "#9C27B0", bg: "#120018", glow: "rgba(224,64,251,0.6)" },
  FORBIDDEN:    { primary: "#FF1744", secondary: "#B71C1C", bg: "#1a0000", glow: "rgba(255,23,68,0.7)" },
};

// ── Complexity scale by rarity ───────────────────────────────────────────────
const COMPLEXITY: Record<Rarity, number> = {
  STATIC: 1, SIGNAL: 2, TRANSMISSION: 2, ANOMALY: 3,
  ORACLE: 3, LEGENDARY: 4, MYTHIC: 5, FORBIDDEN: 5,
};

// ── Type-specific motif generators ───────────────────────────────────────────

interface MotifProps {
  rng: () => number;
  cx: number;
  cy: number;
  w: number;
  h: number;
  color: string;
  secondary: string;
  complexity: number;
}

function voiceMotif({ rng, cx, cy, w, h, color, complexity }: MotifProps): string {
  const rings = 3 + complexity;
  let svg = "";
  for (let i = rings; i >= 1; i--) {
    const r = (w * 0.38) * (i / rings);
    const opacity = 0.08 + (i / rings) * 0.35;
    svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${i === rings ? 0.5 : 0.3}" opacity="${opacity}"/>`;
  }
  // Orbital dots
  const dotCount = 6 + complexity * 2;
  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * Math.PI * 2 + rng() * 0.3;
    const orbit = w * (0.22 + rng() * 0.12);
    const dx = cx + Math.cos(angle) * orbit;
    const dy = cy + Math.sin(angle) * orbit;
    const dotR = 1.5 + rng() * 2;
    svg += `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="${dotR.toFixed(1)}" fill="${color}" opacity="${(0.4 + rng() * 0.5).toFixed(2)}"/>`;
  }
  // Central burst lines
  const lineCount = 8 + complexity * 3;
  for (let i = 0; i < lineCount; i++) {
    const angle = (i / lineCount) * Math.PI * 2;
    const len = w * (0.06 + rng() * 0.14);
    svg += `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(angle) * len).toFixed(1)}" y2="${(cy + Math.sin(angle) * len).toFixed(1)}" stroke="${color}" stroke-width="0.5" opacity="${(0.2 + rng() * 0.4).toFixed(2)}"/>`;
  }
  // Central glow circle
  svg += `<circle cx="${cx}" cy="${cy}" r="${6 + complexity}" fill="${color}" opacity="0.15"/>`;
  svg += `<circle cx="${cx}" cy="${cy}" r="3" fill="${color}" opacity="0.8"/>`;
  return svg;
}

function transmissionMotif({ rng, cx, cy, w, h, color, complexity }: MotifProps): string {
  let svg = "";
  // Waveform
  const waves = 2 + complexity;
  for (let w2 = 0; w2 < waves; w2++) {
    const yOff = cy + (w2 - waves / 2) * 14;
    const amp = 8 + rng() * 16;
    const freq = 0.06 + rng() * 0.04;
    const pts: string[] = [];
    for (let x = 0; x <= w; x += 2) {
      const y = yOff + Math.sin(x * freq + w2 * 1.3) * amp * Math.sin((x / w) * Math.PI);
      pts.push(`${x.toFixed(0)},${y.toFixed(1)}`);
    }
    svg += `<polyline points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="${1 - w2 * 0.2}" opacity="${(0.6 - w2 * 0.15).toFixed(2)}"/>`;
  }
  // Vertical signal bars
  const bars = 5 + complexity * 2;
  for (let i = 0; i < bars; i++) {
    const bx = (i / (bars - 1)) * w * 0.9 + w * 0.05;
    const bh = h * (0.2 + rng() * 0.4);
    const by = cy - bh / 2;
    svg += `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="2" height="${bh.toFixed(1)}" fill="${color}" opacity="${(0.15 + rng() * 0.25).toFixed(2)}" rx="1"/>`;
  }
  // Scan line
  svg += `<line x1="0" y1="${cy}" x2="${w}" y2="${cy}" stroke="${color}" stroke-width="0.5" opacity="0.3"/>`;
  return svg;
}

function loreMotif({ rng, cx, cy, w, h, color, complexity }: MotifProps): string {
  let svg = "";
  // Concentric mandala rings with spokes
  const rings = 2 + complexity;
  for (let i = 1; i <= rings; i++) {
    const r = (w * 0.42) * (i / rings);
    const spokes = 6 + (i % 2 === 0 ? 6 : 0);
    svg += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="${color}" stroke-width="0.4" opacity="${(0.15 + (i / rings) * 0.3).toFixed(2)}"/>`;
    for (let j = 0; j < spokes; j++) {
      const a = (j / spokes) * Math.PI * 2;
      const r0 = r - (w * 0.42) / rings;
      svg += `<line x1="${(cx + Math.cos(a) * r0).toFixed(1)}" y1="${(cy + Math.sin(a) * r0).toFixed(1)}" x2="${(cx + Math.cos(a) * r).toFixed(1)}" y2="${(cy + Math.sin(a) * r).toFixed(1)}" stroke="${color}" stroke-width="0.3" opacity="0.25"/>`;
    }
  }
  // Central triangle (pointing up)
  const ts = w * 0.22;
  svg += `<polygon points="${cx},${cy - ts} ${cx - ts * 0.87},${cy + ts * 0.5} ${cx + ts * 0.87},${cy + ts * 0.5}" fill="none" stroke="${color}" stroke-width="0.6" opacity="0.6"/>`;
  // Inner eye
  svg += `<ellipse cx="${cx}" cy="${cy}" rx="${ts * 0.3}" ry="${ts * 0.18}" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.5"/>`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${ts * 0.08}" fill="${color}" opacity="0.8"/>`;
  return svg;
}

function signalMotif({ rng, cx, cy, w, h, color, complexity }: MotifProps): string {
  let svg = "";
  const nodeCount = 4 + complexity * 2;
  const nodes: { x: number; y: number }[] = [];
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({ x: w * (0.1 + rng() * 0.8), y: h * (0.1 + rng() * 0.8) });
  }
  // Connections
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < w * 0.55) {
        svg += `<line x1="${nodes[i].x.toFixed(1)}" y1="${nodes[i].y.toFixed(1)}" x2="${nodes[j].x.toFixed(1)}" y2="${nodes[j].y.toFixed(1)}" stroke="${color}" stroke-width="${(0.3 + (1 - dist / (w * 0.55)) * 0.7).toFixed(2)}" opacity="${(0.15 + (1 - dist / (w * 0.55)) * 0.4).toFixed(2)}"/>`;
      }
    }
  }
  // Node dots
  for (const n of nodes) {
    const r = 2 + rng() * 3;
    svg += `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="${(0.4 + rng() * 0.5).toFixed(2)}"/>`;
    svg += `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${(r + 4).toFixed(1)}" fill="none" stroke="${color}" stroke-width="0.4" opacity="0.2"/>`;
  }
  // Pulse ripples from center node
  for (let p = 1; p <= complexity; p++) {
    const r = p * w * 0.12;
    svg += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="${color}" stroke-width="0.3" opacity="${(0.12 / p).toFixed(2)}"/>`;
  }
  return svg;
}

function oracleMotif({ rng, cx, cy, w, h, color, complexity }: MotifProps): string {
  let svg = "";
  // All-seeing eye
  const eyeW = w * 0.5;
  const eyeH = h * 0.2;
  svg += `<ellipse cx="${cx}" cy="${cy}" rx="${eyeW * 0.5}" ry="${eyeH * 0.5}" fill="none" stroke="${color}" stroke-width="0.8" opacity="0.7"/>`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${eyeH * 0.28}" fill="${color}" opacity="0.25"/>`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${eyeH * 0.14}" fill="${color}" opacity="0.9"/>`;
  // Radiating lines from eye
  const rays = 12 + complexity * 4;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    const r0 = eyeH * 0.5;
    const r1 = r0 + w * (0.08 + rng() * 0.15);
    svg += `<line x1="${(cx + Math.cos(angle) * r0).toFixed(1)}" y1="${(cy + Math.sin(angle) * r0).toFixed(1)}" x2="${(cx + Math.cos(angle) * r1).toFixed(1)}" y2="${(cy + Math.sin(angle) * r1).toFixed(1)}" stroke="${color}" stroke-width="${(0.3 + rng() * 0.4).toFixed(2)}" opacity="${(0.3 + rng() * 0.4).toFixed(2)}"/>`;
  }
  // Triangle frame
  const ts = w * 0.35;
  svg += `<polygon points="${cx},${cy - ts} ${cx - ts * 0.87},${cy + ts * 0.5} ${cx + ts * 0.87},${cy + ts * 0.5}" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.35"/>`;
  return svg;
}

function cipherMotif({ rng, cx, cy, w, h, color, complexity }: MotifProps): string {
  let svg = "";
  const chars = "0123456789ABCDEF✦◈▦◉▲";
  const cols = 6 + complexity * 2;
  const rows = 8 + complexity;
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      if (rng() > 0.35) continue;
      const x = (col / cols) * w + (w / cols) * 0.5;
      const y = (row / rows) * h + (h / rows) * 0.5;
      const char = chars[Math.floor(rng() * chars.length)];
      const opacity = 0.1 + rng() * 0.45;
      const size = 5 + Math.floor(rng() * 5);
      svg += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="monospace" font-size="${size}" fill="${color}" opacity="${opacity.toFixed(2)}" text-anchor="middle">${char}</text>`;
    }
  }
  // Overlapping cipher rings
  for (let i = 0; i < 3; i++) {
    const r = w * (0.12 + i * 0.08);
    const dashes = `${(8 + i * 4)},${(4 + i * 2)}`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="0.6" stroke-dasharray="${dashes}" opacity="${0.4 - i * 0.1}"/>`;
  }
  return svg;
}

function glitchMotif({ rng, cx, cy, w, h, color, secondary }: MotifProps): string {
  let svg = "";
  // Horizontal glitch slices
  const sliceCount = 8 + Math.floor(rng() * 8);
  for (let i = 0; i < sliceCount; i++) {
    const y = rng() * h;
    const sliceH = 1 + rng() * 4;
    const shift = (rng() - 0.5) * 20;
    const opacity = 0.2 + rng() * 0.5;
    svg += `<rect x="${shift.toFixed(1)}" y="${y.toFixed(1)}" width="${w}" height="${sliceH.toFixed(1)}" fill="${color}" opacity="${opacity.toFixed(2)}"/>`;
  }
  // RGB channel split
  svg += `<rect x="${(w * 0.1 - 3).toFixed(0)}" y="${(h * 0.35).toFixed(0)}" width="${(w * 0.8).toFixed(0)}" height="${(h * 0.3).toFixed(0)}" fill="#FF0000" opacity="0.06"/>`;
  svg += `<rect x="${(w * 0.1 + 3).toFixed(0)}" y="${(h * 0.35).toFixed(0)}" width="${(w * 0.8).toFixed(0)}" height="${(h * 0.3).toFixed(0)}" fill="#0000FF" opacity="0.06"/>`;
  // Corrupted block art
  const blocks = 12 + Math.floor(rng() * 10);
  for (let i = 0; i < blocks; i++) {
    const bx = rng() * w;
    const by = rng() * h;
    const bw = 3 + rng() * 18;
    const bh = 2 + rng() * 6;
    svg += `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${rng() > 0.5 ? color : secondary}" opacity="${(0.1 + rng() * 0.4).toFixed(2)}"/>`;
  }
  // Diagonal scar
  svg += `<line x1="0" y1="${(cy - h * 0.2).toFixed(0)}" x2="${w}" y2="${(cy + h * 0.2).toFixed(0)}" stroke="${color}" stroke-width="1" opacity="0.4"/>`;
  return svg;
}

function mahavidyaMotif({ rng, cx, cy, w, h, color, complexity }: MotifProps): string {
  let svg = "";
  // Sri Yantra-inspired nested triangles
  const levels = 2 + complexity;
  for (let l = 0; l < levels; l++) {
    const s = w * (0.38 - l * 0.06);
    const up = l % 2 === 0;
    if (up) {
      svg += `<polygon points="${cx},${cy - s} ${cx - s * 0.87},${cy + s * 0.5} ${cx + s * 0.87},${cy + s * 0.5}" fill="none" stroke="${color}" stroke-width="${(0.5 - l * 0.05).toFixed(2)}" opacity="${(0.5 - l * 0.06).toFixed(2)}"/>`;
    } else {
      svg += `<polygon points="${cx},${cy + s} ${cx - s * 0.87},${cy - s * 0.5} ${cx + s * 0.87},${cy - s * 0.5}" fill="none" stroke="${color}" stroke-width="${(0.5 - l * 0.05).toFixed(2)}" opacity="${(0.5 - l * 0.06).toFixed(2)}"/>`;
    }
  }
  // Petal ring (lotus)
  const petals = 8;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    const pr = w * 0.28;
    const pcx = cx + Math.cos(a) * pr * 0.5;
    const pcy = cy + Math.sin(a) * pr * 0.5;
    svg += `<ellipse cx="${pcx.toFixed(1)}" cy="${pcy.toFixed(1)}" rx="${(pr * 0.42).toFixed(1)}" ry="${(pr * 0.18).toFixed(1)}" fill="none" stroke="${color}" stroke-width="0.4" opacity="0.35" transform="rotate(${((a * 180) / Math.PI).toFixed(0)} ${pcx.toFixed(1)} ${pcy.toFixed(1)})"/>`;
  }
  // Bindu (central dot with rings)
  svg += `<circle cx="${cx}" cy="${cy}" r="${w * 0.045}" fill="${color}" opacity="0.9"/>`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${w * 0.09}" fill="none" stroke="${color}" stroke-width="0.4" opacity="0.4"/>`;
  return svg;
}

function prophecyMotif({ rng, cx, cy, w, h, color, complexity }: MotifProps): string {
  let svg = "";
  // Star field
  const stars = 20 + complexity * 8;
  for (let i = 0; i < stars; i++) {
    const sx = rng() * w;
    const sy = rng() * h;
    const sr = 0.5 + rng() * 1.5;
    svg += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${sr.toFixed(1)}" fill="${color}" opacity="${(0.2 + rng() * 0.7).toFixed(2)}"/>`;
  }
  // Constellation lines (connect nearby stars)
  const starPositions = Array.from({ length: 8 }, () => ({ x: rng() * w, y: rng() * h }));
  for (let i = 0; i < starPositions.length - 1; i++) {
    if (rng() > 0.5) {
      svg += `<line x1="${starPositions[i].x.toFixed(1)}" y1="${starPositions[i].y.toFixed(1)}" x2="${starPositions[i + 1].x.toFixed(1)}" y2="${starPositions[i + 1].y.toFixed(1)}" stroke="${color}" stroke-width="0.3" opacity="0.25"/>`;
    }
  }
  // Central nebula
  svg += `<circle cx="${cx}" cy="${cy}" r="${w * 0.18}" fill="${color}" opacity="0.06"/>`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${w * 0.08}" fill="${color}" opacity="0.12"/>`;
  // Comet trail
  const ca = rng() * Math.PI * 2;
  const cl = w * 0.4;
  svg += `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(ca) * cl).toFixed(1)}" y2="${(cy + Math.sin(ca) * cl).toFixed(1)}" stroke="${color}" stroke-width="1.5" opacity="0.3"/>`;
  svg += `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(ca) * cl * 1.2).toFixed(1)}" y2="${(cy + Math.sin(ca) * cl * 1.2).toFixed(1)}" stroke="${color}" stroke-width="0.5" opacity="0.15"/>`;
  return svg;
}

function relicMotif({ rng, cx, cy, w, h, color, complexity }: MotifProps): string {
  let svg = "";
  // Stone tablet / artifact shape
  const tw = w * 0.65;
  const th = h * 0.75;
  svg += `<rect x="${cx - tw / 2}" y="${cy - th / 2}" width="${tw}" height="${th}" rx="4" fill="none" stroke="${color}" stroke-width="0.8" opacity="0.45"/>`;
  svg += `<rect x="${cx - tw / 2 + 6}" y="${cy - th / 2 + 6}" width="${tw - 12}" height="${th - 12}" rx="2" fill="none" stroke="${color}" stroke-width="0.3" opacity="0.25"/>`;
  // Crack lines
  const cracks = 2 + complexity;
  for (let i = 0; i < cracks; i++) {
    const sx = cx + (rng() - 0.5) * tw * 0.6;
    const sy = cy + (rng() - 0.5) * th * 0.6;
    const len = 15 + rng() * 25;
    const a = rng() * Math.PI * 2;
    svg += `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${(sx + Math.cos(a) * len).toFixed(1)}" y2="${(sy + Math.sin(a) * len).toFixed(1)}" stroke="${color}" stroke-width="0.4" opacity="0.4"/>`;
    const a2 = a + (rng() - 0.5) * 1.2;
    svg += `<line x1="${(sx + Math.cos(a) * len * 0.6).toFixed(1)}" y1="${(sy + Math.sin(a) * len * 0.6).toFixed(1)}" x2="${(sx + Math.cos(a2) * len).toFixed(1)}" y2="${(sy + Math.sin(a2) * len).toFixed(1)}" stroke="${color}" stroke-width="0.3" opacity="0.3"/>`;
  }
  // Central rune marks
  const runeSymbols = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ"];
  const runeCount = 2 + complexity;
  for (let i = 0; i < runeCount; i++) {
    const rx = cx + (i - runeCount / 2) * 14;
    const rune = runeSymbols[Math.floor(rng() * runeSymbols.length)];
    svg += `<text x="${rx.toFixed(1)}" y="${cy + 5}" font-family="serif" font-size="14" fill="${color}" opacity="0.5" text-anchor="middle">${rune}</text>`;
  }
  return svg;
}

function entityMotif({ rng, cx, cy, w, h, color, complexity }: MotifProps): string {
  let svg = "";
  // Nebula-like form (layered ellipses at random angles)
  const layers = 3 + complexity;
  for (let i = 0; i < layers; i++) {
    const rx = w * (0.1 + rng() * 0.3);
    const ry = h * (0.05 + rng() * 0.2);
    const ex = cx + (rng() - 0.5) * w * 0.25;
    const ey = cy + (rng() - 0.5) * h * 0.2;
    const rot = rng() * 180;
    svg += `<ellipse cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${color}" opacity="${(0.04 + rng() * 0.08).toFixed(3)}" transform="rotate(${rot.toFixed(0)} ${ex.toFixed(1)} ${ey.toFixed(1)})"/>`;
    svg += `<ellipse cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="none" stroke="${color}" stroke-width="0.3" opacity="${(0.1 + rng() * 0.2).toFixed(2)}" transform="rotate(${rot.toFixed(0)} ${ex.toFixed(1)} ${ey.toFixed(1)})"/>`;
  }
  // Tentacle-like curves
  const tentacles = 4 + complexity * 2;
  for (let i = 0; i < tentacles; i++) {
    const angle = (i / tentacles) * Math.PI * 2 + rng() * 0.5;
    const len = w * (0.2 + rng() * 0.25);
    const cpx = cx + Math.cos(angle + 0.8) * len * 0.6;
    const cpy = cy + Math.sin(angle + 0.8) * len * 0.6;
    const ex = cx + Math.cos(angle) * len;
    const ey = cy + Math.sin(angle) * len;
    svg += `<path d="M${cx},${cy} Q${cpx.toFixed(1)},${cpy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}" fill="none" stroke="${color}" stroke-width="${(0.3 + rng() * 0.5).toFixed(2)}" opacity="${(0.15 + rng() * 0.3).toFixed(2)}"/>`;
  }
  svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="${color}" opacity="0.7"/>`;
  return svg;
}

function memberMotif({ rng, cx, cy, w, h, color, complexity }: MotifProps): string {
  let svg = "";
  // Personal sigil: hexagon frame
  const sides = 6;
  const hr = w * 0.35;
  const hexPts = Array.from({ length: sides }, (_, i) => {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 6;
    return `${(cx + Math.cos(a) * hr).toFixed(1)},${(cy + Math.sin(a) * hr).toFixed(1)}`;
  }).join(" ");
  svg += `<polygon points="${hexPts}" fill="none" stroke="${color}" stroke-width="0.7" opacity="0.5"/>`;
  const hr2 = hr * 0.7;
  const hex2Pts = Array.from({ length: sides }, (_, i) => {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 6;
    return `${(cx + Math.cos(a) * hr2).toFixed(1)},${(cy + Math.sin(a) * hr2).toFixed(1)}`;
  }).join(" ");
  svg += `<polygon points="${hex2Pts}" fill="none" stroke="${color}" stroke-width="0.4" opacity="0.3"/>`;
  // Interior pattern based on complexity
  const spokes2 = 6;
  for (let i = 0; i < spokes2; i++) {
    const a = (i / spokes2) * Math.PI * 2 - Math.PI / 6;
    svg += `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * hr2).toFixed(1)}" y2="${(cy + Math.sin(a) * hr2).toFixed(1)}" stroke="${color}" stroke-width="0.3" opacity="0.2"/>`;
  }
  // Unique dot pattern
  for (let i = 0; i < 6 + complexity * 2; i++) {
    const a = rng() * Math.PI * 2;
    const r = hr2 * (0.2 + rng() * 0.7);
    svg += `<circle cx="${(cx + Math.cos(a) * r).toFixed(1)}" cy="${(cy + Math.sin(a) * r).toFixed(1)}" r="${(1 + rng() * 2).toFixed(1)}" fill="${color}" opacity="${(0.3 + rng() * 0.5).toFixed(2)}"/>`;
  }
  svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="${color}" opacity="0.6"/>`;
  return svg;
}

function avatarMotif({ rng, cx, cy, w, h, color, complexity }: MotifProps): string {
  let svg = "";
  // Portrait circle frame
  const hr = w * 0.28;
  svg += `<circle cx="${cx}" cy="${cy * 0.85}" r="${hr}" fill="${color}" opacity="0.08"/>`;
  svg += `<circle cx="${cx}" cy="${cy * 0.85}" r="${hr}" fill="none" stroke="${color}" stroke-width="0.7" opacity="0.4"/>`;
  // Portrait silhouette shape (head + shoulders)
  const head = hr * 0.55;
  svg += `<circle cx="${cx}" cy="${cy * 0.72}" r="${head}" fill="${color}" opacity="0.12"/>`;
  svg += `<path d="M${(cx - hr * 0.9).toFixed(1)},${(cy * 0.85 + hr * 0.7).toFixed(1)} Q${cx},${(cy * 0.85 + hr * 0.3).toFixed(1)} ${(cx + hr * 0.9).toFixed(1)},${(cy * 0.85 + hr * 0.7).toFixed(1)}" fill="${color}" opacity="0.15"/>`;
  // Aura rings
  for (let i = 1; i <= 1 + complexity; i++) {
    svg += `<circle cx="${cx}" cy="${cy * 0.85}" r="${hr + i * 8}" fill="none" stroke="${color}" stroke-width="0.3" opacity="${(0.12 / i).toFixed(2)}"/>`;
  }
  return svg;
}

function incidentMotif({ rng, cx, cy, w, h, color, complexity }: MotifProps): string {
  let svg = "";
  // Warning triangle
  const ts = w * 0.38;
  svg += `<polygon points="${cx},${cy - ts} ${cx - ts * 0.87},${cy + ts * 0.5} ${cx + ts * 0.87},${cy + ts * 0.5}" fill="${color}" opacity="0.1"/>`;
  svg += `<polygon points="${cx},${cy - ts} ${cx - ts * 0.87},${cy + ts * 0.5} ${cx + ts * 0.87},${cy + ts * 0.5}" fill="none" stroke="${color}" stroke-width="1" opacity="0.6"/>`;
  // Exclamation mark
  svg += `<line x1="${cx}" y1="${cy - ts * 0.45}" x2="${cx}" y2="${cy + ts * 0.1}" stroke="${color}" stroke-width="2.5" opacity="0.7" stroke-linecap="round"/>`;
  svg += `<circle cx="${cx}" cy="${cy + ts * 0.28}" r="1.8" fill="${color}" opacity="0.7"/>`;
  // Alert pulse rings
  for (let i = 1; i <= complexity; i++) {
    const r = ts * 0.6 + i * 10;
    svg += `<circle cx="${cx}" cy="${cy + ts * 0.05}" r="${r.toFixed(0)}" fill="none" stroke="${color}" stroke-width="0.3" opacity="${(0.15 / i).toFixed(2)}"/>`;
  }
  // Horizontal scan bars
  for (let i = 0; i < 3; i++) {
    const by = cy - ts + (i + 1) * (ts * 1.5 / 4);
    svg += `<line x1="${(cx - ts * 0.87 + 4).toFixed(1)}" y1="${by.toFixed(1)}" x2="${(cx + ts * 0.87 - 4).toFixed(1)}" y2="${by.toFixed(1)}" stroke="${color}" stroke-width="0.3" opacity="0.2"/>`;
  }
  return svg;
}

// ── Dispatch table ───────────────────────────────────────────────────────────
const MOTIF_FN: Record<CardType, (props: MotifProps) => string> = {
  VOICE:        voiceMotif,
  TRANSMISSION: transmissionMotif,
  LORE:         loreMotif,
  SIGNAL:       signalMotif,
  ORACLE:       oracleMotif,
  CIPHER:       cipherMotif,
  RELIC:        relicMotif,
  ENTITY:       entityMotif,
  PROPHECY:     prophecyMotif,
  MEMBER:       memberMotif,
  GLITCH:       glitchMotif,
  MAHAVIDYA:    mahavidyaMotif,
  AVATAR:       avatarMotif,
  INCIDENT:     incidentMotif,
};

// ── Background generators ────────────────────────────────────────────────────
function renderBg(rng: () => number, w: number, h: number, palette: typeof RARITY_PALETTE[Rarity], rarity: Rarity): string {
  const { primary, secondary, bg } = palette;
  const cx = w / 2;
  const cy = h / 2;
  const id = `grad-${Math.floor(rng() * 9999)}`;

  // Base gradient direction varies per card
  const angle = rng() * 360;
  const gx1 = Math.cos((angle * Math.PI) / 180) * 0.5 + 0.5;
  const gy1 = Math.sin((angle * Math.PI) / 180) * 0.5 + 0.5;
  const gx2 = 1 - gx1;
  const gy2 = 1 - gy1;

  const complexity = COMPLEXITY[rarity];
  let svg = `<defs>
    <radialGradient id="${id}" cx="${gx1.toFixed(2)}" cy="${gy1.toFixed(2)}" r="0.8" fx="${gx1.toFixed(2)}" fy="${gy1.toFixed(2)}">
      <stop offset="0%" stop-color="${secondary}" stop-opacity="0.18"/>
      <stop offset="60%" stop-color="${bg}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.95"/>
    </radialGradient>
  </defs>`;

  svg += `<rect width="${w}" height="${h}" fill="${bg}"/>`;
  svg += `<rect width="${w}" height="${h}" fill="url(#${id})"/>`;

  // Subtle grid
  const gridSize = 12 + Math.floor(rng() * 8);
  svg += `<defs><pattern id="g-${id}" width="${gridSize}" height="${gridSize}" patternUnits="userSpaceOnUse"><path d="M ${gridSize} 0 L 0 0 0 ${gridSize}" fill="none" stroke="${primary}" stroke-width="0.25"/></pattern></defs>`;
  svg += `<rect width="${w}" height="${h}" fill="url(#g-${id})" opacity="0.06"/>`;

  // Corner accents
  if (complexity >= 2) {
    svg += cornerAccent(0, 0, primary, rng);
    svg += cornerAccent(w, 0, primary, rng, true);
    svg += cornerAccent(0, h, primary, rng, false, true);
    svg += cornerAccent(w, h, primary, rng, true, true);
  }

  return svg;
}

function cornerAccent(x: number, y: number, color: string, rng: () => number, flipX = false, flipY = false): string {
  const size = 14 + rng() * 6;
  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;
  return `<path d="M${x},${y + sy * size} L${x},${y} L${x + sx * size},${y}" fill="none" stroke="${color}" stroke-width="0.6" opacity="0.4"/>`;
}

// ── Public API ────────────────────────────────────────────────────────────────
export interface CardArtProps {
  slug: string;
  cardType: CardType;
  rarity: Rarity;
  width: number;
  height: number;
}

/**
 * Generate a deterministic SVG art string for the given card parameters.
 * Same slug + type + rarity always produces the same output.
 */
export function generateCardArtSvg({ slug, cardType, rarity, width: w, height: h }: CardArtProps): string {
  const seed = hashStr(`${slug}:${cardType}:${rarity}`);
  const rng = makeRng(seed);
  const palette = RARITY_PALETTE[rarity];
  const complexity = COMPLEXITY[rarity];
  const cx = w / 2;
  const cy = h / 2;

  const bg = renderBg(rng, w, h, palette, rarity);
  const motif = (MOTIF_FN[cardType] ?? voiceMotif)({
    rng, cx, cy, w, h,
    color: palette.primary,
    secondary: palette.secondary,
    complexity,
  });

  // High-rarity glow overlay
  let glow = "";
  if (complexity >= 3) {
    glow = `<circle cx="${cx}" cy="${cy}" r="${w * 0.45}" fill="${palette.primary}" opacity="0.025"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bg}${motif}${glow}</svg>`;
}

/**
 * React component that renders generative card art inline.
 * Deterministic — same card always produces the same visual.
 */
export function GenerativeCardArt({ slug, cardType, rarity, width, height }: CardArtProps) {
  const svg = generateCardArtSvg({ slug, cardType, rarity, width, height });
  return (
    <div
      style={{ width, height, overflow: "hidden" }}
      dangerouslySetInnerHTML={{ __html: svg }}
      aria-hidden="true"
    />
  );
}
