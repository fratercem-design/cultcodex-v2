/**
 * Seed the 12 special-edition gold-foil collectibles as the "special-editions" set.
 * Idempotent. Each card gets its painted art (public/cards/art/{slug}.webp),
 * maxSupply SPECIAL_EDITION_MAX_SUPPLY and obtainMethod "secret" (never in packs).
 *   npx tsx scripts/cards/seed-special-editions.ts [--dry-run]
 */
import "dotenv/config";
import { prisma } from "../../src/lib/db";
import { SPECIAL_EDITIONS, SPECIAL_EDITION_MAX_SUPPLY } from "../../src/lib/cards/special-editions";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`${SPECIAL_EDITIONS.length} special editions${dryRun ? " (dry run)" : ""}`);
  if (dryRun) {
    for (const s of SPECIAL_EDITIONS) console.log(`  ${s.slug} · ${s.title} · ${s.rarity}`);
    await prisma.$disconnect();
    return;
  }

  const set = await prisma.cardSet.upsert({
    where: { slug: "special-editions" },
    update: { name: "Special Editions", setType: "special" },
    create: {
      slug: "special-editions", name: "Special Editions", setType: "special", sortOrder: 1,
      description: "Twelve gold-foil collectibles, each limited to 100 copies.",
    },
  });

  let created = 0, updated = 0;
  for (const s of SPECIAL_EDITIONS) {
    const data = {
      title: s.title, subtitle: s.subtitle, flavourText: s.flavourText,
      cardType: s.cardType, rarity: s.rarity, abilities: s.abilities,
      artUrl: `/cards/art/${s.slug}.webp`, maxSupply: SPECIAL_EDITION_MAX_SUPPLY,
      obtainMethod: "secret", sourceType: "special-edition",
    };
    const existing = await prisma.card.findUnique({ where: { slug: s.slug }, select: { id: true } });
    const card = await prisma.card.upsert({
      where: { slug: s.slug },
      update: data,
      create: { slug: s.slug, ...data },
    });
    if (existing) updated++; else created++;
    await prisma.cardSetMember.upsert({
      where: { setId_cardId: { setId: set.id, cardId: card.id } },
      update: {}, create: { setId: set.id, cardId: card.id },
    });
  }

  console.log(`Special Editions set ready · created ${created}, updated ${updated} cards`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(String(e).slice(0, 300)); process.exit(1); });
