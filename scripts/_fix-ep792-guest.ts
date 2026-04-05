import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();

  const epId = "cmn469krp00lz3stthdevd8z7"; // EP.792
  const mayersId = "cmn5tenff00mgpottlmcnwxje";
  const mcqueenId = "cmn46u8y000zab0tt7i3m0giv";

  // 1. Remove Mayers from EP.792
  console.log("Removing Alexandra Mayers from EP.792...");
  await prisma.episodeGuest.delete({
    where: {
      episodeId_personId: {
        episodeId: epId,
        personId: mayersId,
      },
    },
  });
  console.log("  ✓ Mayers removed from EP.792");

  // 2. Add McQueen to EP.792 (check if already exists first)
  const existing = await prisma.episodeGuest.findUnique({
    where: {
      episodeId_personId: {
        episodeId: epId,
        personId: mcqueenId,
      },
    },
  });

  if (!existing) {
    console.log("Adding Alexander McQueen to EP.792...");
    await prisma.episodeGuest.create({
      data: {
        episodeId: epId,
        personId: mcqueenId,
      },
    });
    console.log("  ✓ McQueen added to EP.792");
  } else {
    console.log("  McQueen already on EP.792");
  }

  // 3. Verify
  const guests = await prisma.episodeGuest.findMany({
    where: { episodeId: epId },
    include: { person: { select: { displayName: true, slug: true } } },
  });
  console.log("\n=== EP.792 GUESTS (after fix) ===");
  for (const g of guests) {
    console.log(`  ${g.person.displayName} (${g.person.slug})`);
  }

  // 4. Count appearances
  const mayersCount = await prisma.episodeGuest.count({ where: { personId: mayersId } });
  const mcqueenCount = await prisma.episodeGuest.count({ where: { personId: mcqueenId } });
  console.log(`\nMayers now has ${mayersCount} episode appearances`);
  console.log(`McQueen now has ${mcqueenCount} episode appearances`);

  await disconnect();
}

main().catch(console.error);
