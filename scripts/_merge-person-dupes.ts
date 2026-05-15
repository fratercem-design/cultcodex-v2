/**
 * Merge duplicate person records.
 * Strategy: pick best "primary" record, reassign all episodes/quotes to it, delete others.
 * NEVER deletes from repos — only DB dedup.
 *
 * IMPORTANT: ThingThatIs and Mason are DIFFERENT people — do NOT merge.
 */
import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

type PrismaClient = ReturnType<typeof getPrisma>;

async function mergePeople(
  p: PrismaClient,
  primarySlug: string,
  secondarySlugs: string[],
  label: string
) {
  const primary = await p.person.findUnique({ where: { slug: primarySlug } });
  if (!primary) {
    console.log("  SKIP " + label + ": primary " + primarySlug + " not found");
    return;
  }

  const secondaries = await p.person.findMany({
    where: { slug: { in: secondarySlugs } },
    select: { id: true, slug: true, displayName: true },
  });

  if (secondaries.length === 0) {
    console.log("  SKIP " + label + ": no secondaries found");
    return;
  }

  const secIds = secondaries.map(s => s.id);

  // Reassign guest appearances (skip if already linked to primary)
  for (const secId of secIds) {
    const appearances = await p.episodeGuest.findMany({
      where: { personId: secId },
    });
    for (const app of appearances) {
      const existing = await p.episodeGuest.findUnique({
        where: { episodeId_personId: { episodeId: app.episodeId, personId: primary.id } },
      });
      if (!existing) {
        await p.episodeGuest.create({
          data: { episodeId: app.episodeId, personId: primary.id },
        });
      }
      await p.episodeGuest.delete({
        where: { episodeId_personId: { episodeId: app.episodeId, personId: secId } },
      });
    }
  }

  // Reassign quotes
  await p.quote.updateMany({
    where: { speakerPersonId: { in: secIds } },
    data: { speakerPersonId: primary.id },
  });

  // Reassign person-topic links
  for (const secId of secIds) {
    const topics = await p.personTopic.findMany({ where: { personId: secId } });
    for (const pt of topics) {
      const existing = await p.personTopic.findUnique({
        where: { personId_topicId: { personId: primary.id, topicId: pt.topicId } },
      });
      if (!existing) {
        await p.personTopic.create({ data: { personId: primary.id, topicId: pt.topicId } });
      }
      await p.personTopic.delete({
        where: { personId_topicId: { personId: secId, topicId: pt.topicId } },
      });
    }
  }

  // Delete secondary person records
  await p.person.deleteMany({ where: { id: { in: secIds } } });

  console.log("  MERGED " + label + ": " + secondaries.map(s => s.slug).join(", ") + " -> " + primarySlug + " (" + secIds.length + " merged)");
}

async function main() {
  const p = getPrisma();

  console.log("=== MERGING EXACT DUPLICATES ===\n");

  // 1. Exact duplicates (12 groups from audit)
  await mergePeople(p, "beetlejuice", ["beetle-juice"], "Beetle Juice");
  await mergePeople(p, "bronze-bird", ["bronzebird"], "Bronze Bird");
  await mergePeople(p, "dj-electra", ["dj-electra-be"], "DJ Electra");
  await mergePeople(p, "jerry-leane", ["jerry"], "Jerry Leane");
  await mergePeople(p, "jim-nick", ["jimnick"], "Jim Nick");
  await mergePeople(p, "john-clark", ["john"], "John Clark");
  await mergePeople(p, "mr-big-pipes", ["mrbigpipes"], "Mr. Big Pipes");
  await mergePeople(p, "open-panel-guests", ["open-panel"], "Open Panel Guests");
  await mergePeople(p, "sam", ["sam-man", "samman", "sam-samman-nyc", "sam-man-sam-man-nyc", "sam-ans"], "Sam Man");
  // ThingThatIs: merge slug variants but NOT mason (Mason is different person)
  await mergePeople(p, "thingthatis", ["thing-that-is"], "ThingThatIs");
  // thing-that-is-mason is a COMPOUND — leave it for now
  await mergePeople(p, "ty", ["ty-ty-santos"], "Ty");
  await mergePeople(p, "untrackable", ["un-trackable"], "Untrackable");

  console.log("\n=== MERGING ALEXANDER MCQUEEN CLUSTER ===\n");
  // Alexander McQueen (the panel guest, NOT fashion designer)
  await mergePeople(p, "alexander-mcqueen", [
    "alexander-alex",
    "alexander-alexander-mcqueen",
    "alexander-mcqueen-alex",
    "alexander-mcqueen-nypd",
    "alexander-canada-dry",
    "nypd-alexander-mcqueen",
    "officer-alex-mcqueen",
    "alexandria-alexander",
  ], "Alexander McQueen cluster");
  // "alexander" (just first name) — likely same person given 15 eps
  await mergePeople(p, "alexander-mcqueen", ["alexander"], "Alexander -> McQueen");

  console.log("\n=== MERGING ALEXANDRA MAYERS CLUSTER ===\n");
  await mergePeople(p, "alexandra-mayers", [
    "alexandra",
    "alexandra-alex",
    "alexandra-alexander",
    "alexandra-mares",
    "alexandra-meyer",
    "alexandra-meyer-monica-foster",
    "alexandra-myers-alex",
    "alexandria",
    "alexander-mayors",
  ], "Alexandra Mayers cluster");

  console.log("\n=== MERGING ALISA JORDANA CLUSTER ===\n");
  await mergePeople(p, "alisa-jordana", [
    "alisa",
    "alisa-jordan",
    "elisa-jordana",
    "lisa-alisa",
    "lisa-jordana",
  ], "Alisa Jordana cluster");

  console.log("\n=== MERGING BEETA / BETA CLUSTER ===\n");
  // Beta/Beeta/VA/Bea are all the same person
  await mergePeople(p, "beta", [
    "beeta",
    "beeta-beta",
    "va-beeta",
    "va-beta",
    "beta-bg",
    "beta-bea",
    "be-beta",
    "beta-beat-up",
    "beta-be-va",
    "beta-va",
    "bea-beta",
    "beeta-bea",
    "bea-beta-kitties",
    "beta-beeta",
    "vita-va-beeta",
    "bt-beta-beeta",
    "beta-bea-va",
    "beeta-va",
    "bita-beeta",
  ], "Beta/Beeta cluster");

  console.log("\n=== MERGING CANADA DRY CLUSTER ===\n");
  await mergePeople(p, "canada-dry", [
    "canada",
    "canada-dry-sass",
    "sask-canada-dry",
  ], "Canada Dry cluster");

  // Final count
  const count = await p.person.count();
  console.log("\n=== DONE ===");
  console.log("People count after merge:", count);

  await disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
