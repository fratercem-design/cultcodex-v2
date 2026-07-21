"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ROUND_EMBLEMS } from "./emblems";

// Per-round accent color (flows into the emblem via currentColor).
const ROUND_COLOR: Record<string, string> = {
  "real-or-fake-lore": "text-accent-violet",
  "two-truths-lie": "text-accent-cyan",
  "prophecy-or-bogus": "text-accent-gold",
  "did-psyche-say-it": "text-accent-violet",
  "codex-cluedo": "text-accent-gold",
};

type MC = {
  id: string; round: string; type: "multiple-choice";
  prompt: string; options: string[]; answerIndex: number; explain: string; sourceHref?: string;
};
type TTL = {
  id: string; round: string; type: "two-truths-lie";
  prompt: string; statements: { text: string; real: boolean; slug?: string }[]; answerIndex: number; explain: string;
};
type Clue = {
  id: string; round: string; type: "clue";
  prompt: string; suspects: string[]; locations: string[]; artifacts: string[];
  solution: { suspect: string; location: string; artifact: string }; explain: string;
};
type Q = MC | TTL | Clue;
type Round = { key: string; label: string; icon: string };
export type GameShowBank = { total: number; rounds: Round[]; questions: Q[] };

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function GameShow({ bank }: { bank: GameShowBank }) {
  const [roundKey, setRoundKey] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const pool = useMemo(
    () => (roundKey ? bank.questions.filter((q) => q.round === roundKey) : bank.questions),
    [bank.questions, roundKey]
  );
  const q = pool[idx];

  const next = useCallback(() => { setRevealed(false); setIdx((i) => (i + 1) % pool.length); }, [pool.length]);
  const prev = useCallback(() => { setRevealed(false); setIdx((i) => (i - 1 + pool.length) % pool.length); }, [pool.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!roundKey && !q) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); revealed ? next() : setRevealed(true); }
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key.toLowerCase() === "r") setRevealed((r) => !r);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, next, prev, roundKey, q]);

  // ── Round select (the lobby) ──
  if (!roundKey) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {bank.rounds.map((r) => {
            const count = bank.questions.filter((x) => x.round === r.key).length;
            const Emblem = ROUND_EMBLEMS[r.key];
            return (
              <button
                key={r.key}
                onClick={() => { setRoundKey(r.key); setIdx(0); setRevealed(false); }}
                className="group flex items-center gap-4 rounded-lg border border-accent-violet/25 bg-surface p-5 text-left hover:border-accent-violet/60 hover:bg-accent-violet/5 transition-all"
              >
                {Emblem
                  ? <Emblem size={44} className={`flex-shrink-0 ${ROUND_COLOR[r.key] ?? "text-accent-violet"}`} />
                  : <span className="text-3xl" aria-hidden>{r.icon}</span>}
                <span>
                  <span className="block font-display text-lg font-bold text-text-primary group-hover:text-accent-violet transition-colors">{r.label}</span>
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-text-muted/60">{count} questions</span>
                </span>
              </button>
            );
          })}
          <button
            onClick={() => { setRoundKey("__all"); setIdx(0); setRevealed(false); }}
            className="group flex items-center gap-4 rounded-lg border border-accent-gold/30 bg-accent-gold/5 p-5 text-left hover:border-accent-gold/60 hover:bg-accent-gold/10 transition-all"
          >
            <span className="text-3xl" aria-hidden>🎲</span>
            <span>
              <span className="block font-display text-lg font-bold text-text-primary group-hover:text-accent-gold transition-colors">The Whole Deck</span>
              <span className="block font-mono text-[10px] uppercase tracking-widest text-text-muted/60">all {bank.total} questions</span>
            </span>
          </button>
        </div>
        <p className="text-center font-mono text-[10px] text-text-muted/60 leading-relaxed">
          Screen-share this in OBS / StreamYard. Chat answers with a letter.
          <br className="hidden sm:block" />
          <span className="text-accent-violet">Space</span> reveals &amp; advances · <span className="text-accent-violet">← →</span> navigate · <span className="text-accent-violet">R</span> toggles the answer.
        </p>
      </div>
    );
  }

  const activePool = roundKey === "__all" ? bank.questions : pool;
  const cur = activePool[idx];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Control bar */}
      <div className="mb-6 flex items-center justify-between gap-3 border-b border-border pb-3">
        <button onClick={() => { setRoundKey(null); setIdx(0); setRevealed(false); }} className="font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-accent-violet transition-colors">
          ← Rounds
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-violet/60">
          {bank.rounds.find((r) => r.key === roundKey)?.label ?? "The Whole Deck"} · {idx + 1}/{activePool.length}
        </span>
        <div className="flex gap-2">
          <button onClick={prev} className="rounded border border-border px-2.5 py-1 font-mono text-xs text-text-muted hover:border-accent-violet/40 hover:text-accent-violet transition-colors">←</button>
          <button onClick={next} className="rounded border border-border px-2.5 py-1 font-mono text-xs text-text-muted hover:border-accent-violet/40 hover:text-accent-violet transition-colors">→</button>
        </div>
      </div>

      {cur && <QuestionCard q={cur} revealed={revealed} onReveal={() => setRevealed(true)} onNext={next} />}
    </div>
  );
}

