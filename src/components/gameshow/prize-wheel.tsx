"use client";

import { useCallback, useState } from "react";
import { WHEEL, spinWheel, setActiveTitle, type ProgressState, type Prize } from "./progression";

const SEG = 360 / WHEEL.length;
const SEG_COLORS = ["#4A2D6E", "#0C0B11", "#C8392E", "#0C0B11", "#4A2D6E", "#C8392E", "#0C0B11"];
const SEG_LABELS = ["+25", "+100", "✦", "TITLE", "+50", "🎡", "+10"];

export function PrizeWheel({ progress, onUpdate, onPrize }: {
  progress: ProgressState;
  onUpdate: (s: ProgressState) => void;
  onPrize: (p: Prize) => void;
}) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Prize | null>(null);

  const doSpin = useCallback(() => {
    if (spinning || progress.spins <= 0) return;
    const res = spinWheel();
    if (!res) return;
    setSpinning(true);
    setResult(null);
    // Land the chosen segment's center at the top pointer, plus 5 full turns.
    const target = 360 * 5 - (res.index * SEG + SEG / 2);
    setRotation((r) => Math.floor(r / 360) * 360 + target);
    window.setTimeout(() => {
      setSpinning(false);
      setResult(res.prize);
      onUpdate(res.state);
      onPrize(res.prize);
    }, 3200);
  }, [spinning, progress.spins, onUpdate, onPrize]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-accent-gold/30 bg-surface/60 p-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/gameshow/closing.webp" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-[0.12]" />
      <div className="absolute inset-0 bg-gradient-to-b from-void/85 via-void/80 to-void/90" />
      <div className="relative space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">{"/// the_prize_wheel"}</p>
        <span className="font-mono text-[12px] text-text-muted">🎡 {progress.spins} spin{progress.spins === 1 ? "" : "s"} · earn one every 5 correct</span>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="relative h-52 w-52">
          {/* pointer */}
          <div className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2 text-accent-gold-text text-xl drop-shadow">▼</div>
          <svg viewBox="0 0 100 100" className="h-full w-full" style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 3.1s cubic-bezier(0.17,0.67,0.12,0.99)" : "none" }}>
            {WHEEL.map((_, i) => {
              const a0 = (i * SEG - 90) * (Math.PI / 180);
              const a1 = ((i + 1) * SEG - 90) * (Math.PI / 180);
              const x0 = 50 + 48 * Math.cos(a0), y0 = 50 + 48 * Math.sin(a0);
              const x1 = 50 + 48 * Math.cos(a1), y1 = 50 + 48 * Math.sin(a1);
              const mid = (i * SEG + SEG / 2 - 90) * (Math.PI / 180);
              const lx = 50 + 30 * Math.cos(mid), ly = 50 + 30 * Math.sin(mid);
              return (
                <g key={i}>
                  <path d={`M50 50 L${x0} ${y0} A48 48 0 0 1 ${x1} ${y1} Z`} fill={SEG_COLORS[i % SEG_COLORS.length]} stroke="#C8A96B" strokeWidth="0.4" opacity="0.92" />
                  <text x={lx} y={ly} fill="#EBE3D2" fontSize="6" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${i * SEG + SEG / 2}, ${lx}, ${ly})`}>{SEG_LABELS[i]}</text>
                </g>
              );
            })}
            <circle cx="50" cy="50" r="6" fill="#C8392E" stroke="#C8A96B" strokeWidth="0.6" />
          </svg>
        </div>

        <button
          onClick={doSpin}
          disabled={spinning || progress.spins <= 0}
          className="rounded-lg border border-accent-gold/60 bg-accent-gold/15 px-8 py-3 font-display text-base font-bold text-accent-gold-text hover:bg-accent-gold/25 hover:scale-[1.04] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 transition-all shadow-[0_0_24px_-8px_rgba(200,57,46,0.6)]"
        >
          {spinning ? "spinning…" : progress.spins > 0 ? "🎡 SPIN" : "No spins — go play"}
        </button>
        {result && !spinning && (
          <p className="animate-[fadein_0.3s] font-display text-lg font-bold text-accent-cyan">🎉 {result.label}</p>
        )}
      </div>

      {/* Vault of titles */}
      {progress.titles.length > 0 && (
        <div className="border-t border-border pt-3 space-y-2">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">{`/// wear_a_title · ${progress.titles.length} won`}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onUpdate(setActiveTitle(""))} className={`rounded border px-2.5 py-1 font-mono text-[12px] transition-all ${progress.activeTitle === "" ? "border-accent-violet/50 bg-accent-violet/10 text-accent-violet-text" : "border-border text-text-muted hover:text-accent-violet-text"}`}>none</button>
            {progress.titles.map((t) => (
              <button key={t} onClick={() => onUpdate(setActiveTitle(t))} className={`rounded border px-2.5 py-1 font-mono text-[12px] transition-all ${progress.activeTitle === t ? "border-accent-gold/50 bg-accent-gold/10 text-accent-gold-text" : "border-border text-text-muted hover:text-accent-gold-text"}`}>{t}</button>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
