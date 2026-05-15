/**
 * /start-here — The initiation funnel.
 *
 * New visitor flow:
 *   1. What is this?  (one-line answer, then depth)
 *   2. What role are you? (Observer / Initiate / Oracle)
 *   3. Three doorways into the content
 *   4. What's locked — tease the intelligence layer
 *   5. Full map of every surface
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
import { getArchiveStats } from "@/lib/queries/stats";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start Here — CULT CODEX",
  description:
    "A structured archive of the Cult of Psyche. 1,500+ episodes. Every word. Every soul. Every pattern. Choose how deep you want to go.",
};

export default async function StartHerePage() {
  const [stats, recentEpisodes] = await Promise.all([
    getArchiveStats(),
    prisma.episode.findMany({
      where: { status: "published" },
      orderBy: { airDate: "desc" },
      take: 5,
      select: { slug: true, title: true, episodeNumber: true },
    }),
  ]);

  return (
    <>
      <PageHero
        title="ENTER THE CODEX"
        subtitle="A system of signals. Choose your depth."
        backgroundImage="/hero-bg.jpg"
      />

      <main id="main-content" className="mx-auto max-w-6xl px-4 py-12 space-y-16">

        {/* ── What is this? ── */}
        <section className="max-w-3xl mx-auto space-y-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-gold text-center">
            /// what_is_this
          </p>

          <div className="text-center space-y-3">
            <p className="font-display text-xl sm:text-2xl text-text-primary leading-relaxed">
              The Cult of Psyche is not a podcast.
            </p>
            <p className="text-sm text-text-muted leading-relaxed max-w-xl mx-auto">
              It is over a year of transmissions — panels, tarot, archetypes, AI, the occult,
              human behavior, and a host who treats every conversation as a psychological experiment.
              CultCodex is the structured archive of everything that happened.
            </p>
          </div>

          {/* Archive weight */}
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {[
              { n: stats.episodes.toLocaleString(), label: "Episodes" },
              { n: stats.people.toLocaleString(), label: "Voices" },
              { n: stats.loreEntries.toLocaleString(), label: "Lore entries" },
              { n: stats.quotes.toLocaleString(), label: "Quotes" },
              { n: stats.topics.toLocaleString(), label: "Signals" },
              { n: `${stats.totalHours.toLocaleString()}+`, label: "Hours" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-surface p-3 text-center">
                <p className="font-mono text-lg font-bold text-accent-gold">{s.n}</p>
                <p className="mt-0.5 font-mono text-[10px] text-text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <MysticalDivider />

        {/* ── Three doorways ── */}
        <section className="space-y-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted text-center">
            /// choose_your_path
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <IconScroll size={40} />,
                eyebrow: "Path I",
                title: "The Guided Path",
                tagline: "Begin with feeling.",
                description:
                  "Five doorways keyed to what's pulling you right now. Curated transmissions. No pre-requisites. The softest way in.",
                href: "/start-here/guided",
                color: "gold" as const,
              },
              {
                icon: <IconTopic size={40} />,
                eyebrow: "Path II",
                title: "Explore Signals",
                tagline: "Browse by theme.",
                description:
                  "Every topic the cult has circled — consciousness, AI, the occult, human wiring, the absurd. Follow a signal where it leads.",
                href: "/topics",
                color: "cyan" as const,
              },
              {
                icon: <IconCanonical size={40} />,
                eyebrow: "Path III",
                title: "The Full Archive",
                tagline: "Every transmission.",
                description:
                  `${stats.episodes.toLocaleString()} episodes. Hosts, guests, panels, lore, chaos. Raw and chronological. For the ones who already know they want everything.`,
                href: "/episodes",
                color: "violet" as const,
              },
            ].map((d) => {
              const c = colorMap[d.color];
              return (
                <Link
                  key={d.title}
                  href={d.href}
                  className={`group relative flex flex-col gap-4 rounded-lg border ${c.border} bg-surface p-8 transition-all ${c.hoverBorder} ${c.hoverBg} hover:-translate-y-0.5`}
                >
                  <div className={`${c.icon} transition-transform group-hover:scale-110`}>{d.icon}</div>
                  <div className="space-y-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">{d.eyebrow}</p>
                    <h2 className={`font-display text-xl font-bold ${c.title}`}>{d.title}</h2>
                    <p className={`font-mono text-xs italic ${c.tagline}`}>{d.tagline}</p>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed flex-1">{d.description}</p>
                  <span className={`font-mono text-[11px] uppercase tracking-widest ${c.cta} inline-flex items-center gap-2 group-hover:gap-3 transition-all`}>
                    Enter <span aria-hidden>→</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <MysticalDivider />

        {/* ── Where to start: 5 recommended episodes ── */}
        <section className="max-w-3xl mx-auto space-y-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold text-center">
            /// if_you_don&apos;t_know_where_to_start
          </p>
          <p className="text-center text-sm text-text-muted">Five transmissions that orient you to the system.</p>
          <div className="space-y-3">
            {recentEpisodes.map((ep, i) => (
              <Link
                key={ep.slug}
                href={`/episodes/${ep.slug}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4 transition-all hover:border-accent-gold/40 hover:bg-accent-gold-dim group"
              >
                <span className="font-mono text-2xl font-bold text-accent-gold/30 w-8 flex-shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-text-primary group-hover:text-accent-gold transition-colors truncate">
                    {ep.title}
                  </p>
                  {ep.episodeNumber && (
                    <p className="font-mono text-[10px] text-text-muted/60 mt-0.5">Episode {ep.episodeNumber}</p>
                  )}
                </div>
                <span className="font-mono text-[11px] text-accent-gold opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </Link>
            ))}
          </div>
          <p className="text-center font-mono text-[10px] text-text-muted/50">
            These are starting points, not a ranking. The archive rewards wandering.
          </p>
        </section>

        <MysticalDivider />

        {/* ── What's locked: tease the intelligence layer ── */}
        <section className="max-w-3xl mx-auto space-y-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted text-center">
            /// observer_vs_initiate
          </p>
          <div className="rounded-2xl border border-accent-gold/20 bg-gradient-to-b from-accent-gold/5 to-surface overflow-hidden">
            {/* Visible layer */}
            <div className="p-6 space-y-4">
              <p className="font-mono text-[11px] text-text-muted">
                As an <span className="text-text-primary font-bold">Observer</span>, you can browse everything — summaries, guest profiles,
                quotes, topics, lore, the full episode list.
              </p>
              <p className="font-mono text-[11px] text-text-muted">
                As an <span className="text-accent-gold font-bold">Initiate+</span>, the archive becomes a tool:
              </p>
              <ul className="space-y-2">
                {[
                  "Full transcripts — every word, searchable, timestamped",
                  "Decode Mode — AI psychological breakdowns of every panel",
                  "Click any segment to jump straight to that moment",
                  "Advanced search: find every time a guest used a specific tactic",
                  "Pattern recognition across hundreds of episodes",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 font-mono text-[11px] text-text-muted">
                    <span className="text-accent-gold mt-0.5">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* CTA strip */}
            <div className="border-t border-accent-gold/20 bg-accent-gold/5 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-xs text-text-muted">
                Initiate+ opens for <span className="text-accent-gold font-bold">$10/month</span>. Cancel any time.
              </p>
              <Link
                href="/premium"
                className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-5 py-2 font-mono text-xs font-bold text-accent-gold transition-all hover:bg-accent-gold/25"
              >
                See what opens →
              </Link>
            </div>
          </div>
        </section>

        <MysticalDivider />

        {/* ── Full map ── */}
        <section className="space-y-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted text-center">
            /// full map — every surface in the codex
          </p>

          {[
            {
              label: "Voices & Moments",
              color: "gold" as const,
              items: [
                { href: "/people", label: "People", desc: `${stats.people.toLocaleString()} voices, hosts, guests` },
                { href: "/quotes", label: "Quotes", desc: `${stats.quotes.toLocaleString()} memorable moments` },
                { href: "/transcripts", label: "Transcripts", desc: "Searchable spoken-word text" },
                { href: "/lore", label: "Lore", desc: "Deep mythology entries" },
              ],
            },
            {
              label: "Discovery",
              color: "cyan" as const,
              items: [
                { href: "/search", label: "Search", desc: "Full-text across the archive" },
                { href: "/series", label: "Series", desc: "Curated show arcs" },
                { href: "/members", label: "Members", desc: "The cult community" },
                { href: "/live", label: "Live", desc: "What's streaming now" },
              ],
            },
            {
              label: "Reference",
              color: "violet" as const,
              items: [
                { href: "/lexicon", label: "Lexicon", desc: "Panelverse terms defined" },
                { href: "/topics", label: "Signals", desc: "Every theme and concept" },
                { href: "/collections", label: "Collections", desc: "Curated groupings" },
                { href: "/premium", label: "Premium", desc: "Initiate+ · Oracle tiers" },
              ],
            },
            {
              label: "Intelligence Layer",
              color: "violet" as const,
              items: [
                { href: "/psychenomicon", label: "Psychenomicon", desc: "Living myth-engine — chapters, entities, threads" },
                { href: "/psychenomicon/entities", label: "Entities", desc: "Tracked archetypes across the archive" },
              ],
            },
          ].map((group) => {
            const c = colorMap[group.color];
            return (
              <div key={group.label} className="space-y-2">
                <h3 className={`font-mono text-[11px] uppercase tracking-[0.25em] ${c.title}`}>{group.label}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group rounded-lg border ${c.border} bg-surface p-4 transition-colors ${c.hoverBorder} ${c.hoverBg}`}
                    >
                      <h4 className={`font-sans text-sm font-medium ${c.title}`}>{item.label}</h4>
                      <p className="mt-1 text-xs text-text-muted">{item.desc}</p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <ArchiveDisclaimer variant="full" />
      </main>
    </>
  );
}

const colorMap = {
  gold: {
    icon: "text-accent-gold",
    title: "text-accent-gold",
    border: "border-accent-gold/10",
    hoverBorder: "hover:border-accent-gold/40",
    hoverBg: "hover:bg-accent-gold-dim",
    tagline: "text-accent-gold",
    cta: "text-accent-gold",
  },
  cyan: {
    icon: "text-accent-cyan",
    title: "text-accent-cyan",
    border: "border-accent-cyan/10",
    hoverBorder: "hover:border-accent-cyan/40",
    hoverBg: "hover:bg-accent-cyan-dim",
    tagline: "text-accent-cyan",
    cta: "text-accent-cyan",
  },
  violet: {
    icon: "text-accent-violet",
    title: "text-accent-violet",
    border: "border-accent-violet/10",
    hoverBorder: "hover:border-accent-violet/40",
    hoverBg: "hover:bg-accent-violet-dim",
    tagline: "text-accent-violet",
    cta: "text-accent-violet",
  },
};
