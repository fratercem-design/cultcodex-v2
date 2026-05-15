// scripts/ingest/import-episodes.ts
import { readFileSync } from "fs";
import { getPrisma, disconnect, slugify, buildSearchText } from "./lib";
import { EpisodeRowSchema } from "./schemas";
import { ContentStatus } from "../../src/generated/prisma/client";
import { z } from "zod";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/ingest/import-episodes.ts <file.json>");
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const rows = z.array(EpisodeRowSchema).parse(raw);
  const prisma = getPrisma();

  let created = 0;
  let updated = 0;
  const warnings: string[] = [];

  for (const row of rows) {
    const slug = slugify(row.title);
    const searchText = buildSearchText(
      row.title,
      row.summaryShort,
      row.summaryLong,
      ...row.guests,
      ...row.topics
    );

    // Resolve series
    let seriesId: string | null = null;
    if (row.series) {
      const series = await prisma.series.findUnique({
        where: { slug: slugify(row.series) },
      });
      if (series) seriesId = series.id;
      else warnings.push(`Series "${row.series}" not found for "${row.title}"`);
    }

    // Upsert episode
    const episode = await prisma.episode.upsert({
      where: { slug },
      create: {
        title: row.title,
        slug,
        episodeNumber: row.episodeNumber ?? null,
        airDate: row.airDate ? new Date(row.airDate) : null,
        duration: row.duration ?? null,
        youtubeVideoId: row.youtubeVideoId ?? null,
        thumbnailUrl: row.thumbnailUrl ?? null,
        summaryShort: row.summaryShort ?? null,
        summaryLong: row.summaryLong ?? null,
        cutOfPsyche: row.cutOfPsyche ?? null,
        searchText,
        status: ContentStatus.published,
        seriesId,
      },
      update: {
        title: row.title,
        episodeNumber: row.episodeNumber ?? undefined,
        airDate: row.airDate ? new Date(row.airDate) : undefined,
        duration: row.duration ?? undefined,
        youtubeVideoId: row.youtubeVideoId ?? undefined,
        thumbnailUrl: row.thumbnailUrl ?? undefined,
        summaryShort: row.summaryShort ?? undefined,
        summaryLong: row.summaryLong ?? undefined,
        cutOfPsyche: row.cutOfPsyche ?? undefined,
        searchText,
        seriesId: seriesId ?? undefined,
      },
    });

    const isNew =
      Math.abs(episode.createdAt.getTime() - episode.updatedAt.getTime()) < 1000;
    if (isNew) created++;
    else updated++;

    // Link guests (clear + re-create for idempotence)
    if (row.guests.length > 0) {
      await prisma.episodeGuest.deleteMany({
        where: { episodeId: episode.id },
      });
      for (const name of row.guests) {
        const person = await prisma.person.findUnique({
          where: { slug: slugify(name) },
        });
        if (person) {
          await prisma.episodeGuest.create({
            data: { episodeId: episode.id, personId: person.id },
          });
        } else {
          warnings.push(`Guest "${name}" not found for "${row.title}"`);
        }
      }
    }

    // Link topics (clear + re-create for idempotence)
    if (row.topics.length > 0) {
      await prisma.episodeTopic.deleteMany({
        where: { episodeId: episode.id },
      });
      for (const name of row.topics) {
        const topic = await prisma.topic.findUnique({
          where: { slug: slugify(name) },
        });
        if (topic) {
          await prisma.episodeTopic.create({
            data: { episodeId: episode.id, topicId: topic.id },
          });
        } else {
          warnings.push(`Topic "${name}" not found for "${row.title}"`);
        }
      }
    }

    // Link lore (clear + re-create for idempotence)
    if (row.lore.length > 0) {
      await prisma.episodeLore.deleteMany({
        where: { episodeId: episode.id },
      });
      for (const name of row.lore) {
        const lore = await prisma.loreEntry.findUnique({
          where: { slug: slugify(name) },
        });
        if (lore) {
          await prisma.episodeLore.create({
            data: { episodeId: episode.id, loreEntryId: lore.id },
          });
        } else {
          warnings.push(`Lore "${name}" not found for "${row.title}"`);
        }
      }
    }
  }

  console.log(`Episodes: ${created} created, ${updated} updated (${rows.length} total)`);
  if (warnings.length > 0) {
    console.warn(`\nWarnings (${warnings.length}):`);
    for (const w of warnings) console.warn(`  - ${w}`);
  }
  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
