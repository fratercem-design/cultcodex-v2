"use client";

// Ambient layer — Ritual Research Instrument rules (2026-09 audit):
//   * Atmosphere lives at the edges, never on top of text. The falling glyph
//     "rain" and the glitch bursts painted over nav labels, headings and
//     footer links (screen-blended above content), so both are gone.
//   * The layer runs on the homepage threshold only, and fades out once the
//     visitor scrolls past it. Reading routes are effect-free.
//   * Still off under prefers-reduced-motion and the Appearance toggle.

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getAmbient, subscribeAppearance } from "@/lib/appearance";

const PALETTE = [
  (a: number) => `rgba(98, 228, 200,${a})`,   // cyan
  (a: number) => `rgba(74, 45, 110,${a})`,  // violet
  (a: number) => `rgba(200, 57, 46,${a})`,  // gold
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

const rp = () => PALETTE[Math.floor(Math.random() * PALETTE.length)]!;

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
    if (i === 0) {
      ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    } else {
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
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
  ctx.strokeStyle = "rgba(74, 45, 110,0.04)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Slow hexagon
  ctx.save(); ctx.rotate(t * 0.04);
  poly(ctx, 6, R, "rgba(98, 228, 200,0.04)");
  ctx.restore();

  // Two counter-rotating triangles (Star of David sigil)
  ctx.save(); ctx.rotate(t * 0.07);
  poly(ctx, 3, R * 0.88, "rgba(200, 57, 46,0.055)");
  ctx.restore();
  ctx.save(); ctx.rotate(-t * 0.07 + Math.PI);
  poly(ctx, 3, R * 0.88, "rgba(74, 45, 110,0.055)");
  ctx.restore();

  // Inner circle
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.32, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(200, 57, 46,0.07)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // 3 orbital dots
  for (let i = 0; i < 3; i++) {
    const a = t * 0.06 + (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * R * 0.62, Math.sin(a) * R * 0.62, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(98, 228, 200,0.28)";
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
    ctx.strokeStyle = `rgba(98, 228, 200,${0.025 + 0.04 * (i / 10)})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Vertical lines converging to vanishing point
  for (let i = 0; i <= 12; i++) {
    ctx.beginPath();
    ctx.moveTo(w / 2, vpY); ctx.lineTo((i / 12) * w, h);
    ctx.strokeStyle = "rgba(74, 45, 110,0.025)";
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Moving sweep line
  const st = (t * 0.15) % 1;
  const sy = vpY + Math.pow(st, 2) * (h - vpY);
  ctx.beginPath();
  ctx.moveTo(0, sy); ctx.lineTo(w, sy);
  ctx.strokeStyle = `rgba(98, 228, 200,${0.10 * (1 - st)})`;
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
    grad.addColorStop(0, "rgba(74, 45, 110,0.0)");
    grad.addColorStop(0.6, "rgba(74, 45, 110,0.02)");
    grad.addColorStop(1, "rgba(74, 45, 110,0.05)");
    ctx.fillStyle = grad;
    ctx.fillRect(mx - m.w / 2, h - mh, m.w, mh);
    ctx.strokeStyle = "rgba(98, 228, 200,0.04)";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(mx - m.w / 2, h - mh, m.w, mh);
  }
  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AmbientVisualSystem() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const onThreshold = usePathname() === "/";
  // User toggle: when ambient visuals are off, the animation loop never starts.
  const [enabled, setEnabled] = useState<boolean>(() => getAmbient() === "on");

  useEffect(() => subscribeAppearance(() => setEnabled(getAmbient() === "on")), []);

  useEffect(() => {
    // User disabled ambient visuals → don't run.
    if (!enabled || !onThreshold) return;
    // Respect reduced-motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mobile = window.innerWidth < 768;
    let particles: Particle[] = [];
    let t = 0, lastT = performance.now();
    let mx = -999, my = -999;
    let rafId = 0;
    let w = 0, h = 0;

    function init() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
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

      // Particles
      for (const p of particles) { p.tick(dt, w, h, mx, my); p.draw(ctx!); }

      rafId = requestAnimationFrame(frame);
    }

    function onMouse(e: MouseEvent) { mx = e.clientX; my = e.clientY; }
    function onResize() { init(); }
    function onVis() {
      if (document.hidden || paused) {
        cancelAnimationFrame(rafId);
      } else {
        lastT = performance.now();
        rafId = requestAnimationFrame(frame);
      }
    }

    // The app scrolls #terminal-scroll, not the window. Past the threshold
    // (~90% of a viewport) the layer fades out and the RAF loop stops.
    const scroller = document.getElementById("terminal-scroll");
    let paused = false;
    function onScroll() {
      const past = (scroller?.scrollTop ?? 0) > window.innerHeight * 0.9;
      if (wrapRef.current) wrapRef.current.style.opacity = past ? "0" : "1";
      if (past && !paused) { paused = true; cancelAnimationFrame(rafId); }
      else if (!past && paused) { paused = false; lastT = performance.now(); rafId = requestAnimationFrame(frame); }
    }

    init();
    rafId = requestAnimationFrame(frame);
    scroller?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouse);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
      document.removeEventListener("visibilitychange", onVis);
      scroller?.removeEventListener("scroll", onScroll);
    };
  }, [enabled, onThreshold]);

  if (!onThreshold) return null;

  return (
    // mix-blend-mode: screen makes the near-black canvas background transparent
    // while glyph/particle pixels show as additive color overlays on the UI.
    // pointer-events: none keeps all clicks/scroll passing through to content.
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="ambient-canvas"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        overflow: "hidden",
        mixBlendMode: "screen",
        transition: "opacity 400ms cubic-bezier(.2,.7,.2,1)",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
