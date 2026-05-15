/**
 * One-off: import only the EP1596 enrichment JSON into the DB.
 *
 * The full `import-enriched.ts` script processes ALL files in
 * scripts/enrich/data/ (1592+ files) on every run. This script targets
 * just the single newly-generated file, replicating the same upsert logic.
 */
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { getPrisma, disconnect, slugify } from "./ingest/lib";
import { EnrichmentResultSchema } from "./enrich/schemas";

const TARGET_SLUG = "psyche-responds-to-the-community-that-never-acccepted-him";
const DATA_FILE = path.join(__dirname, "enrich", "data", `${TARGET_SLUG}.json`);

async function main() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`Enrichment file not found: ${DATA_FILE}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  const data = EnrichmentResultSchema.parse(raw);
  console.log(
    `Loaded ${TARGET_SLUG}.json — ${data.guests.length} guests, ${data.quotes.length} quotes, ${data.topics.length} topics, ${data.lore.length} lore`
  );

  const prisma = getPrisma();

  const episode = await prisma.episode.findUnique({ where: { slug: TARGET_SLUG } });
  if (!episode) {
    console.error(`Episode not found for slug "${TARGET_SLUG}"`);
    await disconnect();
    process.exit(1);
  }
  console.log(`Target episode: EP.${episode.episodeNumber} — ${episode.title}`);

  // Update episode summary fields
  await prisma.episode.update({
    where: { id: episode.id },
    data: {
      summaryShort: data.summaryShort,
      summaryLong: data.summaryLong,
      cutOfPsyche: data.cutOfPsyche,
    },
  });
  console.log("  Updated summary fields");

  // Guests
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
      console.log(`  Guest: ${guest.name} (${guest.personType})`);
    }
  }

  // Topics
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
    console.log(`  Topics: ${data.topics.length}`);
  }

  // Lore
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
      console.log(`  Lore: ${lore.title}`);
    }
  }

  // Quotes
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
    console.log(`  Quotes: ${data.quotes.length}`);
  }

  console.log("\nImport complete.");
  await disconnect();
}

main().catch(async (err) => {
  console.error("Fatal error:", err);
  await disconnect();
  process.exit(1);
});
