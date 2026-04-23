/**
 * ENTER THE CODEX — Screen 1 (Entry Gate)
 *
 * Three doorways for a first-time visitor:
 *   1. GUIDED PATH      → /start-here/guided   (5 emotional entry tiles)
 *   2. EXPLORE SIGNALS  → /topics              (browse by theme)
 *   3. FULL ARCHIVE     → /episodes            (every transmission)
 *
 * Mythic tone: "You are entering a system of signals."
 */
import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import {
  IconScroll,
  IconTopic,
  IconCanonical,
} from "@/components/graphics/codex-icons";
import { ArchiveDisclaimer } from "@/components/ui/archive-disclaimer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enter the Codex — CULT CODEX",
  description:
    "You are entering a system of signals. Choose how you enter: guided, explore, or full archive.",
};

interface Doorway {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  tagline: string;
  description: string;
  href: string;
  color: "gold" | "cyan" | "violet";
}

const DOORWAYS: Doorway[] = [
  {
    icon: <IconScroll size={40} />,
    eyebrow: "Path I",
    title: "The Guided Path",
    tagline: "Begin with feeling.",
    description:
      "Five doorways keyed to what's pulling you right now. Curated transmissions. No pre-requisites. The softest way in.",
    href: "/start-here/guided",
    color: "gold",
  },
  {
    icon: <IconTopic size={40} />,
    eyebrow: "Path II",
    title: "Explore Signals",
    tagline: "Browse by theme.",
    description:
      "Every topic the cult has circled — consciousness, AI, the occult, human wiring, the absurd. Follow a signal where it leads.",
    href: "/topics",
    color: "cyan",
  },
  {
    icon: <IconCanonical size={40} />,
    eyebrow: "Path III",
    title: "The Full Archive",
    tagline: "Every transmission.",
    description:
      "1,327 episodes. Hosts, guests, panels, lore, chaos. Raw and chronological. For the ones who already know they want everything.",
    href: "/episodes",
    color: "violet",
  },
];

const colorMap: Record<Doorway["color"], {
  icon: string;
  title: string;
  border: string;
  hoverBorder: string;
  hoverBg: string;
  tagline: string;
  cta: string;
}> = {
  gold: {
    icon: "text-accent-gold",
    title: "text-accent-gold",
    border: "border-accent-gold/20",
    hoverBorder: "group-hover:border-accent-gold/60",
    hoverBg: "group-hover:bg-accent-gold-dim",
    tagline: "text-accent-gold",
    cta: "text-accent-gold",
  },
  cyan: {
    icon: "text-accent-cyan",
    title: "text-accent-cyan",
    border: "border-accent-cyan/20",
    hoverBorder: "group-hover:border-accent-cyan/60",
    hoverBg: "group-hover:bg-accent-cyan-dim",
    tagline: "text-accent-cyan",
    cta: "text-accent-cyan",
  },
  violet: {
    icon: "text-accent-violet",
    title: "text-accent-violet",
    border: "border-accent-violet/20",
    hoverBorder: "group-hover:border-accent-violet/60",
    hoverBg: "group-hover:bg-accent-violet-dim",
    tagline: "text-accent-violet",
    cta: "text-accent-violet",
  },
};

export default function StartHerePage() {
  return (
    <>
      <PageHero
        title="ENTER THE CODEX"
        subtitle="You are entering a system of signals. Choose how you enter."
        backgroundImage="/hero-bg.jpg"
      />

      <main
        id="main-content"
        className="mx-auto max-w-6xl px-4 py-12 space-y-12"
      >
        {/* Mythic framing */}
        <section className="text-center max-w-2xl mx-auto space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-gold">
            /// transmission_begin
          </p>
          <p className="font-display text-base sm:text-lg text-text-primary leading-relaxed">
            The Cult of Psyche is not a podcast. It is a decade of signals — tarot,
            mythology, AI, the occult, the absurd, the sacred.
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            1,327 transmissions. 497 voices. Three ways in.
          </p>
        </section>

        {/* The three doorways */}
        <section className="grid gap-6 md:grid-cols-3">
          {DOORWAYS.map((d) => {
            const c = colorMap[d.color];
            return (
              <Link
                key={d.title}
                href={d.href}
                className={`group relative flex flex-col gap-4 rounded-lg border ${c.border} bg-surface p-8 transition-all ${c.hoverBorder} ${c.hoverBg} hover:-translate-y-0.5`}
              >
                <div className={`${c.icon} transition-transform group-hover:scale-110`}>
                  {d.icon}
                </div>
                <div className="space-y-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
                    {d.eyebrow}
                  </p>
                  <h2 className={`font-display text-xl font-bold ${c.title}`}>
                    {d.title}
                  </h2>
                  <p className={`font-mono text-xs italic ${c.tagline}`}>
                    {d.tagline}
                  </p>
                </div>
                <p className="text-sm text-text-muted leading-relaxed flex-1">
                  {d.description}
                </p>
                <span
                  className={`font-mono text-[11px] uppercase tracking-widest ${c.cta} inline-flex items-center gap-2 group-hover:gap-3 transition-all`}
                >
                  Enter <span aria-hidden>→</span>
                </span>
              </Link>
            );
          })}
        </section>

        <MysticalDivider />

        {/* Full map — every surface in the codex, color-coded */}
        <section className="space-y-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted text-center">
            /// full map — every surface in the codex
          </p>

          {/* Voices & Moments — gold */}
          <div className="space-y-2">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent-gold">
              Voices &amp; Moments
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { href: "/people", label: "People", desc: "497 voices, hosts, guests" },
                { href: "/quotes", label: "Quotes", desc: "3,374 memorable moments" },
                { href: "/transcripts", label: "Transcripts", desc: "Searchable spoken-word text" },
                { href: "/lore", label: "Lore", desc: "Deep mythology entries" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-lg border border-accent-gold/10 bg-surface p-4 transition-colors hover:border-accent-gold/40 hover:bg-accent-gold-dim"
                >
                  <h4 className="font-sans text-sm font-medium text-accent-gold">
                    {item.label}
                  </h4>
                  <p className="mt-1 text-xs text-text-muted">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Discovery — cyan */}
          <div className="space-y-2">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent-cyan">
              Discovery
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { href: "/search", label: "Search", desc: "Full-text across the archive" },
                { href: "/series", label: "Series", desc: "15 curated show arcs" },
                { href: "/members", label: "Members", desc: "The cult community" },
                { href: "/live", label: "Live", desc: "What's streaming now" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-lg border border-accent-cyan/10 bg-surface p-4 transition-colors hover:border-accent-cyan/40 hover:bg-accent-cyan-dim"
                >
                  <h4 className="font-sans text-sm font-medium text-accent-cyan">
                    {item.label}
                  </h4>
                  <p className="mt-1 text-xs text-text-muted">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Reference — violet */}
          <div className="space-y-2">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent-violet">
              Reference
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { href: "/lexicon", label: "Lexicon", desc: "60+ panelverse terms" },
                { href: "/timeline", label: "Timeline", desc: "Show history, year by year" },
                { href: "/stats", label: "Stats", desc: "Numbers and visualizations" },
                { href: "/mythic-map", label: "Mythic Map", desc: "Archetypes and structure" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-lg border border-accent-violet/10 bg-surface p-4 transition-colors hover:border-accent-violet/40 hover:bg-accent-violet-dim"
                >
                  <h4 className="font-sans text-sm font-medium text-accent-violet">
                    {item.label}
                  </h4>
                  <p className="mt-1 text-xs text-text-muted">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <ArchiveDisclaimer variant="full" />
      </main>
    </>
  );
}
