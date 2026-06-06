import Link from "next/link";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import {
  IconCrystalBall,
  IconTransmission,
  IconTarot,
  IconPerson,
  IconMicrophone,
  IconScroll,
} from "@/components/graphics/codex-icons";
import { ArchiveDisclaimer } from "@/components/ui/archive-disclaimer";
import { getCounts } from "@/lib/queries/stats";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/start-here" },
  title: "Start Here — CULT CODEX",
  description:
    "Cult of Psyche is a live streaming show — back since October 2024 after years away. CultCodex is the structured archive of every transmission: every word indexed, every pattern extracted, every figure profiled.",
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
  {
    icon: <IconScroll size={36} />,
    title: "Lore Archive",
    question: "What keeps getting referenced?",
    description:
      "Running myths, recurring entities, cult in-jokes, and the growing mythology the archive has catalogued since the show's return.",
    href: "/lore",
    accent: "cyan" as const,
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

export default async function StartHerePage() {
  const stats = await getCounts();

  return (
    <main id="main-content" className="mx-auto max-w-5xl px-4 py-12 space-y-20">

      {/* ── 0. Personalized path CTA ── */}
      <section className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-accent-violet/30 bg-gradient-to-b from-accent-violet/5 to-surface overflow-hidden">
          <div className="p-7 space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-violet/60">
              {"/// not sure where to start?"}
            </p>
            <h2 className="font-display text-xl font-bold text-text-primary">
              Let the archive find you.
            </h2>
            <p className="font-mono text-[11px] text-text-muted leading-relaxed">
              Three questions. The archive calibrates around your answers and
              gives you five episodes, three people, and two Oracle prompts
              tailored to where you are right now.
            </p>
          </div>
          <div className="border-t border-accent-violet/20 bg-accent-violet/5 px-7 py-4 flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] text-text-muted">Takes 30 seconds.</p>
            <Link
              href="/start-here/quiz"
              className="inline-flex items-center gap-2 rounded-lg border border-accent-violet bg-accent-violet/15 px-5 py-2 font-mono text-xs font-bold text-accent-violet transition-all hover:bg-accent-violet/25"
            >
              Find your path →
            </Link>
          </div>
        </div>
      </section>

      <MysticalDivider />

      {/* ── 1. What is this? ── */}
      <section className="max-w-3xl mx-auto space-y-8 text-center">
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold/60">
            ✦ &nbsp; CultCodex &nbsp; ✦
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary leading-tight">
            Start Here
          </h1>
          <p className="font-mono text-xs text-text-muted/70 tracking-wide">
            What Cult of Psyche is · What this archive captures · Where to begin
          </p>
        </div>

        <div className="space-y-4 text-left rounded-2xl border border-border bg-surface p-7">
          <p className="text-sm text-text-muted leading-relaxed">
            <span className="text-text-primary font-semibold">Cult of Psyche is a live streaming show.</span>{" "}
            Unscripted, unfiltered panels between a host and rotating guests — exploring consciousness,
            the occult, AI, human psychology, and whatever was happening that day. No script.
            No editorial filter. Just the conversation and wherever it went.
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            The show went dark for years. It came back in October 2024 — live streaming, rotating
            guests, the same format, a different frequency. Guests became recurring figures, dynamics
            became lore, conflicts became mythology.
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            <span className="text-accent-gold font-semibold">CultCodex is what that became.</span>{" "}
            Every transmission indexed. Every figure profiled. Every recurring pattern extracted.
            The chaos turned into a searchable, navigable archive — with an AI layer that keeps
            building the mythology from the inside.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {[
            { n: stats.episodes.toLocaleString(), label: "Transmissions" },
            { n: `${stats.totalHours.toLocaleString()}+`, label: "Hours" },
            { n: stats.people.toLocaleString(), label: "Voices" },
            { n: stats.segments.toLocaleString(), label: "Moments indexed" },
            { n: stats.quotes.toLocaleString(), label: "Quotes" },
            { n: stats.lore.toLocaleString(), label: "Lore entries" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-surface p-3 text-center">
              <p className="font-mono text-lg font-bold text-accent-gold">{s.n}</p>
              <p className="mt-0.5 font-mono text-[10px] text-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <MysticalDivider />

      {/* ── 2. Three things worth understanding ── */}
      <section className="space-y-6 max-w-4xl mx-auto">
        <div className="text-center space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted/50">
            {"/// before_you_go_further"}
          </p>
          <p className="font-display text-lg text-text-primary">Three things worth knowing.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              num: "I",
              title: "The archive captures behavior, not just content.",
              body: "\"Who said what\" is the surface. CultCodex tracks what happened underneath — recurring tactics, shifting dynamics, behavioral signatures across hundreds of appearances. That's what separates this from a YouTube playlist.",
              color: "border-accent-gold/20 text-accent-gold",
            },
            {
              num: "II",
              title: "The chaos had structure.",
              body: "From outside, livestream panels look random. Inside the archive, the same dynamics repeat — different guests, different eras, same underlying patterns. The Psychenomicon is the system that maps what keeps recurring and what it means.",
              color: "border-accent-violet/20 text-accent-violet",
            },
            {
              num: "III",
              title: "This is a living record.",
              body: "The archive is still growing. New transmissions enter. Patterns are extracted. The mythology builds in real time. You're not looking at a completed artifact — you're looking at something that is still becoming what it is.",
              color: "border-accent-cyan/20 text-accent-cyan",
            },
          ].map((c) => (
            <div key={c.num} className={`rounded-xl border ${c.color.split(" ")[0]} bg-surface p-6 space-y-3`}>
              <p className={`font-mono text-xs font-bold ${c.color.split(" ")[1]}`}>
                {c.num}
              </p>
              <h3 className="font-display text-sm font-bold text-text-primary leading-snug">{c.title}</h3>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <MysticalDivider />

      {/* ── 3. Six doorways ── */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted/50">
            {"/// enter_the_archive"}
          </p>
          <p className="font-display text-lg text-text-primary">Start with what&apos;s pulling on you.</p>
          <p className="font-mono text-xs text-text-muted max-w-md mx-auto">
            Forget categories. These are the six territories the archive keeps returning to.
            Pick the one that resonates right now.
          </p>
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
            href="/episodes"
            className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 rounded border border-accent-violet/30 text-accent-violet hover:bg-accent-violet-dim transition-colors"
          >
            Full archive →
          </Link>
          <Link
            href="/topics"
            className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 rounded border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan-dim transition-colors"
          >
            Browse all signals →
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

      {/* ── 4. Ask the Oracle ── */}
      <section className="max-w-3xl mx-auto">
        <div className="rounded-2xl border border-accent-violet/30 bg-gradient-to-b from-accent-violet/5 to-surface overflow-hidden">
          <div className="p-7 space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-violet/60">
              {"/// not_sure_where_to_start"}
            </p>
            <h2 className="font-display text-xl font-bold text-text-primary">
              Ask the Oracle anything.
            </h2>
            <p className="font-mono text-[11px] text-text-muted leading-relaxed">
              The Oracle is an AI trained on the full archive — every transcript, every lore entry,
              every behavioral profile. Ask it about a person, a pattern, a specific episode,
              a recurring dynamic, or a concept the archive keeps returning to.
              It doesn&apos;t search — it synthesizes.
            </p>
            <p className="font-mono text-[11px] text-text-muted leading-relaxed">
              Try: <span className="text-accent-violet italic">&ldquo;What patterns repeat across every major conflict?&rdquo;</span>{" "}
              or <span className="text-accent-violet italic">&ldquo;Who keeps showing up and why?&rdquo;</span>{" "}
              or just the name of someone you&apos;ve seen.
            </p>
          </div>
          <div className="border-t border-accent-violet/20 bg-accent-violet/5 px-7 py-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-xs text-text-muted">
              Full Oracle access requires{" "}
              <Link href="/premium" className="text-accent-gold underline hover:text-accent-gold/80">
                Initiate+
              </Link>
              {" "}· $10/month
            </p>
            <Link
              href="/oracle"
              className="inline-flex items-center gap-2 rounded-lg border border-accent-violet bg-accent-violet/15 px-5 py-2 font-mono text-xs font-bold text-accent-violet transition-all hover:bg-accent-violet/25"
            >
              Open the Oracle →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. What opens as Initiate+ ── */}
      <section className="max-w-3xl mx-auto space-y-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted text-center">
          {"/// the_intelligence_layer"}
        </p>
        <div className="rounded-2xl border border-accent-gold/20 bg-gradient-to-b from-accent-gold/5 to-surface overflow-hidden">
          <div className="p-7 space-y-4">
            <p className="font-mono text-[11px] text-text-muted leading-relaxed">
              As an <span className="text-text-primary font-bold">Observer</span>, you can see the full
              shape of the archive — every episode, every person, every lore entry, every quote.
              You know something is here.
            </p>
            <p className="font-mono text-[11px] text-text-muted leading-relaxed">
              <span className="text-accent-gold font-bold">Initiate+</span> is where the archive
              becomes a tool you can actually use:
            </p>
            <ul className="space-y-2.5">
              {[
                "Read every word ever spoken — full transcripts, searchable, timestamped",
                "Jump to any moment in any transmission instantly",
                "Search by what's actually happening — archetype, behavior, conflict type",
                "AI-extracted behavioral patterns from every panel",
                "Build your own intelligence file — save signals, quotes, observations",
                "The Psychenomicon — full access to the living myth-engine",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 font-mono text-[11px] text-text-muted">
                  <span className="text-accent-gold mt-0.5 shrink-0">✦</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-accent-gold/20 bg-accent-gold/5 px-7 py-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-xs text-text-muted">
              Initiate+ opens for{" "}
              <span className="text-accent-gold font-bold">$10/month</span>. Cancel any time.
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

      {/* ── 6. Full map ── */}
      <section className="space-y-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted text-center">
          {"/// full_map — every surface in the codex"}
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
              { href: "/timeline", label: "Timeline", desc: "All episodes, chronological" },
            ],
          },
          {
            label: "Discovery",
            color: "cyan" as const,
            items: [
              { href: "/search", label: "Search", desc: "Full-text across the archive" },
              { href: "/graph", label: "Relationship Map", desc: "Who appeared with whom — as a live network" },
              { href: "/topics", label: "Signals", desc: "Every theme and concept" },
              { href: "/collections", label: "Collections", desc: "Curated groupings" },
              { href: "/episodes", label: "Episodes", desc: `${stats.episodes.toLocaleString()} transmissions` },
            ],
          },
          {
            label: "Intelligence Layer",
            color: "violet" as const,
            items: [
              { href: "/oracle", label: "Oracle — Ask AI", desc: "Ask anything · AI answers from the full archive" },
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
