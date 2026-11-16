/**
 * Seed The Panel: 25 character cards, the "the-panel" set, and the Panel Pack
 * (sold in the store for the current season, pool = these 25 only). Each card
 * also gets a reading meaning, so it can be drawn in Archive and Hybrid
 * readings. Idempotent.
 *   npx tsx scripts/cards/seed-panel.ts [--dry-run]
 */
import fs from "fs";
import path from "path";
import { getPrisma, disconnect } from "../ingest/lib";
import { PANEL, PANEL_PACK, PANEL_SET, panelStats } from "../../src/lib/cards/panel";
import { composeDivination } from "../../src/lib/cards/card-divination";
import { currentSeason } from "../../src/lib/cards/codex/catalog";

async function main() {
  const prisma = getPrisma();
  const dryRun = process.argv.includes("--dry-run");
  console.log(`${PANEL.length} panel cards${dryRun ? " (dry run)" : ""}`);
  if (dryRun) {
    for (const c of PANEL) console.log(`  ${c.slug} · ${c.title}, ${c.subtitle} · ${c.rarity}`);
    await disconnect();
    return;
  }

  const set = await prisma.cardSet.upsert({
    where: { slug: PANEL_SET.slug },
    update: { name: PANEL_SET.name, description: PANEL_SET.description, setType: "panel" },
    create: { slug: PANEL_SET.slug, name: PANEL_SET.name, description: PANEL_SET.description, setType: "panel", sortOrder: 2 },
  });

  const { weights, ...packFields } = PANEL_PACK;
  const pack = await prisma.cardPack.upsert({
    where: { slug: PANEL_PACK.slug },
    update: { ...packFields, ...weights, season: currentSeason().number, isAvailable: true },
    create: { ...packFields, ...weights, season: currentSeason().number, isAvailable: true },
  });

  let created = 0, updated = 0;
  for (const [i, c] of PANEL.entries()) {
    const [statA, statB, statC] = panelStats(c);
    const d = composeDivination({ ...c, abilities: [...c.abilities] });
    // Painted art wins once it exists; until then the card draws its procedural scene.
    const painted = fs.existsSync(path.join(process.cwd(), "public", "cards", "art", `${c.slug}.webp`));
    const data = {
      title: c.title, subtitle: c.subtitle, flavourText: c.flavourText, cardType: c.cardType, rarity: c.rarity,
      abilities: [...c.abilities], statA, statB, statC, collectorNo: i + 1, season: 0,
      artUrl: painted ? `/cards/art/${c.slug}.webp` : null,
      obtainMethod: "pack", sourceType: "panel", isActive: true,
      uprightMeaning: d.upright, reversedMeaning: d.reversed, element: d.element, planet: d.planet,
      archetype: d.archetype, shadowAspect: d.shadowAspect, advice: d.advice, oraclePrompt: d.oraclePrompt,
      divinationKeywords: d.keywords, divinationStrength: d.strength, divinationEligible: true, meaningVersion: 1,
    };
    const existing = await prisma.card.findUnique({ where: { slug: c.slug }, select: { id: true } });
    const card = await prisma.card.upsert({ where: { slug: c.slug }, update: data, create: { slug: c.slug, ...data } });
    if (existing) updated++; else created++;
    await prisma.cardSetMember.upsert({
      where: { setId_cardId: { setId: set.id, cardId: card.id } },
      update: {}, create: { setId: set.id, cardId: card.id },
    });
    await prisma.packCard.upsert({
      where: { packId_cardId: { packId: pack.id, cardId: card.id } },
      update: {}, create: { packId: pack.id, cardId: card.id },
    });
  }

  console.log(`The Panel ready · created ${created}, updated ${updated} cards · pack "${PANEL_PACK.name}" in the store`);
  await disconnect();
}
main().catch((e) => { console.error(String(e).slice(0, 300)); process.exit(1); });