function OptionRow({ letter, text, state }: { letter: string; text: string; state: "idle" | "correct" | "wrong" }) {
  const cls =
    state === "correct" ? "border-emerald-400/60 bg-emerald-400/10 text-text-primary"
    : state === "wrong" ? "border-border bg-surface text-text-muted/50 line-through"
    : "border-border bg-surface text-text-primary";
  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 transition-all ${cls}`}>
      <span className={`font-mono text-sm font-bold ${state === "correct" ? "text-emerald-400" : "text-accent-violet/70"}`}>{letter}</span>
      <span className="text-base sm:text-lg leading-snug">{text}</span>
    </div>
  );
}

function QuestionCard({ q, revealed, onReveal, onNext }: { q: Q; revealed: boolean; onReveal: () => void; onNext: () => void }) {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl sm:text-2xl font-bold text-text-primary leading-tight">{q.prompt}</h2>

      {q.type === "multiple-choice" && (
        <div className="space-y-2.5">
          {q.options.map((opt, i) => (
            <OptionRow key={i} letter={LETTERS[i]} text={opt} state={!revealed ? "idle" : i === q.answerIndex ? "correct" : "wrong"} />
          ))}
        </div>
      )}

      {q.type === "two-truths-lie" && (
        <div className="space-y-2.5">
          {q.statements.map((s, i) => (
            <OptionRow key={i} letter={LETTERS[i]} text={s.text}
              state={!revealed ? "idle" : i === q.answerIndex ? "correct" : "idle"} />
          ))}
          {revealed && <p className="font-mono text-[11px] uppercase tracking-widest text-red-400">↑ {LETTERS[q.answerIndex]} is the lie</p>}
        </div>
      )}

      {q.type === "clue" && (
        <div className="grid gap-4 sm:grid-cols-3">
          {([["SUSPECT", q.suspects, q.solution.suspect], ["LOCATION", q.locations, q.solution.location], ["ARTIFACT", q.artifacts, q.solution.artifact]] as const).map(([label, opts, sol]) => (
            <div key={label} className="space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold/60">{label}</p>
              {opts.map((o, i) => (
                <div key={i} className={`rounded border px-3 py-2 text-sm transition-all ${revealed && o === sol ? "border-emerald-400/60 bg-emerald-400/10 text-text-primary" : "border-border bg-surface text-text-muted"}`}>
                  <span className="font-mono text-[10px] text-accent-violet/60 mr-2">{LETTERS[i]}</span>{o}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Reveal / explanation */}
      {revealed ? (
        <div className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 p-4 space-y-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold">{"/// the_codex_rules"}</p>
          <p className="text-sm text-text-muted leading-relaxed">{q.explain}</p>
          {"sourceHref" in q && q.sourceHref && (
            <Link href={q.sourceHref} className="inline-block font-mono text-[10px] text-accent-violet hover:underline">
              See it in the archive →
            </Link>
          )}
          <div className="pt-1">
            <button onClick={onNext} className="rounded border border-accent-violet/50 bg-accent-violet/10 px-5 py-2 font-mono text-xs font-bold text-accent-violet hover:bg-accent-violet/20 transition-colors">
              Next question →
            </button>
          </div>
        </div>
      ) : (
        <button onClick={onReveal} className="w-full rounded-lg border border-accent-violet/50 bg-accent-violet/10 py-3.5 font-mono text-sm font-bold uppercase tracking-widest text-accent-violet hover:bg-accent-violet/20 transition-colors">
          Reveal the answer ⏎
        </button>
      )}
    </div>
  );
}
