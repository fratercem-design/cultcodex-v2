import { fmtEpisodeCount } from "@/lib/queries/stats";
import type { Metadata } from "next";

const SITE_NAME = "CultCodex";
const PRODUCTION_URL = "https://cultcodex.me";
// Guard against localhost leaking into canonical/OG URLs via a build-time env var.
// If NEXT_PUBLIC_SITE_URL is unset, empty, OR points to localhost/127.0.0.1, fall
// back to prod. Exported as the single source of truth for absolute site URLs —
// import this rather than reading NEXT_PUBLIC_SITE_URL directly.
export const SITE_URL = (() => {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!url || /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(url)) return PRODUCTION_URL;
  return url;
})();

/**
 * Minimum linked episodes for an auto-generated topic or lore page to be worth
 * indexing. Below this the page is little more than the site chrome plus a
 * title — ~24k such pages were in the sitemap, outnumbering the substantive
 * episode and people pages 5:1 and diluting crawl budget. Pages under the
 * threshold stay live and linked (`follow`), they just stop competing for
 * index slots. Shared by the sitemap and the per-page metadata so the two
 * never disagree about what is indexable.
 */
export const THIN_PAGE_MIN_EPISODES = 2;

export function isThinPage(episodeCount: number): boolean {
  return episodeCount < THIN_PAGE_MIN_EPISODES;
}

/** `robots` metadata for a generated page: noindex when thin, default otherwise. */
export function thinPageRobots(episodeCount: number): Pick<Metadata, "robots"> {
  return isThinPage(episodeCount) ? { robots: { index: false, follow: true } } : {};
}

/**
 * Serialize an object for embedding in a <script type="application/ld+json">.
 * Escapes `<`, `>` and `&` to their \uXXXX forms so a value containing
 * `</script>` (or other HTML) cannot break out of the script block — plain
 * JSON.stringify does NOT do this, which would be an XSS vector for any
 * user/CMS-sourced field. The escapes remain valid JSON.
 */
export function jsonLdScript(obj: Record<string, unknown>): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** Convert a "HH:MM:SS" / "MM:SS" duration string to ISO-8601 (e.g. PT1H2M3S). */
function toIso8601Duration(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const parts = raw.trim().split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return undefined;
  let h = 0, m = 0, s = 0;
  if (parts.length === 3) [h, m, s] = parts;
  else if (parts.length === 2) [m, s] = parts;
  else if (parts.length === 1) [s] = parts;
  else return undefined;
  if (h === 0 && m === 0 && s === 0) return undefined;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s ? `${s}S` : ""}`;
}

export interface EpisodeJsonLdInput {
  title: string;
  slug: string;
  description?: string | null;
  airDate?: Date | null;
  thumbnailUrl?: string | null;
  youtubeVideoId?: string | null;
  duration?: string | null;
  transcript?: string | null;
}

/**
 * Build a schema.org VideoObject for an episode page. Surfaced to Google so
 * episodes can appear in video search results and rich snippets.
 * Returns a plain object intended for a <script type="application/ld+json">.
 */
export function episodeJsonLd(ep: EpisodeJsonLdInput): Record<string, unknown> {
  const url = `${SITE_URL}/episodes/${ep.slug}`;
  const isoDuration = toIso8601Duration(ep.duration);

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: ep.title,
    description:
      ep.description?.trim() || `An episode from the Cult of Psyche archive: ${ep.title}.`,
    ...(ep.thumbnailUrl ? { thumbnailUrl: [ep.thumbnailUrl] } : {}),
    ...(ep.airDate ? { uploadDate: ep.airDate.toISOString() } : {}),
    ...(isoDuration ? { duration: isoDuration } : {}),
    ...(ep.transcript ? { transcript: ep.transcript } : {}),
    ...(ep.youtubeVideoId
      ? {
          embedUrl: `https://www.youtube.com/embed/${ep.youtubeVideoId}`,
          contentUrl: `https://www.youtube.com/watch?v=${ep.youtubeVideoId}`,
        }
      : {}),
    url,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

type BuildMetadataInput = {
  title: string;
  description?: string | null;
  path: string;
  /** Optional path or URL to an OG image. Path-relative is normalized to SITE_URL. */
  image?: string | null;
};

