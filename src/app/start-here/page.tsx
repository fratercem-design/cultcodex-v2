import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import { IconTransmission, IconScroll, IconCrystalBall, IconTarot, IconMask, IconFlame, IconMicrophone, IconQuote } from "@/components/graphics/codex-icons";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { ArchiveDisclaimer } from "@/components/ui/archive-disclaimer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start Here — CULT CODEX",
  description: "New to the Cult of Psyche? Choose your path into the archive.",
};

const PATHS = [
  {
    icon: <IconTarot size={32} />,
    title: "Tarot & Readings",
    description: "Psyche's tarot readings, spiritual guidance, and divination sessions. The mystical heart of the channel.",
    href: "/series?filter=psyche-awakens-tarot",
    seriesLink: "/episodes?series=psyche-awakens-tarot",
    color: "text-accent-gold",
    borderColor: "hover:border-accent-gold/40",
  },
  {
    icon: <IconScroll size={32} />,
    title: "Mythology & Lore",
    description: "Ancient myths, esoteric philosophy, Mahavidyas, alchemy, and the deep lore of the Psycheverse.",
    href: "/episodes?series=mythology-and-lore",
    seriesLink: "/lore",
    color: "text-accent-cyan",
    borderColor: "hover:border-accent-cyan/40",
  },
  {
    icon: <IconMicrophone size={32} />,
    title: "Open Panels & Live Streams",
    description: "The chaotic, hilarious, and unfiltered live sessions with community guests. Where legends are made.",
    href: "/episodes?series=open-panel",
    seriesLink: "/series",
    color: "text-accent-green",
    borderColor: "hover:border-accent-green/40",
  },
  {
    icon: <IconFlame size={32} />,
    title: "Community Drama & Feuds",
    description: "The Troll Tribunal, iconic confrontations, and the interpersonal sagas that define the Cult.",
    href: "/episodes?series=troll-tribunal",
    seriesLink: "/topics",
    color: "text-red-400",
    borderColor: "hover:border-red-400/40",
  },
  {
    icon: <IconCrystalBall size={32} />,
    title: "Astrology Deep Dives",
    description: "Zodiac breakdowns, birth chart analysis, planetary transits, and celestial commentary.",
    href: "/episodes?series=astrology-deep-dives",
    seriesLink: "/topics",
    color: "text-purple-400",
    borderColor: "hover:border-purple-400/40",
  },
  {
    icon: <IconMask size={32} />,
    title: "Scary Tales & Stories",
    description: "Quantum Scary Tales, Uncle Wiggly readings, Baital Pachchisi, and The Golden Ass.",
    href: "/episodes?series=quantum-scary-tales",
    seriesLink: "/series",
    color: "text-orange-400",
    borderColor: "hover:border-orange-400/40",
  },
];

export default function StartHerePage() {
  return (
    <>
      <PageHero
        title="START HERE"
        subtitle="Choose your path into the archive"
        backgroundImage="/hero-bg.jpg"
      />

      <main id="main-content" className="mx-auto max-w-5xl px-4 py-10 space-y-10">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm text-text-muted leading-relaxed">
            The Cult of Psyche archive contains over 1,300 episodes spanning tarot,
            mythology, live panels, music, drama, and more. Pick a doorway below
            to find your way in.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PATHS.map((path) => (
            <Link
              key={path.title}
              href={path.href}
              className={`group relative flex flex-col gap-3 rounded-lg border border-border bg-surface p-6 transition-all ${path.borderColor} hover:bg-elevated`}
            >
              <div className={path.color}>{path.icon}</div>
              <h2 className={`font-display text-lg font-bold ${path.color}`}>
                {path.title}
              </h2>
              <p className="text-xs text-text-muted leading-relaxed flex-1">
                {path.description}
              </p>
              <span className="font-mono text-[10px] text-accent-green group-hover:underline">
                Explore →
              </span>
            </Link>
          ))}
        </div>

        <MysticalDivider />

        <SectionCard title="Other Ways to Explore">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/people", label: "People Directory", desc: "Hosts, guests, and figures" },
              { href: "/quotes", label: "Quote Archive", desc: "Notable words and wisdom" },
              { href: "/search", label: "Search Everything", desc: "Episodes, transcripts, lore" },
              { href: "/stats", label: "Archive Stats", desc: "Numbers and visualizations" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-green/30 hover:bg-elevated"
              >
                <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-green transition-colors">
                  {item.label}
                </h3>
                <p className="mt-1 text-xs text-text-muted">{item.desc}</p>
              </Link>
            ))}
          </div>
        </SectionCard>

        <ArchiveDisclaimer variant="full" />
      </main>
    </>
  );
}
