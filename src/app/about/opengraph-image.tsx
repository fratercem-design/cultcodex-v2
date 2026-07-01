import { createOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/render";

export const runtime = "nodejs";
export const alt = "About CultCodex — The Cult of Psyche Archive";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createOgImage({
    eyebrow: "About",
    title: "The searchable memory of the Cult of Psyche.",
    subtitle:
      "Every transmission, transcript, guest, and fragment of lore — indexed and searchable.",
    accent: "gold",
  });
}
