import { createOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/render";

export const runtime = "nodejs";
export const alt = "The Trials — CultCodex";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createOgImage({
    eyebrow: "The trials",
    title: "Complete the rites. Unlock what's hidden.",
    subtitle: "Five trials of the Codex, each unlocking a hidden lore fragment.",
    accent: "cyan",
  });
}
