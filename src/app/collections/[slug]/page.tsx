/**
 * /collections/[slug] — Themed "Signal Pack" detail page.
 *
 * Reads a ThemedCollection from editorial config (src/lib/collections/
 * themed-collections.ts), then pulls live data from Prisma:
 *   - Topics whose slug OR title case-insensitively matches any
 *     topicMatcher (these become SignalGrid chips)
 *   - Episodes linked to those topics (these become the transmission
 *     stack, with optional hand-picked slugs pinned to the top)
 *
 * Not DB-backed at the collection level — the "collection" itself is
 * config. This lets editorial iterate on packaging without running
 * migrations, while still surfacing real archive data.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import {
  THEMED_COLLECTIONS,
  getCollectionBySlug,
} from "@/lib/collections/themed-collections";
import {
  buildEpisodeInclude,
  formatEpisodeForCard,
} from "@/lib/queries/episodes";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

import { PageHero } from "@/components/ui/page-hero";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { CollectionHero } from "@/components/collections/collection-hero";
import { CollectionIcon } from "@/components/collections/collection-icon";
import { SectionBlock } from "@/components/collections/section-block";
import { SignalGrid } from "@/components/collections/signal-grid";
import { CollectionEpisodeCard } from "@/components/collections/collection-episode-card";
import { accentFor } from "@/components/collections/collection-accents";

export const revalidate = 600;

// Statically build every configured collection. (Only 3 today — cheap.)
export async function generateStaticParams() {
  return THEMED_COLLECTIONS.map((c) => ({ slug: c.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const col = getCollectionBySlug(slug);
  if (!col) {
    return buildMetadata({
      title: "Collection Not Found",
      description: "This signal pack does not exist.",
      path: `/collections/${slug}`,
    });
  }
  return buildMetadata({
    title: col.title,
    description: col.description[0] ?? col.subtitle,
    path: `/collections/${col.slug}`,
  });
}

/** Find topics whose slug OR title case-insensitively contains any matcher. */
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
    take: 24,
  });
}

/** Pull episodes tied to the resolved topic ids, newest airDate first. */
async function findRelatedEpisodes(topicIds: string[], excludeSlugs: string[]) {
  if (topicIds.length === 0) return [];
  const rows = await prisma.episode.findMany({
    where: {
      status: "published",
      slug: { notIn: excludeSlugs },
      topics: { some: { topicId: { in: topicIds } } },
    },
    include: buildEpisodeInclude(),
    orderBy: [
      { airDate: { sort: "desc", nulls: "last" } },
      { episodeNumber: "desc" },
    ],
    take: 18,
  });
  return rows.map(formatEpisodeForCard);
}

/** Fetch hand-picked pinned episodes in the order the config listed them. */
async function findPinnedEpisodes(slugs: string[]) {
  if (!slugs || slugs.length === 0) return [];
  const rows = await prisma.episode.findMany({
    where: { slug: { in: slugs } },
    include: buildEpisodeInclude(),
  });
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  return slugs
    .map((s) => bySlug.get(s))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map(formatEpisodeForCard);
}

