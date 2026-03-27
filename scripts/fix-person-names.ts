// scripts/fix-person-names.ts
// Fixes known person name misspellings: ALISA→ELISA, BEA/BETA→BEETA
import "dotenv/config";
import { getPrisma, disconnect, slugify } from "./ingest/lib";

const NAME_FIXES: Array<{ from: string[]; to: { displayName: string; slug: string } }> = [
  {
    from: ["alisa", "Alisa"],
    to: { displayName: "Elisa", slug: "elisa" },
  },
  {
    from: ["bea", "Bea", "beta", "Beta"],
    to: { displayName: "Beeta", slug: "beeta" },
  },
];

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const prisma = getPrisma();

  for (const fix of NAME_FIXES) {
    // Find all person records matching any of the "from" names (case-insensitive slug match)
    const fromSlugs = fix.from.map((n) => slugify(n));

    for (const fromSlug of fromSlugs) {
      const person = await prisma.person.findUnique({ where: { slug: fromSlug } });
      if (!person) {
        console.log(`  Skip: "${fromSlug}" not found in DB`);
        continue;
      }

      // Check if the canonical already exists
      const canonical = await prisma.person.findUnique({ where: { slug: fix.to.slug } });

      if (canonical && canonical.id !== person.id) {
        // Merge into canonical (same pattern as dedup-people.ts)
        console.log(`Merging "${person.displayName}" (${person.slug}) → "${canonical.displayName}" (${canonical.slug})`);

        if (!dryRun) {
          // Re-point guest appearances
          const appearances = await prisma.episodeGuest.findMany({ where: { personId: person.id } });
          for (const app of appearances) {
            const existing = await prisma.episodeGuest.findFirst({
              where: { episodeId: app.episodeId, personId: canonical.id },
            });
            await prisma.episodeGuest.delete({
              where: { episodeId_personId: { episodeId: app.episodeId, personId: person.id } },
            });
            if (!existing) {
              await prisma.episodeGuest.create({
                data: { episodeId: app.episodeId, personId: canonical.id },
              });
            }
          }

          // Re-point quotes
          await prisma.quote.updateMany({ where: { speakerPersonId: person.id }, data: { speakerPersonId: canonical.id } });

          // Re-point mentions
          const mentions = await prisma.episodeMentionedPerson.findMany({ where: { personId: person.id } });
          for (const m of mentions) {
            const existing = await prisma.episodeMentionedPerson.findFirst({
              where: { episodeId: m.episodeId, personId: canonical.id },
            });
            await prisma.episodeMentionedPerson.delete({
              where: { episodeId_personId: { episodeId: m.episodeId, personId: person.id } },
            });
            if (!existing) {
              await prisma.episodeMentionedPerson.create({
                data: { episodeId: m.episodeId, personId: canonical.id },
              });
            }
          }

          // Delete the misspelled person
          await prisma.person.delete({ where: { id: person.id } });
          console.log(`  Deleted duplicate "${person.displayName}" (${person.slug})`);
        }
      } else if (!canonical) {
        // No canonical exists — just rename in place
        console.log(`Renaming "${person.displayName}" (${person.slug}) → "${fix.to.displayName}" (${fix.to.slug})`);

        if (!dryRun) {
          // Add old name to altNames for search
          const altNames = person.altNames ?? [];
          if (!altNames.includes(person.displayName)) {
            altNames.push(person.displayName);
          }

          await prisma.person.update({
            where: { id: person.id },
            data: {
              displayName: fix.to.displayName,
              slug: fix.to.slug,
              altNames,
            },
          });
          console.log(`  Updated successfully`);
        }
      } else {
        console.log(`"${person.displayName}" already has correct slug "${fix.to.slug}"`);
      }
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
