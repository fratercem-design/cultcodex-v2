/**
 * Step 6 — seed the 80-card Cult of Psyche Tarot as the collectible "Arcana" set.
 * Idempotent. Each card is created/refreshed with sourceType='tarot',
 * divinationEligible=true, and composed divinatory meaning (family + own flavour),
 * then linked to the CardSet "arcana". Majors strength 100, minors 90.
 *   npx tsx scripts/cards/seed-tarot-arcana.ts [--dry-run]
 */
import "dotenv/config";
import { prisma } from "../../src/lib/db";
import { ALL_TAROT_CARDS } from "../../src/lib/cards/tarot-data";
import { composeDivination } from "../../src/lib/cards/card-divination";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`${ALL_TAROT_CARDS.length} tarot cards → collectible Arcana set${dryRun ? " (dry run)" : ""}`);
  if (dryRun) {
    const t = ALL_TAROT_CARDS[0];
    const d = composeDivination(t);
    console.log(`sample: ${t.title} (${t.slug} · ${t.cardType} → ${d.archetype})\n  ▲ ${d.upright.slice(0, 100)}…`);
    await prisma.$disconnect();
    return;
  }

  const set = await prisma.cardSet.upsert({
    where: { slug: "arcana" },
    update: { name: "The Arcana", setType: "tarot" },
    create: {
      slug: "arcana", name: "The Arcana", setType: "tarot", sortOrder: 0,
      description: "The 80-card Cult of Psyche Tarot — the classic backbone of the oracle.",
      rewardTitle: "Grand Diviner", unlocksSpread: "three",
    },
  });

  let created = 0, updated = 0;
  for (const t of ALL_TAROT_CARDS) {
    const d = composeDivination(t);
    const strength = t.slug.includes("-maj-") ? 100 : 90;
    const div = {
      uprightMeaning: d.upright, reversedMeaning: d.reversed, element: d.element,
      planet: d.planet, archetype: d.archetype, shadowAspect: d.shadowAspect,
      advice: d.advice, oraclePrompt: d.oraclePrompt, divinationKeywords: d.keywords,
      divinationStrength: strength, divinationEligible: true, meaningVersion: 1,
      sourceType: "tarot",
    };
    const existing = await prisma.card.findUnique({ where: { slug: t.slug }, select: { id: true } });
    const card = await prisma.card.upsert({
      where: { slug: t.slug },
      update: div,
      create: {
        slug: t.slug, title: t.title, subtitle: t.subtitle, flavourText: t.flavourText,
        cardType: t.cardType, rarity: t.rarity, abilities: t.abilities, ...div,
      },
    });
    if (existing) updated++; else created++;
    await prisma.cardSetMember.upsert({
      where: { setId_cardId: { setId: set.id, cardId: card.id } },
      update: {}, create: { setId: set.id, cardId: card.id },
    });
  }

  const members = await prisma.cardSetMember.count({ where: { setId: set.id } });
  console.log(`Arcana set ready · created ${created}, updated ${updated} cards · ${members} members`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(String(e).slice(0, 300)); process.exit(1); });
