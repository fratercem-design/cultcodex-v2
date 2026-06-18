"use client";

import { useEffect, useRef, useState } from "react";
import { getAmbient, subscribeAppearance } from "@/lib/appearance";

// ─── Glyph pool: runic + katakana + occult + binary ───────────────────────────
const GLYPHS = [
  "ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ","ᛉ","ᛊ","ᛏ","ᛒ","ᛗ","ᛚ","ᛜ","ᛞ","ᛟ",
  "ア","イ","ウ","エ","オ","カ","キ","ク","ケ","コ","サ","シ","ス","セ","ソ","タ","チ","ツ","テ","ト",
  "⊕","⊗","⊙","☿","♄","♃","♂","♀","☉","☽","△","▽","◇","◉","⬡","✦","✧","⌘","⍟","⎔",
  "0","1",
];

const PALETTE = [
  (a: number) => `rgba(93,183,216,${a})`,   // cyan
  (a: number) => `rgba(155,110,208,${a})`,  // violet
  (a: number) => `rgba(200,169,107,${a})`,  // gold
  (a: number) => `rgba(169,74,74,${a})`,    // crimson
] as const;

// Fixed monolith geometry (fraction of canvas width/height)
const MONOLITHS = [
  { xf: 0.12, hf: 0.52, w: 16 },
  { xf: 0.28, hf: 0.42, w: 22 },
  { xf: 0.50, hf: 0.65, w: 14 },
  { xf: 0.72, hf: 0.48, w: 20 },
  { xf: 0.88, hf: 0.56, w: 17 },
];

const rg = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!;
const rp = () => PALETTE[Math.floor(Math.random() * PALETTE.length)]!;

// ─── Glyph Column ─────────────────────────────────────────────────────────────
class GlyphCol {
  x: number; y: number; speed: number; len: number;
  color: (a: number) => string; chars: string[];
  mutT: number; ch: number;

  constructor(x: number, h: number, ch: number) {
    this.x = x; this.ch = ch; this.y = 0; this.speed = 0; this.len = 0;
    this.color = rp(); this.chars = []; this.mutT = 0;
    this.reset(h, true);
  }

  reset(h: number, init = false) {
    this.y = init ? -Math.random() * h : -this.ch * 2;
    this.speed = 25 + Math.random() * 55;
    this.len = Math.floor(8 + Math.random() * 18);
    this.color = rp();
    this.chars = Array.from({ length: this.len + 1 }, rg);
    this.mutT = 0;
  }

  tick(dt: number, h: number) {
    this.y += this.speed * dt;
    this.mutT += dt;
    if (this.mutT > 0.15) {
      this.chars[Math.floor(Math.random() * this.chars.length)] = rg();
      this.mutT = 0;
    }
    if (this.y - this.len * this.ch > h) this.reset(h);
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { ch, chars, len, color, x, y } = this;
    const cH = ctx.canvas.height;
    for (let i = 0; i <= len; i++) {
      const gy = y - i * ch;
      if (gy < -ch || gy > cH + ch) continue;
      if (i === 0) {
        ctx.fillStyle = "rgba(230,240,255,0.9)";
      } else {
        const a = Math.pow(1 - i / len, 1.6) * 0.65;
        if (a < 0.01) continue;
        ctx.fillStyle = color(a);
      }
      ctx.fillText(chars[i] ?? "0", x, gy);
    }
  }
}

// ─── Particle ─────────────────────────────────────────────────────────────────
class Particle {
  x: number; y: number; vx: number; vy: number;
  r: number; color: (a: number) => string; ba: number; ft: number;

  constructor(w: number, h: number) {
    this.x = Math.random() * w; this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * 15; this.vy = (Math.random() - 0.5) * 15;
    this.r = 0.5 + Math.random() * 1.5;
    this.color = rp();
    this.ba = 0.15 + Math.random() * 0.4;
    this.ft = Math.random() * Math.PI * 2;
  }

  tick(dt: number, w: number, h: number, mx: number, my: number) {
    const dx = this.x - mx, dy = this.y - my;
    const d = Math.hypot(dx, dy);
    if (d < 100 && d > 0) {
      const f = (100 - d) / 100 * 50;
      this.vx += (dx / d) * f * dt;
      this.vy += (dy / d) * f * dt;
    }
    this.vx *= 0.98; this.vy *= 0.98;
    const sp = Math.hypot(this.vx, this.vy);
    if (sp > 70) { this.vx = this.vx / sp * 70; this.vy = this.vy / sp * 70; }
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (this.x < 0) this.x = w; if (this.x > w) this.x = 0;
    if (this.y < 0) this.y = h; if (this.y > h) this.y = 0;
    this.ft += dt * 1.5;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const a = this.ba * (0.7 + 0.3 * Math.sin(this.ft));
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color(a);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * 4, 0, Math.PI * 2);
    ctx.fillStyle = this.color(a * 0.07);
    ctx.fill();
  }
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────

