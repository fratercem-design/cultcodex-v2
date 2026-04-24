/**
 * Targeted importer: only processes enrichment files for episodes that are
 * still unenriched in the DB. Avoids re-running the full 1500+ file import.
 *
 * Usage: npx tsx scripts/_import-new-enrichments.ts
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { getPrisma, disconnect } from "./ingest/lib";
import { EnrichmentResultSchema } from "./enrich/schemas";
import { loadEnrichmentFiles } from "./enrich/import-enriched";

// We need importEnrichment but it isn't exported — re-implement the same
// upsert logic here against the same schemas to keep this file self-contained.
import { slugify } from "./ingest/lib";

const DATA_DIR = path.join(__dirname, "enrich", "data");

async function importOne(
  prisma: ReturnType<typeof getPrisma>,
  slug: string,
  data: ReturnType<typeof EnrichmentResultSchema.parse>
): Promise<void> {
  const episode = await prisma.episode.findUnique({ where: { slug } });
  if (!episode) throw new Error(`Episode not found for slug "${slug}"`);

  await prisma.episode.update({
    where: { id: episode.id },
    data: {
      summaryShort: data.summaryShort,
      summaryLong: data.summaryLong,
      cutOfPsyche: data.cutOfPsyche ?? "",
    },
  });

  if (data.guests.length > 0) {
    await prisma.episodeGuest.deleteMany({ where: { episodeId: episode.id } });
    for (const guest of data.guests) {
      const personSlug = slugify(guest.name);
      const person = await prisma.person.upsert({
        where: { slug: personSlug },
        create: {
          displayName: guest.name,
          slug: personSlug,
          personType: guest.personType as any,
          shortBio: guest.shortBio || null,
        },
        update: {
          personType: guest.personType as any,
          shortBio: guest.shortBio || undefined,
        },
      });
      await prisma.episodeGuest.create({
        data: { episodeId: episode.id, personId: person.id },
      });
    }
  }

  if (data.topics.length > 0) {
    await prisma.episodeTopic.deleteMany({ where: { episodeId: episode.id } });
    for (const topicTitle of data.topics) {
      const topicSlug = slugify(topicTitle);
      const topic = await prisma.topic.upsert({
        where: { slug: topicSlug },
        create: { title: topicTitle, slug: topicSlug },
        update: {},
      });
      await prisma.episodeTopic.create({
        data: { episodeId: episode.id, topicId: topic.id },
      });
    }
  }

  if (data.lore.length > 0) {
    await prisma.episodeLore.deleteMany({ where: { episodeId: episode.id } });
    for (const lore of data.lore) {
      const loreSlug = slugify(lore.title);
      const loreEntry = await prisma.loreEntry.upsert({
        where: { slug: loreSlug },
        create: {
          title: lore.title,
          slug: loreSlug,
          summary: lore.summary,
          canonStatus: lore.canonStatus as any,
          category: lore.category,
        },
        update: {
          summary: lore.summary,
          canonStatus: lore.canonStatus as any,
          category: lore.category,
        },
      });
      await prisma.episodeLore.create({
        data: { episodeId: episode.id, loreEntryId: loreEntry.id },
      });
    }
  }

  if (data.quotes.length > 0) {
    await prisma.quote.deleteMany({ where: { episodeId: episode.id } });
    for (const quote of data.quotes) {
      const speakerSlug = slugify(quote.speaker);
      const speaker = await prisma.person.findUnique({
        where: { slug: speakerSlug },
      });
      await prisma.quote.create({
        data: {
          text: quote.text,
          speakerPersonId: speaker?.id ?? null,
          episodeId: episode.id,
          timestampSeconds: quote.timestampSeconds,
          context: quote.context || null,
          significance: quote.significance || null,
        },
      });
    }
  }
}

async function main() {
  const prisma = getPrisma();

  // 1. Find all currently unenriched episode slugs
  const unenriched = await prisma.episode.findMany({
    where: { OR: [{ summaryLong: null }, { summaryLong: "" }] },
    select: { slug: true },
  });
  const targetSlugs = new Set(unenriched.map((e) => e.slug));
  console.log(`Unenriched in DB: ${targetSlugs.size}`);

  // 2. Load enrichment files but only for the target slugs
  const allFiles = loadEnrichmentFiles();
  const todo = allFiles.filter((f) => targetSlugs.has(f.slug));
  console.log(
    `Enrichment files on disk: ${allFiles.length}, matching unenriched: ${todo.length}\n`
  );

  if (todo.length === 0) {
    console.log("Nothing to import.");
    await disconnect();
    return;
  }

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < todo.length; i++) {
    const entry = todo[i];
    try {
      await importOne(prisma, entry.slug, entry.data);
      success++;
      process.stdout.write(
        `\r  ${i + 1}/${todo.length} ${entry.slug.padEnd(60).slice(0, 60)}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\n  FAIL ${entry.slug}: ${msg}`);
      errors.push(`${entry.slug}: ${msg}`);
      failed++;
    }
  }

  console.log(`\n\nDone: ${success} imported, ${failed} failed`);
  if (errors.length > 0) {
    console.error("\nErrors:");
    for (const e of errors) console.error(`  - ${e}`);
  }

  await disconnect();
}

main().catch((err) => {
  console.error("Fatal:", err);
  disconnect();
  process.exit(1);
});
