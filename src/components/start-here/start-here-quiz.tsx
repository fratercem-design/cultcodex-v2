"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Interest, Depth, Intent } from "@/lib/queries/start-here";

interface Step {
  key: string;
  question: string;
  subtext: string;
  options: { value: string; label: string; sub: string; glyph: string }[];
}

const STEPS: Step[] = [
  {
    key: "interest",
    question: "What's pulling you?",
    subtext: "Not a category — a territory. Pick what's alive for you right now.",
    options: [
      { value: "consciousness", label: "Consciousness & the Self", sub: "Non-duality, ego death, psychedelics, simulation", glyph: "◎" },
      { value: "ai", label: "AI & The Future", sub: "Machine intelligence, what's coming, post-human futures", glyph: "⟁" },
      { value: "occult", label: "The Occult & Hidden Knowledge", sub: "Tarot, alchemy, hermeticism, chaos magick, astrology", glyph: "✦" },
      { value: "behavior", label: "Human Behavior & Psychology", sub: "Narcissism, shadow, relationships, addiction, identity", glyph: "◐" },
      { value: "wild", label: "Chaos, Drama & Wild Conversations", sub: "Open panels, Troll Tribunal, legendary guests, conflict", glyph: "⚡" },
    ],
  },
  {
    key: "depth",
    question: "Where are you in the archive?",
    subtext: "This calibrates what the archive shows you.",
    options: [
      { value: "fresh", label: "Fresh — I've barely started", sub: "Show me the foundations, the early transmissions", glyph: "●" },
      { value: "familiar", label: "Familiar — I know the basics", sub: "Show me what's recent and what I may have missed", glyph: "◉" },
      { value: "deep", label: "Deep — I've gone far in", sub: "Show me the buried material, the less-obvious entries", glyph: "⬟" },
    ],
  },
  {
    key: "intent",
    question: "What do you want right now?",
    subtext: "The archive will meet you there.",
    options: [
      { value: "episodes", label: "Episodes to watch", sub: "Specific transmissions to drop into", glyph: "▶" },
      { value: "people", label: "People to understand", sub: "Figures, voices, and their arcs in the archive", glyph: "◈" },
      { value: "oracle", label: "Ask the Oracle something", sub: "Let AI synthesize across thousands of transmissions", glyph: "◇" },
    ],
  },
];

interface Answers {
  interest: Interest | null;
  depth: Depth | null;
  intent: Intent | null;
}

export function StartHereQuiz() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ interest: null, depth: null, intent: null });
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const current = STEPS[step];

  function handleSelect(value: string) {
    setSelected(value);
    // Brief delay so the selection visually registers before advancing
    setTimeout(() => {
      const key = current.key as keyof Answers;
      const next = { ...answers, [key]: value as never };
      setAnswers(next);
      setSelected(null);

      if (step < STEPS.length - 1) {
        setStep(step + 1);
      } else {
        setSubmitting(true);
        const { interest, depth, intent } = next;
        router.push(
          `/start-here/results?interest=${interest}&depth=${depth}&intent=${intent}`
        );
      }
    }, 180);
  }

  const accentByStep = ["text-accent-violet", "text-accent-cyan", "text-accent-gold"];
  const borderByStep = ["border-accent-violet/40", "border-accent-cyan/40", "border-accent-gold/40"];
  const bgByStep = ["bg-accent-violet/10", "bg-accent-cyan/10", "bg-accent-gold/10"];
  const accent = accentByStep[step];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2 justify-center">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < step
                  ? "w-8 bg-text-muted/60"
                  : i === step
                  ? `w-8 ${accent.replace("text-", "bg-")}`
                  : "w-4 bg-border"
              }`}
            />
          </div>
        ))}
        <span className="font-mono text-[10px] text-text-muted ml-2 tracking-widest uppercase">
          {step + 1} / {STEPS.length}
        </span>
      </div>

      {/* Question */}
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-bold text-text-primary">
          {current.question}
        </h2>
        <p className="font-mono text-xs text-text-muted">{current.subtext}</p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {current.options.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => !submitting && handleSelect(opt.value)}
              disabled={submitting}
              className={`group w-full flex items-start gap-4 rounded-xl border p-5 text-left transition-all duration-150 ${
                isSelected
                  ? `${borderByStep[step]} ${bgByStep[step]}`
                  : "border-border bg-surface hover:border-border-strong hover:bg-elevated"
              }`}
            >
              <span
                className={`font-mono text-xl mt-0.5 transition-colors shrink-0 ${
                  isSelected ? accent : "text-text-muted group-hover:text-text-primary"
                }`}
              >
                {opt.glyph}
              </span>
              <div className="space-y-1 min-w-0">
                <p
                  className={`font-display text-sm font-bold transition-colors ${
                    isSelected ? accent : "text-text-primary"
                  }`}
                >
                  {opt.label}
                </p>
                <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                  {opt.sub}
                </p>
              </div>
              <span
                className={`ml-auto font-mono text-xs mt-1 shrink-0 transition-all ${
                  isSelected ? accent : "text-text-muted/0 group-hover:text-text-muted/60"
                }`}
              >
                {isSelected ? "✓" : "→"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Back */}
      {step > 0 && !submitting && (
        <div className="text-center">
          <button
            onClick={() => setStep(step - 1)}
            className="font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
          >
            ← back
          </button>
        </div>
      )}

      {submitting && (
        <p className="text-center font-mono text-xs text-text-muted animate-pulse">
          Calibrating the archive…
        </p>
      )}
    </div>
  );
}
