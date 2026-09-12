import { StartHereQuiz } from "@/components/start-here/start-here-quiz";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import Link from "next/link";
import type { Metadata } from "next";
import { getCounts, fmtEpisodeCount } from "@/lib/queries/stats";

export async function generateMetadata(): Promise<Metadata> {
  const counts = await getCounts().catch(() => null);
  return {
    alternates: { canonical: "/start-here/quiz" },
    title: "Find Your Path — CULT CODEX",
    description: `Three questions. A personalized entry point into ${fmtEpisodeCount(counts?.episodes ?? 0)} transmissions.`,
  };
}

export default async function StartHereQuizPage() {
  const counts = await getCounts().catch(() => null);

  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-16 space-y-12">
      <div className="text-center space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold-text/80">
          ✦ &nbsp; CultCodex &nbsp; ✦
        </p>
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Find Your Path
        </h1>
        <p className="font-mono text-xs text-text-muted max-w-md mx-auto leading-relaxed">
          Three questions. The archive calibrates around your answers and gives
          you a personal entry point into {fmtEpisodeCount(counts?.episodes ?? 0)} transmissions.
        </p>
      </div>

      <MysticalDivider />

      <StartHereQuiz />

      <div className="text-center pt-4">
        <Link
          href="/start-here"
          className="font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
        >
          ← back to start here
        </Link>
      </div>
    </main>
  );
}
