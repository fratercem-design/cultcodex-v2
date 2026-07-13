/**
 * Seed the reading spreads (idempotent). Signal cost lives on the spread.
 *   npx tsx scripts/cards/seed-spreads.ts
 */
import "dotenv/config";
import { prisma } from "../../src/lib/db";

const SPREADS = [
  {
    slug: "single", name: "Single Signal", cardCount: 1, signalCost: 1, sortOrder: 0,
    description: "One card. The signal beneath the noise.",
    positions: [{ index: 0, name: "The Signal", meaning: "What is actually happening right now." }],
  },
  {
    slug: "three", name: "Three-Card Transmission", cardCount: 3, signalCost: 3, sortOrder: 1,
    description: "Past current, present break, emerging pattern.",
    positions: [
      { index: 0, name: "The Static", meaning: "What you are carrying in from before." },
      { index: 1, name: "The Break", meaning: "What is true in this moment." },
      { index: 2, name: "The Emergence", meaning: "What is forming if you read the break." },
    ],
  },
];

async function main() {
  for (const s of SPREADS) {
    const spread = await prisma.spread.upsert({
      where: { slug: s.slug },
      update: { name: s.name, cardCount: s.cardCount, signalCost: s.signalCost, sortOrder: s.sortOrder, description: s.description },
      create: { slug: s.slug, name: s.name, cardCount: s.cardCount, signalCost: s.signalCost, sortOrder: s.sortOrder, description: s.description },
    });
    // Reset positions to match (idempotent)
    await prisma.spreadPosition.deleteMany({ where: { spreadId: spread.id } });
    await prisma.spreadPosition.createMany({
      data: s.positions.map((p) => ({ spreadId: spread.id, index: p.index, name: p.name, meaning: p.meaning })),
    });
    console.log(`seeded spread "${s.slug}" (${s.cardCount} cards, ${s.signalCost} Signal, ${s.positions.length} positions)`);
  }
  await prisma.$disconnect();
}
main().catch((e) => { console.error(String(e).slice(0, 300)); process.exit(1); });
