"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ROUND_EMBLEMS } from "./emblems";
import { ROUND_ART, CORRECT_ART, WRONG_ART } from "./art-manifest";
import {
  ROUND_META, ACHIEVEMENTS, type Achievement, type ProgressState,
  load as loadProgress, rankFor, recordAnswer, recordArchiveClick,
  dailyIndex, isDailyDone, recordDaily, DAILY_BONUS_XP,
} from "./progression";
import { SparkBurst } from "./fx";
import { Leaderboard } from "./leaderboard";
import { PrizeWheel } from "./prize-wheel";
import bankJson from "@/lib/data/gameshow-questions.json";

const ROUND_COLOR: Record<string, string> = {
  "real-or-fake-lore": "text-accent-violet-text",
  "two-truths-lie": "text-accent-cyan",
  "prophecy-or-bogus": "text-accent-gold-text",
  "did-psyche-say-it": "text-accent-violet-text",
  "codex-cluedo": "text-accent-gold-text",
  "troll-or-not": "text-accent-cyan",
  "who-is-it": "text-accent-violet-text",
  "general-trivia": "text-accent-gold-text",
  "name-that-realm": "text-accent-cyan",
  "real-title": "text-accent-gold-text",
  "finish-the-lore": "text-accent-violet-text",
};

type MC = { id: string; round: string; type: "multiple-choice"; prompt: string; options: string[]; answerIndex: number; explain: string; sourceHref?: string; image?: string };
type TTL = { id: string; round: string; type: "two-truths-lie"; prompt: string; statements: { text: string; real: boolean; slug?: string }[]; answerIndex: number; explain: string };
type Clue = { id: string; round: string; type: "clue"; prompt: string; suspects: string[]; locations: string[]; artifacts: string[]; solution: { suspect: string; location: string; artifact: string }; explain: string };
type Q = MC | TTL | Clue;
type Round = { key: string; label: string; icon: string };
export type GameShowBank = { total: number; rounds: Round[]; questions: Q[] };
const bank = bankJson as unknown as GameShowBank;

const LETTERS = ["A", "B", "C", "D", "E", "F"];

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
      const o = ctx.createOscillator(); const g = ctx.createGain();
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
    levelup: () => tone([523, 659, 784, 1047], 0.4, "sine", 0.08),
    next: () => tone([300, 500], 0.1, "sine", 0.04),
    setMuted: (m: boolean) => { mutedRef.current = m; },
  };
}

type Toast = { id: number; text: string; sub?: string };

