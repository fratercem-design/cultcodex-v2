// scripts/ingest/import-topics.ts
import { readFileSync } from "fs";
import { getPrisma, disconnect, slugify, buildSearchText } from "./lib";
import { TopicRowSchema } from "./schemas";
import { z } from "zod";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/ingest/import-topics.ts <file.json>");
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const rows = z.array(TopicRowSchema).parse(raw);
  const prisma = getPrisma();

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const slug = slugify(row.title);
    const result = await prisma.topic.upsert({
      where: { slug },
      create: {
        title: row.title,
        slug,
        description: row.description ?? null,
      },
      update: {
        title: row.title,
        description: row.description ?? undefined,
      },
    });

    // Check if createdAt === updatedAt (roughly) to determine create vs update
    const isNew =
      Math.abs(result.createdAt.getTime() - result.updatedAt.getTime()) < 1000;
    if (isNew) created++;
    else updated++;
  }

  console.log(`Topics: ${created} created, ${updated} updated (${rows.length} total)`);
  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
