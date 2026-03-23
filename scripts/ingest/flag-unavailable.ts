import { getPrisma, disconnect } from "./lib";

async function main() {
  const prisma = getPrisma();

  const ep = await prisma.episode.findFirst({
    where: { youtubeVideoId: "BscwAHouPfA" },
    select: { id: true, episodeNumber: true, title: true },
  });

  if (!ep) {
    console.log("Episode not found");
    await disconnect();
    return;
  }

  const updated = await prisma.episode.update({
    where: { id: ep.id },
    data: { status: "unavailable" },
    select: { episodeNumber: true, title: true, status: true },
  });
  console.log("Updated:", JSON.stringify(updated, null, 2));

  await disconnect();
}

main();
