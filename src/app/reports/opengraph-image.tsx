import { createOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/render";

export const runtime = "nodejs";
export const alt = "Codex Reports — CultCodex";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return await createOgImage({
    eyebrow: "Intelligence on demand",
    title: "Codex Reports",
    subtitle: "Guest Intelligence Reports, conflict maps, and pattern analyses from the full archive.",
    accent: "gold",
  });
}
