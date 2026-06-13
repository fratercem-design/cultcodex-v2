export const dynamic = "force-dynamic";

import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { IconTarot, IconScroll, IconFlame, IconMicrophone, IconCrystalBall, IconMask, IconQuote, IconTransmission } from "@/components/graphics/codex-icons";
import { prisma } from "@/lib/db";
import { THEMED_COLLECTIONS } from "@/lib/collections/themed-collections";
import { CollectionIcon } from "@/components/collections/collection-icon";
import { accentFor } from "@/components/collections/collection-accents";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Collections — CULT CODEX",
  description: "Curated collections of the best Cult of Psyche episodes, organized by theme.",
  alternates: { canonical: "/collections" },
};

interface Collection {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  links: { label: string; href: string }[];
}

const COLLECTIONS: Collection[] = [
  {
    title: "Best of Tarot",
    description: "The most powerful and insightful tarot readings across all series. Psyche at their most mystical.",
    icon: <IconTarot size={28} />,
    color: "text-accent-gold",
    borderColor: "border-accent-gold/20",
    links: [
      { label: "Psyche Awakens Tarot", href: "/episodes?series=psyche-awakens-tarot" },
      { label: "All tarot episodes", href: "/search?q=tarot+reading&type=episodes" },
    ],
  },
  {
    title: "Mythology Deep Dives",
    description: "Explorations of ancient myths, gods, goddesses, and esoteric traditions from cultures around the world.",
    icon: <IconScroll size={28} />,
    color: "text-accent-cyan",
    borderColor: "border-accent-cyan/20",
    links: [
      { label: "Mythology & Lore series", href: "/episodes?series=mythology-and-lore" },
      { label: "Lore archive", href: "/lore" },
    ],
  },
  {
    title: "Funniest Panels",
    description: "The most chaotic, hilarious, and memorable live panel moments. Community mayhem at its finest.",
    icon: <IconMicrophone size={28} />,
    color: "text-accent-cyan",
    borderColor: "border-accent-cyan/20",
    links: [
      { label: "Open Panel episodes", href: "/episodes?series=open-panel" },
      { label: "Midnight Madness", href: "/episodes?series=midnight-madness" },
    ],
  },
  {
    title: "Cult Lore Essentials",
    description: "The foundational concepts, doctrines, and mythology of the Cult of Psyche universe.",
    icon: <IconScroll size={28} />,
    color: "text-purple-400",
    borderColor: "border-purple-400/20",
    links: [
      { label: "Canonical lore", href: "/lore?canon=canonical" },
      { label: "All lore entries", href: "/lore" },
    ],
  },
  {
    title: "Astrology Sessions",
    description: "Zodiac deep dives, planetary analysis, birth chart readings, and celestial wisdom.",
    icon: <IconCrystalBall size={28} />,
    color: "text-yellow-400",
    borderColor: "border-yellow-400/20",
    links: [
      { label: "Astrology Deep Dives", href: "/episodes?series=astrology-deep-dives" },
      { label: "Search zodiac", href: "/search?q=zodiac&type=episodes" },
    ],
  },
  {
    title: "Scary Tales & Story Time",
    description: "Quantum Scary Tales, Uncle Wiggly, Baital Pachchisi, The Golden Ass, and other narrative series.",
    icon: <IconMask size={28} />,
    color: "text-orange-400",
    borderColor: "border-orange-400/20",
    links: [
      { label: "Quantum Scary Tales", href: "/episodes?series=quantum-scary-tales" },
      { label: "Uncle Wiggly", href: "/episodes?series=uncle-wiggly-stories" },
      { label: "Baital Pachchisi", href: "/episodes?series=baital-pachchisi-tales" },
      { label: "The Golden Ass", href: "/episodes?series=the-golden-ass" },
    ],
  },
  {
    title: "Troll Tribunal",
    description: "The legendary Troll Tribunal sessions — confrontations, judgments, and internet justice.",
    icon: <IconFlame size={28} />,
    color: "text-red-400",
    borderColor: "border-red-400/20",
    links: [
      { label: "Troll Tribunal series", href: "/episodes?series=troll-tribunal" },
      { label: "Trollopedia", href: "/episodes?series=trollopedia" },
    ],
  },
  {
    title: "Notable Quotes",
    description: "The most memorable, profound, and hilarious quotes from across the archive.",
    icon: <IconQuote size={28} />,
    color: "text-accent-gold",
    borderColor: "border-accent-gold/20",
    links: [
      { label: "Full quote archive", href: "/quotes" },
      { label: "Search quotes", href: "/search?type=quotes" },
    ],
  },
];

