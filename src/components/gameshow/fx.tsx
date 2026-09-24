"use client";

import { useEffect, useRef } from "react";

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; rot: number; vr: number };

const PALETTES: Record<string, string[]> = {
  correct: ["#62E4C8", "#34d399", "#EBE3D2", "#C8A96B"],
  wrong: ["#C8392E", "#7f1d1d", "#4A2D6E", "#EBE3D2"],
  gold: ["#C8392E", "#C8A96B", "#EBE3D2", "#4A2D6E"],
};

/**
 * SparkBurst — a lightweight canvas particle burst that fires whenever `trigger`
 * changes. `variant` picks the palette. Respects prefers-reduced-motion. Sits
 * as a full-screen, non-interactive overlay; self-clears when particles die.
 */
export function SparkBurst({ trigger, variant = "correct" }: { trigger: number; variant?: keyof typeof PALETTES }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const partsRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.42;
    const palette = PALETTES[variant] ?? PALETTES.correct;
    const count = variant === "wrong" ? 42 : 90;
    const spread = variant === "wrong" ? 5.5 : 9;

    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * spread;
      partsRef.current.push({
        x: cx, y: cy,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 3,
        life: 0, max: 50 + Math.random() * 40,
        size: 2 + Math.random() * 4,
        color: palette[(Math.random() * palette.length) | 0],
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
      });
    }

    const step = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const parts = partsRef.current;
      for (const p of parts) {
        p.life++;
        p.vy += 0.16; // gravity
        p.vx *= 0.985;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        const t = 1 - p.life / p.max;
        if (t <= 0) continue;
        ctx.save();
        ctx.globalAlpha = Math.max(0, t);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
        ctx.restore();
      }
      partsRef.current = parts.filter((p) => p.life < p.max);
      if (partsRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [trigger, variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
