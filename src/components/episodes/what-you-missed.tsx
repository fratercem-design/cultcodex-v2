"use client";

import { useState } from "react";
import Link from "next/link";

interface ManipulationSignal {
  tactic: string;
  who: string;
  evidence: string;
}

interface PowerDynamics {
  shifts: string[];
}

interface DecodeData {
  manipulation_signals?: ManipulationSignal[];
  power_dynamics?: PowerDynamics;
  key_patterns?: string[];
}

interface WhatYouMissedProps {
  decodeData: DecodeData | null;
  isUnlocked: boolean;
  isAuthenticated: boolean;
  episodeSlug: string;
}

export function WhatYouMissed({ decodeData, isUnlocked, isAuthenticated, episodeSlug }: WhatYouMissedProps) {
  const [expanded, setExpanded] = useState(false);

  if (!decodeData) return null;

  const signals = decodeData.manipulation_signals ?? [];
  const shifts = decodeData.power_dynamics?.shifts ?? [];
  const patterns = decodeData.key_patterns ?? [];

  const totalMissed = signals.length + shifts.length + patterns.length;
  if (totalMissed === 0) return null;

  const label =
    totalMissed === 1
      ? "1 hidden signal detected"
      : `${totalMissed} hidden signals detected`;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-surface overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-amber-500/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-base text-amber-400">⚠</span>
          <div>
            <p className="font-mono text-xs font-bold text-amber-400">What You Missed</p>
            <p className="font-mono text-[12px] text-text-muted mt-0.5">{label}</p>
          </div>
        </div>
        <span className="font-mono text-xs text-text-muted">{expanded ? "hide −" : "show +"}</span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-amber-500/20">
          {!isUnlocked ? (
            /* Locked — show count, hide detail */
            <div className="space-y-3 py-2">
              <p className="text-sm text-text-muted leading-relaxed">
                Decode Mode found <span className="text-amber-400 font-bold">{signals.length} manipulation tactic{signals.length !== 1 ? "s" : ""}</span>,{" "}
                <span className="text-amber-400 font-bold">{shifts.length} power shift{shifts.length !== 1 ? "s" : ""}</span>, and{" "}
                <span className="text-amber-400 font-bold">{patterns.length} recurring pattern{patterns.length !== 1 ? "s" : ""}</span>{" "}
                in this episode that most people don&apos;t consciously register.
              </p>
              <div className="flex flex-wrap gap-2">
                {!isAuthenticated && (
                  <Link
                    href="/api/auth/signin"
                    className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 font-mono text-xs text-text-muted hover:text-text-primary transition-colors"
                  >
                    Sign in
                  </Link>
                )}
                <Link
                  href="/premium#access"
                  className="inline-flex items-center gap-2 rounded border border-amber-500/40 bg-amber-500/10 px-4 py-2 font-mono text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  Get Decode Mode — $10/mo →
                </Link>
              </div>
            </div>
          ) : (
            /* Unlocked — show the goods */
            <div className="space-y-4">
              {signals.length > 0 && (
                <div className="space-y-2">
                  <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">
                    Manipulation Tactics ({signals.length})
                  </p>
                  {signals.map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded border border-red-500/20 bg-red-500/5 px-3 py-2.5">
                      <span className="font-mono text-[12px] text-red-400 mt-0.5">▸</span>
                      <div className="min-w-0">
                        <span className="font-mono text-[12px] font-bold text-red-400">{s.tactic}</span>
                        <span className="font-mono text-[12px] text-text-muted"> — {s.who}</span>
                        <p className="text-xs text-text-muted mt-0.5 italic leading-relaxed">&quot;{s.evidence}&quot;</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {shifts.length > 0 && (
                <div className="space-y-2">
                  <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">
                    Power Shifts ({shifts.length})
                  </p>
                  {shifts.map((sh, i) => (
                    <div key={i} className="flex items-start gap-2 pl-3 border-l border-accent-violet/40">
                      <p className="text-xs text-text-muted leading-relaxed">{sh}</p>
                    </div>
                  ))}
                </div>
              )}

              {patterns.length > 0 && (
                <div className="space-y-2">
                  <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">
                    Patterns Most People Miss ({patterns.length})
                  </p>
                  {patterns.map((p, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 flex-shrink-0 mt-0.5">✦</span>
                      <p className="text-xs text-text-muted leading-relaxed">{p}</p>
                    </div>
                  ))}
                </div>
              )}

              <p className="font-mono text-[12px] text-text-muted border-t border-border pt-3">
                Full analysis →{" "}
                <Link
                  href={`/episodes/${episodeSlug}?tab=decode`}
                  className="text-accent-violet-text hover:underline"
                >
                  Decode tab
                </Link>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
