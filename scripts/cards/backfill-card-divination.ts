/**
 * Author divinatory meaning onto the 204 live collectible cards.
 *
 *   npx tsx scripts/cards/backfill-card-divination.ts --dry-run   # preview, no writes
 *   npx tsx scripts/cards/backfill-card-divination.ts             # write to live DB
 *
 * HERO cards get hand-authored meanings; the rest are composed from their cardType
 * archetype family woven with their own flavourText (see card-divination.ts).
 * Idempotent — re-run any time; bump meaningVersion when meanings change.
 */
import "dotenv/config";
import { prisma } from "../../src/lib/db";
import { composeDivination, HERO } from "../../src/lib/cards/card-divination";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const cards = await prisma.card.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, title: true, subtitle: true, flavourText: true, cardType: true, abilities: true },
  });
  console.log(`Loaded ${cards.length} active cards. HERO overrides: ${Object.keys(HERO).length}.`);

  if (dryRun) {
    const sample = cards.slice(0, 6);
    for (const c of sample) {
      const d = composeDivination(c);
      console.log(`\n— ${c.title} (${c.slug} · ${c.cardType} → ${d.archetype})`);
      console.log(`  ▲ ${d.upright}`);
      console.log(`  ▼ ${d.reversed}`);
      console.log(`  ◆ ${d.oraclePrompt}`);
    }
    console.log("\nDry run — no writes.");
    await prisma.$disconnect();
    return;
  }

  // Raw SQL: the generated client (from master's reverted schema) doesn't know the
  // divination fields, but the live DB columns exist. Write directly, parameterized.
  let n = 0;
  for (const c of cards) {
    const d = composeDivination(c);
    await prisma.$executeRaw`
      UPDATE "Card" SET
        "uprightMeaning"     = ${d.upright},
        "reversedMeaning"    = ${d.reversed},
        "element"            = ${d.element},
        "planet"             = ${d.planet},
        "archetype"          = ${d.archetype},
        "shadowAspect"       = ${d.shadowAspect},
        "advice"             = ${d.advice},
        "oraclePrompt"       = ${d.oraclePrompt},
        "divinationKeywords" = ${d.keywords}::text[],
        "divinationStrength" = ${d.strength},
        "divinationEligible" = true,
        "meaningVersion"     = 1
      WHERE "id" = ${c.id}`;
    n++;
  }
  const [{ withMeaning, eligible }] = await prisma.$queryRaw<Array<{ withMeaning: bigint; eligible: bigint }>>`
    SELECT count(*) FILTER (WHERE "uprightMeaning" IS NOT NULL) AS "withMeaning",
           count(*) FILTER (WHERE "divinationEligible" = true) AS "eligible"
    FROM "Card"`;
  console.log(`Authored ${n} cards. VERIFY · uprightMeaning: ${withMeaning} · divinationEligible=true: ${eligible}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(String(e).slice(0, 300)); process.exit(1); });
