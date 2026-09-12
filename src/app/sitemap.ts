import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { ARCHETYPES } from "@/lib/archetypes";
import { SYMBOLS } from "@/lib/symbols/data";
import { PILLARS } from "@/lib/pillars/pillars";
import { getFreePreviewChapterNumbers } from "@/lib/psychenomicon";
import { isThinPage } from "@/lib/seo";

// Regenerate at most once per hour
export const revalidate = 3600;

/**
 * Only the free-preview chapters belong in the sitemap.
 *
 * Every other chapter serves a crawler the same ~1,450-character "This chapter
 * is sealed" shell. Submitting all 2,990 asked Google to index thousands of
 * near-duplicate pages — roughly 9% of the site's whole URL set, which reads as
 * a sitewide quality signal rather than a per-page one. Those chapters now
 * carry `noindex`, and listing a noindex URL in a sitemap only contradicts it.
 *
 * Exported so the rule is unit-testable without standing up the database.
 */
export function indexableChapterSubset<T extends { chapterNumber: number }>(
  chapters: T[],
  freeChapterNumbers: number[]
): T[] {
  const free = new Set(freeChapterNumbers);
  return chapters.filter((c) => free.has(c.chapterNumber));
}

/**
 * Same idea for auto-generated lore and topic pages: only the ones with enough
 * linked episodes to carry real content belong in the sitemap.
 *
 * Before this, every lore entry (~10.6k) and topic (~13.9k) was listed — 24k of
 * the ~29k submitted URLs — and most of them render a title plus the site
 * chrome, nothing a crawler can rank. The threshold is THIN_PAGE_MIN_EPISODES,
 * shared with the per-page `robots` in /lore/[slug] and /topics/[slug] so a URL
 * is never in the sitemap while its own page says noindex.
 */
export function indexableLinkedSubset<T extends { _count: { episodes: number } }>(rows: T[]): T[] {
  return rows.filter((r) => !isThinPage(r._count.episodes));
}

