import type { Metadata } from "next";
import { QuizClient } from "@/components/archetype-quiz/quiz-client";

export const dynamic = "force-static";

export const metadata: Metadata = {
  alternates: { canonical: "/archetype-quiz" },
  title: "Discover Your Archetype — CultCodex",
  description:
    "10 questions. One revelation. Discover your mythic archetype through the Cult Codex system — Oracle, Alchemist, Trickster, Mirror Walker, Prophet, Architect, Exile, or Familiar.",
  openGraph: {
    title: "Discover Your Archetype — CultCodex",
    description:
      "10 questions. One revelation. Find out which of the 8 CultCodex archetypes you embody.",
  },
};

export default function ArchetypeQuizPage() {
  return (
    <main className="min-h-screen bg-void">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-accent-violet/5 to-void py-12 px-4">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-accent-violet/60">
            {"/// archetype_discovery"}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
            DISCOVER YOUR ARCHETYPE
          </h1>
          <div className="mx-auto h-0.5 w-16 bg-accent-violet rounded-full" />
          <p className="font-mono text-sm text-text-muted">
            10 questions. One revelation.
          </p>
          <p className="text-sm text-text-muted/70 max-w-md mx-auto leading-relaxed">
            The CultCodex system maps eight mythic archetypes — each a distinct mode of perceiving, acting, and being in the world. Answer honestly.
          </p>
        </div>
      </section>

      {/* Quiz */}
      <QuizClient />
    </main>
  );
}
