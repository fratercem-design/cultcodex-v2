import Image from "next/image";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { buildMetadata } from "@/lib/seo";
import { RECOMMENDATIONS } from "@/lib/recommendations";

const hasItems = RECOMMENDATIONS.length > 0;

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Psyche Recommends",
    description:
      "The tools, decks and services Psyche actually uses, with referral links that support the Cult of Psyche.",
    path: "/recommends",
  }),
  // An empty page has nothing worth indexing; it opens up once links exist.
  ...(hasItems ? {} : { robots: { index: false, follow: true } }),
};

export default function RecommendsPage() {
  const categories = [...new Set(RECOMMENDATIONS.map((r) => r.category))];

  return (
    <>
      <PageHero
        title="PSYCHE RECOMMENDS"
        subtitle="What Psyche actually uses — and links that support the show"
        backgroundImage="/hero-bg.jpg"
        label="recommends"
      />

      <main id="main-content" className="mx-auto max-w-5xl space-y-12 px-4 py-12">
        {/* FTC: disclose before the links, in plain words. */}
        <p className="mx-auto max-w-2xl rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm leading-relaxed text-text-muted">
          <span className="font-semibold text-text-primary">Affiliate disclosure:</span> these are
          referral links. If you sign up or buy through them, Cult of Psyche may earn a commission
          or credit, at no extra cost to you.
        </p>

        {!hasItems ? (
          <EmptyState message="Recommendations are on their way" suggestion="Check back soon." />
        ) : (
          categories.map((category) => (
            <section key={category} aria-labelledby={`cat-${category}`} className="space-y-4">
              <h2
                id={`cat-${category}`}
                className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text"
              >
                {category}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {RECOMMENDATIONS.filter((r) => r.category === category).map((r) => (
                  <article
                    key={r.slug}
                    className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6"
                  >
                    <div className="flex items-start gap-4">
                      {r.image && (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border">
                          <Image src={r.image} alt="" fill sizes="64px" className="object-cover" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-display text-lg font-bold text-text-primary">{r.name}</h3>
                        {r.offer && (
                          <p className="mt-0.5 font-mono text-[12px] text-accent-violet-text">{r.offer}</p>
                        )}
                      </div>
                    </div>
                    <p className="flex-1 text-sm leading-relaxed text-text-muted">{r.blurb}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <a
                        href={`/go/${r.slug}`}
                        target="_blank"
                        rel="sponsored noopener noreferrer"
                        className="inline-flex min-h-11 items-center rounded-lg border border-accent-gold bg-accent-gold/15 px-5 font-mono text-sm font-bold text-accent-gold-text transition-colors hover:bg-accent-gold/25"
                      >
                        Check it out →
                      </a>
                      {r.code && (
                        <p className="font-mono text-[12px] text-text-muted">
                          Code <span className="rounded border border-border px-2 py-1 text-text-primary">{r.code}</span>
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </>
  );
}