function poly(ctx: CanvasRenderingContext2D, n: number, r: number, color: string) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    i === 0
      ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function drawGeometry(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
  const R = Math.min(w, h) * 0.20;
  ctx.save();
  ctx.translate(w * 0.5, h * 0.36);

  // Outer ring
  ctx.beginPath();
  ctx.arc(0, 0, R * 1.3, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(155,110,208,0.04)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Slow hexagon
  ctx.save(); ctx.rotate(t * 0.04);
  poly(ctx, 6, R, "rgba(93,183,216,0.04)");
  ctx.restore();

  // Two counter-rotating triangles (Star of David sigil)
  ctx.save(); ctx.rotate(t * 0.07);
  poly(ctx, 3, R * 0.88, "rgba(200,169,107,0.055)");
  ctx.restore();
  ctx.save(); ctx.rotate(-t * 0.07 + Math.PI);
  poly(ctx, 3, R * 0.88, "rgba(155,110,208,0.055)");
  ctx.restore();

  // Inner circle
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.32, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(200,169,107,0.07)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // 3 orbital dots
  for (let i = 0; i < 3; i++) {
    const a = t * 0.06 + (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * R * 0.62, Math.sin(a) * R * 0.62, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(93,183,216,0.28)";
    ctx.fill();
  }

  ctx.restore();
}

function drawGrid(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
  const vpY = h * 0.52;
  ctx.save();

  // Horizontal lines — exponential spacing for perspective
  for (let i = 0; i <= 10; i++) {
    const p = Math.pow(i / 10, 2.5);
    const y = vpY + p * (h - vpY);
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(w, y);
    ctx.strokeStyle = `rgba(93,183,216,${0.025 + 0.04 * (i / 10)})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Vertical lines converging to vanishing point
  for (let i = 0; i <= 12; i++) {
    ctx.beginPath();
    ctx.moveTo(w / 2, vpY); ctx.lineTo((i / 12) * w, h);
    ctx.strokeStyle = "rgba(155,110,208,0.025)";
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Moving sweep line
  const st = (t * 0.15) % 1;
  const sy = vpY + Math.pow(st, 2) * (h - vpY);
  ctx.beginPath();
  ctx.moveTo(0, sy); ctx.lineTo(w, sy);
  ctx.strokeStyle = `rgba(93,183,216,${0.10 * (1 - st)})`;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.restore();
}

function drawMonoliths(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  for (const m of MONOLITHS) {
    const mx = m.xf * w;
    const mh = m.hf * h;
    const grad = ctx.createLinearGradient(mx, h - mh, mx, h);
    grad.addColorStop(0, "rgba(155,110,208,0.0)");
    grad.addColorStop(0.6, "rgba(155,110,208,0.02)");
    grad.addColorStop(1, "rgba(155,110,208,0.05)");
    ctx.fillStyle = grad;
    ctx.fillRect(mx - m.w / 2, h - mh, m.w, mh);
    ctx.strokeStyle = "rgba(93,183,216,0.04)";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(mx - m.w / 2, h - mh, m.w, mh);
  }
  ctx.restore();
}

function applyGlitch(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const n = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < n; i++) {
    const sy = Math.floor(Math.random() * h);
    const sh = Math.ceil(1 + Math.random() * 12);
    const ox = (Math.random() - 0.5) * 40;
    try {
      const img = ctx.getImageData(0, sy, w, sh);
      ctx.putImageData(img, ox, sy);
    } catch { /* cross-origin guard */ }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AmbientVisualSystem() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // User toggle: when ambient visuals are off, the animation loop never starts.
  const [enabled, setEnabled] = useState<boolean>(() => getAmbient() === "on");

  useEffect(() => subscribeAppearance(() => setEnabled(getAmbient() === "on")), []);

  useEffect(() => {
    // User disabled ambient visuals → don't run.
    if (!enabled) return;
    // Respect reduced-motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mobile = window.innerWidth < 768;
    const CH = mobile ? 17 : 14; // cell height (px)
    const CW = mobile ? 20 : 15; // cell width  (px)
    const COL_DIV = mobile ? 3 : 1; // column density divisor

    let cols: GlyphCol[] = [];
    let particles: Particle[] = [];
    let t = 0, lastT = performance.now();
    let glitchT = 0, nextGlitch = 12 + Math.random() * 12;
    let mx = -999, my = -999;
    let rafId = 0;
    let w = 0, h = 0;

    function init() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
      const numCols = Math.floor(w / CW / COL_DIV);
      cols = Array.from({ length: numCols }, (_, i) =>
        new GlyphCol(i * CW * COL_DIV + CW / 2, h, CH)
      );
      particles = Array.from(
        { length: mobile ? 20 : 45 },
        () => new Particle(w, h)
      );
    }

    function frame(now: number) {
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      t += dt;

      // Trail fade — same hue as --term-bg for seamless blending
      ctx!.fillStyle = "rgba(4,6,10,0.13)";
      ctx!.fillRect(0, 0, w, h);

      // Environment layers (back to front)
      drawMonoliths(ctx!, w, h);
      drawGrid(ctx!, t, w, h);
      drawGeometry(ctx!, t, w, h);

      // Glyph rain
      ctx!.font = `${CH - 2}px "JetBrains Mono", monospace`;
      ctx!.textAlign = "center";
      for (const col of cols) { col.tick(dt, h); col.draw(ctx!); }

      // Particles
      for (const p of particles) { p.tick(dt, w, h, mx, my); p.draw(ctx!); }

      // Occasional glitch burst (every 12–24 s)
      glitchT += dt;
      if (glitchT > nextGlitch) {
        applyGlitch(ctx!, w, h);
        glitchT = 0;
        nextGlitch = 12 + Math.random() * 12;
      }

      rafId = requestAnimationFrame(frame);
    }

    function onMouse(e: MouseEvent) { mx = e.clientX; my = e.clientY; }
    function onResize() { init(); }
    function onVis() {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        lastT = performance.now();
        rafId = requestAnimationFrame(frame);
      }
    }

    init();
    rafId = requestAnimationFrame(frame);
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouse);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled]);

  return (
    // mix-blend-mode: screen makes the near-black canvas background transparent
    // while glyph/particle pixels show as additive color overlays on the UI.
    // pointer-events: none keeps all clicks/scroll passing through to content.
    <div
      aria-hidden="true"
      className="ambient-canvas"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        overflow: "hidden",
        mixBlendMode: "screen",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
