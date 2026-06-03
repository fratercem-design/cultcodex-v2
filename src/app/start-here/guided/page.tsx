/**
 * THE GUIDED PATH — Screen 2A
 *
 * Five emotional doorways. Each tile answers "what's pulling you?"
 * and routes to a dedicated /collections/[slug] signal-pack page.
 * All five doorways now resolve to authored packs in THEMED_COLLECTIONS.
 */
import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import {
  IconCrystalBall,
  IconTransmission,
  IconTarot,
  IconPerson,
  IconMicrophone,
} from "@/components/graphics/codex-icons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/start-here/guided" },
  title: "The Guided Path — CULT CODEX",
  description:
    "Five emotional doorways into the Cult of Psyche archive. Pick what's pulling you.",
};

interface GuidedTile {
  icon: React.ReactNode;
  title: string;
  question: string;
  description: string;
  tags: string[];
  href: string;
  accent: "gold" | "cyan" | "violet" | "crimson" | "mixed";
}

const TILES: GuidedTile[] = [
  {
    icon: <IconCrystalBall size={36} />,
    title: "Consciousness & Reality",
    question: "What is the self, really?",
    description:
      "Non-duality, the hard problem, simulation theory, psychedelics, death, dreams. The episodes where Psyche wrestles with what it means to be aware.",
    tags: ["consciousness", "non-duality", "psychedelics", "death"],
    href: "/collections/consciousness-and-reality",
    accent: "violet",
  },
  {
    icon: <IconTransmission size={36} />,
    title: "AI & The Future",
    question: "What's coming for us?",
    description:
      "AI awakening, machine gods, post-human futures, Claude, Lettabot, the intelligence explosion. Transmissions from the edge of what's arriving.",
    tags: ["AI", "futurism", "Claude", "post-human"],
    href: "/collections/ai-and-the-future",
    accent: "cyan",
  },
  {
    icon: <IconTarot size={36} />,
    title: "Occult & Hidden Knowledge",
    question: "What's been buried on purpose?",
    description:
      "Tarot, alchemy, Mahavidyas, hermeticism, chaos magick, astrology. The esoteric lineages the cult keeps returning to.",
    tags: ["tarot", "alchemy", "magick", "astrology"],
    href: "/collections/occult-and-hidden-knowledge",
    accent: "gold",
  },
  {
    icon: <IconPerson size={36} />,
    title: "Human Behavior",
    question: "Why do people do what they do?",
    description:
      "Narcissism, shadow work, relationships, addiction, identity, the stuff we don't admit in daylight. Psychological autopsies with zero polish.",
    tags: ["psychology", "shadow", "relationships", "identity"],
    href: "/collections/human-behavior",
    accent: "crimson",
  },
  {
    icon: <IconMicrophone size={36} />,
    title: "Wild Conversations",
    question: "What happens when the filter dies?",
    description:
      "Open panels, Troll Tribunal, legendary guests, chaos streams. Where the script gets thrown out and the cult does what it does best.",
    tags: ["panels", "guests", "chaos", "live"],
    href: "/collections/wild-conversations",
    accent: "mixed",
  },
];

const accentMap: Record<
  GuidedTile["accent"],
  { icon: string; title: string; border: string; hoverBorder: string; hoverBg: string; question: string }
