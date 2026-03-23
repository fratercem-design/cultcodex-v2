import { getPrisma, disconnect } from "./lib";

async function main() {
  const prisma = getPrisma();
  const untagged = await prisma.episode.findMany({
    where: { topics: { none: {} } },
    select: { id: true, title: true, episodeNumber: true, airDate: true, contentType: true },
    orderBy: { episodeNumber: "asc" },
  });

  const lines = untagged.map(e =>
    `${e.id}|${e.episodeNumber}|${e.title}|${e.airDate?.toISOString().slice(0,10) ?? ""}|${e.contentType}`
  );

  // Write to stdout
  for (const line of lines) {
    process.stdout.write(line + "\n");
  }

  await disconnect();
}
main();
