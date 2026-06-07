import { createOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/render";

export const runtime = "nodejs";
export const alt = "Appear on the Show — CultCodex";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createOgImage({
    eyebrow: "Guests",
    title: "Appear on the Show",
    subtitle: "The panel is open. Here's how to get on — and make it count.",
    accent: "cyan",
  });
}
