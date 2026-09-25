import { prisma } from "@/lib/db";
import { ARCHETYPES } from "@/lib/archetypes";
import { SYMBOLS } from "@/lib/symbols/data";
import { PILLARS } from "@/lib/pillars/pillars";
import { getFreePreviewChapterNumbers } from "@/lib/psychenomicon";
import { isThinPage } from "@/lib/seo";
import { isIndexablePerson } from "@/lib/people/noise-slugs";
import { RECOMMENDATIONS } from "@/lib/recommendations";

export interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
  images?: string[];
}

export function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://cultcodex.me";
}

const LINKED_PAGE_SELECT = {
  slug: true,
  updatedAt: true,
  _count: { select: { episodes: true } },
} as const;

/**
 * Only the free-preview chapters belong in the sitemap.
 *
 * Every other chapter serves a crawler the same ~1,450-character "This chapter
 * is sealed" shell. Submitting all 2,990 asked Google to index thousands of
 * near-duplicate pages - roughly 9% of the whole URL set, which reads as a
 * sitewide quality signal rather than a per-page one. Those chapters now carry
 * `noindex`, and listing a noindex URL in a sitemap only contradicts it.
 */
export function indexableChapterSubset<T extends { chapterNumber: number }>(
  chapters: T[],
  freeChapterNumbers: number[]
): T[] {
  const free = new Set(freeChapterNumbers);
  return chapters.filter((c) => free.has(c.chapterNumber));
}

/** Drops pages too thin to deserve indexing (see `isThinPage`). */
export function indexableLinkedSubset<T extends { _count: { episodes: number } }>(rows: T[]): T[] {
  return rows.filter((r) => !isThinPage(r._count.episodes));
}

// -- Segment loaders -------------------------------------------------------
// Each segment is fetched and serialised on its own request. That is the point
// of the split: the previous single /sitemap.xml materialised all 6,582 URLs
// (1.6 MB) in one render and intermittently returned a 500 doing it.

