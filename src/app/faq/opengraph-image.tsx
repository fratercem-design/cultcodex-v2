import { createOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/render";

export const runtime = "nodejs";
export const alt = "FAQ — CultCodex";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createOgImage({
    eyebrow: "FAQ",
    title: "What CultCodex is, and how it works.",
    subtitle:
      "The Oracle, AI provenance, subscriptions, corrections, and your privacy — answered.",
    accent: "cyan",
  });
}
