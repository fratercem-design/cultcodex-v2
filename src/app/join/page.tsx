
import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { CodexSigil } from "@/components/graphics/codex-sigil";
import { getCounts } from "@/lib/queries/stats";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 600;

export const metadata: Metadata = buildMetadata({
  title: "Join the Cult",
  description:
    "Become part of the Cult of Psyche. Watch live, join the open panels, support the show, and unlock the full intelligence archive with Initiate+.",
  path: "/join",
});

const TIERS = [
  {
    name: "Observer",
    price: "Free",
    tagline: "Watch the signal.",
    accent: "cyan" as const,
    perks: [
      "Browse the full archive — every episode, person, and lore entry",
      "3 free Oracle questions per month",
      "Daily transmission + weekly digest",
      "See the shape of everything",
    ],
    cta: { label: "Start exploring →", href: "/start-here" },
  },
  {
    name: "Initiate+",
    price: "$10/mo",
    tagline: "Enter the archive.",
    accent: "gold" as const,
    featured: true,
    perks: [
      "Unlimited AI Oracle — answers cited to real transcripts",
      "Every full transcript, searchable and timestamped",
      "The Psychenomicon — the living myth-engine",
      "Decode Mode + behavioral pattern maps",
      "Your member identity in the community",
    ],
    cta: { label: "Become Initiate+ →", href: "/premium" },
  },
];

const WAYS = [
  {
    glyph: "◎",
    title: "Watch Live",
    body: "Cult of Psyche streams live — open panels, tarot, and unscripted conversation. Drop in, lurk, or jump on the panel.",
    href: "/cult-live",
    cta: "Go to the live stream",
  },
  {
    glyph: "◈",
    title: "Join the Panel",
    body: "The show is an open panel — anyone can join the conversation. Become a member for panel access and visibility in chat.",
    href: "/premium",
    cta: "Get panel access",
  },
  {
    glyph: "✦",
    title: "Support the Show",
    body: "Super chats, memberships, and Initiate+ keep the archive growing and the signal alive. Every bit of support funds the work.",
    href: "/premium",
    cta: "Support the cult",
  },
  {
    glyph: "◉",
    title: "Ask the Oracle",
    body: "The AI Oracle answers any question from inside the full archive — patterns, people, episodes, lore. Try it free.",
    href: "/oracle",
    cta: "Consult the Oracle",
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
            {stats.episodes.toLocaleString()}+ transmissions · {stats.people.toLocaleString()} voices
            · {stats.totalHours.toLocaleString()}+ hours · one growing mythology.
          </p>
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
          </div>
        </section>

        <MysticalDivider />

        {/* Tiers */}
        <section className="space-y-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold-text/80 text-center">
            {"/// choose_your_level"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
            {TIERS.map((t) => {
              const featured = "featured" in t && t.featured;
              return (
                <div
                  key={t.name}
                  className={`rounded-2xl border p-6 space-y-4 ${
                    featured
                      ? "border-accent-gold/40 bg-gradient-to-b from-accent-gold/8 to-surface"
                      : "border-accent-cyan/25 bg-gradient-to-b from-accent-cyan/5 to-surface"
                  }`}
                >
                  <div className="space-y-1">
                    <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${featured ? "text-accent-gold-text/80" : "text-accent-cyan/60"}`}>
                      {t.tagline}
                    </p>
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-display text-xl font-bold text-text-primary">{t.name}</h3>
                      <span className={`font-mono text-sm font-bold ${featured ? "text-accent-gold-text" : "text-accent-cyan"}`}>
                        {t.price}
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {t.perks.map((p) => (
                      <li key={p} className="flex items-start gap-2 font-mono text-[11px] text-text-muted leading-relaxed">
                        <span className={`mt-0.5 shrink-0 ${featured ? "text-accent-gold-text" : "text-accent-cyan"}`}>✦</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={t.cta.href}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-5 py-2.5 font-mono text-xs font-bold transition-all ${
                      featured
                        ? "border-accent-gold bg-accent-gold/15 text-accent-gold-text hover:bg-accent-gold/25"
                        : "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan/20"
                    }`}
                  >
                    {t.cta.label}
                  </Link>
                </div>
              );
            })}
          </div>
          <p className="font-mono text-[10px] text-text-muted/50 text-center">
            Cancel any time · Instant access · No contracts
          </p>
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
