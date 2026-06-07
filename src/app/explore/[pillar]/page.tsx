/**
 * /explore/[pillar] — SEO pillar / authority page.
 *
 * Long-form original prose about a major subject the show explores,
 * backed by live archive data (topics + episodes matched on
 * topicMatchers). Emits CollectionPage + BreadcrumbList + FAQPage
 * structured data for rich results.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { PILLARS, getPillarBySlug } from "@/lib/pillars/pillars";
import { buildEpisodeInclude, formatEpisodeForCard } from "@/lib/queries/episodes";
import { prisma } from "@/lib/db";
import { buildMetadata, jsonLdScript, breadcrumbListJsonLd } from "@/lib/seo";

import { PageHero } from "@/components/ui/page-hero";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { CodexSigil } from "@/components/graphics/codex-sigil";
import { SignalGrid } from "@/components/collections/signal-grid";
import { CollectionEpisodeCard } from "@/components/collections/collection-episode-card";
import { accentFor } from "@/components/collections/collection-accents";

export const revalidate = 600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://cultcodex.me";

export async function generateStaticParams() {
  return PILLARS.map((p) => ({ pillar: p.slug }));
}

interface PageProps {
  params: Promise<{ pillar: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pillar } = await params;
  const p = getPillarBySlug(pillar);
  if (!p) {
    return buildMetadata({
      title: "Not Found",
      description: "This pillar does not exist.",
      path: `/explore/${pillar}`,
    });
  }
  return {
    ...buildMetadata({
      title: p.metaTitle,
      description: p.metaDescription,
      path: `/explore/${p.slug}`,
    }),
    title: p.metaTitle,
  };
}

async function findRelatedTopics(matchers: string[]) {
  if (matchers.length === 0) return [];
  return prisma.topic.findMany({
    where: {
      OR: matchers.flatMap((m) => [
        { slug: { contains: m, mode: "insensitive" as const } },
        { title: { contains: m, mode: "insensitive" as const } },
      ]),
    },
    include: { _count: { select: { episodes: true } } },
    orderBy: [{ episodes: { _count: "desc" } }, { title: "asc" }],
    take: 30,
  });
}

async function findRelatedEpisodes(topicIds: string[]) {
  if (topicIds.length === 0) return [];
  const rows = await prisma.episode.findMany({
    where: {
      status: "published",
      topics: { some: { topicId: { in: topicIds } } },
    },
    include: buildEpisodeInclude(),
    orderBy: [
      { airDate: { sort: "desc", nulls: "last" } },
      { episodeNumber: "desc" },
    ],
    take: 24,
  });
  return rows.map(formatEpisodeForCard);
}

export default async function PillarPage({ params }: PageProps) {
  const { pillar } = await params;
  const p = getPillarBySlug(pillar);
  if (!p) notFound();

  const topics = await findRelatedTopics(p.topicMatchers);
  const relatedEpisodes = await findRelatedEpisodes(topics.map((t) => t.id));
  const a = accentFor(p.accent);
  const related = (p.related ?? [])
    .map((s) => getPillarBySlug(s))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const url = `${SITE_URL}/explore/${p.slug}`;

  return (
    <>
      <PageHero
        title={p.title.toUpperCase()}
        subtitle={p.tagline}
        backgroundImage="/hero-bg.jpg"
        label="explore"
      />

      <main id="main-content" className="mx-auto max-w-4xl px-4 py-12 space-y-14">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
          <Link href="/" className="hover:text-accent-gold transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/explore" className="hover:text-accent-gold transition-colors">Explore</Link>
          <span className="mx-2">/</span>
          <span className={a.title}>{p.title}</span>
        </nav>

        {/* Intro — authority prose */}
        <article className="space-y-5">
          <div className={`flex items-center gap-3 ${a.title}`}>
            <CodexSigil size={32} glow />
            <h2 className="font-display text-2xl font-bold text-text-primary">{p.title}</h2>
          </div>
          {p.intro.map((para, i) => (
            <p key={i} className="text-[15px] text-text-muted leading-relaxed">{para}</p>
          ))}
        </article>

        {/* What you'll find */}
        <section className="rounded-xl border border-border bg-surface p-6 space-y-3">
          <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${a.eyebrow}`}>
            {"/// what_you'll_find"}
          </p>
          <ul className="space-y-2">
            {p.whatYoullFind.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-text-muted leading-relaxed">
                <span className={`mt-0.5 shrink-0 ${a.title}`}>✦</span>{item}
              </li>
            ))}
          </ul>
        </section>

        {/* Signals */}
        {topics.length > 0 && (
          <section className="space-y-3">
            <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${a.eyebrow}`}>
              {"/// signals_tracked"}
            </p>
            <p className="font-mono text-[11px] text-text-muted">
              {topics.length} topic{topics.length === 1 ? "" : "s"} the archive cross-references for {p.title.toLowerCase()}.
            </p>
            <SignalGrid
              signals={topics.map((t) => ({ title: t.title, slug: t.slug, episodeCount: t._count.episodes }))}
              accent={p.accent}
              emptyLabel="No topics match yet."
            />
          </section>
        )}

        {/* Episodes */}
        <section className="space-y-3">
          <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${a.eyebrow}`}>
            {"/// transmissions"}
          </p>
          {relatedEpisodes.length === 0 ? (
            <p className="text-sm text-text-muted italic">
              No transmissions tagged yet.{" "}
              <Link href="/episodes" className={`underline ${a.title}`}>Browse the full archive →</Link>
            </p>
          ) : (
            <>
              <p className="font-mono text-[11px] text-text-muted">
                {relatedEpisodes.length} episode{relatedEpisodes.length === 1 ? "" : "s"} exploring {p.title.toLowerCase()}.
              </p>
              <div className="space-y-3">
                {relatedEpisodes.map((ep) => (
                  <CollectionEpisodeCard key={ep.id} episode={ep} accent={p.accent} />
                ))}
              </div>
            </>
          )}
        </section>

        <MysticalDivider />

        {/* FAQ */}
        <section className="space-y-4">
          <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${a.eyebrow}`}>
            {"/// frequently_asked"}
          </p>
          <div className="space-y-3">
            {p.faqs.map((f) => (
              <details key={f.q} className="group rounded-xl border border-border bg-surface p-5">
                <summary className="cursor-pointer font-display text-sm font-bold text-text-primary list-none flex items-center justify-between gap-3">
                  {f.q}
                  <span className={`shrink-0 transition-transform group-open:rotate-45 ${a.title}`}>+</span>
                </summary>
                <p className="mt-3 text-sm text-text-muted leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Related pillars */}
        {related.length > 0 && (
          <>
            <MysticalDivider />
            <section className="space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted text-center">
                {"/// keep_exploring"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {related.map((rp) => {
                  const ra = accentFor(rp.accent);
                  return (
                    <Link
                      key={rp.slug}
                      href={`/explore/${rp.slug}`}
                      className={`group rounded-lg border ${ra.border} bg-surface p-4 transition-colors ${ra.hoverBorder} ${ra.hoverBg}`}
                    >
                      <h3 className={`font-display text-base font-bold ${ra.title}`}>{rp.title}</h3>
                      <p className="mt-1 text-xs text-text-muted">{rp.tagline}</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* CTA */}
        <section className="rounded-2xl border border-accent-violet/30 bg-gradient-to-b from-accent-violet/5 to-surface p-6 text-center space-y-3">
          <h2 className="font-display text-lg font-bold text-text-primary">Ask the Oracle about {p.title.toLowerCase()}.</h2>
          <p className="font-mono text-[11px] text-text-muted max-w-md mx-auto">
            The AI Oracle answers any question from inside the full archive — with citations.
          </p>
          <Link href="/oracle" className="inline-flex items-center gap-2 rounded-lg border border-accent-violet bg-accent-violet/15 px-6 py-3 font-mono text-xs font-bold text-accent-violet transition-all hover:bg-accent-violet/25">
            Consult the Oracle →
          </Link>
        </section>
      </main>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: p.metaTitle,
            description: p.metaDescription,
            url,
            isPartOf: { "@type": "WebSite", name: "CultCodex", url: SITE_URL },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbListJsonLd([
              { name: "Home", url: SITE_URL },
              { name: "Explore", url: `${SITE_URL}/explore` },
              { name: p.title, url },
            ])
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: p.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </>
  );
}
