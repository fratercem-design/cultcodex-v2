import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { PILLARS } from "@/lib/pillars/pillars";
import { accentFor } from "@/components/collections/collection-accents";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Explore the Archive — Tarot, Consciousness, Occult, AI & More",
  description:
    "Explore the major subjects of the Cult of Psyche archive: tarot, consciousness, the occult, AI, astrology, spirituality, human behavior, and open-panel internet culture.",
  path: "/explore",
});

export default function ExploreIndexPage() {
  return (
    <>
      <PageHero
        title="EXPLORE THE ARCHIVE"
        subtitle={`${PILLARS.length} territories the Cult keeps returning to.`}
        backgroundImage="/hero-bg.jpg"
        label="explore"
      />

      <main id="main-content" className="mx-auto max-w-5xl px-4 py-12 space-y-10">
        <section className="max-w-2xl mx-auto text-center space-y-3">
          <p className="text-sm text-text-muted leading-relaxed">
            Cult of Psyche ranges across tarot, consciousness, the occult, AI, astrology,
            spirituality, human behavior, and the chaos of open-panel internet culture. Each pillar
            below is an authority guide — original framing plus every related transmission in the
            archive.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {PILLARS.map((p) => {
            const a = accentFor(p.accent);
            return (
              <Link
                key={p.slug}
                href={`/explore/${p.slug}`}
                className={`group rounded-xl border ${a.border} bg-surface p-6 space-y-2 transition-all ${a.hoverBorder} ${a.hoverBg} hover:-translate-y-0.5`}
              >
                <h2 className={`font-display text-xl font-bold ${a.title}`}>{p.title}</h2>
                <p className="text-sm text-text-muted leading-relaxed">{p.tagline}</p>
                <p className={`font-mono text-[12px] uppercase tracking-widest ${a.eyebrow} inline-flex items-center gap-2 group-hover:gap-3 transition-all pt-1`}>
                  Explore <span aria-hidden>→</span>
                </p>
              </Link>
            );
          })}
        </section>
      </main>
    </>
  );
}
