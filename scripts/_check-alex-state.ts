import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const p = getPrisma();
  const all = await p.person.findMany({
    where: {
      OR: [
        { displayName: { contains: "alex", mode: "insensitive" } },
        { displayName: { contains: "mcqueen", mode: "insensitive" } },
        { displayName: { contains: "myers", mode: "insensitive" } },
        { displayName: { contains: "mayers", mode: "insensitive" } },
        { slug: { contains: "alex" } },
        { slug: { contains: "mcqueen" } },
        { slug: { contains: "myers" } },
        { slug: { contains: "mayers" } },
      ],
    },
    include: {
      _count: {
        select: { guestAppearances: true, quotes: true, mentions: true },
      },
    },
    orderBy: { displayName: "asc" },
  });
  console.log(`Found ${all.length} Alex/McQueen/Mayers candidates:\n`);
  for (const person of all) {
    console.log(
      `  id=${person.id} | "${person.displayName}" (slug: ${person.slug}, type: ${person.personType}) — ${person._count.guestAppearances}g/${person._count.quotes}q/${person._count.mentions}m`
    );
    if (person.shortBio) console.log(`     bio: ${person.shortBio.slice(0, 100)}`);
    if (person.altNames && person.altNames.length > 0) console.log(`     altNames: ${person.altNames.join(", ")}`);
  }
  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