> = {
  gold: {
    icon: "text-accent-gold",
    title: "text-accent-gold",
    border: "border-accent-gold/20",
    hoverBorder: "group-hover:border-accent-gold/60",
    hoverBg: "group-hover:bg-accent-gold-dim",
    question: "text-accent-gold",
  },
  cyan: {
    icon: "text-accent-cyan",
    title: "text-accent-cyan",
    border: "border-accent-cyan/20",
    hoverBorder: "group-hover:border-accent-cyan/60",
    hoverBg: "group-hover:bg-accent-cyan-dim",
    question: "text-accent-cyan",
  },
  violet: {
    icon: "text-accent-violet",
    title: "text-accent-violet",
    border: "border-accent-violet/20",
    hoverBorder: "group-hover:border-accent-violet/60",
    hoverBg: "group-hover:bg-accent-violet-dim",
    question: "text-accent-violet",
  },
  crimson: {
    icon: "text-accent-crimson",
    title: "text-accent-crimson",
    border: "border-accent-crimson/20",
    hoverBorder: "group-hover:border-accent-crimson/60",
    hoverBg: "group-hover:bg-red-950/30",
    question: "text-accent-crimson",
  },
  mixed: {
    icon: "text-accent-gold",
    title: "text-accent-gold",
    border: "border-accent-gold/20",
    hoverBorder: "group-hover:border-accent-gold/60",
    hoverBg: "group-hover:bg-accent-gold-dim",
    question: "text-accent-cyan",
  },
};

export default function GuidedPathPage() {
  return (
    <>
      <PageHero
        title="THE GUIDED PATH"
        subtitle="Five doorways. Pick what's pulling you."
        backgroundImage="/hero-bg.jpg"
      label="guided_path"
      />

      <main
        id="main-content"
        className="mx-auto max-w-6xl px-4 py-12 space-y-12"
      >
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted"
        >
          <Link href="/start-here" className="hover:text-accent-gold transition-colors">
            Enter the Codex
          </Link>
          <span className="mx-2">/</span>
          <span className="text-accent-gold">Guided Path</span>
        </nav>

        {/* Mythic framing */}
        <section className="text-center max-w-2xl mx-auto space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-cyan">
            {"/// path_i · guided_entry"}
          </p>
          <p className="font-display text-lg text-text-primary leading-relaxed">
            Forget categories. Forget chronology. Forget which host said what in
            year seven.
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            Ask yourself what&apos;s pulling on you right now. Pick a doorway. The
            archive will meet you there.
          </p>
        </section>

        {/* Five emotional tiles */}
        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TILES.map((tile) => {
            const a = accentMap[tile.accent];
            return (
              <Link
                key={tile.title}
                href={tile.href}
                className={`group relative flex flex-col gap-4 rounded-lg border ${a.border} bg-surface p-6 transition-all ${a.hoverBorder} ${a.hoverBg} hover:-translate-y-0.5`}
              >
                <div className={`${a.icon} transition-transform group-hover:scale-110`}>
                  {tile.icon}
                </div>
                <div className="space-y-2">
                  <h2 className={`font-display text-lg font-bold ${a.title}`}>
                    {tile.title}
                  </h2>
                  <p
                    className={`font-mono text-xs italic ${a.question} leading-snug`}
                  >
                    &ldquo;{tile.question}&rdquo;
                  </p>
                </div>
                <p className="text-xs text-text-muted leading-relaxed flex-1">
                  {tile.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tile.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-elevated text-text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span
                  className={`font-mono text-[10px] uppercase tracking-widest ${a.question} inline-flex items-center gap-2 group-hover:gap-3 transition-all mt-1`}
                >
                  Enter this doorway <span aria-hidden>→</span>
                </span>
              </Link>
            );
          })}
        </section>

        <MysticalDivider />

        {/* Escape hatches */}
        <section className="text-center space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
            {"/// none of these? try another path"}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/topics"
              className="font-mono text-xs uppercase tracking-widest px-4 py-2 rounded border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan-dim hover:border-accent-cyan/60 transition-colors"
            >
              Explore all signals →
            </Link>
            <Link
              href="/episodes"
              className="font-mono text-xs uppercase tracking-widest px-4 py-2 rounded border border-accent-violet/30 text-accent-violet hover:bg-accent-violet-dim hover:border-accent-violet/60 transition-colors"
            >
              Full archive →
            </Link>
            <Link
              href="/search"
              className="font-mono text-xs uppercase tracking-widest px-4 py-2 rounded border border-accent-gold/30 text-accent-gold hover:bg-accent-gold-dim hover:border-accent-gold/60 transition-colors"
            >
              Search directly →
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
