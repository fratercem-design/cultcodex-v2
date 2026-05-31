import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { ARCHETYPES } from "@/lib/archetypes";

// Regenerate at most once per hour
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cultcodex.me";

  const [episodes, people, lore, topics, series, psychenomiconChapters] = await Promise.all([
    prisma.episode.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true, thumbnailUrl: true },
    }),
    prisma.person.findMany({ select: { slug: true, updatedAt: true, avatarUrl: true } }),
    prisma.loreEntry.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.topic.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.series.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.psychenomiconChapter.findMany({
      where: { status: "stable" },
      select: { slug: true, updatedAt: true },
    }),
  ]);

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
    { url: `${baseUrl}/start-here`,           lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/this-week`,            lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/stats`,                lastModified: now, changeFrequency: "weekly",  priority: 0.5 },
    { url: `${baseUrl}/lexicon`,              lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/mythic-map`,           lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/oracle`,               lastModified: now, changeFrequency: "always",  priority: 0.6 },
    { url: `${baseUrl}/live`,                 lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${baseUrl}/tarot`,                lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/members`,              lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${baseUrl}/graph`,                lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${baseUrl}/symbols`,              lastModified: now, changeFrequency: "monthly", priority: 0.7 },
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
    ...psychenomiconChapters.map((c) => ({
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
  ];

  const archetypePages: MetadataRoute.Sitemap = ARCHETYPES.map((a) => ({
    url: `${baseUrl}/archetypes/${a.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...dynamicPages, ...archetypePages];
}
