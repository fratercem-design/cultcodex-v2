import { createOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/render";

export const runtime = "nodejs";
export const alt = "Join the Cult — CultCodex";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return await createOgImage({
    eyebrow: "Join the cult",
    title: "There's no membership card. Only a door.",
    subtitle: "Watch live, join the open panels, support the show, and ask the Oracle.",
    accent: "gold",
  });
}
