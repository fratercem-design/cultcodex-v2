// scripts/enrich/import-enriched.ts
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { getPrisma, disconnect, slugify } from "../ingest/lib";
import { EnrichmentResultSchema, type EnrichmentResult } from "./schemas";

const DATA_DIR = path.join(__dirname, "data");

// ─── Types ──────────────────────────────────────────
export interface EnrichmentFile {
  slug: string;
  filePath: string;
  data: EnrichmentResult;
}

// ─── Load enrichment files from data directory ──────
export function loadEnrichmentFiles(): EnrichmentFile[] {
  if (!fs.existsSync(DATA_DIR)) return [];

  const jsonFiles = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const results: EnrichmentFile[] = [];

  for (const file of jsonFiles) {
    const filePath = path.join(DATA_DIR, file);
    const slug = path.basename(file, ".json");

    try {
      const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const data = EnrichmentResultSchema.parse(raw);
      results.push({ slug, filePath, data });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Skipping ${file}: ${msg}`);
    }
  }

  return results;
}

// ─── Import a single enrichment file into DB ────────
async function importEnrichment(
  prisma: ReturnType<typeof getPrisma>,
  entry: EnrichmentFile
): Promise<void> {
  const { slug, data } = entry;

  // Find the episode by slug
  const episode = await prisma.episode.findUnique({ where: { slug } });
  if (!episode) {
    throw new Error(`Episode not found for slug "${slug}"`);
  }

  // Update episode summary fields
  await prisma.episode.update({
    where: { id: episode.id },
    data: {
      summaryShort: data.summaryShort,
      summaryLong: data.summaryLong,
      cutOfPsyche: data.cutOfPsyche,
    },
  });

  // ── Guests: upsert Person + clear-and-recreate EpisodeGuest ──
  if (data.guests.length > 0) {
    await prisma.episodeGuest.deleteMany({
      where: { episodeId: episode.id },
    });

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

  // ── Topics: upsert Topic + clear-and-recreate EpisodeTopic ──
  if (data.topics.length > 0) {
    await prisma.episodeTopic.deleteMany({
      where: { episodeId: episode.id },
    });

    for (const topicTitle of data.topics) {
      const topicSlug = slugify(topicTitle);
      const topic = await prisma.topic.upsert({
        where: { slug: topicSlug },
        create: {
          title: topicTitle,
          slug: topicSlug,
        },
        update: {},
      });

      await prisma.episodeTopic.create({
        data: { episodeId: episode.id, topicId: topic.id },
      });
    }
  }

  // ── Lore: upsert LoreEntry + clear-and-recreate EpisodeLore ──
  if (data.lore.length > 0) {
    await prisma.episodeLore.deleteMany({
      where: { episodeId: episode.id },
    });

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

  // ── Quotes: clear-and-recreate for this episode ──
  if (data.quotes.length > 0) {
    await prisma.quote.deleteMany({
      where: { episodeId: episode.id },
    });

    for (const quote of data.quotes) {
      // Resolve speaker to a Person
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

// ─── Main ───────────────────────────────────────────
async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const files = loadEnrichmentFiles();
  console.log(`Found ${files.length} enrichment file(s) in ${DATA_DIR}`);

  if (files.length === 0) {
    console.log("Nothing to import.");
    return;
  }

  if (dryRun) {
    console.log("\n--dry-run mode: listing files without touching DB\n");
    for (const f of files) {
      console.log(
        `  ${f.slug}.json — ${f.data.guests.length} guests, ${f.data.quotes.length} quotes, ${f.data.topics.length} topics, ${f.data.lore.length} lore`
      );
    }
    console.log(`\nTotal: ${files.length} file(s)`);
    return;
  }

  const prisma = getPrisma();
  let success = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const entry of files) {
    try {
      console.log(`Processing ${entry.slug}...`);
      await importEnrichment(prisma, entry);
      console.log(
        `  OK — ${entry.data.guests.length} guests, ${entry.data.quotes.length} quotes, ${entry.data.topics.length} topics, ${entry.data.lore.length} lore`
      );
      success++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Episode not found")) {
        console.warn(`  SKIP — ${msg}`);
        skipped++;
      } else {
        console.error(`  FAIL — ${msg}`);
        errors.push(`${entry.slug}: ${msg}`);
        failed++;
      }
    }
  }

  console.log(
    `\nDone: ${success} imported, ${skipped} skipped, ${failed} failed (${files.length} total)`
  );
  if (errors.length > 0) {
    console.error("\nErrors:");
    for (const e of errors) console.error(`  - ${e}`);
  }

  await disconnect();
}

// Only run main() when executed directly
if (require.main === module) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    disconnect();
    process.exit(1);
  });
}
