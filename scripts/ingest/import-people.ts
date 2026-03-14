// scripts/ingest/import-people.ts
import { readFileSync } from "fs";
import { getPrisma, disconnect, slugify, buildSearchText } from "./lib";
import { PersonRowSchema } from "./schemas";
import { PersonType } from "../../src/generated/prisma/client";
import { z } from "zod";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/ingest/import-people.ts <file.json>");
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const rows = z.array(PersonRowSchema).parse(raw);
  const prisma = getPrisma();

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const slug = slugify(row.displayName);
    const searchText = buildSearchText(
      row.displayName,
      ...row.altNames,
      row.shortBio
    );

    const result = await prisma.person.upsert({
      where: { slug },
      create: {
        displayName: row.displayName,
        slug,
        altNames: row.altNames,
        shortBio: row.shortBio ?? null,
        personType: row.personType as PersonType,
        avatarUrl: row.avatarUrl ?? null,
        searchText,
      },
      update: {
        displayName: row.displayName,
        altNames: row.altNames,
        shortBio: row.shortBio ?? undefined,
        personType: row.personType as PersonType,
        avatarUrl: row.avatarUrl ?? undefined,
        searchText,
      },
    });

    const isNew =
      Math.abs(result.createdAt.getTime() - result.updatedAt.getTime()) < 1000;
    if (isNew) created++;
    else updated++;
  }

  console.log(`People: ${created} created, ${updated} updated (${rows.length} total)`);
  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
