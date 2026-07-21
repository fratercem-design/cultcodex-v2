import type { Metadata } from "next";
import Link from "next/link";
import { GameShowLoader } from "@/components/gameshow/game-show-loader";
import { GameShowHero } from "@/components/gameshow/emblems";
import { HERO_ART } from "@/components/gameshow/art-manifest";

export const dynamic = "force-static";

export const metadata: Metadata = {
  alternates: { canonical: "/gameshow" },
  title: "The Panelverse Game Show — CULT CODEX",
  description:
    "A live game show for the Cult of Psyche audience — 500 questions across eight rounds, drawn from the real archive. Screen-share it and let chat play along.",
  robots: { index: true, follow: true },
};

export default function GameShowPage() {
  return (
    <main className="min-h-screen bg-void">
      <section className="relative overflow-hidden border-b border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-void py-10 px-4">
        {HERO_ART && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO_ART} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-void/70 via-void/60 to-void" />
          </>
        )}
        <div className="relative mx-auto max-w-3xl text-center space-y-3">
          <GameShowHero size={92} className="mx-auto text-accent-violet" title="Panelverse Game Show sigil" />
          <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-accent-violet/60">
            {"/// live_play · chat_answers_along"}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
            The Panelverse Game Show
          </h1>
          <p className="text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
            Five hundred questions across eight rounds, every answer pulled from
            the real Cult of Psyche archive. Pick a round, screen-share it, and
            let the chat call letters. The Codex keeps score in spirit.
          </p>
        </div>
      </section>

      <GameShowLoader />

      <div className="mx-auto max-w-3xl px-4 pb-12 text-center">
        <Link href="/fun" className="font-mono text-[10px] text-text-muted hover:text-accent-violet transition-colors">
          ← The Fun Wing
        </Link>
      </div>
    </main>
  );
}
