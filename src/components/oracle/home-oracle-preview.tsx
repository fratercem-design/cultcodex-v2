"use client";

import { useState } from "react";
import Link from "next/link";
import type { OracleCitation, OracleResponse } from "@/app/api/oracle/ask/route";
import { INITIATE_ORACLE_MONTHLY_LIMIT } from "@/lib/subscription-tiers";

type PreviewState = "idle" | "loading" | "answered" | "gated" | "limit" | "error";

export function HomeOraclePreview() {
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<PreviewState>("idle");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<OracleCitation[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || state === "loading") return;

    setState("loading");
    setAnswer("");
    setCitations([]);
    setErrorMsg("");

    try {
      const res = await fetch("/api/oracle/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });

      const data = (await res.json()) as OracleResponse;

      if (!data.ok) {
        if (data.error === "initiate_required") {
          setState("gated");
        } else if (data.error === "anon_limit_reached" || data.error === "free_limit_reached") {
          setState("limit");
        } else {
          setErrorMsg(data.error ?? "The Oracle is silent.");
          setState("error");
        }
        return;
      }

      setAnswer(data.answer ?? "");
      setCitations(data.citations ?? []);
      setState("answered");
    } catch {
      setErrorMsg("A disturbance in the archive. Try again.");
      setState("error");
    }
  }

  const sentences = answer.split(/(?<=\.)\s+/);
  const visibleAnswer = sentences.slice(0, 2).join(" ");
  const hiddenAnswer = sentences.slice(2).join(" ");

  return (
    <div className="space-y-3">
      {/* Question input — hide after receiving an answer or hitting a wall */}
      {state !== "answered" && state !== "gated" && state !== "limit" && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            aria-label="Ask the Oracle a question"
            placeholder="Ask anything about the archive…"
            disabled={state === "loading"}
            maxLength={300}
            className="flex-1 rounded-lg border border-accent-violet/30 bg-void/60 px-3 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-violet/60 focus:outline-none disabled:opacity-50 transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
          />
          <button
            type="submit"
            disabled={!question.trim() || state === "loading"}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-accent-violet/50 bg-accent-violet/10 px-4 py-2.5 font-mono text-xs font-bold text-accent-violet-text transition-all hover:bg-accent-violet/20 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {state === "loading" ? (
              <span className="inline-block h-3 w-3 rounded-full border-2 border-current/30 border-t-current animate-spin" />
            ) : (
              "Ask →"
            )}
          </button>
        </form>
      )}

      {state === "loading" && (
        <p className="text-center font-mono text-[12px] uppercase tracking-[0.12em] text-accent-violet-text/70 animate-pulse py-2">
          {"/// searching_the_archive"}
        </p>
      )}

      {/* Answer — first 2 sentences visible, rest blurred with paywall */}
      {state === "answered" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-accent-violet/20 bg-surface/80 p-5 space-y-3">
            <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-cyan/70">
              The Oracle Responds · Re: &ldquo;{question}&rdquo;
            </p>
            <blockquote className="font-serif text-sm leading-relaxed text-text-primary">
              {visibleAnswer}
            </blockquote>
            {hiddenAnswer && (
              <div className="relative overflow-hidden rounded">
                <blockquote
                  className="font-serif text-sm leading-relaxed text-text-primary blur-[5px] select-none pointer-events-none"
                  aria-hidden="true"
                >
                  {hiddenAnswer}
                </blockquote>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface/80" />
              </div>
            )}
            {citations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1 blur-[4px] select-none pointer-events-none" aria-hidden="true">
                {citations.slice(0, 4).map((c, i) => (
                  <span key={i} className="rounded border border-accent-cyan/20 bg-accent-cyan/5 px-2 py-0.5 font-mono text-[12px] text-accent-cyan/70 uppercase tracking-wider">
                    {c.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* Paywall CTA */}
          <div className="rounded-xl border border-accent-gold/25 bg-gradient-to-b from-accent-gold/5 to-surface px-5 py-4 text-center space-y-2">
            <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">
              {"/// unlock full answer + citations"}
            </p>
            <p className="font-serif text-sm text-text-muted italic">
              Initiate+ reveals complete Oracle responses with archive citations — up to {INITIATE_ORACLE_MONTHLY_LIMIT} questions each month.
            </p>
            <Link
              href="/premium"
              className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-5 py-2 font-mono text-xs font-bold text-accent-gold-text transition-all hover:bg-accent-gold/25"
            >
              Unlock Initiate+ — $10/mo →
            </Link>
          </div>
        </div>
      )}

      {/* Gated — needs subscription */}
      {state === "gated" && (
        <div className="rounded-xl border border-accent-gold/20 bg-gradient-to-b from-accent-gold/5 to-surface p-5 text-center space-y-2">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">{"/// initiate_required"}</p>
          <p className="font-display text-sm font-bold text-text-primary">The Oracle speaks only to Initiates.</p>
          <p className="font-mono text-xs text-text-muted">Unlock the full Oracle with unlimited questions and archive citations.</p>
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-5 py-2 font-mono text-xs font-bold text-accent-gold-text transition-all hover:bg-accent-gold/25"
          >
            Become Initiate+ — $10/mo →
          </Link>
        </div>
      )}

      {/* Monthly preview used */}
      {state === "limit" && (
        <div className="rounded-xl border border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-surface p-5 text-center space-y-2">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-violet-text/70">{"/// preview_exhausted"}</p>
          <p className="font-display text-sm font-bold text-text-primary">Your free preview is complete.</p>
          <p className="font-mono text-xs text-text-muted">Initiate+ unlocks {INITIATE_ORACLE_MONTHLY_LIMIT} cited Oracle questions each month.</p>
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 rounded-lg border border-accent-violet bg-accent-violet/15 px-5 py-2 font-mono text-xs font-bold text-accent-violet-text transition-all hover:bg-accent-violet/25"
          >
            Become Initiate+ — $10/mo →
          </Link>
        </div>
      )}

      {/* Generic error */}
      {state === "error" && (
        <div className="rounded-lg border border-red-500/20 bg-red-950/10 px-3 py-2.5 text-center">
          <p className="font-mono text-xs text-red-400">{errorMsg || "The Oracle is unavailable."}</p>
          <button
            onClick={() => { setState("idle"); setErrorMsg(""); }}
            className="mt-1.5 font-mono text-[12px] text-text-muted hover:text-accent-violet-text transition-colors"
          >
            Try again →
          </button>
        </div>
      )}
    </div>
  );
}
