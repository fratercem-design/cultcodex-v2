"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ROUND_EMBLEMS } from "./emblems";
import { ROUND_ART } from "./art-manifest";
import bankJson from "@/lib/data/gameshow-questions.json";

const ROUND_COLOR: Record<string, string> = {
  "real-or-fake-lore": "text-accent-violet",
  "two-truths-lie": "text-accent-cyan",
  "prophecy-or-bogus": "text-accent-gold",
  "did-psyche-say-it": "text-accent-violet",
  "codex-cluedo": "text-accent-gold",
  "troll-or-not": "text-accent-cyan",
  "who-is-it": "text-accent-violet",
  "general-trivia": "text-accent-gold",
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

/** Tiny Web Audio sound kit — no asset files. Lazily created on first gesture. */
function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const mutedRef = useRef(false);
  const ensure = () => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) ctxRef.current = new AC();
    }
    return ctxRef.current;
  };
  const tone = (freqs: number[], dur: number, type: OscillatorType = "sine", gain = 0.08) => {
    if (mutedRef.current) return;
    const ctx = ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type; o.frequency.value = f;
      const t0 = ctx.currentTime + i * 0.06;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t0); o.stop(t0 + dur + 0.02);
    });
  };
  return {
    select: () => tone([420], 0.08, "triangle", 0.05),
    correct: () => tone([523.25, 659.25, 783.99], 0.28, "sine", 0.09),
    wrong: () => tone([160, 120], 0.3, "sawtooth", 0.06),
    next: () => tone([300, 500], 0.1, "sine", 0.04),
    setMuted: (m: boolean) => { mutedRef.current = m; },
  };
}

// The bank is imported here (client-side) rather than passed as a prop, so the
// large question payload never crosses the server→client boundary — that huge
// serialized prop was what forced the board into a never-revealing Suspense
// boundary. Combined with the ssr:false loader, the board renders reliably.
const bank = bankJson as unknown as GameShowBank;

export function GameShow() {
  const [roundKey, setRoundKey] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const sound = useSound();
  useEffect(() => { sound.setMuted(muted); }, [muted, sound]);

  const pool = useMemo(
    () => (roundKey && roundKey !== "__all" ? bank.questions.filter((q) => q.round === roundKey) : bank.questions),
    [bank.questions, roundKey]
  );
  const q = pool[idx];

  const goto = useCallback((n: number) => { setRevealed(false); setSelected(null); setIdx(n); }, []);
  const next = useCallback(() => { sound.next(); goto((idx + 1) % pool.length); }, [idx, pool.length, goto, sound]);
  const prev = useCallback(() => { goto((idx - 1 + pool.length) % pool.length); }, [idx, pool.length, goto]);

  const reveal = useCallback(() => {
    if (revealed || !q) return;
    setRevealed(true);
    if (q.type === "clue") { sound.correct(); return; }
    const answer = q.type === "multiple-choice" ? q.answerIndex : q.answerIndex;
    if (selected == null) sound.correct();
    else if (selected === answer) sound.correct();
    else sound.wrong();
  }, [revealed, q, selected, sound]);

  const choose = useCallback((i: number) => {
    if (revealed) return;
    setSelected(i);
    sound.select();
  }, [revealed, sound]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!roundKey) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); revealed ? next() : reveal(); }
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (["1", "2", "3", "4"].includes(e.key)) choose(Number(e.key) - 1);
      else if (["a", "b", "c", "d"].includes(e.key.toLowerCase())) choose("abcd".indexOf(e.key.toLowerCase()));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, next, prev, reveal, choose, roundKey]);

  // ── Lobby ──
  if (!roundKey) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {bank.rounds.map((r) => {
            const count = bank.questions.filter((x) => x.round === r.key).length;
            const Emblem = ROUND_EMBLEMS[r.key];
            const art = ROUND_ART[r.key];
            return (
              <button
                key={r.key}
                onClick={() => { setRoundKey(r.key); goto(0); }}
                className="group relative overflow-hidden flex items-center gap-4 rounded-lg border border-accent-violet/25 bg-surface p-5 text-left hover:border-accent-violet/60 hover:bg-accent-violet/5 hover:scale-[1.015] active:scale-[0.99] transition-all"
              >
                {art && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={art} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-25 group-hover:opacity-40 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-r from-void via-void/80 to-void/40" />
                  </>
                )}
                {Emblem
                  ? <Emblem size={44} className={`relative flex-shrink-0 ${ROUND_COLOR[r.key] ?? "text-accent-violet"} transition-transform group-hover:rotate-6`} />
                  : <span className="relative text-3xl" aria-hidden>{r.icon}</span>}
                <span className="relative">
                  <span className="block font-display text-lg font-bold text-text-primary group-hover:text-accent-violet transition-colors">{r.label}</span>
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-text-muted/60">{count} questions</span>
                </span>
              </button>
            );
          })}
          <button
            onClick={() => { setRoundKey("__all"); goto(0); }}
            className="group flex items-center gap-4 rounded-lg border border-accent-gold/30 bg-accent-gold/5 p-5 text-left hover:border-accent-gold/60 hover:bg-accent-gold/10 hover:scale-[1.015] active:scale-[0.99] transition-all"
          >
            <span className="text-3xl transition-transform group-hover:rotate-12" aria-hidden>🎲</span>
            <span>
              <span className="block font-display text-lg font-bold text-text-primary group-hover:text-accent-gold transition-colors">The Whole Deck</span>
              <span className="block font-mono text-[10px] uppercase tracking-widest text-text-muted/60">all {bank.total} questions</span>
            </span>
          </button>
        </div>
        <p className="text-center font-mono text-[10px] text-text-muted/60 leading-relaxed">
          Screen-share in OBS / StreamYard. Chat calls a letter; you tap it.
          <br className="hidden sm:block" />
          <span className="text-accent-violet">A–D / 1–4</span> select · <span className="text-accent-violet">Space</span> reveal &amp; advance · <span className="text-accent-violet">← →</span> navigate.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3 border-b border-border pb-3">
        <button onClick={() => { setRoundKey(null); goto(0); }} className="font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-accent-violet transition-colors">
          ← Rounds
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-violet/60">
          {bank.rounds.find((r) => r.key === roundKey)?.label ?? "The Whole Deck"} · {idx + 1}/{pool.length}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => setMuted((m) => !m)} title={muted ? "Unmute" : "Mute"} className="rounded border border-border px-2 py-1 font-mono text-xs text-text-muted hover:border-accent-violet/40 hover:text-accent-violet transition-colors">
            {muted ? "🔇" : "🔊"}
          </button>
          <button onClick={prev} className="rounded border border-border px-2.5 py-1 font-mono text-xs text-text-muted hover:border-accent-violet/40 hover:text-accent-violet transition-colors">←</button>
          <button onClick={next} className="rounded border border-border px-2.5 py-1 font-mono text-xs text-text-muted hover:border-accent-violet/40 hover:text-accent-violet transition-colors">→</button>
        </div>
      </div>

      {q && (
        <QuestionCard
          key={q.id}
          q={q}
          revealed={revealed}
          selected={selected}
          onChoose={choose}
          onReveal={reveal}
          onNext={next}
        />
      )}
    </div>
  );
}

