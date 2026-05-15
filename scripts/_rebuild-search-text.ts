import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();

  // ─── Person records ──────────────────────────────────
  const people = await prisma.person.findMany({
    select: {
      id: true,
      displayName: true,
      altNames: true,
      shortBio: true,
      loreSummary: true,
      searchText: true,
    },
  });

  let personUpdated = 0;
  let personUnchanged = 0;

  for (const p of people) {
    const parts: string[] = [p.displayName];
    if (p.altNames && p.altNames.length > 0) {
      parts.push(p.altNames.join(" "));
    }
    if (p.shortBio) parts.push(p.shortBio);
    if (p.loreSummary) parts.push(p.loreSummary);

    const newSearchText = parts.join(" ");

    if (newSearchText !== p.searchText) {
      await prisma.person.update({
        where: { id: p.id },
        data: { searchText: newSearchText },
      });
      personUpdated++;
    } else {
      personUnchanged++;
    }
  }

  console.log(`\n=== Person records ===`);
  console.log(`Total: ${people.length}`);
  console.log(`Updated: ${personUpdated}`);
  console.log(`Unchanged: ${personUnchanged}`);

  // ─── Episode records ─────────────────────────────────
  const episodes = await prisma.episode.findMany({
    select: {
      id: true,
      title: true,
      summaryShort: true,
      summaryLong: true,
      searchText: true,
    },
  });

  let episodeUpdated = 0;
  let episodeUnchanged = 0;

  for (const ep of episodes) {
    const parts: string[] = [ep.title];
    if (ep.summaryShort) parts.push(ep.summaryShort);
    if (ep.summaryLong) parts.push(ep.summaryLong);

    const newSearchText = parts.join(" ");

    if (newSearchText !== ep.searchText) {
      await prisma.episode.update({
        where: { id: ep.id },
        data: { searchText: newSearchText },
      });
      episodeUpdated++;
    } else {
      episodeUnchanged++;
    }
  }

  console.log(`\n=== Episode records ===`);
  console.log(`Total: ${episodes.length}`);
  console.log(`Updated: ${episodeUpdated}`);
  console.log(`Unchanged: ${episodeUnchanged}`);

  await disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
