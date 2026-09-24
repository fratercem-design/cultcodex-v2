"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ARCHETYPES, QUESTIONS } from "@/lib/archetype-quiz/data";
import type { QuizArchetype } from "@/lib/archetype-quiz/data";

type QuizState = "quiz" | "result";

function calculateResult(answers: Partial<Record<string, number>>): QuizArchetype {
  let topId = ARCHETYPES[0].id;
  let topScore = 0;
  for (const archetype of ARCHETYPES) {
    const score = answers[archetype.id] ?? 0;
    if (score > topScore) {
      topScore = score;
      topId = archetype.id;
    }
  }
  return ARCHETYPES.find((a) => a.id === topId) ?? ARCHETYPES[0];
}

export function QuizClient() {
  const [phase, setPhase] = useState<QuizState>("quiz");
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<Partial<Record<string, number>>>({});
  const [animating, setAnimating] = useState(false);
  const [result, setResult] = useState<QuizArchetype | null>(null);
  const [copied, setCopied] = useState(false);

  const question = QUESTIONS[currentQ];
  const isLast = currentQ === QUESTIONS.length - 1;
  const progress = ((currentQ) / QUESTIONS.length) * 100;

  const handleAnswer = useCallback(
    (optionScores: Partial<Record<string, number>>) => {
      if (animating) return;
      setAnimating(true);

      const newScores = { ...scores };
      for (const [id, pts] of Object.entries(optionScores)) {
        newScores[id] = (newScores[id] ?? 0) + (pts ?? 0);
      }
      setScores(newScores);

      if (isLast) {
        const winner = calculateResult(newScores);
        setTimeout(() => {
          setResult(winner);
          setPhase("result");
          setAnimating(false);
        }, 280);
      } else {
        setTimeout(() => {
          setCurrentQ((q) => q + 1);
          setAnimating(false);
        }, 280);
      }
    },
    [animating, scores, isLast]
  );

  const handleRetake = useCallback(() => {
    setPhase("quiz");
    setCurrentQ(0);
    setScores({});
    setResult(null);
    setCopied(false);
    setAnimating(false);
  }, []);

  const handleCopy = useCallback(() => {
    if (!result) return;
    const text = `I am ${result.name} — ${result.tagline} Discover your archetype at cultcodex.me/archetype-quiz`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [result]);

  if (phase === "result" && result) {
    return (
      <div
        className="mx-auto max-w-2xl px-4 py-8"
        style={{
          animation: "fadeSlideIn 0.5s ease forwards",
        }}
      >
        <style>{`
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes glyphPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.04); }
          }
        `}</style>

        {/* Result hero */}
        <div className="rounded-xl border border-border bg-surface p-8 space-y-6 text-center">
          {/* Glyph */}
          <div
            className="text-8xl font-mono mx-auto leading-none"
            style={{
              color: result.hex,
              filter: `drop-shadow(0 0 20px ${result.hex}66)`,
              animation: "glyphPulse 3s ease-in-out infinite",
              display: "inline-block",
            }}
          >
            {result.glyph}
          </div>

          {/* Label + name */}
          <div className="space-y-1">
            <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">
              {"/// you_are"}
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-bold"
              style={{ color: result.hex }}
            >
              {result.name}
            </h2>
            <p className="font-mono text-sm text-text-muted italic">{result.tagline}</p>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-6 space-y-4">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">
            {"/// your_nature"}
          </p>
          <p className="text-sm text-text-muted leading-relaxed">{result.description}</p>
        </div>

        {/* Shadow */}
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-5 space-y-2">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-red-400/60">
            {"/// the_shadow"}
          </p>
          <p className="text-sm text-text-muted/80 leading-relaxed italic">{result.shadow}</p>
        </div>

        {/* Gifts */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-6 space-y-3">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">
            {"/// your_gifts"}
          </p>
          <ul className="space-y-2">
            {result.gifts.map((gift, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="font-mono text-xs mt-0.5 flex-shrink-0"
                  style={{ color: result.hex }}
                >
                  ▸
                </span>
                <span className="text-sm text-text-muted leading-relaxed">{gift}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Related symbols */}
        <div className="mt-6 space-y-3">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">
            {"/// related_symbols"}
          </p>
          <div className="flex flex-wrap gap-2">
            {result.relatedSymbols.map((slug) => (
              <Link
                key={slug}
                href={`/symbols/${slug}`}
                className="inline-flex items-center gap-1.5 rounded border border-accent-gold/30 bg-accent-gold/10 hover:bg-accent-gold/20 px-3 py-1.5 font-mono text-xs text-accent-gold-text transition-colors"
              >
                ✦ {slug.replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        </div>

        {/* CTA + actions */}
        <div className="mt-8 space-y-4">
          <Link
            href={result.ctaHref}
            className="block w-full text-center rounded-lg border px-6 py-3.5 font-mono text-sm font-bold transition-colors"
            style={{
              borderColor: `${result.hex}66`,
              backgroundColor: `${result.hex}1a`,
              color: result.hex,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = `${result.hex}33`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = `${result.hex}1a`;
            }}
          >
            {result.cta}
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 rounded-lg border border-border bg-surface hover:border-accent-gold/30 hover:text-accent-gold-text px-5 py-2.5 font-mono text-xs text-text-muted transition-colors"
            >
              {copied ? "✓ Copied to clipboard!" : "Copy result"}
            </button>
            <button
              onClick={handleRetake}
              className="rounded-lg border border-border bg-surface hover:border-border/80 px-5 py-2.5 font-mono text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              Retake quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-2xl px-4 py-8"
      style={{
        animation: "fadeSlideIn 0.4s ease forwards",
      }}
    >
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes optionIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Progress */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center justify-between font-mono text-[12px] text-text-muted">
          <span>{"/// question_"}{String(currentQ + 1).padStart(2, "0")}</span>
          <span>{currentQ + 1} / {QUESTIONS.length}</span>
        </div>
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-gold rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div
        className="mb-8 space-y-2"
        key={`q-${currentQ}`}
        style={{
          animation: "fadeSlideIn 0.35s ease forwards",
        }}
      >
        <h2 className="font-display text-xl sm:text-2xl font-bold text-text-primary leading-snug">
          {question.question}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-3" key={`opts-${currentQ}`}>
        {question.options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(option.scores)}
            disabled={animating}
            className="w-full text-left rounded-xl border border-border bg-surface hover:border-accent-gold/50 hover:bg-accent-gold/5 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-4 font-mono text-sm text-text-muted hover:text-text-primary transition-all duration-150"
            style={{
              animation: `optionIn 0.3s ease ${i * 60}ms both`,
            }}
          >
            <span className="text-accent-gold-text/80 mr-3 text-[12px] uppercase tracking-widest">
              {["A", "B", "C", "D"][i]}
            </span>
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
}
