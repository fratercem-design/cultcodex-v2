// scripts/ingest/ai-categorize.ts
// Uses Claude to analyze episode titles and assign topics, series, and content descriptions
import Anthropic from "@anthropic-ai/sdk";
import { getPrisma, disconnect, slugify } from "./lib";
import { readFileSync } from "fs";

// Load API key from .env
const envFile = readFileSync(".env", "utf-8");
const apiKeyMatch = envFile.match(/ANTHROPIC_API_KEY=(.+)/);
if (!apiKeyMatch) throw new Error("No ANTHROPIC_API_KEY in .env");
const anthropic = new Anthropic({ apiKey: apiKeyMatch[1].trim() });

interface AICategorization {
  episodeId: string;
  topics: string[];
  series: string | null;
  contentType: string | null; // "livestream" | "short" | "original"
  summaryShort: string | null;
}

async function categorizeWithAI(
  episodes: { id: string; title: string; episodeNumber: number | null; airDate: Date | null; contentType: string }[],
  existingTopics: string[],
  existingSeries: string[]
): Promise<AICategorization[]> {
  const epList = episodes
    .map((e) => `ID:${e.id} | EP.${e.episodeNumber} | ${e.title} | ${e.airDate?.toISOString().slice(0, 10) ?? "unknown"} | type:${e.contentType}`)
    .join("\n");

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: `You are categorizing episodes of "Cult of Psyche" / "Psyche Awakens" — a livestreaming show featuring tarot readings, open panel discussions, cats, community drama, spirituality, and pop culture.

EXISTING TOPICS (use these when possible, create new ones only if needed):
${existingTopics.slice(0, 200).join(", ")}

EXISTING SERIES (assign if title matches a pattern):
${existingSeries.join(", ")}

For each episode below, provide:
- topics: 1-4 relevant topic tags (from existing list or new)
- series: one of the existing series names, or null
- summaryShort: a 1-sentence description (10-20 words) based on the title

Respond as a JSON array of objects with shape:
{ "id": "...", "topics": ["..."], "series": "..." or null, "summaryShort": "..." }

EPISODES:
${epList}

Return ONLY the JSON array, no explanation.`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  // Extract JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.log("  WARNING: Could not parse AI response");
    return [];
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.log("  WARNING: Invalid JSON from AI");
    return [];
  }
}

async function main() {
  const prisma = getPrisma();

  // Get all untagged episodes (no topics)
  const untagged = await prisma.episode.findMany({
    where: { topics: { none: {} } },
    select: {
      id: true,
      title: true,
      episodeNumber: true,
      airDate: true,
      contentType: true,
    },
    orderBy: { episodeNumber: "asc" },
  });

  console.log(`Untagged episodes: ${untagged.length}`);

  // Get existing data for context
  const existingTopics = await prisma.topic.findMany({ select: { id: true, title: true, slug: true } });
  const existingSeries = await prisma.series.findMany({ select: { id: true, title: true, slug: true } });

  const topicTitles = existingTopics.map((t) => t.title);
  const seriesTitles = existingSeries.map((s) => s.title);
  const topicsBySlug = new Map(existingTopics.map((t) => [t.slug, t]));
  const seriesBySlug = new Map(existingSeries.map((s) => [s.slug, s]));

  // Process in batches of 40
  const BATCH_SIZE = 40;
  let totalTopicsLinked = 0;
  let totalSeriesLinked = 0;
  let totalSummaries = 0;
  let batchNum = 0;

  for (let i = 0; i < untagged.length; i += BATCH_SIZE) {
    batchNum++;
    const batch = untagged.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${batchNum} (${batch.length} episodes, ${i + 1}-${i + batch.length} of ${untagged.length})...`);

    const results = await categorizeWithAI(batch, topicTitles, seriesTitles);

    for (const result of results) {
      // Find the episode
      const ep = batch.find((e) => e.id === result.id);
      if (!ep) continue;

      // ── Link topics ──
      if (result.topics && result.topics.length > 0) {
        for (const topicTitle of result.topics) {
          const slug = slugify(topicTitle);
          let topic = topicsBySlug.get(slug);

          if (!topic) {
            // Create new topic
            try {
              const created = await prisma.topic.create({
                data: { title: topicTitle, slug },
              });
              topic = { id: created.id, title: topicTitle, slug };
              topicsBySlug.set(slug, topic);
              topicTitles.push(topicTitle);
            } catch {
              // Likely slug conflict, try to find it
              topic = existingTopics.find(
                (t) => t.title.toLowerCase() === topicTitle.toLowerCase()
              ) ?? undefined;
              if (!topic) continue;
            }
          }

          try {
            await prisma.episodeTopic.create({
              data: { episodeId: result.id, topicId: topic.id },
            });
            totalTopicsLinked++;
          } catch {
            // Duplicate, skip
          }
        }
      }

      // ── Link series ──
      if (result.series) {
        const seriesSlug = slugify(result.series);
        const series = seriesBySlug.get(seriesSlug) ??
          existingSeries.find((s) => s.title.toLowerCase() === result.series!.toLowerCase());
        if (series) {
          try {
            await prisma.episode.update({
              where: { id: result.id },
              data: { seriesId: series.id },
            });
            totalSeriesLinked++;
          } catch {
            // Skip
          }
        }
      }

      // ── Set summary ──
      if (result.summaryShort) {
        try {
          await prisma.episode.update({
            where: { id: result.id },
            data: { summaryShort: result.summaryShort },
          });
          totalSummaries++;
        } catch {
          // Skip
        }
      }
    }

    console.log(`  Batch ${batchNum} done: ${results.length} categorized`);

    // Rate limit: wait 1s between batches
    if (i + BATCH_SIZE < untagged.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`\n=== AI Categorization Results ===`);
  console.log(`Topic links added: ${totalTopicsLinked}`);
  console.log(`Series assigned: ${totalSeriesLinked}`);
  console.log(`Summaries written: ${totalSummaries}`);

  // Final counts
  const finalWithTopics = await prisma.episode.count({ where: { topics: { some: {} } } });
  const finalWithSeries = await prisma.episode.count({ where: { seriesId: { not: null } } });
  const finalWithSummary = await prisma.episode.count({ where: { summaryShort: { not: null } } });
  const total = await prisma.episode.count();
  console.log(`\nEpisodes with topics: ${finalWithTopics}/${total}`);
  console.log(`Episodes with series: ${finalWithSeries}/${total}`);
  console.log(`Episodes with summaries: ${finalWithSummary}/${total}`);

  await disconnect();
}

main();
