// Build RelatedPerson connections from co-appearance analysis.
// No AI needed — pure DB analysis.
// Pairs of people who appear together in ≥2 episodes get a RelatedPerson record.
//
// Usage:
//   npx tsx scripts/enrich/enrich-relationships.ts [--min-coappearances N]
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { getPrisma, disconnect } from "../ingest/lib";

const LOG_PATH = path.join(__dirname, "enrich-relationships.log");

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
}

function parseArgs(): { minCoappearances: number } {
  const args = process.argv.slice(2);
  let minCoappearances = 2;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--min-coappearances" && args[i + 1]) {
      minCoappearances = parseInt(args[i + 1], 10); i++;
    }
  }
  return { minCoappearances };
}

async function main() {
  const { minCoappearances } = parseArgs();
  const prisma = getPrisma();

  log(`Building relationship map (min co-appearances: ${minCoappearances})`);

  // Load all episode guest records
  const allGuests = await prisma.episodeGuest.findMany({
    select: { episodeId: true, personId: true },
  });

  // Group by episode
  const episodeMap = new Map<string, string[]>();
  for (const g of allGuests) {
    const list = episodeMap.get(g.episodeId) ?? [];
    list.push(g.personId);
    episodeMap.set(g.episodeId, list);
  }

  log(`Loaded ${allGuests.length} guest records across ${episodeMap.size} episodes`);

  // Count co-appearances for each pair
  const pairCounts = new Map<string, number>();
  for (const [, guests] of episodeMap) {
    if (guests.length < 2) continue;
    for (let i = 0; i < guests.length; i++) {
      for (let j = i + 1; j < guests.length; j++) {
        const a = guests[i] < guests[j] ? guests[i] : guests[j];
        const b = guests[i] < guests[j] ? guests[j] : guests[i];
        const key = `${a}|${b}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }

  const qualifiedPairs = Array.from(pairCounts.entries())
    .filter(([, count]) => count >= minCoappearances)
    .sort((a, b) => b[1] - a[1]);

  log(`Found ${qualifiedPairs.length} pairs with ≥${minCoappearances} co-appearances`);

  // Clear existing relationships and rebuild
  const deleted = await prisma.relatedPerson.deleteMany({});
  log(`Cleared ${deleted.count} existing relationships`);

  let created = 0;
  let failed = 0;

  for (const [key, count] of qualifiedPairs) {
    const [personAId, personBId] = key.split("|");
    try {
      await prisma.relatedPerson.upsert({
        where: { personAId_personBId: { personAId, personBId } },
        update: {},
        create: { personAId, personBId },
      });
      created++;
    } catch {
      // Also try reversed order
      try {
        await prisma.relatedPerson.upsert({
          where: { personAId_personBId: { personAId: personBId, personBId: personAId } },
          update: {},
          create: { personAId: personBId, personBId: personAId },
        });
        created++;
      } catch {
        failed++;
      }
    }
  }

  log(`\nDone — created: ${created} relationships, failed: ${failed}`);

  // Log top 20 most-connected pairs
  const topPairs = qualifiedPairs.slice(0, 20);
  if (topPairs.length) {
    const personIds = [...new Set(topPairs.flatMap(([k]) => k.split("|")))];
    const people = await prisma.person.findMany({
      where: { id: { in: personIds } },
      select: { id: true, displayName: true },
    });
    const nameMap = new Map(people.map((p) => [p.id, p.displayName]));
    log("\nTop co-appearance pairs:");
    for (const [key, count] of topPairs) {
      const [a, b] = key.split("|");
      log(`  ${count}x — ${nameMap.get(a) ?? a} ↔ ${nameMap.get(b) ?? b}`);
    }
  }

  await disconnect();
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
