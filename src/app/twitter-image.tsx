import { getCounts, fmtEpisodeCount } from "@/lib/queries/stats";
import { createOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/render";

export const runtime = "nodejs";
export const alt = "CultCodex — The Cult of Psyche Archive";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const counts = await getCounts().catch(() => null);
  return await createOgImage({
    eyebrow: "Cult of Psyche archive",
    title: "CultCodex",
    subtitle: `Tarot, consciousness, the occult, AI, and open-panel chaos — ${fmtEpisodeCount(counts?.episodes ?? 0)} transmissions, searchable, with an AI Oracle.`,
    accent: "gold",
  });
}
