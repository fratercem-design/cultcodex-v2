import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

/**
 * Inspect the current state of ThingThatIs / Mason records before running
 * the dedup script. The hardcoded IDs in _dedup-tti-mason.ts may be stale.
 */
const SCRIPT_IDS = {
  TTI_KEEP: "cmn5uodrw03lapottju50pkox",
  TTI_MERGE: "cmn5ukcbu03c6potti3apskou",
  CONFLATED: "cmn5ukjs603crpott1qd4hn78",
  MASON: "cmn46npg900drb0ttpq84hpqj",
};

async function main() {
  const p = getPrisma();

  console.log("=== Hardcoded IDs from _dedup-tti-mason.ts ===\n");
  for (const [label, id] of Object.entries(SCRIPT_IDS)) {
    const person = await p.person.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            guestAppearances: true,
            quotes: true,
            mentions: true,
          },
        },
      },
    });
    if (!person) {
      console.log(`  ${label}: ${id} — NOT FOUND (may have been deleted)`);
    } else {
      console.log(
        `  ${label}: ${id} — "${person.displayName}" (slug: ${person.slug}, type: ${person.personType}) — ${person._count.guestAppearances} guest, ${person._count.quotes} quotes, ${person._count.mentions} mentions`
      );
    }
  }

  console.log("\n=== All Person records mentioning 'thing' or 'tti' ===\n");
  const allTti = await p.person.findMany({
    where: {
      OR: [
        { displayName: { contains: "thing", mode: "insensitive" } },
        { displayName: { contains: "tti", mode: "insensitive" } },
        { slug: { contains: "thing" } },
        { slug: { contains: "tti" } },
      ],
    },
    include: {
      _count: { select: { guestAppearances: true, quotes: true, mentions: true } },
    },
  });
  for (const person of allTti) {
    console.log(
      `  id=${person.id} | "${person.displayName}" (slug: ${person.slug}, type: ${person.personType}) — ${person._count.guestAppearances}g/${person._count.quotes}q/${person._count.mentions}m`
    );
  }

  console.log("\n=== All Person records with 'mason' in name or slug ===\n");
  const allMason = await p.person.findMany({
    where: {
      OR: [
        { displayName: { contains: "mason", mode: "insensitive" } },
        { slug: { contains: "mason" } },
      ],
    },
    include: {
      _count: { select: { guestAppearances: true, quotes: true, mentions: true } },
    },
  });
  for (const person of allMason) {
    console.log(
      `  id=${person.id} | "${person.displayName}" (slug: ${person.slug}, type: ${person.personType}) — ${person._count.guestAppearances}g/${person._count.quotes}q/${person._count.mentions}m`
    );
  }

  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
