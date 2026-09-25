/**
 * Remove a person from the archive at their request.
 *
 * Targets every slug in REMOVED_PERSON_SLUGS, plus Person rows whose name or
 * alt names spell the same person differently (captions produce many
 * variants). For each target it deletes:
 *   - quotes spoken by them (their words; a Person delete would only
 *     unattribute them)
 *   - the Person row (guest/mention links, topics, lore links, relationship
 *     events and related-person rows cascade)
 *   - PersonMedia (their mirrored YouTube videos and scraped wiki page)
 *   - PsychenomiconEntity rows soft-linked to them (appearances and archetype
 *     events cascade)
 * and deactivates trading cards that name them.
 *
 * Episodes and lore entries of the show itself are only listed, not changed:
 * whether to edit those is a separate decision.
 *
 * Read-only by default; the -apply wrapper deletes.
 */
import { getPrisma, disconnect } from "../ingest/lib";
import { REMOVED_PERSON_SLUGS } from "../../src/lib/people/noise-slugs";

const NAME_PATTERNS: Record<string, RegExp> = {
  "alexandra-mayers": /\b(alexandr[ae]|alexandria|alex)\s+(melody\s+)?m[aey]{1,2}[eo]?rs?\b/i,
};

export async function run(apply: boolean): Promise<void> {
  const prisma = getPrisma();
  console.log(apply ? "APPLY — rows will be deleted" : "DRY RUN — nothing will change");

  for (const slug of REMOVED_PERSON_SLUGS) {
    const pattern = NAME_PATTERNS[slug];
    const everyone = await prisma.person.findMany({
      select: { id: true, slug: true, displayName: true, altNames: true },
    });
    const people = everyone.filter(
      (p) => p.slug === slug || (pattern && [p.displayName, ...p.altNames].some((n) => pattern.test(n))),
    );
    const ids = people.map((p) => p.id);
    const slugs = people.map((p) => p.slug);
    const nameFilter = pattern ? { contains: slug.split("-").at(-1)!, mode: "insensitive" as const } : undefined;

    console.log(`\n== ${slug}`);
    for (const p of people) console.log(`  person: ${p.slug} (${p.displayName}) alt=[${p.altNames.join(", ")}]`);

    const [quotes, media, entities, cards, lore, episodes] = await Promise.all([
      prisma.quote.count({ where: { speakerPersonId: { in: ids } } }),
      prisma.personMedia.count({ where: { personSlug: { in: [slug, ...slugs] } } }),
      prisma.psychenomiconEntity.findMany({ where: { personSlug: { in: [slug, ...slugs] } }, select: { slug: true } }),
      nameFilter
        ? prisma.card.findMany({
            where: {
              isActive: true,
              OR: [{ title: nameFilter }, { subtitle: nameFilter }, { flavourText: nameFilter }],
            },
            select: { slug: true, title: true, _count: { select: { ownedCards: true } } },
          })
        : [],
      nameFilter
        ? prisma.loreEntry.findMany({
            where: { OR: [{ title: nameFilter }, { summary: nameFilter }, { fullEntry: nameFilter }] },
            select: { slug: true, title: true },
          })
        : [],
      nameFilter
        ? prisma.episode.findMany({
            where: { OR: [{ title: nameFilter }, { summaryShort: nameFilter }, { summaryLong: nameFilter }] },
            select: { slug: true, title: true },
          })
        : [],
    ]);

    console.log(`  quotes spoken: ${quotes}`);
    console.log(`  person media rows: ${media}`);
    console.log(`  psychenomicon entities: ${entities.map((e) => e.slug).join(", ") || "none"}`);
    for (const c of cards) console.log(`  card: ${c.slug} "${c.title}" (owned by ${c._count.ownedCards})`);
    console.log(`  lore entries naming them (not changed): ${lore.length}`);
    for (const l of lore) console.log(`    /lore/${l.slug}  ${l.title}`);
    console.log(`  episodes naming them (not changed): ${episodes.length}`);
    for (const e of episodes) console.log(`    /episodes/${e.slug}  ${e.title}`);

    if (!apply) continue;

    await prisma.$transaction([
      prisma.quote.deleteMany({ where: { speakerPersonId: { in: ids } } }),
      prisma.personMedia.deleteMany({ where: { personSlug: { in: [slug, ...slugs] } } }),
      prisma.psychenomiconEntity.deleteMany({ where: { personSlug: { in: [slug, ...slugs] } } }),
      prisma.card.updateMany({ where: { slug: { in: cards.map((c) => c.slug) } }, data: { isActive: false } }),
      prisma.person.deleteMany({ where: { id: { in: ids } } }),
    ]);
    console.log("  deleted.");
  }

  await disconnect();
}

if (process.argv[1]?.endsWith("remove-person.ts")) {
  run(process.argv.includes("--apply")).catch(async (e) => {
    console.error(e);
    await disconnect();
    process.exit(1);
  });
}
