import type { Metadata } from "next";

const SITE_NAME = "CultCodex";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

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
