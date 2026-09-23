"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Routes that already carry the "Start here" invitation in their own content.
// Repeating it in a banner above them was pure chrome (2026-09 audit, SH-03).
const HIDDEN_ON = new Set(["/", "/start-here"]);

const STORAGE_KEY = "codex_entry_banner_dismissed";

export function EntryBanner({ episodeCount }: { episodeCount: string }) {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisible(true);
      }
    } catch {
      // storage blocked — skip banner
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible || HIDDEN_ON.has(pathname ?? "")) return null;

  return (
    <div
      role="banner"
      className="relative z-40 border-b border-accent-gold/20 bg-void/95 backdrop-blur-sm px-4 py-2.5"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <p className="font-mono text-[12px] text-text-muted leading-relaxed">
          <span className="text-accent-gold-text font-bold">{"///"}</span>{" "}
          First time here?{" "}
          <span className="text-text-primary">Pick a doorway — six ways into {episodeCount} episodes.</span>{" "}
          <Link
            href="/start-here"
            className="text-accent-gold-text underline underline-offset-2 hover:text-accent-gold-text/80 transition-colors"
          >
            Start here →
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          /* The glyph alone measured ~11x18 CSS px; WCAG 2.2 Target Size
             (Minimum) asks for 24x24. The box is sized here rather than the
             glyph so the hit area grows without enlarging the ×. */
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-text-muted hover:text-text-primary transition-colors text-lg leading-none"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}
