import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const p = getPrisma();

  // 1. Fix Alexandra Mayers — update bio, clean altNames, remove overlap with McQueen
  await p.person.update({
    where: { slug: "alexandra-mayers" },
    data: {
      shortBio: "Creator and host of irlnewstime, ip2wiki.info, and AlexandraMayers channels on YouTube",
      altNames: ["Alexandra Meyer", "Monica Foster", "Alexandra Myers", "Alexandra Mares"],
      personType: "mentioned",
    },
  });
  console.log("Updated Alexandra Mayers — new bio, cleaned altNames");

  // 2. Fix Alexander McQueen — remove "Canada Dry" from altNames (Canada Dry is a separate person)
  await p.person.update({
    where: { slug: "alexander-mcqueen" },
    data: {
      altNames: ["NYPD", "Officer Alex McQueen", "Alex McQueen"],
    },
  });
  console.log("Updated Alexander McQueen — cleaned altNames");

  // 3. Merge stray alexander-alexandra into McQueen (it's a compound name from enrichment)
  const stray = await p.person.findUnique({
    where: { slug: "alexander-alexandra" },
    select: { id: true },
  });
  if (stray) {
    // Move its episodes to McQueen
    const mcqueen = await p.person.findUnique({ where: { slug: "alexander-mcqueen" } });
    if (mcqueen) {
      const apps = await p.episodeGuest.findMany({ where: { personId: stray.id } });
      for (const app of apps) {
        const existing = await p.episodeGuest.findUnique({
          where: { episodeId_personId: { episodeId: app.episodeId, personId: mcqueen.id } },
        });
        if (!existing) {
          await p.episodeGuest.create({ data: { episodeId: app.episodeId, personId: mcqueen.id } });
        }
        await p.episodeGuest.delete({
          where: { episodeId_personId: { episodeId: app.episodeId, personId: stray.id } },
        });
      }
      // Move quotes
      await p.quote.updateMany({ where: { speakerPersonId: stray.id }, data: { speakerPersonId: mcqueen.id } });
      // Move person-topic links
      const topics = await p.personTopic.findMany({ where: { personId: stray.id } });
      for (const pt of topics) {
        const existing = await p.personTopic.findUnique({
          where: { personId_topicId: { personId: mcqueen.id, topicId: pt.topicId } },
        });
        if (!existing) {
          await p.personTopic.create({ data: { personId: mcqueen.id, topicId: pt.topicId } });
        }
        await p.personTopic.delete({ where: { personId_topicId: { personId: stray.id, topicId: pt.topicId } } });
      }
      // Delete stray record
      await p.person.delete({ where: { id: stray.id } });
      console.log("Merged alexander-alexandra -> alexander-mcqueen and deleted stray");
    }
  } else {
    console.log("alexander-alexandra not found (already cleaned)");
  }

  // Verify
  const mayers = await p.person.findUnique({
    where: { slug: "alexandra-mayers" },
    select: { displayName: true, shortBio: true, altNames: true, _count: { select: { guestAppearances: true, quotes: true } } },
  });
  const mcqueenFinal = await p.person.findUnique({
    where: { slug: "alexander-mcqueen" },
    select: { displayName: true, shortBio: true, altNames: true, _count: { select: { guestAppearances: true, quotes: true } } },
  });
  console.log("\n=== FINAL STATE ===");
  console.log("Mayers:", JSON.stringify(mayers, null, 2));
  console.log("McQueen:", JSON.stringify(mcqueenFinal, null, 2));

  // Count remaining alex* records
  const remaining = await p.person.findMany({
    where: { OR: [{ slug: { startsWith: "alexander" } }, { slug: { startsWith: "alexandra" } }, { slug: { startsWith: "alexandria" } }] },
    select: { slug: true, displayName: true },
  });
  console.log("\nRemaining alex* records:", remaining.map(r => r.slug).join(", "));

  await disconnect();
}
main();
