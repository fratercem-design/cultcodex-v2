/**
 * Legacy card art: list the season-0 cards whose art is a generated image in
 * public/cards/art/, and (with -apply) point them at the restyled WebP files
 * committed under public/cards/art-v2/.
 *
 * Cards whose art is a real photo (a person's avatar, an episode thumbnail)
 * are left alone: restyling a photo of a real person would put an invented
 * likeness on their card.
 *
 * Read-only by default: prints one JSON line per card for the art pass. The
 * -apply wrapper updates artUrl for every card that has a file in art-v2/.
 */
import { existsSync } from "fs";
import * as path from "path";
import { getPrisma, disconnect } from "../ingest/lib";

const V2_DIR = path.resolve(__dirname, "../../public/cards/art-v2");

export async function run(apply: boolean) {
  const prisma = getPrisma();
  const cards = await prisma.card.findMany({
    where: { season: 0, artUrl: { startsWith: "/cards/art/" } },
    select: { id: true, slug: true, title: true, subtitle: true, flavourText: true, cardType: true, rarity: true, artUrl: true, isActive: true },
    orderBy: { slug: "asc" },
  });
  console.log(`${apply ? "APPLY" : "REPORT (read-only)"} — ${cards.length} legacy cards with generated art`);

  if (!apply) {
    for (const c of cards) console.log(`CARD ${JSON.stringify(c)}`);
    return disconnect();
  }

  let updated = 0;
  for (const c of cards) {
    if (!existsSync(path.join(V2_DIR, `${c.slug}.webp`))) continue;
    await prisma.card.update({ where: { id: c.id }, data: { artUrl: `/cards/art-v2/${c.slug}.webp` } });
    updated++;
  }
  console.log(`Summary: ${updated} of ${cards.length} cards now use the restyled art`);
  await disconnect();
}

if (process.argv[1]?.endsWith("card-art.ts")) {
  run(false).catch(async (e) => {
    console.error(e);
    await disconnect();
    process.exit(1);
  });
}
