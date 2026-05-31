"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import type { OracleCitation, OracleResponse } from "@/app/api/oracle/ask/route";

type ConsoleState = "idle" | "loading" | "answered" | "error";

interface OracleConsoleProps {
  initialFreeQueriesRemaining?: number;
  initialQuestion?: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Interpolate violet (#6E4BAE) → cyan (#5DB7D8) across 32 bars
function barColor(index: number, total: number): string {
  const t = index / (total - 1);
  const r = Math.round(110 + (93 - 110) * t);
  const g = Math.round(75 + (183 - 75) * t);
  const b = Math.round(174 + (216 - 174) * t);
  return `rgb(${r},${g},${b})`;
}

const BAR_COUNT = 32;
const BAR_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => {
  // Pseudo-random heights that look like a waveform
  const base = Math.sin(i * 0.7) * 0.4 + Math.sin(i * 1.3) * 0.3 + 0.5;
  return Math.max(0.15, Math.min(1, base));
});

export function OracleConsole({ initialFreeQueriesRemaining, initialQuestion }: OracleConsoleProps) {
  const [question, setQuestion] = useState(initialQuestion ?? "");
  const [state, setState] = useState<ConsoleState>("idle");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<OracleCitation[]>([]);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [hasVoice, setHasVoice] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [gated, setGated] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);
  const [trialRemaining, setTrialRemaining] = useState<number | null>(null);
  const [captureEmail, setCaptureEmail] = useState("");
  const [captureState, setCaptureState] = useState<"idle" | "saving" | "done">("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [shareCopied, setShareCopied] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const answerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (audioBase64 && state === "answered") {
      const src = `data:audio/mpeg;base64,${audioBase64}`;
      const audio = new Audio(src);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => { setIsPlaying(false); setCurrentTime(0); };
      audio.onpause = () => setIsPlaying(false);
      audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
      audio.onloadedmetadata = () => setDuration(audio.duration);

      audio.play().catch(() => {});
    }
  }, [audioBase64, state]);

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
    setFreeLimitReached(false);
    setErrorMsg("");
    setCurrentTime(0);
    setDuration(0);

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
        } else if (data.error === "free_limit_reached" || data.error === "anon_limit_reached") {
          setFreeLimitReached(true);
          setFreeQueriesLeft(0);
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
      setTrialUsed(data.trialUsed ?? false);
      if (data.trialRemaining !== undefined) setTrialRemaining(data.trialRemaining);
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

  const handleShare = useCallback(async () => {
    const params = new URLSearchParams({
      q: question.slice(0, 120),
      a: answer.slice(0, 240),
    });
    const url = `${window.location.origin}/oracle/share?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      // Fallback: open share URL in new tab
      window.open(url, "_blank", "noopener");
    }
  }, [question, answer]);

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
    setCurrentTime(0);
    setDuration(0);
    setTrialUsed(false);
    setCaptureState("idle");
    setCaptureEmail("");
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
            {"/// searching_the_archive"}
          </p>
        </div>
      )}

      {/* ── Free query counter ── */}
      {typeof freeQueriesLeft === "number" && freeQueriesLeft > 0 && state !== "loading" && (
        <p className="text-center font-mono text-[9px] uppercase tracking-[0.35em] text-text-muted/50">
          {freeQueriesLeft} free {freeQueriesLeft === 1 ? "query" : "queries"} remaining this month
        </p>
      )}

      {/* ── Gated ── */}
      {state === "error" && gated && (
        <div className="rounded-xl border border-accent-gold/20 bg-gradient-to-b from-accent-gold/5 to-surface p-6 text-center space-y-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-gold/60">{"/// initiate_required"}</p>
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

      {/* ── Free / anon limit reached ── */}
      {(state === "error" && freeLimitReached) || (freeLimitReached && state === "idle") ? (
        <div className="rounded-xl border border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-surface p-6 text-center space-y-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet/60">/// free_queries_exhausted</p>
          <p className="font-display text-base font-bold text-text-primary">Monthly preview complete.</p>
          <p className="font-mono text-xs text-text-muted">
            Initiate+ unlocks unlimited Oracle access to the full archive.
          </p>
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 rounded-lg border border-accent-violet bg-accent-violet/15 px-6 py-2.5 font-mono text-xs font-bold text-accent-violet transition-all hover:bg-accent-violet/25"
          >
            Become Initiate+ — $10/mo →
          </Link>
        </div>
      ) : null}

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

      {/* ── Answer — Speaking Avatar Card ── */}
      {state === "answered" && (
        <div ref={answerRef} className="space-y-4 animate-fadeIn">
          {/* Oracle response card */}
          <div className="relative rounded-xl border border-accent-violet/20 bg-surface/80 backdrop-blur-sm p-1">
            <div
              className="pointer-events-none absolute -inset-px rounded-xl"
              aria-hidden="true"
              style={{
                background:
                  "linear-gradient(135deg, rgba(110,75,174,0.12) 0%, transparent 40%, transparent 60%, rgba(93,183,216,0.08) 100%)",
              }}
            />
            <div className="relative rounded-lg border border-border bg-elevated p-5 sm:p-6">
              {/* Avatar + content row */}
              <div className="flex gap-4 sm:gap-5">
                {/* Oracle portrait */}
                <div className="shrink-0">
                  <div
                    className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-lg overflow-hidden"
                    style={{
                      boxShadow: isPlaying
                        ? "0 0 0 2px #6E4BAE, 0 0 0 4px #5DB7D8, 0 0 20px rgba(110,75,174,0.5), 0 0 40px rgba(93,183,216,0.2)"
                        : "0 0 0 2px rgba(110,75,174,0.6), 0 0 12px rgba(110,75,174,0.25)",
                      transition: "box-shadow 0.4s ease",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/oracle-throne.jpg"
                      alt="The Oracle"
                      className="h-full w-full object-cover object-top"
                    />
                    {/* Active state indicator */}
                    {isPlaying && (
                      <div
                        className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-accent-cyan animate-pulse"
                        style={{ boxShadow: "0 0 6px #5DB7D8, 0 0 12px rgba(93,183,216,0.5)" }}
                      />
                    )}
                  </div>
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-cyan/70">
                    The Oracle Responds
                  </p>
                  <blockquote className="font-serif text-base sm:text-lg leading-relaxed text-text-primary">
                    {answer}
                  </blockquote>
                  <p className="font-mono text-[9px] text-text-muted/40 uppercase tracking-widest pt-1 border-t border-border">
                    Re: &ldquo;{question}&rdquo;
                  </p>
                </div>
              </div>

              {/* Waveform + controls */}
              {hasVoice && audioBase64 && (
                <div className="mt-5 space-y-2">
                  {/* Gradient waveform bars */}
                  <div
                    className="flex items-end gap-px h-10 cursor-pointer"
                    onClick={handlePlayPause}
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {BAR_HEIGHTS.map((h, i) => (
                      <div
                        key={i}
                        className={isPlaying ? "animate-waveform" : ""}
                        style={{
                          flex: 1,
                          height: `${Math.round(h * 40)}px`,
                          minHeight: "4px",
                          borderRadius: "2px",
                          backgroundColor: barColor(i, BAR_COUNT),
                          opacity: isPlaying ? 0.85 : 0.3,
                          animationDelay: `${(i % 8) * 0.1}s`,
                          transition: "opacity 0.3s ease",
                        }}
                      />
                    ))}
                  </div>

                  {/* Controls row */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handlePlayPause}
                      className="flex items-center gap-1.5 rounded border border-accent-violet/30 bg-accent-violet/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-accent-violet hover:bg-accent-violet/20 transition-colors"
                    >
                      {isPlaying ? (
                        <><PauseIcon /> Pause</>
                      ) : (
                        <><PlayIcon /> Hear the Oracle</>
                      )}
                    </button>
                    <p className="font-mono text-[9px] text-text-muted/50">
                      {isPlaying ? "Audio playing" : "Audio ready"} · {formatTime(currentTime)} / {formatTime(duration)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Citations */}
          {citations.length > 0 && (
            <div className="space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted/50">
                {"/// archive_sources"}
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

          {/* Email capture after free trial */}
          {trialUsed && captureState !== "done" && (
            <div className="rounded-xl border border-accent-gold/30 bg-accent-gold/5 p-5 space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold/60">
                {trialRemaining !== null && trialRemaining > 0
                  ? `/// ${trialRemaining} free question${trialRemaining === 1 ? "" : "s"} remaining this month`
                  : "/// free questions exhausted"}
              </p>
              <p className="font-display text-sm font-bold text-text-primary">
                The Oracle has more to say.
              </p>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Initiate+ opens unlimited Oracle access — plus transcripts, behavioral profiles,
                and the full intelligence layer. Drop your email and we&apos;ll send you in.
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!captureEmail.trim() || captureState === "saving") return;
                  setCaptureState("saving");
                  try {
                    await fetch("/api/subscribe", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: captureEmail.trim() }),
                    });
                  } finally {
                    setCaptureState("done");
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={captureEmail}
                  onChange={(e) => setCaptureEmail(e.target.value)}
                  className="flex-1 rounded border border-accent-gold/30 bg-void px-3 py-2 font-mono text-xs text-text-primary placeholder-text-muted/40 focus:border-accent-gold/60 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={captureState === "saving"}
                  className="rounded border border-accent-gold bg-accent-gold/15 px-4 py-2 font-mono text-[11px] font-bold text-accent-gold transition-all hover:bg-accent-gold/25 disabled:opacity-50"
                >
                  {captureState === "saving" ? "…" : "Send me in →"}
                </button>
              </form>
              <p className="font-mono text-[10px] text-text-muted/50">
                Or{" "}
                <Link href="/premium" className="text-accent-gold underline hover:text-accent-gold/80">
                  subscribe now →
                </Link>
              </p>
            </div>
          )}

          {trialUsed && captureState === "done" && (
            <div className="rounded-xl border border-accent-gold/30 bg-accent-gold/5 px-5 py-4 text-center space-y-1">
              <p className="font-mono text-xs font-bold text-accent-gold">Received.</p>
              <p className="font-mono text-[11px] text-text-muted">
                Check your inbox.{" "}
                <Link href="/premium" className="text-accent-gold underline">
                  Subscribe now →
                </Link>
              </p>
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

function ShareIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 1L9 3L7 5" />
      <path d="M9 3H4.5C3 3 2 4 2 5.5V9" />
    </svg>
  );
}

function CitationIcon({ type }: { type: OracleCitation["type"] }) {
  const icons: Record<OracleCitation["type"], string> = {
    quote: "❝",
    transcript: "◈",
    episode: "◉",
    person: "◇",
    chapter: "▲",   // Psychenomicon chapter
    entity: "◎",    // Psychenomicon entity
  };
  return <span className="opacity-60">{icons[type]}</span>;
}
