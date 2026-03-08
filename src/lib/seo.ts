import type { Metadata } from "next";

const SITE_NAME = "CultCodex";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

type BuildMetadataInput = {
  title: string;
  description?: string | null;
  path: string;
};

export function buildMetadata({
  title,
  description,
  path,
}: BuildMetadataInput): Metadata {
  const cleanDescription =
    description?.trim() || "The matrix archive of the Cult of Psyche.";

  const url = `${SITE_URL}${path}`;

  return {
    title: `${title} | ${SITE_NAME}`,
    description: cleanDescription,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description: cleanDescription,
      url,
      siteName: SITE_NAME,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description: cleanDescription,
    },
  };
}
