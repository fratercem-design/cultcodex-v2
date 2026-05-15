/**
 * /start-here — The initiation funnel.
 *
 * New visitor flow:
 *   1. What is this? (archive weight)
 *   2. Five doorways — pick what's pulling you
 *   3. What's locked — tease the intelligence layer
 *   4. Full map of every surface
 */
import Link from "next/link";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import {
  IconCrystalBall,
  IconTransmission,
  IconTarot,
  IconPerson,
  IconMicrophone,
} from "@/components/graphics/codex-icons";
import { ArchiveDisclaimer } from "@/components/ui/archive-disclaimer";
import { getArchiveStats } from "@/lib/queries/stats";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start Here — CULT CODEX",
  description:
    "A structured archive of the Cult of Psyche. 1,500+ episodes. Every word. Every soul. Every pattern. Choose how deep you want to go.",
};

const DOORWAYS = [
  {
    icon: <IconCrystalBall size={36} />,
    title: "Consciousness & Reality",
    question: "What is the self, really?",
    description:
      "Non-duality, the hard problem, simulation theory, psychedelics, death, dreams. The episodes where Psyche wrestles with what it means to be aware.",
    href: "/collections/consciousness-and-reality",
    accent: "violet" as const,
  },
  {
    icon: <IconTransmission size={36} />,
    title: "AI & The Future",
    question: "What's coming for us?",
    description:
      "AI awakening, machine gods, post-human futures, the intelligence explosion. Transmissions from the edge of what's arriving.",
    href: "/collections/ai-and-the-future",
    accent: "cyan" as const,
  },
  {
    icon: <IconTarot size={36} />,
    title: "Occult & Hidden Knowledge",
    question: "What's been buried on purpose?",
    description:
      "Tarot, alchemy, Mahavidyas, hermeticism, chaos magick, astrology. The esoteric lineages the cult keeps returning to.",
    href: "/collections/occult-and-hidden-knowledge",
    accent: "gold" as const,
  },
  {
    icon: <IconPerson size={36} />,
    title: "Human Behavior",
    question: "Why do people do what they do?",
    description:
      "Narcissism, shadow work, relationships, addiction, identity. Psychological autopsies with zero polish.",
    href: "/collections/human-behavior",
    accent: "crimson" as const,
  },
  {
    icon: <IconMicrophone size={36} />,
    title: "Wild Conversations",
    question: "What happens when the filter dies?",
    description:
      "Open panels, Troll Tribunal, legendary guests, chaos streams. Where the script gets thrown out and the cult does what it does best.",
    href: "/collections/wild-conversations",
    accent: "gold" as const,
  },
] as const;

const accentMap = {
  gold: {
    icon: "text-accent-gold",
    title: "text-accent-gold",
    border: "border-accent-gold/20",
    hover: "group-hover:border-accent-gold/60 group-hover:bg-accent-gold-dim",
    question: "text-accent-gold",
  },
  cyan: {
    icon: "text-accent-cyan",
    title: "text-accent-cyan",
    border: "border-accent-cyan/20",
    hover: "group-hover:border-accent-cyan/60 group-hover:bg-accent-cyan-dim",
    question: "text-accent-cyan",
  },
  violet: {
    icon: "text-accent-violet",
    title: "text-accent-violet",
    border: "border-accent-violet/20",
    hover: "group-hover:border-accent-violet/60 group-hover:bg-accent-violet-dim",
    question: "text-accent-violet",
  },
  crimson: {
    icon: "text-accent-crimson",
    title: "text-accent-crimson",
    border: "border-accent-crimson/20",
    hover: "group-hover:border-accent-crimson/60 group-hover:bg-red-950/30",
    question: "text-accent-crimson",
  },
};

