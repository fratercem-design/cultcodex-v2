"use client";

import { useCallback, useEffect, useState } from "react";

type Row = { handle: string; score: number; correct: number; total: number; createdAt: string };
type Range = "week" | "month" | "all";
const RANGES: { key: Range; label: string }[] = [
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
  { key: "all", label: "All-Time" },
];
const HANDLE_KEY = "cc_gameshow_handle";

export function Leaderboard({ sessionCorrect, sessionTotal }: { sessionCorrect: number; sessionTotal: number }) {
  const [range, setRange] = useState<Range>("week");
  const [board, setBoard] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [handle, setHandle] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "done" | "error">("idle");

  useEffect(() => { try { setHandle(localStorage.getItem(HANDLE_KEY) ?? ""); } catch { /* ignore */ } }, []);

  const fetchBoard = useCallback(async (r: Range) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gameshow/score?range=${r}`, { cache: "no-store" });
      const data = await res.json();
      setBoard(Array.isArray(data.board) ? data.board : []);
    } catch { setBoard([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBoard(range); }, [range, fetchBoard]);

  const submit = useCallback(async () => {
    if (sessionTotal < 1 || submitState === "sending") return;
    const h = handle.trim() || "Anonymous Cultist";
    try { localStorage.setItem(HANDLE_KEY, h); } catch { /* ignore */ }
    setSubmitState("sending");
    try {
      const res = await fetch("/api/gameshow/score", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: h, score: sessionCorrect, correct: sessionCorrect, total: sessionTotal, round: "all" }),
      });
      if (!res.ok) throw new Error();
      setSubmitState("done");
      fetchBoard(range);
    } catch { setSubmitState("error"); }
  }, [handle, sessionCorrect, sessionTotal, submitState, range, fetchBoard]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-accent-gold/25 bg-surface/60 p-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/gameshow/hall.webp" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-[0.14]" />
      <div className="absolute inset-0 bg-gradient-to-b from-void/85 via-void/80 to-void/90" />
      <div className="relative space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">{"/// hall_of_oracles"}</p>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button key={r.key} onClick={() => setRange(r.key)}
              className={`rounded px-2.5 py-1 font-mono text-[12px] uppercase tracking-widest transition-colors ${range === r.key ? "bg-accent-gold/20 text-accent-gold-text" : "text-text-muted hover:text-accent-gold-text"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="py-6 text-center font-mono text-[12px] uppercase tracking-widest text-text-muted animate-pulse">consulting the codex…</p>
      ) : !board || board.length === 0 ? (
        <p className="py-6 text-center text-xs text-text-muted">No runs on the board yet. Be the first oracle.</p>
      ) : (
        <ol className="space-y-1">
          {board.map((row, i) => (
            <li key={`${row.handle}-${i}`} className={`flex items-center gap-3 rounded px-3 py-1.5 ${i < 3 ? "bg-accent-gold/5" : ""}`}>
              <span className={`w-6 font-display text-sm font-bold ${i === 0 ? "text-accent-gold-text" : i < 3 ? "text-accent-cyan" : "text-text-muted"}`}>{i + 1}</span>
              <span className="flex-1 truncate font-mono text-xs text-text-primary">{row.handle}</span>
              <span className="font-mono text-[12px] text-text-muted">{row.correct}/{row.total}</span>
              <span className="w-10 text-right font-display text-sm font-bold text-accent-violet-text">{row.score}</span>
            </li>
          ))}
        </ol>
      )}

      {/* Post your run */}
      <div className="border-t border-border pt-3">
        {submitState === "done" ? (
          <p className="text-center font-mono text-[12px] uppercase tracking-widest text-emerald-400">✓ Run posted — you&rsquo;re on the board</p>
        ) : sessionTotal < 1 ? (
          <p className="text-center font-mono text-[12px] text-text-muted">Answer a few questions, then post your run here.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12px] text-text-muted">This run: <span className="text-accent-cyan font-bold">{sessionCorrect}/{sessionTotal}</span></span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              maxLength={24}
              placeholder="Your cult name"
              className="min-w-0 flex-1 rounded border border-border bg-void px-3 py-1.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent-gold/50 focus:outline-none"
            />
            <button onClick={submit} disabled={submitState === "sending"}
              className="rounded border border-accent-gold/50 bg-accent-gold/15 px-4 py-1.5 font-mono text-[12px] font-bold uppercase tracking-widest text-accent-gold-text hover:bg-accent-gold/25 disabled:opacity-50 transition-colors">
              {submitState === "sending" ? "posting…" : submitState === "error" ? "retry" : "Post Run"}
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
