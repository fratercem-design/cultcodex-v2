import type { Metadata } from "next";
import Link from "next/link";
import { GameShow, type GameShowBank } from "@/components/gameshow/game-show";
import bankJson from "@/lib/data/gameshow-questions.json";

const bank = bankJson as unknown as GameShowBank;

// Fully static shell (the question bank is bundled, no per-request data) — matches
// the other Fun Wing pages and avoids the dynamic-streaming path that left the
// client board stuck in an unrevealed Suspense boundary.
export const dynamic = "force-static";

export const metadata: Metadata = {
  alternates: { canonical: "/gameshow" },
  title: "The Panelverse Game Show — CULT CODEX",
  description:
    "A live game show for the Cult of Psyche audience — 100 questions across five rounds, drawn from the real archive. Screen-share it and let chat play along.",
  robots: { index: true, follow: true },
};

export default function GameShowPage() {
  return (
    <main className="min-h-screen bg-void">
      <section className="border-b border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-void py-10 px-4">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-accent-violet/60">
            {"/// live_play · chat_answers_along"}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
            The Panelverse Game Show
          </h1>
          <p className="text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
            One hundred questions, five rounds, every answer pulled from the real
            Cult of Psyche archive. Pick a round, screen-share it, and let the
            chat shout letters. The Codex keeps score in spirit.
          </p>
        </div>
      </section>

      <GameShow bank={bank} />

      <div className="mx-auto max-w-3xl px-4 pb-12 text-center">
        <Link href="/fun" className="font-mono text-[10px] text-text-muted hover:text-accent-violet transition-colors">
          ← The Fun Wing
        </Link>
      </div>
    </main>
  );
}
