
import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { CodexSigil } from "@/components/graphics/codex-sigil";
import { getCounts } from "@/lib/queries/stats";
import { buildMetadata } from "@/lib/seo";
import { CommunityEmailSignup } from "@/components/join/community-email-signup";

export const revalidate = 600;

export const metadata: Metadata = buildMetadata({
  title: "Join the Cult",
  description:
    "Become part of the Cult of Psyche community. Watch live, join an open panel, or receive new transmissions by email.",
  path: "/join",
});

const WAYS = [
  {
    glyph: "◎",
    title: "Watch Live",
    body: "Cult of Psyche streams live — open panels, tarot, and unscripted conversation. Drop in, lurk, or jump on the panel.",
    href: "/cult-live",
    cta: "Enter the live room",
  },
  {
    glyph: "◈",
    title: "Join the Panel",
    body: "The show is an open panel. Read the practical guide, then bring a clear question or perspective when the room opens.",
    href: "/appear",
    cta: "Read the panel guide",
  },
];

export default async function JoinPage() {
  const stats = await getCounts().catch(() => ({
    episodes: 0, segments: 0, people: 0, topics: 0,
    lore: 0, quotes: 0, totalHours: 0, transcribedEpisodes: 0, transcribedPct: 0,
  }));

  return (
    <>
      <PageHero
        title="JOIN THE CULT"
        subtitle="There's no membership card. Only a door."
        backgroundImage="/hero-bg.jpg"
        label="join"
      />

      <main id="main-content" className="mx-auto max-w-5xl px-4 py-12 space-y-16">

        {/* Intro */}
        <section className="max-w-2xl mx-auto text-center space-y-5">
          <div className="flex justify-center text-accent-gold-text">
            <CodexSigil size={56} glow />
          </div>
          <p className="text-sm text-text-muted leading-relaxed">
            <span className="text-text-primary font-semibold">Cult of Psyche</span> is a live,
            unscripted internet show — tarot, consciousness, spirituality, open-panel debates, and
            the strange edges of human behavior. The &ldquo;cult&rdquo; is the community that grew
            around it: the panelists, the lurkers, the ride-or-dies, the trolls who secretly care.
          </p>
          <p className="font-mono text-[11px] text-text-muted/70 leading-relaxed">
            {stats.episodes.toLocaleString("en-US")}+ transmissions · {stats.people.toLocaleString("en-US")} voices
            · {stats.totalHours.toLocaleString("en-US")}+ hours · one growing mythology.
          </p>
          <div className="pt-2">
            <Link
              href="/cult-live"
              className="inline-flex items-center justify-center rounded-lg border border-accent-gold bg-accent-gold/15 px-7 py-3 font-mono text-sm font-bold text-accent-gold-text transition-all hover:bg-accent-gold/25"
            >
              Watch the next transmission →
            </Link>
          </div>
        </section>

        {/* Ways to join */}
        <section className="space-y-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-cyan/60 text-center">
            {"/// ways_in"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {WAYS.map((w) => (
              <Link
                key={w.title}
                href={w.href}
                className="group rounded-xl border border-border bg-surface p-6 space-y-3 transition-all hover:border-accent-gold/40 hover:bg-elevated"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xl text-accent-gold-text/80">{w.glyph}</span>
                  <h2 className="font-display text-lg font-bold text-text-primary group-hover:text-accent-gold-text transition-colors">
                    {w.title}
                  </h2>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">{w.body}</p>
                <p className="font-mono text-[11px] uppercase tracking-widest text-accent-gold-text/80 group-hover:text-accent-gold-text transition-colors">
                  {w.cta} →
                </p>
              </Link>
            ))}
            <CommunityEmailSignup />
          </div>
        </section>

        <MysticalDivider />

        <section className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-6 text-center space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-text-muted">{"/// looking_for_membership"}</p>
          <p className="text-sm leading-relaxed text-text-muted">
            Observer access opens the public index and samples. Initiate+ opens the sealed transcript and intelligence layer.
          </p>
          <Link href="/premium" className="font-mono text-xs text-accent-gold-text hover:underline">
            Compare Initiate+ and Oracle on the single membership page →
          </Link>
        </section>

        <MysticalDivider />

        {/* Close */}
        <section className="text-center space-y-3">
          <p className="font-serif text-sm italic text-text-muted/60">What is remembered, lives.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/start-here" className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 rounded border border-accent-gold/30 text-accent-gold-text hover:bg-accent-gold/5 transition-colors">
              Start here →
            </Link>
            <Link href="/appear" className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 rounded border border-accent-violet/30 text-accent-violet-text hover:bg-accent-violet/5 transition-colors">
              Appear on the show →
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