export default async function ThemedCollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);
  if (!collection) notFound();

  // Resolve topics first; episodes filter by topic ids.
  const topics = await findRelatedTopics(collection.topicMatchers);
  const topicIds = topics.map((t) => t.id);

  const pinnedEpisodes = await findPinnedEpisodes(
    collection.featuredEpisodeSlugs ?? []
  );
  const pinnedSlugs = pinnedEpisodes.map((e) => e.slug);

  const relatedEpisodes = await findRelatedEpisodes(topicIds, pinnedSlugs);

  const a = accentFor(collection.accent);
  const related = (collection.relatedCollections ?? [])
    .map((s) => getCollectionBySlug(s))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <>
      <PageHero
        title={collection.title.toUpperCase()}
        subtitle={collection.subtitle}
        backgroundImage="/hero-bg.jpg"
      />

      <main
        id="main-content"
        className="mx-auto max-w-5xl px-4 py-12 space-y-14"
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
          <Link href="/collections" className="hover:text-accent-gold transition-colors">
            Collections
          </Link>
          <span className="mx-2">/</span>
          <span className={a.title}>{collection.title}</span>
        </nav>

        <CollectionHero
          icon={<CollectionIcon iconKey={collection.iconKey} size={48} />}
          eyebrow={collection.eyebrow}
          title={collection.title}
          subtitle={collection.subtitle}
          description={collection.description}
          accent={collection.accent}
        />

        {/* Key ideas */}
        <SectionBlock
          eyebrow="/// key_signals"
          caption="What this pack keeps pointing at."
          accent={collection.accent}
        >
          <ul className="space-y-2">
            {collection.keyIdeas.map((idea, i) => (
              <li
                key={i}
                className="flex gap-3 text-sm text-text-primary leading-relaxed"
              >
                <span
                  className={`font-mono text-[10px] ${a.eyebrow} flex-shrink-0 mt-1`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-text-muted">{idea}</span>
              </li>
            ))}
          </ul>
        </SectionBlock>

        {/* Pinned transmissions (optional) */}
        {pinnedEpisodes.length > 0 && (
          <SectionBlock
            eyebrow="/// pinned_transmissions"
            caption="Start with these. Hand-picked points of entry."
            accent={collection.accent}
          >
            <div className="space-y-3">
              {pinnedEpisodes.map((ep) => (
                <CollectionEpisodeCard
                  key={ep.id}
                  episode={ep}
                  accent={collection.accent}
                  pinned
                />
              ))}
            </div>
          </SectionBlock>
        )}

        {/* Signal chips */}
        <SectionBlock
          eyebrow="/// signals_tracked"
          caption={`The ${topics.length} topic${
            topics.length === 1 ? "" : "s"
          } this pack cross-references. Follow any signal to see every transmission tagged to it.`}
          accent={collection.accent}
        >
          <SignalGrid
            signals={topics.map((t) => ({
              title: t.title,
              slug: t.slug,
              episodeCount: t._count.episodes,
            }))}
            accent={collection.accent}
            emptyLabel="No topics match yet — try /topics to explore."
          />
        </SectionBlock>

        {/* Transmissions list */}
        <SectionBlock
          eyebrow="/// transmissions"
          caption={`${relatedEpisodes.length} episode${
            relatedEpisodes.length === 1 ? "" : "s"
          } tagged to the signals above.`}
          accent={collection.accent}
        >
          {relatedEpisodes.length === 0 ? (
            <p className="text-sm text-text-muted italic">
              No transmissions tagged yet.{" "}
              <Link href="/episodes" className={`underline ${a.title}`}>
                Browse the full archive →
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {relatedEpisodes.map((ep) => (
                <CollectionEpisodeCard
                  key={ep.id}
                  episode={ep}
                  accent={collection.accent}
                />
              ))}
            </div>
          )}
        </SectionBlock>

        {/* Quote hook */}
        {collection.quoteHook && (
          <>
            <MysticalDivider />
            <figure className="text-center max-w-2xl mx-auto space-y-3">
              <blockquote
                className={`font-display text-xl italic ${a.title} leading-relaxed`}
              >
                &ldquo;{collection.quoteHook.text}&rdquo;
              </blockquote>
              {collection.quoteHook.attribution && (
                <figcaption className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
                  — {collection.quoteHook.attribution}
                </figcaption>
              )}
            </figure>
          </>
        )}

        {/* Related surfaces */}
        {(related.length > 0 || (collection.relatedSurfaces?.length ?? 0) > 0) && (
          <>
            <MysticalDivider />
            <section className="space-y-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted text-center">
                /// follow the signal further
              </p>

              {related.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {related.map((rc) => {
                    const ra = accentFor(rc.accent);
                    return (
                      <Link
                        key={rc.slug}
                        href={`/collections/${rc.slug}`}
                        className={`group rounded-lg border ${ra.border} bg-surface p-4 transition-colors ${ra.hoverBorder} ${ra.hoverBg}`}
                      >
                        <p
                          className={`font-mono text-[10px] uppercase tracking-[0.3em] ${ra.eyebrow}`}
                        >
                          {rc.eyebrow}
                        </p>
                        <h3
                          className={`mt-1 font-display text-base font-bold ${ra.title}`}
                        >
                          {rc.title}
                        </h3>
                        <p className="mt-1 text-xs text-text-muted italic">
                          &ldquo;{rc.subtitle}&rdquo;
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}

              {(collection.relatedSurfaces?.length ?? 0) > 0 && (
                <div className="flex flex-wrap justify-center gap-3">
                  {collection.relatedSurfaces?.map((rs) => (
                    <Link
                      key={rs.href}
                      href={rs.href}
                      className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 rounded border border-border text-text-muted hover:text-accent-gold hover:border-accent-gold/40 transition-colors"
                    >
                      {rs.label} →
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Escape hatch */}
        <section className="text-center">
          <Link
            href="/collections"
            className="font-mono text-xs uppercase tracking-widest text-text-muted hover:text-accent-gold transition-colors"
          >
            ← All collections
          </Link>
        </section>
      </main>
    </>
  );
}
