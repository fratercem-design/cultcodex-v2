"use client";

import { useEffect, useState } from "react";
import { RANKS, type RankId } from "@/lib/rankings/ranks";

const STORAGE_KEY = "cc_seen_rank";

function indexOfRank(id: string): number {
  return RANKS.findIndex((r) => r.id === id);
}

interface Props {
  currentRankId: RankId;
}

/**
 * Celebratory toast shown when the viewer's rank is higher than the last
 * rank they saw (tracked in localStorage). First-ever view is recorded
 * silently — no toast. Pure client; safe to mount on the rank page.
 */
export function RankUpToast({ currentRankId }: Props) {
  const [shown, setShown] = useState<RankId | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }
    const curIdx = indexOfRank(currentRankId);
    if (curIdx < 0) return;

    if (stored === null) {
      // First visit — record silently.
      try { window.localStorage.setItem(STORAGE_KEY, currentRankId); } catch {}
      return;
    }
    if (indexOfRank(stored) < curIdx) {
      try { window.localStorage.setItem(STORAGE_KEY, currentRankId); } catch {}
      // Defer to next frame so the celebratory toast animates in rather
      // than rendering synchronously inside the effect.
      const id = requestAnimationFrame(() => setShown(currentRankId));
      return () => cancelAnimationFrame(id);
    }
  }, [currentRankId]);

  if (!shown) return null;
  const rank = RANKS.find((r) => r.id === shown);
  if (!rank) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-[70] animate-fadeIn"
      style={{ maxWidth: 320 }}
    >
      <div
        className="relative rounded-2xl border p-5 text-center overflow-hidden"
        style={{
          borderColor: `${rank.hex}66`,
          background: "linear-gradient(180deg, #0c0018 0%, #060010 100%)",
          boxShadow: `0 0 30px ${rank.hex}40, 0 0 60px ${rank.hex}20`,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${rank.hex}22 0%, transparent 60%)` }}
        />
        <button
          onClick={() => setShown(null)}
          aria-label="Dismiss"
          className="absolute top-2 right-3 flex h-6 w-6 items-center justify-center font-mono text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          ✕
        </button>
        <div className="relative space-y-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-text-muted/60">
            {"/// rank_ascended"}
          </p>
          <div
            className="text-4xl"
            style={{ color: rank.hex, textShadow: `0 0 24px ${rank.hex}88` }}
            aria-hidden="true"
          >
            {rank.glyph}
          </div>
          <p className="font-display text-lg font-bold text-white">
            You are now {rank.title}.
          </p>
          <p className="font-mono text-[11px] text-text-muted leading-relaxed">{rank.blurb}</p>
        </div>
      </div>
    </div>
  );
}
