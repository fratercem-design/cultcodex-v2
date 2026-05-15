import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();

  // Find bios with negative/problematic language
  const flagWords = [
    "controversial", "problematic", "offensive", "racist",
    "sexist", "predator", "creepy", "disgusting",
    "toxic", "abusive", "harassing", "stalker",
    "slanderous", "defamatory", "accused of",
    "inappropriate behavior", "criminal", "arrested",
    "mentally ill", "mentally unstable", "crazy",
    "drunk", "alcoholic", "drug addict",
    "fat", "ugly", "stupid", "dumb",
    "notorious", "infamous", "despicable",
    "pedophile", "pedo", "groomer",
    "whore", "slut", "prostitut",
    "degenerate", "scammer", "fraud",
    "violent", "threatening",
  ];

  const people = await prisma.person.findMany({
    select: { id: true, slug: true, displayName: true, shortBio: true },
    where: { shortBio: { not: null } },
  });

  console.log(`Scanning ${people.length} bios for problematic language...\n`);

  const flagged: { slug: string; name: string; bio: string; words: string[] }[] = [];

  for (const p of people) {
    if (!p.shortBio) continue;
    const bioLower = p.shortBio.toLowerCase();
    const found = flagWords.filter(w => bioLower.includes(w));
    if (found.length > 0) {
      flagged.push({ slug: p.slug, name: p.displayName, bio: p.shortBio, words: found });
    }
  }

  console.log(`=== FLAGGED BIOS (${flagged.length}) ===\n`);
  for (const f of flagged) {
    console.log(`${f.name} (${f.slug})`);
    console.log(`  Flags: ${f.words.join(", ")}`);
    console.log(`  Bio: ${f.bio.slice(0, 200)}`);
    console.log();
  }

  await disconnect();
}

main().catch(async (e) => { console.error(e); await disconnect(); process.exit(1); });
