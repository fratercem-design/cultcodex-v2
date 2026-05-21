"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "codex_entry_banner_dismissed";

export function EntryBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
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

  if (!visible) return null;

  return (
    <div
      role="banner"
      className="relative z-40 border-b border-accent-gold/20 bg-void/95 backdrop-blur-sm px-4 py-2.5"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <p className="font-mono text-[11px] text-text-muted leading-relaxed">
          <span className="text-accent-gold font-bold">///</span>{" "}
          First time here?{" "}
          <span className="text-text-primary">Pick a doorway — five ways into 2,600+ episodes.</span>{" "}
          <Link
            href="/start-here"
            className="text-accent-gold underline underline-offset-2 hover:text-accent-gold/80 transition-colors"
          >
            Start here →
          </Link>
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 text-text-muted/50 hover:text-text-muted transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