/**
 * Build a schema.org BreadcrumbList for a page.
 * The last item should have url = the current page URL.
 * All items except the current page should have a url.
 */
export interface BreadcrumbItem {
  name: string;
  url?: string;
}

export function breadcrumbListJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

/**
 * Convenience for the common Home > Section > Page detail breadcrumb.
 * Builds absolute URLs from SITE_URL so callers pass paths only.
 */
export function detailBreadcrumbJsonLd(
  section: { name: string; path: string },
  page: { name: string; path: string }
): Record<string, unknown> {
  return breadcrumbListJsonLd([
    { name: "Home", url: SITE_URL },
    { name: section.name, url: `${SITE_URL}${section.path}` },
    { name: page.name, url: `${SITE_URL}${page.path}` },
  ]);
}

export function organizationJsonLd(episodeCount?: number): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    // 512x512, 36 KB. /logo.jpg is a 307 KB source kept for next/image, which
    // downscales it per use. Raw references like this one and the magic-link
    // email pay the full weight, so they point at the derived file instead.
    logo: `${SITE_URL}/logo-512.jpg`,
    description:
      `The definitive intelligence archive for the Cult of Psyche. ${fmtEpisodeCount(episodeCount ?? 0)} episodes indexed with full transcripts, AI psychological breakdowns, guest profiles, and behavioral pattern maps.`,
    sameAs: ["https://www.youtube.com/@CultofPsyche"],
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqPageJsonLd(items: FaqItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}


export interface ArticleJsonLdInput {
  title: string;
  description?: string | null;
  slug: string;
  path: string;
  datePublished?: Date | null;
  dateModified?: Date | null;
  image?: string | null;
  authorName?: string;
}

/** Build a schema.org Article for report and lore pages. */
export function articleJsonLd(a: ArticleJsonLdInput): Record<string, unknown> {
  const url = `${SITE_URL}${a.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description?.trim() || `${a.title} — CultCodex archive entry.`,
    url,
    ...(a.image ? { image: a.image.startsWith("http") ? a.image : `${SITE_URL}${a.image}` } : {}),
    ...(a.datePublished ? { datePublished: a.datePublished.toISOString() } : {}),
    ...(a.dateModified ? { dateModified: a.dateModified.toISOString() } : {}),
    author: {
      "@type": a.authorName ? "Person" : "Organization",
      name: a.authorName ?? SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  };
}

export interface ItemListEntry {
  name: string;
  /** Path (e.g. "/people/alice") or absolute URL. */
  path: string;
}

/**
 * Build a schema.org CollectionPage wrapping an ItemList for index/listing
 * pages (people, topics, quotes, lore, reports). Surfaces the listing as a
 * structured collection so crawlers understand it indexes many entities
 * rather than being a single document. `items` should be the visible set on
 * the page — keep it bounded (the first page) rather than the whole corpus.
 */
export function collectionPageJsonLd(opts: {
  name: string;
  description?: string | null;
  path: string;
  items: ItemListEntry[];
}): Record<string, unknown> {
  const url = `${SITE_URL}${opts.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    ...(opts.description?.trim() ? { description: opts.description.trim() } : {}),
    url,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: opts.items.length,
      itemListElement: opts.items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: item.path.startsWith("http") ? item.path : `${SITE_URL}${item.path}`,
      })),
    },
  };
}

export function buildMetadata({
  title,
  description,
  path,
  image,
}: BuildMetadataInput): Metadata {
  const cleanDescription =
    description?.trim() || "The living archive of the Cult of Psyche.";

  const url = `${SITE_URL}${path}`;
  const imageUrl = image
    ? image.startsWith("http")
      ? image
      : `${SITE_URL}${image}`
    : undefined;

  const images = imageUrl
    ? [{ url: imageUrl, width: 1200, height: 630 }]
    : undefined;

  return {
    title: `${title} — ${SITE_NAME}`,
    description: cleanDescription,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} — ${SITE_NAME}`,
      description: cleanDescription,
      url,
      siteName: SITE_NAME,
      type: "article",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${SITE_NAME}`,
      description: cleanDescription,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}
