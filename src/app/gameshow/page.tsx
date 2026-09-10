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
    "How well do you really know the Cult? 1,000 questions across 11 rounds, every answer hidden inside thousands of hours of real livestream archive. Play now.",
  robots: { index: true, follow: true },
};

const STATS = [
  { n: "1000", l: "Questions" },
  { n: "11", l: "Rounds" },
  { n: "1000s", l: "Archive Moments" },
  { n: "∞", l: "Replayability" },
];

export default function GameShowPage() {
  return (
    <main className="min-h-screen bg-void">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-accent-violet/20 py-16 px-4">
        {HERO_ART && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO_ART} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-void/75 via-void/70 to-void" />
          </>
        )}
        <div className="gs-drift pointer-events-none absolute inset-0 opacity-40" aria-hidden />

        <div className="relative mx-auto max-w-3xl text-center space-y-5">
          <GameShowHero size={84} className="mx-auto text-accent-violet-text" title="Panelverse Game Show sigil" />
          <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-accent-violet-text/70">{"/// the_ultimate_cult_trivia_experience"}</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-text-primary leading-tight">
            The Panelverse Game Show
          </h1>
          <p className="mx-auto max-w-xl text-base text-text-muted leading-relaxed">
            How well do you <em className="text-accent-gold-text not-italic font-bold">really</em> know the Cult? Every
            question comes from a real livestream. Every answer is hidden somewhere inside thousands of hours of chaos.
            <br className="hidden sm:block" />
            <span className="text-text-primary font-medium"> Can you survive eleven rounds?</span>
          </p>

          <div className="pt-2">
            <Link
              href="#rounds"
              className="inline-flex items-center gap-2 rounded-lg border border-accent-gold/60 bg-accent-gold/15 px-8 py-4 font-display text-lg font-bold text-accent-gold-text hover:bg-accent-gold/25 hover:scale-[1.04] active:scale-[0.98] transition-all shadow-[0_0_32px_-8px_rgba(200,57,46,0.6)]"
            >
              ▶ Play Now
            </Link>
          </div>

          {/* Stat strip */}
          <div className="mx-auto grid max-w-lg grid-cols-4 gap-2 pt-6">
            {STATS.map((s) => (
              <div key={s.l} className="rounded-lg border border-border bg-surface/50 py-3">
                <div className="font-display text-xl sm:text-2xl font-bold text-accent-cyan">{s.n}</div>
                <div className="font-mono text-[8px] sm:text-[9px] uppercase tracking-widest text-text-muted">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <GameShowLoader />

      <div className="mx-auto max-w-3xl px-4 pb-12 text-center">
        <Link href="/fun" className="font-mono text-[10px] text-text-muted hover:text-accent-violet-text transition-colors">← The Fun Wing</Link>
      </div>
    </main>
  );
}
