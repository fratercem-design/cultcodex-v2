"use client";

import { useState } from "react";
import Link from "next/link";

const EXCHANGES = [
  {
    q: "What's Beetle's core behavioral pattern across appearances?",
    a: "Across documented appearances, Beetle follows a consistent three-phase arc: initial warmth and agreement, a pivot to destabilization when direct challenge arises, then withdrawal framed as philosophical distance. The destabilization move is almost always the same — a rapid reframe of the host's premise as a personal failing rather than a factual disagreement. In over half of appearances, this is preceded by three rapid topic changes before the pivot lands. The pattern holds across wildly different panel compositions, which suggests it's structural, not reactive.",
    citations: ["People / Beetle", "47+ episodes", "Behavioral signature"],
  },
  {
    q: "Has anyone ever successfully pushed back against Psyche and held their ground?",
    a: "Three figures maintain sustained counter-framing across multiple appearances without conceding or being absorbed. The most consistent is someone who reframes Psyche's framing before responding — never engaging the premise directly, always replacing it. A second figure uses extended silence as leverage; Psyche fills the silence almost every time, revealing the structure of what she actually wanted to say. The third wins by agreeing completely and then making the agreed-upon point collapse under its own logic. All three share a single trait: they never defend.",
    citations: ["Episode archive", "Behavioral analysis", "Pattern extraction"],
  },
  {
    q: "What recurring dynamic appears most often when panels go off-script?",
    a: "When the structure of a panel breaks down — a guest goes silent, a fight starts, or someone leaves — the same thing happens: Psyche doesn't rescue the situation, she observes it. This observation-over-intervention posture recurs in documented breakdown moments. The effect is that the chaos becomes content, which may be the actual design. Secondary pattern: the person who tries to restore order (smooth things over, redirect, defuse) almost always loses status in the exchange. Intervention is punished; witnessing is rewarded. The archive documents this across multi-hour sessions.",
    citations: ["Panel dynamics", "Behavioral archive", "600+ sessions"],
  },
];

export function OracleExampleExchanges() {
  const [open, setOpen] = useState(0);

  return (
    <div className="space-y-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-accent-violet-text/50 text-center">
        {"/// oracle_sample_transmissions"}
      </p>
      <p className="text-center font-mono text-[11px] text-text-muted/60 mb-4">
        This is what the Oracle does. Your questions. Real archive.
      </p>

      <div className="space-y-2">
        {EXCHANGES.map((ex, i) => (
          <div
            key={i}
            className={`rounded-xl border transition-all duration-300 ${
              open === i
                ? "border-accent-violet/40 bg-surface/90"
                : "border-border bg-surface/60 hover:border-accent-violet/20"
            }`}
          >
            {/* Question row */}
            <button
              onClick={() => setOpen(open === i ? -1 : i)}
              className="w-full flex items-start gap-3 px-5 py-4 text-left"
            >
              <span className="mt-0.5 shrink-0 font-mono text-[9px] text-accent-violet-text/50 uppercase tracking-widest pt-0.5">Q</span>
              <span className="font-mono text-xs text-text-primary leading-relaxed flex-1">{ex.q}</span>
              <span className={`shrink-0 font-mono text-[10px] text-accent-violet-text/40 transition-transform ${open === i ? "rotate-180" : ""}`}>▾</span>
            </button>

            {/* Answer */}
            {open === i && (
              <div className="px-5 pb-5 space-y-4 border-t border-border/50">
                <div className="flex gap-3 pt-4">
                  <span className="mt-0.5 shrink-0 font-mono text-[9px] text-accent-cyan/60 uppercase tracking-widest">◈</span>
                  <p className="font-serif text-sm leading-relaxed text-text-primary">{ex.a}</p>
                </div>
                <div className="flex flex-wrap gap-2 pl-5">
                  {ex.citations.map((c) => (
                    <span
                      key={c}
                      className="rounded border border-accent-violet/15 bg-void px-2 py-0.5 font-mono text-[9px] text-text-muted/60"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-center font-mono text-[10px] text-text-muted/60 pt-2">
        These are synthesized from the actual archive. Your questions will be too.
      </p>
    </div>
  );
}
