// scripts/ingest/import-lore.ts
import { readFileSync } from "fs";
import { getPrisma, disconnect, slugify, buildSearchText } from "./lib";
import { LoreRowSchema } from "./schemas";
import { CanonStatus } from "../../src/generated/prisma/client";
import { z } from "zod";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/ingest/import-lore.ts <file.json>");
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const rows = z.array(LoreRowSchema).parse(raw);
  const prisma = getPrisma();

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const slug = slugify(row.title);
    const searchText = buildSearchText(
      row.title,
      row.category,
      row.summary
    );

    const result = await prisma.loreEntry.upsert({
      where: { slug },
      create: {
        title: row.title,
        slug,
        category: row.category ?? null,
        summary: row.summary ?? null,
        fullEntry: row.fullEntry ?? null,
        canonStatus: row.canonStatus as CanonStatus,
        searchText,
      },
      update: {
        title: row.title,
        category: row.category ?? undefined,
        summary: row.summary ?? undefined,
        fullEntry: row.fullEntry ?? undefined,
        canonStatus: row.canonStatus as CanonStatus,
        searchText,
      },
    });

    const isNew =
      Math.abs(result.createdAt.getTime() - result.updatedAt.getTime()) < 1000;
    if (isNew) created++;
    else updated++;
  }

  console.log(`Lore: ${created} created, ${updated} updated (${rows.length} total)`);
  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
