import { createOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/render";

export const runtime = "nodejs";
export const alt = "Explore the Archive — CultCodex";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createOgImage({
    eyebrow: "Explore the archive",
    title: "The territories the Cult keeps returning to.",
    subtitle: "Tarot, consciousness, the occult, AI, astrology, spirituality, and more.",
    accent: "violet",
  });
}