export default async function StartHerePage() {
  const stats = await getArchiveStats();

  return (
    <main id="main-content" className="mx-auto max-w-5xl px-4 py-12 space-y-16">

      {/* ── What is this? ── */}
      <section className="max-w-3xl mx-auto space-y-8 text-center">
        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold/60">
            ✦ &nbsp; CultCodex &nbsp; ✦
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary leading-snug">
            The complete record of Cult of Psyche
          </h1>
          <p className="text-sm text-text-muted leading-relaxed max-w-xl mx-auto">
            Over a thousand transmissions — panels, tarot, archetypes, AI, the occult, human behavior,
            and a host who treats every conversation as a psychological experiment.
            CultCodex is the structured archive of everything that happened.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
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

      {/* ── Five doorways ── */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted">
            /// pick_your_doorway
          </p>
          <p className="text-sm text-text-muted">Forget categories. Ask what&apos;s pulling on you right now.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {DOORWAYS.map((d) => {
            const a = accentMap[d.accent];
            return (
              <Link
                key={d.title}
                href={d.href}
                className={`group relative flex flex-col gap-4 rounded-lg border ${a.border} bg-surface p-6 transition-all ${a.hover} hover:-translate-y-0.5`}
              >
                <div className={`${a.icon} transition-transform group-hover:scale-110`}>{d.icon}</div>
                <div className="space-y-1">
                  <h2 className={`font-display text-lg font-bold ${a.title}`}>{d.title}</h2>
                  <p className={`font-mono text-xs italic ${a.question}`}>&ldquo;{d.question}&rdquo;</p>
                </div>
                <p className="text-xs text-text-muted leading-relaxed flex-1">{d.description}</p>
                <span className={`font-mono text-[10px] uppercase tracking-widest ${a.question} inline-flex items-center gap-2 group-hover:gap-3 transition-all`}>
                  Enter this doorway <span aria-hidden>→</span>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Link
            href="/topics"
            className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 rounded border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan-dim transition-colors"
          >
            Browse all signals →
          </Link>
          <Link
            href="/episodes"
            className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 rounded border border-accent-violet/30 text-accent-violet hover:bg-accent-violet-dim transition-colors"
          >
            Full archive →
          </Link>
          <Link
            href="/search"
            className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 rounded border border-accent-gold/30 text-accent-gold hover:bg-accent-gold-dim transition-colors"
          >
            Search directly →
          </Link>
        </div>
      </section>

      <MysticalDivider />

      {/* ── Observer vs Initiate ── */}
      <section className="max-w-3xl mx-auto space-y-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted text-center">
          /// observer_vs_initiate
        </p>
        <div className="rounded-2xl border border-accent-gold/20 bg-gradient-to-b from-accent-gold/5 to-surface overflow-hidden">
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
                "The Psychenomicon — living mythological analysis engine",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 font-mono text-[11px] text-text-muted">
                  <span className="text-accent-gold mt-0.5">✦</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
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
          /// full_map — every surface in the codex
        </p>

        {[
          {
            label: "Voices & Moments",
            color: "gold" as const,
            items: [
              { href: "/people", label: "People", desc: `${stats.people.toLocaleString()} voices, hosts, guests` },
              { href: "/quotes", label: "Quotes", desc: `${stats.quotes.toLocaleString()} memorable moments` },
              { href: "/lore", label: "Lore", desc: "Deep mythology entries" },
              { href: "/members", label: "Members", desc: "The cult community" },
            ],
          },
          {
            label: "Discovery",
            color: "cyan" as const,
            items: [
              { href: "/search", label: "Search", desc: "Full-text across the archive" },
              { href: "/topics", label: "Signals", desc: "Every theme and concept" },
              { href: "/collections", label: "Collections", desc: "Curated groupings" },
              { href: "/episodes", label: "Episodes", desc: `${stats.episodes.toLocaleString()} transmissions` },
            ],
          },
          {
            label: "Intelligence Layer",
            color: "violet" as const,
            items: [
              { href: "/psychenomicon", label: "Psychenomicon", desc: "Living myth-engine — chapters, entities, threads" },
              { href: "/psychenomicon/entities", label: "Entities", desc: "Tracked archetypes across the archive" },
              { href: "/lexicon", label: "Lexicon", desc: "Panelverse terms defined" },
              { href: "/premium", label: "Initiate+", desc: "$10/mo · Full access" },
            ],
          },
        ].map((group) => {
          const c = colorMapFull[group.color];
          return (
            <div key={group.label} className="space-y-2">
              <h3 className={`font-mono text-[11px] uppercase tracking-[0.25em] ${c.title}`}>{group.label}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group rounded-lg border ${c.border} bg-surface p-4 transition-colors ${c.hover}`}
                  >
                    <h4 className={`font-mono text-xs font-bold ${c.title}`}>{item.label}</h4>
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
  );
}

const colorMapFull = {
  gold: {
    title: "text-accent-gold",
    border: "border-accent-gold/10",
    hover: "hover:border-accent-gold/40 hover:bg-accent-gold-dim",
  },
  cyan: {
    title: "text-accent-cyan",
    border: "border-accent-cyan/10",
    hover: "hover:border-accent-cyan/40 hover:bg-accent-cyan-dim",
  },
  violet: {
    title: "text-accent-violet",
    border: "border-accent-violet/10",
    hover: "hover:border-accent-violet/40 hover:bg-accent-violet-dim",
  },
};
