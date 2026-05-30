import type { Metadata } from "next";

const SITE_NAME = "CultCodex";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://cultcodex.me";

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