function OptionRow({
  letter, text, onClick, state,
}: {
  letter: string; text: string; onClick?: () => void;
  state: "idle" | "selected" | "correct" | "wrong" | "missed";
}) {
  const cls =
    state === "correct" ? "border-emerald-400/70 bg-emerald-400/10 text-text-primary shadow-[0_0_20px_-4px_rgba(52,211,153,0.5)] scale-[1.01]"
    : state === "wrong" ? "border-red-500/60 bg-red-500/10 text-text-muted animate-[shake_0.4s]"
    : state === "missed" ? "border-emerald-400/40 bg-emerald-400/5 text-text-muted"
    : state === "selected" ? "border-accent-violet/70 bg-accent-violet/10 text-text-primary"
    : "border-border bg-surface text-text-primary hover:border-accent-violet/50 hover:bg-accent-violet/5";
  const badge =
    state === "correct" || state === "missed" ? "text-emerald-400"
    : state === "wrong" ? "text-red-400"
    : state === "selected" ? "text-accent-violet" : "text-accent-violet/70";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-all duration-200 ${cls} ${onClick ? "cursor-pointer active:scale-[0.99]" : "cursor-default"}`}
    >
      <span className={`font-mono text-sm font-bold ${badge}`}>{letter}</span>
      <span className="text-base sm:text-lg leading-snug">{text}</span>
      {state === "correct" && <span className="ml-auto text-emerald-400">✓</span>}
      {state === "wrong" && <span className="ml-auto text-red-400">✕</span>}
    </button>
  );
}

function QuestionCard({
  q, revealed, selected, onChoose, onReveal, onNext,
}: {
  q: Q; revealed: boolean; selected: number | null;
  onChoose: (i: number) => void; onReveal: () => void; onNext: () => void;
}) {
  const mcState = (i: number, answer: number): "idle" | "selected" | "correct" | "wrong" | "missed" => {
    if (!revealed) return selected === i ? "selected" : "idle";
    if (i === answer) return "correct";
    if (i === selected) return "wrong";
    return "idle";
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl sm:text-2xl font-bold text-text-primary leading-tight">{q.prompt}</h2>

      {q.type === "multiple-choice" && (
        <div className="space-y-2.5">
          {q.options.map((opt, i) => (
            <OptionRow key={i} letter={LETTERS[i]} text={opt}
              onClick={revealed ? undefined : () => onChoose(i)}
              state={mcState(i, q.answerIndex)} />
          ))}
        </div>
      )}

      {q.type === "two-truths-lie" && (
        <div className="space-y-2.5">
          {q.statements.map((s, i) => (
            <OptionRow key={i} letter={LETTERS[i]} text={s.text}
              onClick={revealed ? undefined : () => onChoose(i)}
              state={mcState(i, q.answerIndex)} />
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
                <div key={i} className={`rounded border px-3 py-2 text-sm transition-all duration-300 ${revealed && o === sol ? "border-emerald-400/70 bg-emerald-400/10 text-text-primary shadow-[0_0_16px_-4px_rgba(52,211,153,0.5)]" : "border-border bg-surface text-text-muted"}`}>
                  <span className="font-mono text-[10px] text-accent-violet/60 mr-2">{LETTERS[i]}</span>{o}
                  {revealed && o === sol && <span className="ml-1 text-emerald-400">✓</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {revealed ? (
        <div className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 p-4 space-y-2 animate-[fadein_0.3s]">
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
        <button onClick={onReveal} className="w-full rounded-lg border border-accent-violet/50 bg-accent-violet/10 py-3.5 font-mono text-sm font-bold uppercase tracking-widest text-accent-violet hover:bg-accent-violet/20 active:scale-[0.99] transition-all">
          {q.type === "clue" ? "Reveal the case ⏎" : "Reveal the answer ⏎"}
        </button>
      )}
    </div>
  );
}
