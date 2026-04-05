import { prisma } from "@/lib/db";
import { VoidSigil } from "@/components/graphics/void-sigil";
import { SacredGeometryOverlay, FloatingParticles } from "@/components/graphics/sacred-geometry";
import { MysticalDivider, OrnamentalBreak } from "@/components/graphics/mystical-divider";
import { SectionCard } from "@/components/ui/section-card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "The Oracle — CULT CODEX",
  description:
    "Consult the Oracle of the Codex. Receive wisdom from 1,300+ episodes of the Cult of Psyche.",
};

export default async function OraclePage() {
  const totalQuotes = await prisma.quote.count();

  const randomOffset = Math.floor(Math.random() * totalQuotes);

  const quotes = await prisma.quote.findMany({
    take: 1,
    skip: randomOffset,
    include: {
      speaker: true,
      episode: true,
    },
  });

  const quote = quotes[0] ?? null;

  return (
    <div className="relative min-h-screen bg-void">
      {/* --- Ambient background layers --- */}
      <SacredGeometryOverlay />
      <FloatingParticles count={20} />

      {/* Radial violet glow behind the sigil */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px]"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(139,92,246,0.12) 0%, transparent 70%)",
        }}
      />

      {/* ============ HEADER ============ */}
      <header className="relative z-10 flex flex-col items-center pt-16 pb-4 text-center">
        <VoidSigil size={200} animate className="text-accent-violet mb-6" />

        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-accent-violet drop-shadow-lg">
          THE ORACLE
        </h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.3em] text-accent-violet/50">
          of the Codex
        </p>

        <MysticalDivider className="mt-6 opacity-60 [&_svg]:!text-accent-violet/30" />

        <p className="mx-auto mt-4 max-w-md px-4 font-serif text-sm leading-relaxed text-text-muted italic">
          The archive stirs. A voice emerges from the depths of{" "}
          <span className="text-accent-cyan">1,300+ episodes</span>. Listen
          carefully — the Oracle speaks only once.
        </p>
      </header>

      {/* ============ QUOTE CARD ============ */}
      <main className="relative z-10 mx-auto max-w-2xl px-4 pb-20">
        {quote ? (
          <section className="mt-8">
            {/* Outer decorative wrapper */}
            <div className="relative rounded-xl border border-accent-violet/20 bg-surface/80 backdrop-blur-sm p-1">
              {/* Corner glows */}
              <div
                className="pointer-events-none absolute -inset-px rounded-xl"
                aria-hidden="true"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, transparent 30%, transparent 70%, rgba(139,92,246,0.10) 100%)",
                }}
              />

              <div className="relative rounded-lg border border-border bg-elevated p-6 sm:p-8">
                {/* Quotation mark ornament */}
                <div
                  className="pointer-events-none select-none text-center font-serif text-6xl leading-none text-accent-violet/20"
                  aria-hidden="true"
                >
                  &ldquo;
                </div>

                {/* The quote text */}
                <blockquote className="mt-2 text-center font-serif text-lg sm:text-xl leading-relaxed text-text-primary">
                  {quote.text}
                </blockquote>

                <div
                  className="pointer-events-none select-none text-center font-serif text-6xl leading-none text-accent-violet/20 mt-2"
                  aria-hidden="true"
                >
                  &rdquo;
                </div>

                <OrnamentalBreak className="my-4 [&_svg]:!text-accent-violet/25" />

                {/* Speaker attribution */}
                {quote.speaker && (
                  <p className="text-center">
                    <Link
                      href={`/people/${quote.speaker.slug}`}
                      className="font-display text-sm font-semibold text-accent-gold hover:text-accent-gold/80 transition-colors"
                    >
                      {quote.speaker.displayName}
                    </Link>
                  </p>
                )}

                {/* Context / significance */}
                {quote.context && (
                  <p className="mt-3 text-center font-mono text-xs text-text-muted/70 italic">
                    {quote.context}
                  </p>
                )}

                {/* Episode link */}
                {quote.episode && (
                  <p className="mt-3 text-center">
                    <Link
                      href={`/episodes/${quote.episode.slug}`}
                      className="font-mono text-xs text-text-muted hover:text-accent-cyan transition-colors"
                    >
                      Episode {quote.episode.episodeNumber ?? quote.episode.slug}
                      {quote.episode.title ? ` — ${quote.episode.title}` : ""}
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : (
          <SectionCard className="mt-8 text-center">
            <p className="font-serif text-text-muted italic">
              The Oracle is silent. No wisdom was found in the void.
            </p>
          </SectionCard>
        )}

        {/* ============ CONSULT AGAIN ============ */}
        <div className="mt-10 flex justify-center">
          <Link
            href={`/oracle?t=${Date.now()}`}
            className="group relative inline-flex items-center gap-2 rounded-lg border border-accent-violet/30 bg-surface px-6 py-3 font-display text-sm font-semibold text-accent-violet transition-all hover:border-accent-violet/60 hover:bg-accent-violet/5 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]"
          >
            <span className="inline-block transition-transform group-hover:rotate-12">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-accent-violet/60"
              >
                <path
                  d="M8 1v3M8 12v3M1 8h3M12 8h3M3.05 3.05l2.12 2.12M10.83 10.83l2.12 2.12M3.05 12.95l2.12-2.12M10.83 5.17l2.12-2.12"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            Consult the Oracle Again
          </Link>
        </div>

        {/* ============ FOOTER MYSTICAL ============ */}
        <MysticalDivider className="mt-14 opacity-40 [&_svg]:!text-accent-violet/20" />

        <p className="mt-6 text-center font-mono text-xs text-text-muted/50">
          The Oracle has spoken{" "}
          <span className="text-accent-violet/70">
            {totalQuotes.toLocaleString()}
          </span>{" "}
          times
        </p>

        <OrnamentalBreak className="mt-4 opacity-30 [&_svg]:!text-accent-violet/20" />

        <p className="mt-4 text-center font-serif text-xs text-text-muted/30 italic">
          What is remembered, lives.
        </p>
      </main>
    </div>
  );
}
