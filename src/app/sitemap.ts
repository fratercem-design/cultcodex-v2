import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cultcodex.me";

  const [episodes, people, lore, topics, series] = await Promise.all([
    prisma.episode.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true },
    }),
    prisma.person.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.loreEntry.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.topic.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.series.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/episodes`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/people`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/lore`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/topics`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/series`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/quotes`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/search`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/live`, changeFrequency: "daily", priority: 0.6 },
  ];

  const dynamicPages: MetadataRoute.Sitemap = [
    ...episodes.map((e) => ({
      url: `${baseUrl}/episodes/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...people.map((p) => ({
      url: `${baseUrl}/people/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
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
      priority: 0.5,
    })),
    ...series.map((s) => ({
      url: `${baseUrl}/series/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  return [...staticPages, ...dynamicPages];
}