export function GameShow() {
  const [roundKey, setRoundKey] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState<ProgressState>(() => ({ xp: 0, correct: 0, streak: 0, bestStreak: 0, archiveClicks: 0, byRound: {}, unlocked: [], lastDaily: "", dailyStreak: 0, spins: 0, titles: [], activeTitle: "" }));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [burst, setBurst] = useState<{ n: number; variant: "correct" | "wrong" | "gold" }>({ n: 0, variant: "correct" });
  const [session, setSession] = useState({ correct: 0, total: 0 });
  const toastId = useRef(0);
  const sound = useSound();

  // Seed from localStorage after mount, deliberately.
  //
  // progression.load() is SSR-safe: with no window it returns EMPTY, which is
  // what useState is initialised to above. Reading it in a useState initialiser
  // instead would return the *stored* progress on the client's first render
  // while the server rendered EMPTY — a hydration mismatch for any returning
  // player. The one extra render this costs happens once, on mount.
  //
  // Removing the suppression means moving progress to useSyncExternalStore,
  // which also needs a cached snapshot (a fresh object per call loops forever)
  // and a notifier on every save() — worth doing, but not as a lint cleanup.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setProgress(loadProgress()); }, []);
  useEffect(() => { sound.setMuted(muted); }, [muted, sound]);

  const pushToast = useCallback((text: string, sub?: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, sub }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const dailyQ = useMemo(() => bank.questions[dailyIndex(bank.questions.length)], []);
  const pool = useMemo(
    () => (roundKey === "__daily" ? [dailyQ]
      : roundKey && roundKey !== "__all" ? bank.questions.filter((q) => q.round === roundKey)
      : bank.questions),
    [roundKey, dailyQ]
  );
  const q = pool[idx];

  const goto = useCallback((n: number) => { setRevealed(false); setSelected(null); setIdx(n); }, []);
  const next = useCallback(() => { sound.next(); goto((idx + 1) % pool.length); }, [idx, pool.length, goto, sound]);
  const prev = useCallback(() => { goto((idx - 1 + pool.length) % pool.length); }, [idx, pool.length, goto]);

  const reveal = useCallback(() => {
    if (revealed || !q) return;
    setRevealed(true);
    const answer = q.type === "clue" ? -1 : q.answerIndex;
    const isCorrect = q.type !== "clue" && selected != null && selected === answer;
    const isWrong = q.type !== "clue" && selected != null && selected !== answer;
    if (isCorrect) sound.correct(); else if (isWrong) sound.wrong(); else sound.correct();
    // Effects burst — green shower on correct/host-reveal, red on a wrong pick.
    setBurst((b) => ({ n: b.n + 1, variant: isWrong ? "wrong" : "correct" }));
    // Session run tally for the leaderboard (only counts locked-in picks).
    if (selected != null && q.type !== "clue") setSession((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    const applyResult = (res: ReturnType<typeof recordAnswer>, dailyBonus = false) => {
      setProgress(res.state);
      if (dailyBonus && res.xpGained > 0) { setBurst((b) => ({ n: b.n + 1, variant: "gold" })); pushToast(`+${DAILY_BONUS_XP} XP — Daily Challenge`, "Come back tomorrow."); }
      if (res.rankedUp) { sound.levelup(); setBurst((b) => ({ n: b.n + 1, variant: "gold" })); pushToast(`⬆ Rank up — ${res.rankedUp}`, "The Codex takes notice."); }
      if (res.spinEarned) { setBurst((b) => ({ n: b.n + 1, variant: "gold" })); pushToast("🎡 You earned a spin!", "Claim it on the Prize Wheel below."); }
      res.newAchievements.forEach((a: Achievement) => pushToast(a.label, "Achievement unlocked"));
    };
    if (roundKey === "__daily" && q.type !== "clue" && selected != null) {
      applyResult(recordDaily(isCorrect), true);
    } else if (selected != null && q.type !== "clue") {
      // Progression only counts when the player actually locked in a pick.
      applyResult(recordAnswer(q.round, isCorrect));
    }
  }, [revealed, q, selected, sound, pushToast, roundKey]);

  const choose = useCallback((i: number) => { if (revealed) return; setSelected(i); sound.select(); }, [revealed, sound]);

  const surprise = useCallback(() => {
    // Deterministic-free random is fine on the client (not the workflow sandbox).
    const n = Math.floor(Math.random() * bank.questions.length);
    setRoundKey("__all"); setRevealed(false); setSelected(null); setIdx(n); sound.next();
  }, [sound]);

  const onArchive = useCallback(() => {
    const res = recordArchiveClick();
    setProgress(res.state);
    res.newAchievements.forEach((a: Achievement) => pushToast(a.label, "Achievement unlocked"));
  }, [pushToast]);

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

  const rank = rankFor(progress.xp);

  // ── Lobby ──
  if (!roundKey) {
    return (
      <div id="rounds" className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        <ProgressHud progress={progress} rank={rank} />

        <DailyChallenge
          done={isDailyDone(progress)}
          streak={progress.dailyStreak}
          onPlay={() => { setRoundKey("__daily"); goto(0); }}
        />

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={surprise} className="rounded-lg border border-accent-gold/50 bg-accent-gold/10 px-6 py-3 font-mono text-sm font-bold uppercase tracking-widest text-accent-gold-text hover:bg-accent-gold/20 hover:scale-[1.03] active:scale-[0.98] transition-all">
            🎲 Surprise Me
          </button>
          <button onClick={() => { setRoundKey("__all"); goto(0); }} className="rounded-lg border border-accent-violet/50 bg-accent-violet/10 px-6 py-3 font-mono text-sm font-bold uppercase tracking-widest text-accent-violet-text hover:bg-accent-violet/20 hover:scale-[1.03] active:scale-[0.98] transition-all">
            ▶ Play All {bank.total}
          </button>
        </div>

        <div>
          <p className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted/60">{"/// choose_your_round"}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {bank.rounds.map((r) => {
              const count = bank.questions.filter((x) => x.round === r.key).length;
              const Emblem = ROUND_EMBLEMS[r.key];
              const art = ROUND_ART[r.key];
              const meta = ROUND_META[r.key];
              return (
                <button
                  key={r.key}
                  onClick={() => { setRoundKey(r.key); goto(0); }}
                  className="group relative overflow-hidden flex items-start gap-4 rounded-xl border border-accent-violet/25 bg-surface p-5 text-left hover:border-accent-violet/60 hover:scale-[1.015] active:scale-[0.99] transition-all"
                >
                  {art && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={art} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-25 group-hover:opacity-40 transition-opacity duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-r from-void via-void/85 to-void/50" />
                    </>
                  )}
                  {Emblem
                    ? <Emblem size={44} className={`relative flex-shrink-0 ${ROUND_COLOR[r.key] ?? "text-accent-violet-text"} transition-transform group-hover:rotate-6`} />
                    : <span className="relative text-3xl" aria-hidden>{r.icon}</span>}
                  <span className="relative min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-display text-lg font-bold text-text-primary group-hover:text-accent-violet-text transition-colors">{meta?.name ?? r.label}</span>
                    </span>
                    {meta && <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.3em] text-accent-gold-text/70">{meta.tag}</span>}
                    <span className="mt-1.5 block text-xs text-text-muted leading-relaxed">{meta?.desc}</span>
                    <span className="mt-2 block font-mono text-[10px] uppercase tracking-widest text-text-muted/50">{count} questions</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <PrizeWheel
          progress={progress}
          onUpdate={setProgress}
          onPrize={(p) => pushToast(`🎉 ${p.label}`, "Prize claimed")}
        />

        <Leaderboard sessionCorrect={session.correct} sessionTotal={session.total} />

        <AchievementShelf unlocked={progress.unlocked} />

        <p className="text-center font-mono text-[10px] text-text-muted/60 leading-relaxed">
          Screen-share in OBS / StreamYard. Chat calls a letter; you tap it.
          <br className="hidden sm:block" />
          <span className="text-accent-violet-text">A–D / 1–4</span> select · <span className="text-accent-violet-text">Space</span> reveal &amp; advance · <span className="text-accent-violet-text">← →</span> navigate.
        </p>

        <Toasts toasts={toasts} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4"><ProgressHud progress={progress} rank={rank} compact /></div>
      <div className="mb-6 flex items-center justify-between gap-3 border-b border-border pb-3">
        <button onClick={() => { setRoundKey(null); goto(0); }} className="font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-accent-violet-text transition-colors">← Rounds</button>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-violet-text/60">
          {roundKey === "__daily" ? "⚡ Daily Challenge" : ROUND_META[roundKey]?.name ?? bank.rounds.find((r) => r.key === roundKey)?.label ?? "The Whole Deck"} · {idx + 1}/{pool.length}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={surprise} title="Surprise me" className="rounded border border-border px-2 py-1 font-mono text-xs text-text-muted hover:border-accent-gold/40 hover:text-accent-gold-text transition-colors">🎲</button>
          <button onClick={() => setMuted((m) => !m)} title={muted ? "Unmute" : "Mute"} className="rounded border border-border px-2 py-1 font-mono text-xs text-text-muted hover:border-accent-violet/40 hover:text-accent-violet-text transition-colors">{muted ? "🔇" : "🔊"}</button>
          <button onClick={prev} className="rounded border border-border px-2.5 py-1 font-mono text-xs text-text-muted hover:border-accent-violet/40 hover:text-accent-violet-text transition-colors">←</button>
          <button onClick={next} className="rounded border border-border px-2.5 py-1 font-mono text-xs text-text-muted hover:border-accent-violet/40 hover:text-accent-violet-text transition-colors">→</button>
        </div>
      </div>

      {q && <QuestionCard key={q.id} q={q} revealed={revealed} selected={selected} onChoose={choose} onReveal={reveal} onNext={next} onArchive={onArchive} />}
      <Toasts toasts={toasts} />
      <SparkBurst trigger={burst.n} variant={burst.variant} />
    </div>
  );
}

function DailyChallenge({ done, streak, onPlay }: { done: boolean; streak: number; onPlay: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-accent-gold/40 bg-surface p-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/gameshow/deck.webp" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-r from-void via-void/85 to-void/60" />
      <div className="gs-drift pointer-events-none absolute inset-0 opacity-20" aria-hidden />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-gold-text/70">
            {"/// daily_challenge"}{streak > 0 && <span className="ml-2 text-accent-gold-text">🔥 {streak}-day streak</span>}
          </p>
          <h3 className="mt-1 font-display text-xl font-bold text-text-primary">Today&rsquo;s Impossible Question</h3>
          <p className="mt-0.5 text-xs text-text-muted">One question. The same for every cultist today. Nail it for <span className="text-accent-gold-text font-bold">+{DAILY_BONUS_XP} XP</span> and the streak.</p>
        </div>
        {done ? (
          <span className="flex-shrink-0 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-emerald-400">✓ Done · back tomorrow</span>
        ) : (
          <button onClick={onPlay} className="flex-shrink-0 rounded-lg border border-accent-gold/60 bg-accent-gold/15 px-6 py-3 font-display text-base font-bold text-accent-gold-text hover:bg-accent-gold/25 hover:scale-[1.04] active:scale-[0.98] transition-all shadow-[0_0_24px_-8px_rgba(200,57,46,0.6)]">
            ⚡ Take the Challenge
          </button>
        )}
      </div>
    </div>
  );
}

function ProgressHud({ progress, rank, compact }: { progress: ProgressState; rank: ReturnType<typeof rankFor>; compact?: boolean }) {
  return (
    <div className={`rounded-lg border border-accent-violet/20 bg-surface/60 ${compact ? "px-4 py-2" : "px-5 py-3.5"}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-sm font-bold text-accent-violet-text">
          {rank.name}{progress.activeTitle && <span className="ml-1.5 font-mono text-[10px] font-normal text-accent-gold-text">{progress.activeTitle}</span>}
        </span>
        <span className="font-mono text-[10px] text-text-muted">
          {progress.xp} XP{rank.next ? ` · ${rank.toNext} to ${rank.next}` : " · max rank"}
          {progress.streak > 1 && <span className="ml-2 text-accent-gold-text">🔥 {progress.streak}</span>}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-void">
        <div className="h-full rounded-full bg-gradient-to-r from-accent-violet to-accent-cyan transition-all duration-500" style={{ width: `${Math.round(rank.progress * 100)}%` }} />
      </div>
    </div>
  );
}

function AchievementShelf({ unlocked }: { unlocked: string[] }) {
  const set = new Set(unlocked);
  return (
    <div className="rounded-lg border border-border bg-surface/40 p-4">
      <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted/60">{`/// achievements · ${set.size}/${ACHIEVEMENTS.length}`}</p>
      <div className="flex flex-wrap gap-2">
        {ACHIEVEMENTS.map((a) => {
          const got = set.has(a.id);
          return (
            <span key={a.id} title={a.hint} className={`rounded border px-2.5 py-1 font-mono text-[10px] transition-all ${got ? "border-accent-gold/40 bg-accent-gold/10 text-accent-gold-text" : "border-border bg-void text-text-muted/40"}`}>
              {got ? a.label : "🔒 ???"}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Toasts({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="animate-[fadein_0.3s] rounded-lg border border-accent-gold/40 bg-void/95 px-4 py-2.5 shadow-[0_0_24px_-6px_rgba(200,57,46,0.6)]">
          <p className="font-display text-sm font-bold text-accent-gold-text">{t.text}</p>
          {t.sub && <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">{t.sub}</p>}
        </div>
      ))}
    </div>
  );
}

function OptionRow({ letter, text, onClick, state }: { letter: string; text: string; onClick?: () => void; state: "idle" | "selected" | "correct" | "wrong" | "missed" }) {
  const cls =
    state === "correct" ? "border-emerald-400/70 bg-emerald-400/10 text-text-primary shadow-[0_0_20px_-4px_rgba(52,211,153,0.5)] scale-[1.01]"
    : state === "wrong" ? "border-red-500/60 bg-red-500/10 text-text-muted animate-[shake_0.4s]"
    : state === "missed" ? "border-emerald-400/40 bg-emerald-400/5 text-text-muted"
    : state === "selected" ? "border-accent-violet/70 bg-accent-violet/10 text-text-primary"
    : "border-border bg-surface text-text-primary hover:border-accent-violet/50 hover:bg-accent-violet/5";
  const badge = state === "correct" || state === "missed" ? "text-emerald-400" : state === "wrong" ? "text-red-400" : state === "selected" ? "text-accent-violet-text" : "text-accent-violet-text/70";
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-all duration-200 ${cls} ${onClick ? "cursor-pointer active:scale-[0.99]" : "cursor-default"}`}>
      <span className={`font-mono text-sm font-bold ${badge}`}>{letter}</span>
      <span className="text-base sm:text-lg leading-snug">{text}</span>
      {state === "correct" && <span className="ml-auto text-emerald-400">✓</span>}
      {state === "wrong" && <span className="ml-auto text-red-400">✕</span>}
    </button>
  );
}

function QuestionCard({ q, revealed, selected, onChoose, onReveal, onNext, onArchive }: { q: Q; revealed: boolean; selected: number | null; onChoose: (i: number) => void; onReveal: () => void; onNext: () => void; onArchive: () => void }) {
  const mcState = (i: number, answer: number): "idle" | "selected" | "correct" | "wrong" | "missed" => {
    if (!revealed) return selected === i ? "selected" : "idle";
    if (i === answer) return "correct";
    if (i === selected) return "wrong";
    return "idle";
  };
  const answerIdx = q.type === "clue" ? -1 : q.answerIndex;
  const wasWrong = revealed && selected != null && selected !== answerIdx && q.type !== "clue";
  const revealArt = revealed ? (wasWrong ? WRONG_ART : CORRECT_ART) : null;

  return (
    <div className="relative space-y-6 animate-[cardin_0.35s_ease-out]">
      {revealArt && <img src={revealArt} alt="" aria-hidden className="pointer-events-none absolute -inset-x-8 -inset-y-6 -z-10 h-[calc(100%+3rem)] w-[calc(100%+4rem)] object-cover opacity-[0.14] blur-[1px] animate-[fadein_0.4s]" />}
      <h2 className="font-display text-xl sm:text-2xl font-bold text-text-primary leading-tight">{q.prompt}</h2>
      {"image" in q && q.image && (
        <div className="mx-auto max-w-xl overflow-hidden rounded-lg border border-accent-violet/30 shadow-[0_0_30px_-10px_rgba(74,45,110,0.8)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={q.image} alt="Episode thumbnail clue" className="w-full object-cover" loading="lazy" />
        </div>
      )}

      {q.type === "multiple-choice" && (
        <div className="space-y-2.5">
          {q.options.map((opt, i) => <OptionRow key={i} letter={LETTERS[i]} text={opt} onClick={revealed ? undefined : () => onChoose(i)} state={mcState(i, q.answerIndex)} />)}
        </div>
      )}

      {q.type === "two-truths-lie" && (
        <div className="space-y-2.5">
          {q.statements.map((s, i) => <OptionRow key={i} letter={LETTERS[i]} text={s.text} onClick={revealed ? undefined : () => onChoose(i)} state={mcState(i, q.answerIndex)} />)}
          {revealed && <p className="font-mono text-[11px] uppercase tracking-widest text-red-400">↑ {LETTERS[q.answerIndex]} is the lie</p>}
        </div>
      )}

      {q.type === "clue" && (
        <div className="grid gap-4 sm:grid-cols-3">
          {([["SUSPECT", q.suspects, q.solution.suspect], ["LOCATION", q.locations, q.solution.location], ["ARTIFACT", q.artifacts, q.solution.artifact]] as const).map(([label, opts, sol]) => (
            <div key={label} className="space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold-text/60">{label}</p>
              {opts.map((o, i) => (
                <div key={i} className={`rounded border px-3 py-2 text-sm transition-all duration-300 ${revealed && o === sol ? "border-emerald-400/70 bg-emerald-400/10 text-text-primary shadow-[0_0_16px_-4px_rgba(52,211,153,0.5)]" : "border-border bg-surface text-text-muted"}`}>
                  <span className="font-mono text-[10px] text-accent-violet-text/60 mr-2">{LETTERS[i]}</span>{o}
                  {revealed && o === sol && <span className="ml-1 text-emerald-400">✓</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {revealed ? (
        <div className={`rounded-lg border p-4 space-y-2 animate-[fadein_0.3s] ${wasWrong ? "border-red-500/30 bg-red-500/5" : "border-emerald-400/25 bg-emerald-400/5"}`}>
          <p className={`font-mono text-[9px] uppercase tracking-[0.3em] ${wasWrong ? "text-red-400" : "text-emerald-400"}`}>{wasWrong ? "/// the_codex_disagrees" : "/// the_codex_rules"}</p>
          <p className="text-sm text-text-muted leading-relaxed">{q.explain}</p>
          {"sourceHref" in q && q.sourceHref && (
            <Link href={q.sourceHref} onClick={onArchive} className="inline-flex items-center gap-1.5 rounded border border-accent-violet/40 bg-accent-violet/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-accent-violet-text hover:bg-accent-violet/20 transition-colors">
              🗝 Open the archive →
            </Link>
          )}
          <div className="pt-1">
            <button onClick={onNext} className="rounded border border-accent-violet/50 bg-accent-violet/10 px-5 py-2 font-mono text-xs font-bold text-accent-violet-text hover:bg-accent-violet/20 transition-colors">Next question →</button>
          </div>
        </div>
      ) : (
        <button onClick={onReveal} className="w-full rounded-lg border border-accent-violet/50 bg-accent-violet/10 py-3.5 font-mono text-sm font-bold uppercase tracking-widest text-accent-violet-text hover:bg-accent-violet/20 active:scale-[0.99] transition-all">
          {q.type === "clue" ? "Reveal the case ⏎" : "Reveal the answer ⏎"}
        </button>
      )}
    </div>
  );
}
