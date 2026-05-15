"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { OracleCitation, OracleResponse } from "@/app/api/oracle/ask/route";

type ConsoleState = "idle" | "loading" | "answered" | "error";

export function OracleConsole() {
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<ConsoleState>("idle");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<OracleCitation[]>([]);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [hasVoice, setHasVoice] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [gated, setGated] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const answerRef = useRef<HTMLDivElement | null>(null);

  // Auto-play audio when received
  useEffect(() => {
    if (audioBase64 && state === "answered") {
      const src = `data:audio/mpeg;base64,${audioBase64}`;
      const audio = new Audio(src);
      audioRef.current = audio;
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      audio.play().catch(() => {
        // Autoplay blocked — user can click Play manually
      });
    }
  }, [audioBase64, state]);

  // Scroll to answer
  useEffect(() => {
    if (state === "answered" && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [state]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || state === "loading") return;

    setState("loading");
    setAnswer("");
    setCitations([]);
    setAudioBase64(null);
    setHasVoice(false);
    setGated(false);
    setErrorMsg("");

    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      const res = await fetch("/api/oracle/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });

      const data = (await res.json()) as OracleResponse;

      if (!data.ok) {
        if (data.error === "initiate_required") {
          setGated(true);
          setState("error");
        } else {
          setErrorMsg(data.error ?? "The Oracle is silent.");
          setState("error");
        }
        return;
      }

      setAnswer(data.answer ?? "");
      setCitations(data.citations ?? []);
      setAudioBase64(data.audioBase64 ?? null);
      setHasVoice(data.hasVoice ?? false);
      setState("answered");
    } catch {
      setErrorMsg("A disturbance in the archive. Try again.");
      setState("error");
    }
  }

  function handlePlayPause() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }

  function handleReset() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setState("idle");
    setAnswer("");
    setCitations([]);
    setAudioBase64(null);
    setIsPlaying(false);
  }

  return (
    <div className="space-y-6">
      {/* ── Question form ── */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask the Oracle anything about the archive…"
            disabled={state === "loading"}
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-accent-violet/30 bg-void/60 px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted/40 focus:border-accent-violet/60 focus:outline-none resize-none disabled:opacity-50 transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
          />
          <p className="absolute bottom-2 right-3 font-mono text-[9px] text-text-muted/30">
            {question.length}/500
          </p>
        </div>
        <button
          type="submit"
          disabled={!question.trim() || state === "loading"}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-accent-violet/50 bg-accent-violet/10 px-6 py-3 font-mono text-sm font-bold text-accent-violet transition-all hover:border-accent-violet/70 hover:bg-accent-violet/15 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {state === "loading" ? (
            <>
              <LoadingOrb />
              The archive stirs…
            </>
          ) : (
            "Consult the Oracle →"
          )}
        </button>
      </form>

      {/* ── Loading pulse ── */}
      {state === "loading" && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border border-accent-violet/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border border-accent-violet/40 animate-ping animation-delay-150" />
            <div className="absolute inset-4 rounded-full bg-accent-violet/20 animate-pulse" />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-violet/50 animate-pulse">
            /// searching_the_archive
          </p>
        </div>
      )}

      {/* ── Gated ── */}
      {state === "error" && gated && (
        <div className="rounded-xl border border-accent-gold/20 bg-gradient-to-b from-accent-gold/5 to-surface p-6 text-center space-y-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-gold/60">/// initiate_required</p>
          <p className="font-display text-base font-bold text-text-primary">The Oracle speaks only to Initiates.</p>
          <p className="font-mono text-xs text-text-muted">
            Initiate+ unlocks the Oracle, full transcripts, Decode Mode, and the Psychenomicon.
          </p>
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-6 py-2.5 font-mono text-xs font-bold text-accent-gold transition-all hover:bg-accent-gold/25"
          >
            Become Initiate+ — $10/mo →
          </Link>
        </div>
      )}

      {/* ── Generic error ── */}
      {state === "error" && !gated && (
        <div className="rounded-lg border border-red-500/20 bg-red-950/10 px-4 py-3 text-center">
          <p className="font-mono text-xs text-red-400">{errorMsg || "The Oracle is unavailable."}</p>
          <button
            onClick={handleReset}
            className="mt-2 font-mono text-[10px] text-text-muted hover:text-accent-violet transition-colors"
          >
            Try again →
          </button>
        </div>
      )}

      {/* ── Answer ── */}
      {state === "answered" && (
        <div ref={answerRef} className="space-y-4 animate-fadeIn">
          {/* The Oracle's response */}
          <div className="relative rounded-xl border border-accent-violet/20 bg-surface/80 backdrop-blur-sm p-1">
            <div
              className="pointer-events-none absolute -inset-px rounded-xl"
              aria-hidden="true"
              style={{
                background:
                  "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, transparent 40%, transparent 60%, rgba(139,92,246,0.08) 100%)",
              }}
            />
            <div className="relative rounded-lg border border-border bg-elevated p-6 sm:p-8 space-y-4">
              {/* Voice controls */}
              {hasVoice && audioBase64 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayPause}
                    className="flex items-center gap-1.5 rounded border border-accent-violet/30 bg-accent-violet/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-accent-violet hover:bg-accent-violet/20 transition-colors"
                  >
                    {isPlaying ? (
                      <>
                        <PauseIcon /> Pause
                      </>
                    ) : (
                      <>
                        <PlayIcon /> Hear the Oracle
                      </>
                    )}
                  </button>
                  {isPlaying && (
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-0.5 bg-accent-violet/60 rounded-full animate-waveform"
                          style={{
                            height: `${8 + i * 3}px`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Oracle text */}
              <blockquote className="font-serif text-base sm:text-lg leading-relaxed text-text-primary">
                {answer}
              </blockquote>

              {/* Question echo */}
              <p className="font-mono text-[9px] text-text-muted/40 uppercase tracking-widest border-t border-border pt-3">
                In response to: &ldquo;{question}&rdquo;
              </p>
            </div>
          </div>

          {/* Citations */}
          {citations.length > 0 && (
            <div className="space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted/50">
                /// archive_sources
              </p>
              <div className="flex flex-wrap gap-2">
                {citations.map((c, i) => (
                  <Link
                    key={i}
                    href={c.href}
                    className="inline-flex items-center gap-1.5 rounded border border-border bg-surface px-2.5 py-1 font-mono text-[9px] text-text-muted hover:border-accent-violet/30 hover:text-accent-violet transition-colors truncate max-w-[200px]"
                  >
                    <CitationIcon type={c.type} />
                    <span className="truncate">{c.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Ask again */}
          <button
            onClick={handleReset}
            className="w-full text-center font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/50 hover:text-accent-violet transition-colors py-2"
          >
            Ask another question →
          </button>
        </div>
      )}
    </div>
  );
}

function LoadingOrb() {
  return (
    <span className="inline-block h-3 w-3 rounded-full border-2 border-current/30 border-t-current animate-spin" />
  );
}

function PlayIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
      <path d="M2 1.5l6 3.5-6 3.5V1.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
      <rect x="2" y="1.5" width="2.5" height="7" rx="0.5" />
      <rect x="5.5" y="1.5" width="2.5" height="7" rx="0.5" />
    </svg>
  );
}

function CitationIcon({ type }: { type: OracleCitation["type"] }) {
  const icons: Record<OracleCitation["type"], string> = {
    quote: "❝",
    transcript: "◈",
    episode: "◉",
    person: "◇",
  };
  return <span className="opacity-60">{icons[type]}</span>;
}
