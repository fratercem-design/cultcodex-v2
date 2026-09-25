"use client";

import { useCallback, useEffect, useState } from "react";
import "./threshold-hero.css";

const THRESHOLD_SEEN_KEY = "ccx.threshold.seen";

interface ThresholdHeroProps {
  /** e.g. "2026.07.10" — the date the counts below are true as of */
  dateLabel: string;
  /** null when the archive can't be read — shown as a dash, never as 0 */
  episodeCount: number | null;
  transcribedPct: number | null;
  /** next/font variable classes for Bodoni Moda */
  fontClass?: string;
}

/**
 * The Threshold — the one authored ritual moment on the site.
 *
 * Ritual Research Instrument rules (2026-09 audit):
 *   - Say what this is before asking anyone to decode it: a plain one-liner
 *     sits directly under "the Codex."
 *   - No fake telemetry (TX ids, "UPLINK STABLE", "TLS/1.3"). The band is a
 *     plain eyebrow; the meta row carries real counts with an "as of" date.
 *   - No key hijacking. SPACE / Enter / ArrowDown used to be intercepted to
 *     scroll 900px, which broke the browser's own behaviour. The page simply
 *     scrolls; the button is an optional shortcut.
 * Returning visitors still get the compact band.
 */
export function ThresholdHero({
  dateLabel,
  episodeCount,
  transcribedPct,
  fontClass = "",
}: ThresholdHeroProps) {
  const [compact, setCompact] = useState(false);

  // Returning visitors get a band instead of a full screen. Read after mount,
  // never during render: touching localStorage while rendering would make the
  // server and client markup disagree.
  useEffect(() => {
    try {
      // Reading the persisted client-only preference requires a post-mount update.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(THRESHOLD_SEEN_KEY)) setCompact(true);
    } catch {
      // Private mode or blocked storage - fall back to the full threshold.
    }
  }, []);

  const enter = useCallback(() => {
    try {
      localStorage.setItem(THRESHOLD_SEEN_KEY, "1");
    } catch {
      // Non-fatal - they simply see the full threshold again next time.
    }
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("codex-enter")?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  return (
    <section
      className={`threshold ${compact ? "threshold--compact" : ""} ${fontClass}`}
      aria-label="CultCodex — the Cult of Psyche archive"
    >
      <div className="threshold__band">
        <span className="threshold__mono">{"///"} the Cult of Psyche archive</span>
      </div>

      <div className="threshold__center">
        <div className="threshold__sigil" aria-hidden="true">
          <span className="threshold__ring" />
          <span className="threshold__ring threshold__ring--inner" />
          <span className="threshold__glyph">◣</span>
        </div>

        <p className="threshold__kicker">You are entering</p>
        {/* p, not h1 — the page's real <h1> lives in the hero below; two h1s hurt SEO */}
        <p className="threshold__title">
          <em>the Codex.</em>
        </p>
        <p className="threshold__lede">
          Every episode of Cult of Psyche — searchable to the second.
        </p>

        <dl className="threshold__meta">
          <div>
            <dt>Episodes</dt>
            <dd>{episodeCount === null ? "—" : episodeCount.toLocaleString("en-US")}</dd>
          </div>
          <div className="threshold__meta-div" aria-hidden="true" />
          <div>
            <dt>Transcribed</dt>
            <dd>{transcribedPct === null ? "—" : `${transcribedPct}%`}</dd>
          </div>
          <div className="threshold__meta-div" aria-hidden="true" />
          <div>
            <dt>As of</dt>
            <dd>{dateLabel}</dd>
          </div>
        </dl>
      </div>

      <button type="button" className="threshold__enter" onClick={enter}>
        <span className="threshold__enter-label">Enter the archive</span>
        <span className="threshold__enter-chevron" aria-hidden="true">
          ↓
        </span>
      </button>
    </section>
  );
}
