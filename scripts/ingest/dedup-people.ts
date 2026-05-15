// scripts/ingest/dedup-people.ts
// Merges duplicate person entries into canonical ones
import "dotenv/config";
import { getPrisma, disconnect } from "./lib";

// Map of duplicate slugs → canonical slug
// NOTE: Psyche = the host (human), Trix = Psyche's cat. They are separate entities.
// "Psyche/Trix" and "Trix/Psyche" are AI mistakes — merge into Psyche (the host)
const MERGE_MAP: Record<string, string> = {
  // Psyche is the main host — merge combo names into Psyche
  "psyche-trix": "psyche",
  "trix-psyche": "psyche",
  // Unknown speakers → merge into one
  "unknown-speaker-2": "unknown-speaker-1",
  "unknown-speaker-3": "unknown-speaker-1",
  "unknown-speaker-4": "unknown-speaker-1",
  "unknown-speaker-5": "unknown-speaker-1",
};

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const prisma = getPrisma();

  for (const [fromSlug, toSlug] of Object.entries(MERGE_MAP)) {
    const from = await prisma.person.findUnique({ where: { slug: fromSlug } });
    const to = await prisma.person.findUnique({ where: { slug: toSlug } });

    if (!from) { console.log(`Skip: "${fromSlug}" not found`); continue; }
    if (!to) { console.log(`Skip: canonical "${toSlug}" not found`); continue; }
    if (from.id === to.id) { console.log(`Skip: "${fromSlug}" is already "${toSlug}"`); continue; }

    console.log(`Merging "${from.displayName}" → "${to.displayName}"`);

    if (!dryRun) {
      // Re-point guest appearances
      const appearances = await prisma.episodeGuest.findMany({ where: { personId: from.id } });
      for (const app of appearances) {
        const existing = await prisma.episodeGuest.findFirst({
          where: { episodeId: app.episodeId, personId: to.id },
        });
        // Delete the old link
        await prisma.episodeGuest.delete({
          where: { episodeId_personId: { episodeId: app.episodeId, personId: from.id } },
        });
        // Create new link if canonical doesn't already exist
        if (!existing) {
          await prisma.episodeGuest.create({
            data: { episodeId: app.episodeId, personId: to.id },
          });
        }
      }

      // Re-point quotes
      await prisma.quote.updateMany({ where: { speakerPersonId: from.id }, data: { speakerPersonId: to.id } });

      // Re-point mentions
      const mentions = await prisma.episodeMentionedPerson.findMany({ where: { personId: from.id } });
      for (const m of mentions) {
        const existing = await prisma.episodeMentionedPerson.findFirst({
          where: { episodeId: m.episodeId, personId: to.id },
        });
        await prisma.episodeMentionedPerson.delete({
          where: { episodeId_personId: { episodeId: m.episodeId, personId: from.id } },
        });
        if (!existing) {
          await prisma.episodeMentionedPerson.create({
            data: { episodeId: m.episodeId, personId: to.id },
          });
        }
      }

      // Delete the duplicate person
      await prisma.person.delete({ where: { id: from.id } });
      console.log(`  Deleted "${from.displayName}" (${from.slug})`);
    }
  }

  console.log(dryRun ? "\n[DRY RUN] No changes made" : "\nDone");
  await disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  disconnect();
  process.exit(1);
});
