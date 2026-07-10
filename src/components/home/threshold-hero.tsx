"use client";

import { useCallback, useEffect, useRef } from "react";
import "./threshold-hero.css";

interface ThresholdHeroProps {
  /** e.g. "TX-20260710" */
  txId: string;
  /** e.g. "2026.07.10" */
  dateLabel: string;
  episodeCount: number;
  transcribedPct: number;
  /** next/font variable classes for Bodoni Moda + Cinzel */
  fontClass?: string;
}

/**
 * The Threshold — a full-viewport cinematic opening.
 *
 * Implements Ch. II §01 + Ch. VII of the Visual Audit Dossier: the "you have
 * arrived" moment the audit flagged as entirely missing. A single rotating
 * sigil (two counter-rotating rings — never one), a staggered title reveal,
 * and a keyboard/scroll affordance to enter. Pure-CSS entrance so it renders
 * on first paint; JS only wires SPACE/scroll and honours reduced-motion.
 */
export function ThresholdHero({
  txId,
  dateLabel,
  episodeCount,
  transcribedPct,
  fontClass = "",
}: ThresholdHeroProps) {
  const rootRef = useRef<HTMLElement>(null);

  const enter = useCallback(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const target = document.getElementById("codex-enter");
    if (target) {
      target.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
    } else {
      window.scrollTo({
        top: window.innerHeight,
        behavior: reduce ? "auto" : "smooth",
      });
    }
  }, []);

  // Keyboard: SPACE / ↓ / Enter cross the threshold — but only while it still
  // owns the viewport, so we don't hijack the spacebar once the user is reading.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (window.scrollY > window.innerHeight * 0.5) return;
      if (e.key === " " || e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        enter();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enter]);

  return (
    <section
      ref={rootRef}
      className={`threshold ${fontClass}`}
      aria-label="CultCodex — the threshold"
    >
      <div className="threshold__band">
        <span className="threshold__mono">{txId}</span>
        <span className="threshold__pip">
          <span className="threshold__pip-dot" aria-hidden="true" /> UPLINK STABLE
        </span>
        <span className="threshold__mono threshold__mono--dim">TLS/1.3</span>
      </div>

      <div className="threshold__center">
        <div className="threshold__sigil" aria-hidden="true">
          <span className="threshold__ring" />
          <span className="threshold__ring threshold__ring--inner" />
          <span className="threshold__glyph">◣</span>
        </div>

        <p className="threshold__kicker">You are entering</p>
        <h1 className="threshold__title">
          <em>the Codex.</em>
        </h1>

        <dl className="threshold__meta">
          <div>
            <dt>Transmissions</dt>
            <dd>{episodeCount.toLocaleString()}</dd>
          </div>
          <div className="threshold__meta-div" aria-hidden="true" />
          <div>
            <dt>Transcribed</dt>
            <dd>{transcribedPct}%</dd>
          </div>
          <div className="threshold__meta-div" aria-hidden="true" />
          <div>
            <dt>Sealed</dt>
            <dd>{dateLabel}</dd>
          </div>
        </dl>
      </div>

      <button type="button" className="threshold__enter" onClick={enter}>
        <span className="threshold__enter-label">
          <span className="threshold__enter-key">press SPACE to enter</span>
          <span className="threshold__enter-scroll">scroll to enter</span>
        </span>
        <span className="threshold__enter-chevron" aria-hidden="true">
          ↓
        </span>
      </button>
    </section>
  );
}
