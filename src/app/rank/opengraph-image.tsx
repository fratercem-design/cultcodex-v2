import { createOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/render";

export const runtime = "nodejs";
export const alt = "The Ranks — CultCodex";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return await createOgImage({
    eyebrow: "Rank",
    title: "Initiate · Adept · Oracle · Archivist",
    subtitle: "Rise through the ranks of the Cult. Your codex score grows as you go deeper.",
    accent: "violet",
  });
}
