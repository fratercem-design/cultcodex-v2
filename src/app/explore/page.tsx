import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { PILLARS } from "@/lib/pillars/pillars";
import { accentFor } from "@/components/collections/collection-accents";
import { buildMetadata } from "@/lib/seo";
import { SECTION_HEADERS } from "@/lib/section-headers";
import { SITE_DIRECTORY } from "@/lib/site-directory";

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
        backgroundImage={SECTION_HEADERS.constellation}
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

        <section aria-labelledby="directory-heading" className="space-y-8 border-t border-border pt-10">
          <div className="max-w-2xl space-y-2">
            <h2 id="directory-heading" className="font-display text-2xl font-bold text-text-primary">
              Everything in the archive
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              Every section of CultCodex, grouped by what you came to do.
            </p>
          </div>
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {SITE_DIRECTORY.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h3 className="mb-3 font-mono text-[12px] font-semibold uppercase tracking-widest text-accent-gold-text">
                  {group.title}
                </h3>
                <ul className="space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="group block">
                        <span className="text-sm font-semibold text-text-primary transition-colors group-hover:text-accent-gold-text">
                          {link.label}
                        </span>
                        <span className="block text-[13px] leading-snug text-text-muted">{link.blurb}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