const LINKED_PAGE_SELECT = {
  slug: true,
  updatedAt: true,
  _count: { select: { episodes: true } },
} as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cultcodex.me";

  const [episodes, people, lore, topics, series, psychenomiconChapters, freeChapterNumbers] = await Promise.all([
    prisma.episode.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true, thumbnailUrl: true },
    }).catch(() => []),
    prisma.person.findMany({ select: { slug: true, updatedAt: true, avatarUrl: true } }).catch(() => []),
    prisma.loreEntry.findMany({ select: LINKED_PAGE_SELECT }).then(indexableLinkedSubset).catch(() => []),
    prisma.topic.findMany({ select: LINKED_PAGE_SELECT }).then(indexableLinkedSubset).catch(() => []),
    prisma.series.findMany({ select: { slug: true, updatedAt: true } }).catch(() => []),
    prisma.psychenomiconChapter.findMany({
      where: { status: "stable" },
      select: { slug: true, updatedAt: true, chapterNumber: true },
    }).catch(() => []),
    getFreePreviewChapterNumbers().catch(() => [] as number[]),
  ]);

  const indexableChapters = indexableChapterSubset(psychenomiconChapters, freeChapterNumbers);

  // Member pages are optional — schema drift on CodexUser columns must not break the build
  let memberPages: Array<{ codexSlug: string | null; updatedAt: Date }> = [];
  try {
    memberPages = await prisma.codexUser.findMany({
      where: {
        isPublicMember: true,
        codexPagePublic: true,
        codexSlug: { not: null },
        OR: [
          { role: "admin" },
          { subscriptionStatus: "active" },
          { isLifetimeMember: true },
        ],
      },
      select: { codexSlug: true, updatedAt: true },
    });
  } catch {
    // column not yet migrated — skip member pages in sitemap
  }

  /** Newest updatedAt in a collection, or undefined when empty. A sitemap
   *  lastmod must describe the content, not the moment the sitemap was built —
   *  stamping generation time made ~79 URLs claim an hourly change they never
   *  had (2026-08 audit). Index pages inherit their collection's newest date;
   *  genuinely static pages omit lastmod entirely, which the protocol allows
   *  and crawlers prefer over a date they will learn to distrust. */
  const latest = (rows: Array<{ updatedAt: Date }>): Date | undefined =>
    rows.reduce<Date | undefined>(
      (max, r) => (!max || r.updatedAt > max ? r.updatedAt : max),
      undefined
    );

  const episodesUpdated = latest(episodes);
  const peopleUpdated = latest(people);
  const loreUpdated = latest(lore);
  const topicsUpdated = latest(topics);
  const seriesUpdated = latest(series);
  const chaptersUpdated = latest(psychenomiconChapters);
  const membersUpdated = latest(memberPages);
  const archiveUpdated = latest(
    [
      episodesUpdated, peopleUpdated, loreUpdated,
      topicsUpdated, seriesUpdated, chaptersUpdated,
    ]
      .filter((d): d is Date => Boolean(d))
      .map((updatedAt) => ({ updatedAt }))
  );


  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                           lastModified: archiveUpdated, changeFrequency: "daily",   priority: 1.0 },
    { url: `${baseUrl}/episodes`,             lastModified: episodesUpdated, changeFrequency: "daily",   priority: 0.9 },
    { url: `${baseUrl}/people`,               lastModified: peopleUpdated, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/lore`,                 lastModified: loreUpdated, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/topics`,               lastModified: topicsUpdated, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${baseUrl}/series`,               lastModified: seriesUpdated, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${baseUrl}/psychenomicon`,        lastModified: chaptersUpdated, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${baseUrl}/quotes`,               lastModified: episodesUpdated, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${baseUrl}/search`,               changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/collections`,          lastModified: archiveUpdated, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/timeline`,             lastModified: episodesUpdated, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${baseUrl}/timeline/explore`,     lastModified: episodesUpdated, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${baseUrl}/start-here`,           changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/explore`,              lastModified: archiveUpdated, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/join`,                 changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/rank`,                 changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/leaderboard`,          lastModified: membersUpdated, changeFrequency: "daily",   priority: 0.6 },
    { url: `${baseUrl}/quests`,               changeFrequency: "weekly",  priority: 0.5 },
    { url: `${baseUrl}/reports`,              lastModified: peopleUpdated, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${baseUrl}/appear`,               changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/media-kit`,            changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/this-week`,            lastModified: episodesUpdated, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/stats`,                lastModified: archiveUpdated, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${baseUrl}/lexicon`,              changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/mythic-map`,           changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/oracle`,               changeFrequency: "always",  priority: 0.6 },
    { url: `${baseUrl}/live`,                 lastModified: episodesUpdated, changeFrequency: "daily",   priority: 0.6 },
    { url: `${baseUrl}/tarot`,                changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/tarot/oracle`,         changeFrequency: "weekly",  priority: 0.7 },
    { url: `${baseUrl}/people/the-rest`,      lastModified: peopleUpdated, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${baseUrl}/members`,              lastModified: membersUpdated, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${baseUrl}/graph`,                lastModified: archiveUpdated, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${baseUrl}/symbols`,              changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/archetypes`,           changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/archetype-quiz`,       changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/about/methodology`,    changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/corrections`,          changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/content-policy`,       changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/privacy`,              changeFrequency: "yearly",  priority: 0.2 },
    { url: `${baseUrl}/terms`,                changeFrequency: "yearly",  priority: 0.2 },
  ];

  const dynamicPages: MetadataRoute.Sitemap = [
    ...episodes.map((e) => ({
      url: `${baseUrl}/episodes/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      ...(e.thumbnailUrl ? { images: [e.thumbnailUrl] } : {}),
    })),
    ...people.map((p) => ({
      url: `${baseUrl}/people/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      ...(p.avatarUrl ? { images: [p.avatarUrl] } : {}),
    })),
    ...lore.map((l) => ({
      url: `${baseUrl}/lore/${l.slug}`,
      lastModified: l.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...topics.map((t) => ({
      url: `${baseUrl}/topics/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...series.map((s) => ({
      url: `${baseUrl}/series/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...indexableChapters.map((c) => ({
      url: `${baseUrl}/psychenomicon/chapters/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...memberPages
      .filter((m) => m.codexSlug)
      .map((m) => ({
        url: `${baseUrl}/members/${m.codexSlug}`,
        lastModified: m.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
    // Static archetype and symbol pages (force-static, no DB)
    ...ARCHETYPES.map((a) => ({
      url: `${baseUrl}/archetypes/${a.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...SYMBOLS.map((s) => ({
      url: `${baseUrl}/symbols/${s.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    // SEO pillar / authority pages
    ...PILLARS.map((p) => ({
      url: `${baseUrl}/explore/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  return [...staticPages, ...dynamicPages];
}
