import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { ARCHETYPES } from "@/lib/archetypes";
import { SYMBOLS } from "@/lib/symbols/data";
import { PILLARS } from "@/lib/pillars/pillars";
import { getFreePreviewChapterNumbers } from "@/lib/psychenomicon";

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cultcodex.me";

  const [episodes, people, lore, topics, series, psychenomiconChapters, freeChapterNumbers] = await Promise.all([
    prisma.episode.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true, thumbnailUrl: true },
    }).catch(() => []),
    prisma.person.findMany({ select: { slug: true, updatedAt: true, avatarUrl: true } }).catch(() => []),
    prisma.loreEntry.findMany({ select: { slug: true, updatedAt: true } }).catch(() => []),
    prisma.topic.findMany({ select: { slug: true, updatedAt: true } }).catch(() => []),
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

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                           lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${baseUrl}/episodes`,             lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${baseUrl}/people`,               lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/lore`,                 lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/topics`,               lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${baseUrl}/series`,               lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${baseUrl}/psychenomicon`,        lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${baseUrl}/quotes`,               lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${baseUrl}/search`,               lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/collections`,          lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/timeline`,             lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${baseUrl}/timeline/explore`,     lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${baseUrl}/start-here`,           lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/explore`,              lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/join`,                 lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/rank`,                 lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/leaderboard`,          lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${baseUrl}/quests`,               lastModified: now, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${baseUrl}/reports`,              lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${baseUrl}/appear`,               lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/media-kit`,            lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/this-week`,            lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/stats`,                lastModified: now, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${baseUrl}/lexicon`,              lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/mythic-map`,           lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/oracle`,               lastModified: now, changeFrequency: "always",  priority: 0.6 },
    { url: `${baseUrl}/live`,                 lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${baseUrl}/tarot`,                lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/tarot/oracle`,         lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${baseUrl}/people/the-rest`,      lastModified: now, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${baseUrl}/members`,              lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${baseUrl}/graph`,                lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${baseUrl}/symbols`,              lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/archetypes`,           lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/archetype-quiz`,       lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/about/methodology`,    lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/corrections`,          lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/content-policy`,       lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/privacy`,              lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
    { url: `${baseUrl}/terms`,                lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
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
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...SYMBOLS.map((s) => ({
      url: `${baseUrl}/symbols/${s.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    // SEO pillar / authority pages
    ...PILLARS.map((p) => ({
      url: `${baseUrl}/explore/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  return [...staticPages, ...dynamicPages];
}
