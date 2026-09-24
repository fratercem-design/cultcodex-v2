import { createOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/render";

export const runtime = "nodejs";
export const alt = "Media Kit — CultCodex";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return await createOgImage({
    eyebrow: "Press",
    title: "Media Kit",
    subtitle: "Everything you need to write about the Psycheverse — facts, brand language, and contact.",
    accent: "gold",
  });
}
