import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "\ud83d\udc31 \u2014 CULT CODEX",
  description: "You weren\u2019t supposed to find this.",
};

const CAT_QUOTES = [
  "\u201cMeow meow, the cards tell me\u2026\u201d",
  "\u201cWhen the cat walks through the tarot spread, that\u2019s when the real magic happens.\u201d",
  "\u201cHe just sat on the Death card. That\u2019s not a reading, that\u2019s a statement.\u201d",
  "\u201cTrix doesn\u2019t care about your panel. Trix IS the panel.\u201d",
  "\u201cPie has judged you. The verdict is: more treats.\u201d",
];

export default function MeowPage() {
  // Pick a quote deterministically based on the day
  const quoteIndex = new Date().getDate() % CAT_QUOTES.length;
  const quote = CAT_QUOTES[quoteIndex];

  return (
    <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-20">
      {/* Cat eyes */}
      <div className="mb-12 flex items-center gap-20">
        {/* Left eye */}
        <div className="relative">
          <div
            className="h-10 w-7 rounded-[50%] border border-accent-cyan/30"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,217,255,0.4) 0%, rgba(0,217,255,0.15) 40%, transparent 70%)",
              boxShadow:
                "0 0 20px rgba(0,217,255,0.3), 0 0 40px rgba(0,217,255,0.1), inset 0 0 10px rgba(0,217,255,0.2)",
            }}
          >
            {/* Pupil */}
            <div
              className="absolute left-1/2 top-1/2 h-7 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-void"
              style={{
                boxShadow: "0 0 4px rgba(0,0,0,0.8)",
              }}
            />
          </div>
        </div>
        {/* Right eye */}
        <div className="relative">
          <div
            className="h-10 w-7 rounded-[50%] border border-accent-cyan/30"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,217,255,0.4) 0%, rgba(0,217,255,0.15) 40%, transparent 70%)",
              boxShadow:
                "0 0 20px rgba(0,217,255,0.3), 0 0 40px rgba(0,217,255,0.1), inset 0 0 10px rgba(0,217,255,0.2)",
            }}
          >
            <div
              className="absolute left-1/2 top-1/2 h-7 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-void"
              style={{
                boxShadow: "0 0 4px rgba(0,0,0,0.8)",
              }}
            />
          </div>
        </div>
      </div>

      <p className="mb-10 font-mono text-xs tracking-widest text-text-muted">
        You found the cats.
      </p>

      {/* Cat profiles */}
      <div className="flex w-full flex-col gap-8">
        {/* Trix */}
        <div className="rounded-lg border border-accent-cyan/10 bg-accent-cyan/[0.03] px-6 py-5">
          <h2 className="font-display text-lg text-accent-cyan">Trix</h2>
          <p className="mt-1 font-mono text-xs text-text-muted">
            The youngest prince. Panel disruptor. Tarot walk-through specialist.
          </p>
        </div>

        {/* Lenore */}
        <div className="rounded-lg border border-accent-gold/10 bg-accent-gold/[0.03] px-6 py-5">
          <h2 className="font-display text-lg text-accent-gold">
            Lenore <span className="font-mono text-xs text-text-muted">(Pie)</span>
          </h2>
          <p className="mt-1 font-mono text-xs text-text-muted">
            The queen. Silent judge of all panelists. Has seen 1,300+ episodes.
          </p>
        </div>
      </div>

      {/* Random cat quote */}
      <div className="mt-12 max-w-md text-center">
        <p className="font-serif text-sm italic leading-relaxed text-accent-gold/70">
          {quote}
        </p>
        <p className="mt-2 font-mono text-[10px] tracking-wider text-text-muted/50">
          &mdash; Psyche, probably
        </p>
      </div>

      {/* Back link */}
      <Link
        href="/"
        className="mt-16 font-mono text-[10px] tracking-widest text-text-muted/40 transition-colors hover:text-accent-cyan/60"
      >
        &larr; back to the void
      </Link>
    </main>
  );
}
