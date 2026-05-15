import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { getPrisma, disconnect } from "./ingest/lib";

const UNMATCHED_PATH = path.join(__dirname, "unmatched-episodes.txt");

const SERIES_SLUGS = [
  "psyche-awakens-tarot", "open-panel", "midnight-madness", "weekday-streams",
  "troll-tribunal", "classic-cult-of-psyche", "music-videos",
  "journey-through-the-tarot", "baital-pachchisi-tales", "the-golden-ass",
  "quantum-scary-tales", "uncle-wiggly-stories", "secrets-of-the-mahavidyas",
  "64-divine-arts", "astrology-deep-dives", "mythology-and-lore",
  "trollopedia", "shorts-and-clips",
];

const PROMPT = `You are classifying Cult of Psyche YouTube episodes into series.

Available series slugs: ${SERIES_SLUGS.join(", ")}
If none fit, use "NONE".

Content types: livestream, original, short, clip

For each episode, output ONE line: episodeNumber|seriesSlug|contentType

Rules:
- Music videos, songs, dedicated tracks → music-videos / original
- Tarot reading streams, panel hangouts → appropriate live series / livestream
- Short-form content (#shorts, promo, TikTok) → shorts-and-clips / short
- Mythology retellings → mythology-and-lore / original
- Astrology/horoscope content → astrology-deep-dives / original
- Goddess deep dives (Hindu) → secrets-of-the-mahavidyas / original
- Drama/roast/panel clips → NONE / clip if short, livestream if long
- Standalone vlogs, rants, stories → NONE / original
- If unclear, use NONE / original

Episodes to classify:
`;

async function main() {
  const prisma = getPrisma();
  const client = new Anthropic();

  const lines = fs.readFileSync(UNMATCHED_PATH, "utf-8").trim().split("\n");
  console.log(`${lines.length} unmatched episodes to classify`);

  // Load series map
  const allSeries = await prisma.series.findMany({ select: { id: true, slug: true } });
  const seriesMap = new Map(allSeries.map((s) => [s.slug, s.id]));

  // Process in batches of 50
  const BATCH = 50;
  let classified = 0;

  for (let i = 0; i < lines.length; i += BATCH) {
    const batch = lines.slice(i, i + BATCH);
    const batchText = batch.join("\n");

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: PROMPT + batchText }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const resultLines = text.trim().split("\n");

    for (const line of resultLines) {
      const parts = line.split("|");
      if (parts.length < 3) continue;
      const [epNumStr, seriesSlug, contentType] = parts;
      const epNum = parseInt(epNumStr.trim(), 10);
      if (isNaN(epNum)) continue;

      const validContentTypes = ["livestream", "original", "short", "clip"];
      const ct = contentType.trim();
      if (!validContentTypes.includes(ct)) continue;

      const data: any = { contentType: ct };
      if (seriesSlug.trim() !== "NONE") {
        const seriesId = seriesMap.get(seriesSlug.trim());
        if (seriesId) data.seriesId = seriesId;
      }

      await prisma.episode.updateMany({
        where: { episodeNumber: epNum },
        data,
      });
      classified++;
    }

    console.log(`  Batch ${Math.floor(i / BATCH) + 1}: classified ${resultLines.length} episodes`);
    // Rate limit pause
    await new Promise((r) => setTimeout(r, 5000));
  }

  console.log(`\nTotal classified: ${classified}`);
  await disconnect();
}

main();
