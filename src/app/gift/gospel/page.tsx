import Link from "next/link";
import type { Metadata } from "next";
import { SacredGeometryOverlay, FloatingParticles } from "@/components/graphics/sacred-geometry";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { GiftDownloadCta } from "@/components/marketing/gift-download-cta";

export const metadata: Metadata = {
  title: "Your Gospel — CultCodex",
  description: "The Gospel of Psyche's Nightmares — your free Initiate transmission.",
  // Personal thank-you / delivery page — keep it out of the index.
  robots: { index: false, follow: false },
  alternates: { canonical: "/gift/gospel" },
};

const NEXT_STEPS: { href: string; glyph: string; title: string; body: string }[] = [
  { href: "/oracle", glyph: "◉", title: "Ask the Oracle", body: "Question the entire archive — your first 3 are free." },
  { href: "/start-here", glyph: "✦", title: "Start Here", body: "Curated entry points, built by people who went deep first." },
  { href: "/premium", glyph: "▲", title: "Go deeper — Initiate+", body: "Unlock full transcripts, semantic search, and the Psychenomicon." },
];

export default async function GiftGospelPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const justSignedUp = welcome === "1";

  return (
    <div className="relative min-h-screen overflow-hidden bg-void">
      <SacredGeometryOverlay />
      <FloatingParticles count={18} />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 15%, rgba(74, 45, 110,0.16) 0%, transparent 70%)" }}
      />

      <header className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-4 pt-20 pb-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-accent-gold-text/80">
          {justSignedUp ? "/// initiate_confirmed" : "/// your_transmission"}
        </p>
        <h1
          className="mt-3 font-display text-4xl font-bold tracking-[0.04em] text-white sm:text-5xl"
          style={{ textShadow: "0 0 50px rgba(74, 45, 110,0.4)" }}
        >
          {justSignedUp ? "Welcome, Initiate." : "Your Gospel awaits."}
        </h1>
        <p className="mt-3 font-display text-lg text-accent-gold-text sm:text-xl">
          The Gospel of Psyche&rsquo;s Nightmares
        </p>
        <p className="mx-auto mt-4 max-w-md font-serif text-sm italic leading-relaxed text-text-muted">
          A dark scripture from the edge of the archive. It&rsquo;s yours — read it below, and a copy
          is waiting in your inbox.
        </p>

        <div className="mt-8">
          <GiftDownloadCta autostart={justSignedUp} />
        </div>

        <MysticalDivider className="mt-10 opacity-40 [&_svg]:!text-accent-violet-text/25" />
      </header>

      <main className="relative z-10 mx-auto max-w-2xl px-4 pb-24">
        <p className="mb-4 text-center font-mono text-[10px] uppercase tracking-[0.35em] text-accent-violet-text/70">
          {"/// while_you're_here"}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {NEXT_STEPS.map((step) => (
            <Link
              key={step.href}
              href={step.href}
              className="group rounded-xl border border-accent-violet/15 bg-surface/60 px-5 py-6 text-center transition hover:border-accent-gold/40 hover:bg-surface"
            >
              <p className="font-mono text-lg text-accent-gold-text/80">{step.glyph}</p>
              <p className="mt-2 font-mono text-xs font-bold uppercase tracking-widest text-text-primary">
                {step.title}
              </p>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-text-muted">{step.body}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