async function pagesSegment(): Promise<SitemapEntry[]> {
  const b = baseUrl();
  const [episodesUpdated, peopleUpdated, archiveUpdated] = await Promise.all([
    prisma.episode
      .findFirst({ where: { status: "published" }, orderBy: { updatedAt: "desc" }, select: { updatedAt: true } })
      .then((r) => r?.updatedAt)
      .catch(() => undefined),
    prisma.person
      .findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } })
      .then((r) => r?.updatedAt)
      .catch(() => undefined),
    prisma.episode
      .findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } })
      .then((r) => r?.updatedAt)
      .catch(() => undefined),
  ]);

  // Archived years, minus the newest - that one is /timeline itself.
  const yearRows = await prisma.episode
    .findMany({ where: { airDate: { not: null } }, select: { airDate: true } })
    .catch(() => []);
  const timelineYears = [
    ...new Set(
      yearRows
        .map((r) => r.airDate?.getUTCFullYear())
        .filter((y): y is number => typeof y === "number")
    ),
  ]
    .sort((a, b) => b - a)
    .slice(1);

  // A sitemap lastmod must describe the content, not the moment the file was
  // built - stamping generation time made ~79 URLs claim an hourly change they
  // never had (2026-08 audit). Genuinely static pages omit lastmod entirely,
  // which the protocol allows and crawlers prefer over a date they distrust.
  return [
    { url: b, lastModified: archiveUpdated, changeFrequency: "daily", priority: 1.0 },
    { url: `${b}/episodes`, lastModified: episodesUpdated, changeFrequency: "daily", priority: 0.9 },
    { url: `${b}/people`, lastModified: peopleUpdated, changeFrequency: "weekly", priority: 0.8 },
    { url: `${b}/lore`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${b}/topics`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${b}/series`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${b}/psychenomicon`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${b}/quotes`, lastModified: episodesUpdated, changeFrequency: "weekly", priority: 0.6 },
    { url: `${b}/search`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${b}/collections`, lastModified: archiveUpdated, changeFrequency: "monthly", priority: 0.6 },
    { url: `${b}/timeline`, lastModified: episodesUpdated, changeFrequency: "weekly", priority: 0.6 },
    { url: `${b}/timeline/explore`, lastModified: episodesUpdated, changeFrequency: "weekly", priority: 0.6 },
    { url: `${b}/start-here`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${b}/explore`, lastModified: archiveUpdated, changeFrequency: "weekly", priority: 0.8 },
    { url: `${b}/join`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${b}/youtube-members`, changeFrequency: "monthly", priority: 0.6 },
    // Listed once it has links; while empty the page is noindex.
    ...(RECOMMENDATIONS.length > 0 ? [{ url: `${b}/recommends`, changeFrequency: "monthly" as const, priority: 0.5 }] : []),
    { url: `${b}/rank`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${b}/leaderboard`, changeFrequency: "daily", priority: 0.6 },
    { url: `${b}/quests`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${b}/reports`, lastModified: peopleUpdated, changeFrequency: "weekly", priority: 0.6 },
    { url: `${b}/appear`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${b}/media-kit`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${b}/this-week`, lastModified: episodesUpdated, changeFrequency: "weekly", priority: 0.8 },
    { url: `${b}/on-this-day`, changeFrequency: "daily", priority: 0.6 },
    { url: `${b}/drama/feuds`, lastModified: peopleUpdated, changeFrequency: "weekly", priority: 0.6 },
    { url: `${b}/stats`, lastModified: archiveUpdated, changeFrequency: "weekly", priority: 0.5 },
    { url: `${b}/lexicon`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${b}/mythic-map`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${b}/oracle`, changeFrequency: "always", priority: 0.6 },
    { url: `${b}/live`, lastModified: episodesUpdated, changeFrequency: "daily", priority: 0.6 },
    { url: `${b}/tarot`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${b}/tarot/oracle`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${b}/people/the-rest`, lastModified: peopleUpdated, changeFrequency: "weekly", priority: 0.5 },
    { url: `${b}/graph`, lastModified: archiveUpdated, changeFrequency: "weekly", priority: 0.6 },
    { url: `${b}/symbols`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${b}/archetypes`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${b}/archetype-quiz`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${b}/about/methodology`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${b}/corrections`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${b}/content-policy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${b}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${b}/terms`, changeFrequency: "yearly", priority: 0.2 },
    ...timelineYears.map((y) => ({
      url: `${b}/timeline/${y}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...ARCHETYPES.map((a) => ({ url: `${b}/archetypes/${a.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...SYMBOLS.map((s) => ({ url: `${b}/symbols/${s.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...PILLARS.map((p) => ({ url: `${b}/explore/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}

async function episodesSegment(): Promise<SitemapEntry[]> {
  const b = baseUrl();
  const rows = await prisma.episode
    .findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } })
    .catch(() => []);
  return rows.map((e) => ({
    url: `${b}/episodes/${e.slug}`,
    lastModified: e.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
}

async function peopleSegment(): Promise<SitemapEntry[]> {
  const b = baseUrl();
  const rows = await prisma.person
    .findMany({
      select: {
        slug: true,
        displayName: true,
        personType: true,
        updatedAt: true,
        _count: { select: { guestAppearances: true } },
      },
    })
    .catch(() => []);
  return rows.filter((p) => isIndexablePerson({
    slug: p.slug,
    displayName: p.displayName,
    personType: p.personType,
    appearanceCount: p._count.guestAppearances,
  })).map((p) => ({
    url: `${b}/people/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
}

async function loreSegment(): Promise<SitemapEntry[]> {
  const b = baseUrl();
  const rows = await prisma.loreEntry
    .findMany({ select: LINKED_PAGE_SELECT })
    .then(indexableLinkedSubset)
    .catch(() => []);
  return rows.map((l) => ({
    url: `${b}/lore/${l.slug}`,
    lastModified: l.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
}

async function topicsSegment(): Promise<SitemapEntry[]> {
  const b = baseUrl();
  const rows = await prisma.topic
    .findMany({ select: LINKED_PAGE_SELECT })
    .then(indexableLinkedSubset)
    .catch(() => []);
  return rows.map((t) => ({
    url: `${b}/topics/${t.slug}`,
    lastModified: t.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
}

async function seriesSegment(): Promise<SitemapEntry[]> {
  const b = baseUrl();
  const rows = await prisma.series.findMany({ select: { slug: true, updatedAt: true } }).catch(() => []);
  return rows.map((s) => ({
    url: `${b}/series/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));
}

async function chaptersSegment(): Promise<SitemapEntry[]> {
  const b = baseUrl();
  const [chapters, free] = await Promise.all([
    prisma.psychenomiconChapter
      .findMany({ where: { status: "stable" }, select: { slug: true, updatedAt: true, chapterNumber: true } })
      .catch(() => []),
    getFreePreviewChapterNumbers().catch(() => [] as number[]),
  ]);
  return indexableChapterSubset(chapters, free).map((c) => ({
    url: `${b}/psychenomicon/chapters/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
}

export const SITEMAP_SEGMENTS: Record<string, () => Promise<SitemapEntry[]>> = {
  pages: pagesSegment,
  episodes: episodesSegment,
  people: peopleSegment,
  lore: loreSegment,
  topics: topicsSegment,
  series: seriesSegment,
  chapters: chaptersSegment,
};

export function isSitemapSegment(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(SITEMAP_SEGMENTS, name);
}

/** Slugs can legally contain an ampersand; unescaped it makes the XML unparseable. */
export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderUrlSet(entries: SitemapEntry[]): string {
  const body = entries
    .map((e) => {
      const parts = [`    <loc>${xmlEscape(e.url)}</loc>`];
      if (e.lastModified) parts.push(`    <lastmod>${e.lastModified.toISOString()}</lastmod>`);
      if (e.changeFrequency) parts.push(`    <changefreq>${e.changeFrequency}</changefreq>`);
      if (e.priority != null) parts.push(`    <priority>${e.priority.toFixed(1)}</priority>`);
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function renderSitemapIndex(locs: Array<{ url: string; lastModified?: Date }>): string {
  const body = locs
    .map((l) => {
      const parts = [`    <loc>${xmlEscape(l.url)}</loc>`];
      if (l.lastModified) parts.push(`    <lastmod>${l.lastModified.toISOString()}</lastmod>`);
      return `  <sitemap>\n${parts.join("\n")}\n  </sitemap>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}
