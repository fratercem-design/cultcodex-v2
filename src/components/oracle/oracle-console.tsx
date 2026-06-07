"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { OracleCitation, OracleResponse } from "@/app/api/oracle/ask/route";

type ConsoleState = "idle" | "loading" | "answered" | "error";

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Violet (#9B6ED0) → cyan (#5DB7D8) gradient across bars
function barColor(index: number, total: number): string {
  const t = index / (total - 1);
  const r = Math.round(155 + (93 - 155) * t);
  const g = Math.round(110 + (183 - 110) * t);
  const b = Math.round(208 + (216 - 208) * t);
  return `rgb(${r},${g},${b})`;
}

const BAR_COUNT = 40;
const BAR_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const base =
    Math.sin(i * 0.7) * 0.4 +
    Math.sin(i * 1.3) * 0.3 +
    Math.sin(i * 0.4) * 0.2 +
    0.5;
  return Math.max(0.08, Math.min(1, base));
});

// Typewriter hook — reveals text character by character
function useTypewriter(text: string, active: boolean, speed = 16) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    if (!active || !text) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayed(text);
      return;
    }
    indexRef.current = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      indexRef.current++;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, active, speed]);

  return displayed;
}

export function OracleConsole() {
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<ConsoleState>("idle");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<OracleCitation[]>([]);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [hasVoice, setHasVoice] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayBlocked, setAutoPlayBlocked] = useState(false);
  const [gated, setGated] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);
  const [trialRemaining, setTrialRemaining] = useState<number | null>(null);
  const [captureEmail, setCaptureEmail] = useState("");
  const [captureState, setCaptureState] = useState<"idle" | "saving" | "done">("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [typewriterActive, setTypewriterActive] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const answerRef = useRef<HTMLDivElement | null>(null);
  const playButtonRef = useRef<HTMLButtonElement | null>(null);

  const displayedAnswer = useTypewriter(answer, typewriterActive, 16);

  // Auto-play audio when it arrives; detect browser block
  useEffect(() => {
    if (audioBase64 && state === "answered") {
      const src = `data:audio/mpeg;base64,${audioBase64}`;
      const audio = new Audio(src);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      audio.onpause = () => setIsPlaying(false);
      audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
      audio.onloadedmetadata = () => setDuration(audio.duration);

      audio.play().then(() => {
        setAutoPlayBlocked(false);
      }).catch(() => {
        // Browser blocked auto-play — surface a tap-to-hear prompt
        setAutoPlayBlocked(true);
        setTimeout(() => playButtonRef.current?.focus(), 120);
      });
    }
  }, [audioBase64, state]);

  useEffect(() => {
    if (state === "answered") {
      setTypewriterActive(true);
      answerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
    setCurrentTime(0);
    setDuration(0);
    setTypewriterActive(false);
    setAutoPlayBlocked(false);

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
      setAutoPlayBlocked(false);
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
    setCurrentTime(0);
    setDuration(0);
    setTrialUsed(false);
    setCaptureState("idle");
    setCaptureEmail("");
    setTypewriterActive(false);
    setAutoPlayBlocked(false);
  }

  return (
    <div className="space-y-6">

      {/* ── Question form ── */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative group">
          {/* Focus glow border */}
          <div
            className="absolute -inset-px rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(155,110,208,0.5) 0%, rgba(93,183,216,0.25) 50%, rgba(155,110,208,0.5) 100%)",
              filter: "blur(1px)",
            }}
            aria-hidden="true"
          />
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask the Oracle anything about the archive…"
            disabled={state === "loading"}
            rows={3}
            maxLength={500}
            className="relative w-full rounded-xl border border-accent-violet/25 bg-black/60 px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted/30 focus:border-accent-violet/50 focus:outline-none resize-none disabled:opacity-50 transition-all"
            style={{ backdropFilter: "blur(8px)" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
          />
          <p className="absolute bottom-2.5 right-3 font-mono text-[9px] text-text-muted/25">
            {question.length}/500
          </p>
        </div>

        <button
          type="submit"
          disabled={!question.trim() || state === "loading"}
          className="relative w-full overflow-hidden flex items-center justify-center gap-2.5 rounded-xl border border-accent-violet/40 bg-black/40 px-6 py-3.5 font-mono text-sm font-bold text-accent-violet transition-all hover:border-accent-violet/70 hover:bg-accent-violet/10 disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          {/* Shimmer sweep on hover */}
          <span
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
            style={{
              background:
                "linear-gradient(105deg, transparent 20%, rgba(155,110,208,0.06) 40%, rgba(155,110,208,0.14) 50%, rgba(155,110,208,0.06) 60%, transparent 80%)",
            }}
            aria-hidden="true"
          />
          {state === "loading" ? (
            <>
              <LoadingOrb />
              <span>Searching the archive…</span>
            </>
          ) : (
            <>
              <span className="text-accent-violet/50 text-base">◈</span>
              <span>Consult the Oracle</span>
              <span className="text-accent-violet/50 text-base">◈</span>
            </>
          )}
        </button>
      </form>

      {/* ── Loading — flashing oracle portrait ── */}
      {state === "loading" && (
        <div className="flex flex-col items-center gap-5 py-10">
          <div className="relative flex items-center justify-center">
            {/* Flashing rings — defined in globals.css */}
            <div className="absolute rounded-full border-2 border-accent-violet animate-oracle-ring"
              style={{ width: 160, height: 160 }} />
            <div className="absolute rounded-full border border-accent-cyan animate-oracle-ring"
              style={{ width: 190, height: 190, animationDelay: "0.25s" }} />
            <div className="absolute rounded-full border border-accent-violet/40 animate-oracle-ring"
              style={{ width: 220, height: 220, animationDelay: "0.5s" }} />
            {/* Oracle portrait — flashing glow */}
            <div className="relative h-28 w-28 rounded-full overflow-hidden animate-oracle-flash">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/oracle-throne.jpg"
                alt="The Oracle"
                className="h-full w-full object-cover object-top"
              />
            </div>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-accent-violet/50 animate-pulse">
            searching_the_archive
          </p>
        </div>
      )}

      {/* ── Gated ── */}
      {state === "error" && gated && (
        <div className="rounded-xl border border-accent-gold/20 bg-gradient-to-b from-accent-gold/5 to-surface p-6 text-center space-y-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-gold/60">
            {"/// initiate_required"}
          </p>
          <p className="font-display text-base font-bold text-text-primary">
            The Oracle speaks only to Initiates.
          </p>
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
        <div ref={answerRef} className="space-y-5 animate-fadeIn">

          {/* ── Voice player — first thing they see ── */}
          {hasVoice && audioBase64 && (
            <div className="relative rounded-2xl overflow-hidden border border-accent-violet/25">
              {/* Deep background */}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(180deg, #0a0014 0%, #050010 100%)",
                }}
                aria-hidden="true"
              />
              {/* Ambient glow expands when playing */}
              <div
                className="absolute inset-0 pointer-events-none transition-all duration-1000"
                aria-hidden="true"
                style={{
                  background: isPlaying
                    ? "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(155,110,208,0.22) 0%, transparent 70%)"
                    : "radial-gradient(ellipse 50% 40% at 50% 30%, rgba(155,110,208,0.07) 0%, transparent 70%)",
                }}
              />

              <div className="relative p-6 flex flex-col items-center gap-5">
                {/* Pulsing orb play button */}
                <div className="relative flex items-center justify-center">
                  {/* Outer ripple rings — only when playing */}
                  {isPlaying && (
                    <>
                      <div
                        className="absolute rounded-full border border-accent-violet/25 animate-ping"
                        style={{ width: 96, height: 96, animationDuration: "2s" }}
                      />
                      <div
                        className="absolute rounded-full border border-accent-cyan/12 animate-ping"
                        style={{ width: 128, height: 128, animationDuration: "3s", animationDelay: "0.6s" }}
                      />
                    </>
                  )}

                  <button
                    ref={playButtonRef}
                    onClick={handlePlayPause}
                    className="relative h-20 w-20 rounded-full flex items-center justify-center focus:outline-none transition-all duration-500"
                    style={{
                      background: isPlaying
                        ? "radial-gradient(circle at 40% 40%, rgba(155,110,208,0.5) 0%, rgba(93,183,216,0.25) 55%, rgba(155,110,208,0.15) 100%)"
                        : "radial-gradient(circle at 40% 40%, rgba(155,110,208,0.25) 0%, rgba(93,183,216,0.12) 55%, transparent 100%)",
                      boxShadow: isPlaying
                        ? "0 0 0 2px rgba(155,110,208,0.7), 0 0 24px rgba(155,110,208,0.5), 0 0 50px rgba(93,183,216,0.2)"
                        : "0 0 0 2px rgba(155,110,208,0.35), 0 0 14px rgba(155,110,208,0.2)",
                    }}
                    aria-label={isPlaying ? "Pause Oracle voice" : "Hear the Oracle speak"}
                  >
                    {isPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
                  </button>
                </div>

                {/* Status label */}
                {autoPlayBlocked && !isPlaying ? (
                  <p className="font-mono text-[11px] font-bold text-accent-violet tracking-[0.2em] uppercase animate-pulse text-center">
                    ◈ The Oracle speaks — tap to hear ◈
                  </p>
                ) : (
                  <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-accent-violet/55 text-center">
                    {isPlaying ? "The Oracle speaks" : "Voice ready"}
                  </p>
                )}

                {/* Waveform */}
                <div
                  className="flex items-end gap-px h-8 w-full max-w-xs cursor-pointer"
                  onClick={handlePlayPause}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {BAR_HEIGHTS.map((h, i) => (
                    <div
                      key={i}
                      className={isPlaying ? "animate-waveform" : ""}
                      style={{
                        flex: 1,
                        height: `${Math.round(h * 32)}px`,
                        minHeight: "3px",
                        borderRadius: "2px",
                        backgroundColor: barColor(i, BAR_COUNT),
                        opacity: isPlaying ? 0.75 : 0.2,
                        animationDelay: `${(i % 8) * 0.1}s`,
                        transition: "opacity 0.4s ease",
                      }}
                    />
                  ))}
                </div>

                {/* Timestamp */}
                <p className="font-mono text-[9px] text-text-muted/35 uppercase tracking-widest">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </p>
              </div>
            </div>
          )}

          {/* ── Oracle response card ── */}
          <div className="relative rounded-xl overflow-hidden">
            {/* Dark atmospheric background */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(160deg, #0e0020 0%, #070015 50%, #040010 100%)",
              }}
              aria-hidden="true"
            />
            {/* Corner light leaks */}
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
              style={{
                background:
                  "linear-gradient(135deg, rgba(155,110,208,0.14) 0%, transparent 35%, transparent 65%, rgba(93,183,216,0.07) 100%)",
              }}
            />
            {/* Outer border */}
            <div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ border: "1px solid rgba(155,110,208,0.28)" }}
              aria-hidden="true"
            />

            <div className="relative p-6 sm:p-8 space-y-6">
              {/* Oracle portrait — centered at top */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="relative h-20 w-20 rounded-full overflow-hidden"
                  style={{
                    boxShadow: isPlaying
                      ? "0 0 0 2px #9B6ED0, 0 0 0 5px #5DB7D8, 0 0 24px rgba(155,110,208,0.55), 0 0 48px rgba(93,183,216,0.2)"
                      : "0 0 0 2px rgba(155,110,208,0.5), 0 0 14px rgba(155,110,208,0.22)",
                    transition: "box-shadow 0.6s ease",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/oracle-throne.jpg"
                    alt="The Oracle"
                    className="h-full w-full object-cover object-top"
                  />
                  {/* Speaking indicator dot */}
                  {isPlaying && (
                    <div
                      className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-accent-cyan animate-pulse"
                      style={{ boxShadow: "0 0 6px #5DB7D8, 0 0 12px rgba(93,183,216,0.5)" }}
                    />
                  )}
                </div>
                <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-accent-cyan/45">
                  {"/// oracle_response"}
                </p>
              </div>

              {/* Ornamental divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent-violet/18 to-transparent" />
                <span className="text-accent-violet/28 text-xs">◈</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent-violet/18 to-transparent" />
              </div>

              {/* Answer text — typewriter reveal */}
              <blockquote className="font-serif text-base sm:text-lg leading-relaxed text-text-primary text-center px-2 min-h-[3rem]">
                {displayedAnswer}
                {/* Blinking cursor during typewriter */}
                {displayedAnswer.length < answer.length && (
                  <span className="inline-block w-0.5 h-[1.1em] bg-accent-violet/70 ml-0.5 align-middle animate-pulse" />
                )}
              </blockquote>

              {/* Question echo */}
              <p className="font-mono text-[9px] text-text-muted/30 uppercase tracking-widest text-center pt-1 border-t border-accent-violet/10">
                Re: &ldquo;{question}&rdquo;
              </p>
            </div>
          </div>

          {/* ── Citations ── */}
          {citations.length > 0 && (
            <div className="space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted/40">
                {"/// archive_sources"}
              </p>
              <div className="flex flex-wrap gap-2">
                {citations.map((c, i) => (
                  <Link
                    key={i}
                    href={c.href}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-black/30 px-2.5 py-1.5 font-mono text-[9px] text-text-muted hover:border-accent-violet/40 hover:text-accent-violet transition-all truncate max-w-[200px]"
                  >
                    <CitationIcon type={c.type} />
                    <span className="truncate">{c.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Email capture after free trial ── */}
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

          {/* ── Ask again ── */}
          <button
            onClick={handleReset}
            className="w-full text-center font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted/35 hover:text-accent-violet/70 transition-colors py-2"
          >
            ◈ ask another question ◈
          </button>
        </div>
      )}
    </div>
  );
}

// Dual-ring ritual loader with rotating rune points
function RitualLoader() {
  return (
    <div className="relative h-24 w-24">
      {/* Outer ring — slow clockwise */}
      <svg
        className="absolute inset-0 animate-spin"
        style={{ animationDuration: "9s" }}
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="48" cy="48" r="44"
          stroke="rgba(155,110,208,0.18)"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <circle
            key={angle}
            cx={48 + 44 * Math.cos((angle * Math.PI) / 180)}
            cy={48 + 44 * Math.sin((angle * Math.PI) / 180)}
            r="2"
            fill="rgba(155,110,208,0.55)"
          />
        ))}
      </svg>

      {/* Inner ring — counter-clockwise */}
      <svg
        className="absolute inset-3 animate-spin"
        style={{ animationDuration: "5s", animationDirection: "reverse" }}
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="36" cy="36" r="32"
          stroke="rgba(93,183,216,0.18)"
          strokeWidth="1"
          strokeDasharray="2 6"
        />
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <circle
            key={angle}
            cx={36 + 32 * Math.cos((angle * Math.PI) / 180)}
            cy={36 + 32 * Math.sin((angle * Math.PI) / 180)}
            r="1.5"
            fill="rgba(93,183,216,0.65)"
          />
        ))}
      </svg>

      {/* Center orb */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="h-10 w-10 rounded-full animate-pulse"
          style={{
            background:
              "radial-gradient(circle, rgba(155,110,208,0.55) 0%, rgba(93,183,216,0.22) 50%, transparent 80%)",
            boxShadow:
              "0 0 20px rgba(155,110,208,0.45), 0 0 40px rgba(93,183,216,0.15)",
          }}
        />
      </div>
    </div>
  );
}

function LoadingOrb() {
  return (
    <span className="inline-block h-3 w-3 rounded-full border-2 border-current/30 border-t-current animate-spin" />
  );
}

function PlayIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="currentColor">
      <path d="M2 1.5l6 3.5-6 3.5V1.5z" />
    </svg>
  );
}

function PauseIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="currentColor">
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
    chapter: "▲",
    entity: "◎",
  };
  return <span className="opacity-60">{icons[type]}</span>;
}
