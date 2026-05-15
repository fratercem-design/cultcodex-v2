import { prisma } from "../src/lib/db";

async function main() {
  const eps = await prisma.episode.findMany({
    where: { status: "published" },
    select: { title: true, episodeNumber: true },
    orderBy: { episodeNumber: "asc" },
  });

  eps.forEach((e) => console.log(`${e.episodeNumber}|${e.title}`));
  await prisma.$disconnect();
}

main();
