import { createOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/render";

export const runtime = "nodejs";
export const alt = "The Ascendant — CultCodex";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createOgImage({
    eyebrow: "Leaderboard",
    title: "The Ascendant",
    subtitle: "Who has gone deepest into the archive. The highest-ranked members of the Cult.",
    accent: "gold",
  });
}