// Series slugs used by collections — fetch episode counts for these
const SERIES_SLUGS = [
  "psyche-awakens-tarot",
  "mythology-and-lore",
  "open-panel",
  "midnight-madness",
  "astrology-deep-dives",
  "quantum-scary-tales",
  "uncle-wiggly-stories",
  "baital-pachchisi-tales",
  "the-golden-ass",
  "troll-tribunal",
  "trollopedia",
];

export default async function CollectionsPage() {
  // Fetch episode counts per series for display
  const seriesCounts = await prisma.series.findMany({
    where: { slug: { in: SERIES_SLUGS } },
    select: { slug: true, _count: { select: { episodes: true } } },
  });
  const countMap = new Map(seriesCounts.map((s) => [s.slug, s._count.episodes]));
  const totalCollectionEpisodes = seriesCounts.reduce((sum, s) => sum + s._count.episodes, 0);

  return (
    <>
      <PageHero
        title="COLLECTIONS"
        subtitle={`Curated paths through ${totalCollectionEpisodes} episodes`}
        backgroundImage="/hero-bg.jpg"
      
      label="signal_packs"
    />

      <main id="main-content" className="mx-auto max-w-6xl px-4 py-10 space-y-12">
        <p className="text-center text-sm text-text-muted max-w-2xl mx-auto">
          Hand-picked collections to help you discover the best of the Cult of Psyche.
          Each collection groups episodes, lore, and quotes by theme.
        </p>

        {/* Themed Signal Packs — the Guided-Path destinations */}
        <section className="space-y-5">
          <div className="space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-cyan">
              {"/// signal_packs"}
            </p>
            <h2 className="font-display text-xl font-bold text-text-primary">
              Themed Signal Packs
            </h2>
            <p className="text-sm text-text-muted max-w-2xl">
              The editorial entry points — each one a map of the cult&rsquo;s
              recurring confrontation with a single question.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {THEMED_COLLECTIONS.map((col) => {
              const a = accentFor(col.accent);
              return (
                <Link
                  key={col.slug}
                  href={`/collections/${col.slug}`}
                  className={`group relative flex flex-col gap-3 rounded-lg border ${a.border} bg-surface p-6 transition-all ${a.hoverBorder} ${a.hoverBg} hover:-translate-y-0.5`}
                >
                  <div className={`${a.icon} transition-transform group-hover:scale-110`}>
                    <CollectionIcon iconKey={col.iconKey} size={36} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
                      {col.eyebrow}
                    </p>
                    <h3 className={`font-display text-lg font-bold ${a.title}`}>
                      {col.title}
                    </h3>
                    <p className={`font-mono text-xs italic ${a.eyebrow} leading-snug`}>
                      &ldquo;{col.subtitle}&rdquo;
                    </p>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed flex-1 line-clamp-3">
                    {col.description[0]}
                  </p>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-widest ${a.eyebrow} inline-flex items-center gap-2 group-hover:gap-3 transition-all`}
                  >
                    Enter pack <span aria-hidden>→</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <MysticalDivider />

        {/* Series-based collections */}
        <section className="space-y-5">
          <div className="space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold">
              {"/// series_packs"}
            </p>
            <h2 className="font-display text-xl font-bold text-text-primary">
              By Series
            </h2>
            <p className="text-sm text-text-muted max-w-2xl">
              Curated routes into the show&rsquo;s ongoing series — tarot, mythology,
              panels, scary tales.
            </p>
          </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {COLLECTIONS.map((col) => (
            <div
              key={col.title}
              className={`rounded-lg border ${col.borderColor} bg-surface p-6 space-y-3`}
            >
              <div className="flex items-center gap-3">
                <div className={col.color}>{col.icon}</div>
                <h2 className={`font-display text-lg font-bold ${col.color}`}>
                  {col.title}
                </h2>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {col.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {col.links.map((link) => {
                  // Extract series slug from href to show episode count
                  const seriesMatch = link.href.match(/series=([a-z0-9-]+)/);
                  const epCount = seriesMatch ? countMap.get(seriesMatch[1]) : undefined;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-[10px] text-text-muted transition-colors hover:border-accent-cyan/30 hover:text-accent-cyan hover:bg-elevated"
                    >
                      {link.label}
                      {epCount != null && (
                        <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[9px] text-text-muted">
                          {epCount}
                        </span>
                      )}
                      →
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        </section>

        <MysticalDivider />

        <div className="text-center">
          <Link
            href="/start-here"
            className="inline-flex items-center gap-2 rounded-lg border border-accent-gold/30 px-6 py-3 font-mono text-xs text-accent-gold transition-colors hover:bg-accent-gold/10"
          >
            <IconTransmission size={16} />
            New here? Start Here →
          </Link>
        </div>
      </main>
    </>
  );
}
