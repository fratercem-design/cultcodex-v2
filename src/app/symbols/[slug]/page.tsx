import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SYMBOLS } from "@/lib/symbols/data";
import type { SymbolEntry } from "@/lib/symbols/data";

export const dynamic = "force-static";

const CATEGORY_COLORS: Record<SymbolEntry["category"], string> = {
  cosmic: "border-accent-violet/40 text-accent-violet bg-accent-violet/10",
  divine: "border-accent-gold/40 text-accent-gold bg-accent-gold/10",
  occult: "border-red-500/40 text-red-400 bg-red-500/10",
  alchemical: "border-accent-cyan/40 text-accent-cyan bg-accent-cyan/10",
  geometric: "border-blue-400/40 text-blue-400 bg-blue-500/10",
  mythological: "border-orange-400/40 text-orange-400 bg-orange-500/10",
};

export function generateStaticParams() {
  return SYMBOLS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const symbol = SYMBOLS.find((s) => s.slug === slug);
  if (!symbol) return {};

  return {
    title: `${symbol.name} — Symbol Encyclopedia — CultCodex`,
    description: `${symbol.tagline} ${symbol.history.slice(0, 120)}…`,
    keywords: symbol.keywords,
    openGraph: {
      title: `${symbol.name} — CultCodex Symbol Encyclopedia`,
      description: symbol.tagline,
    },
  };
}

export default async function SymbolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const symbol = SYMBOLS.find((s) => s.slug === slug);
  if (!symbol) notFound();

  const relatedSymbols = SYMBOLS.filter((s) =>
    symbol.relatedSlugs.includes(s.slug)
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${symbol.name} — Symbol Encyclopedia`,
    description: symbol.tagline,
    url: `https://cultcodex.me/symbols/${symbol.slug}`,
    keywords: symbol.keywords.join(", "),
    mainEntity: {
      "@type": "Article",
      headline: symbol.name,
      description: `${symbol.history} ${symbol.occultMeaning}`,
      author: {
        "@type": "Organization",
        name: "CultCodex",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-void">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 font-mono text-[10px] text-text-muted">
            <Link href="/" className="hover:text-accent-gold transition-colors">
              CODEX
            </Link>
            <span>/</span>
            <Link href="/symbols" className="hover:text-accent-gold transition-colors">
              SYMBOLS
            </Link>
            <span>/</span>
            <span className="text-text-primary">{symbol.name.toUpperCase()}</span>
          </nav>

          {/* Hero glyph + name */}
          <header className="mb-10 space-y-5">
            <div
              className="text-[120px] leading-none text-accent-gold"
              style={{
                textShadow:
                  "0 0 40px rgba(200,169,107,0.5), 0 0 80px rgba(200,169,107,0.2)",
                fontFamily: "var(--font-mono), monospace",
              }}
              aria-hidden="true"
            >
              {symbol.glyph}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
                  {symbol.name}
                </h1>
                <span
                  className={`inline-flex items-center rounded border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${CATEGORY_COLORS[symbol.category]}`}
                >
                  {symbol.category}
                </span>
              </div>
              <p className="font-mono text-sm text-text-muted italic leading-relaxed">
                {symbol.tagline}
              </p>
            </div>
          </header>

          {/* Content sections */}
          <div className="space-y-10">
            {/* History */}
            <section>
              <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-gold/60 mb-3">
                /// history
              </p>
              <p className="text-sm text-text-muted leading-relaxed">{symbol.history}</p>
            </section>

            <div className="h-px bg-border" />

            {/* Occult Meaning */}
            <section>
              <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-gold/60 mb-3">
                /// occult_meaning
              </p>
              <p className="text-sm text-text-muted leading-relaxed">{symbol.occultMeaning}</p>
            </section>

            <div className="h-px bg-border" />

            {/* Modern Interpretation */}
            <section>
              <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-gold/60 mb-3">
                /// modern_interpretation
              </p>
              <p className="text-sm text-text-muted leading-relaxed">
                {symbol.modernInterpretation}
              </p>
            </section>

            <div className="h-px bg-border" />

            {/* Associated Archetypes */}
            <section>
              <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-gold/60 mb-3">
                /// associated_archetypes
              </p>
              <div className="flex flex-wrap gap-2">
                {symbol.associatedArchetypes.map((archetype) => (
                  <Link
                    key={archetype}
                    href="/archetype-quiz"
                    className="inline-flex items-center gap-1.5 rounded border border-accent-violet/30 bg-accent-violet/10 hover:bg-accent-violet/20 px-3 py-1.5 font-mono text-xs text-accent-violet transition-colors"
                  >
                    <span aria-hidden="true">◈</span>
                    {archetype}
                  </Link>
                ))}
              </div>
            </section>

            {/* Related Symbols */}
            {relatedSymbols.length > 0 && (
              <>
                <div className="h-px bg-border" />
                <section>
                  <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-gold/60 mb-4">
                    /// related_symbols
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {relatedSymbols.map((related) => (
                      <Link
                        key={related.slug}
                        href={`/symbols/${related.slug}`}
                        className="group rounded-xl border border-border bg-surface p-4 hover:border-accent-gold/40 hover:bg-accent-gold/5 transition-all flex flex-col gap-2"
                      >
                        <span className="text-3xl font-mono text-accent-gold/60 group-hover:text-accent-gold transition-colors leading-none">
                          {related.glyph}
                        </span>
                        <span className="font-mono text-xs text-text-primary group-hover:text-accent-gold transition-colors">
                          {related.name}
                        </span>
                        <span className="font-mono text-[9px] text-text-muted line-clamp-1">
                          {related.tagline}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Keywords (for SEO, visually subtle) */}
            <section className="rounded-xl border border-border/50 bg-surface/40 px-5 py-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-text-muted/40 mb-2">
                /// related_topics
              </p>
              <div className="flex flex-wrap gap-2">
                {symbol.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="font-mono text-[9px] text-text-muted/50 border border-border/40 rounded px-2 py-0.5"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* Footer CTAs */}
          <footer className="mt-12 pt-8 border-t border-border">
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-gold/60 mb-4">
              /// continue_your_research
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/psychenomicon"
                className="inline-flex items-center gap-2 rounded-lg border border-accent-violet/40 bg-accent-violet/10 hover:bg-accent-violet/20 px-5 py-2.5 font-mono text-xs font-bold text-accent-violet transition-colors"
              >
                Explore The Psychenomicon →
              </Link>
              <Link
                href="/archetype-quiz"
                className="inline-flex items-center gap-2 rounded-lg border border-accent-gold/40 bg-accent-gold/10 hover:bg-accent-gold/20 px-5 py-2.5 font-mono text-xs font-bold text-accent-gold transition-colors"
              >
                Discover Your Archetype →
              </Link>
              <Link
                href="/symbols"
                className="inline-flex items-center gap-2 rounded-lg border border-border hover:border-accent-gold/30 px-5 py-2.5 font-mono text-xs text-text-muted hover:text-accent-gold transition-colors"
              >
                ← All Symbols
              </Link>
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}
