import { createOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/render";

export const runtime = "nodejs";
export const alt = "CultCodex — The Cult of Psyche Archive";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return await createOgImage({
    eyebrow: "Cult of Psyche archive",
    title: "CultCodex",
    subtitle: "Tarot, consciousness, the occult, AI, and open-panel chaos — nearly 3,000 transmissions, searchable, with an AI Oracle.",
    accent: "gold",
  });
}
