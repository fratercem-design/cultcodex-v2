// Fix episodes with wrong contentType based on duration
import { getPrisma, disconnect } from "./lib";

async function main() {
  const prisma = getPrisma();

  const eps = await prisma.episode.findMany({
    where: { contentType: "original", duration: { not: null } },
    select: { id: true, title: true, duration: true },
  });

  console.log(`Episodes marked 'original' with duration: ${eps.length}`);

  let fixedLivestream = 0;
  let fixedShort = 0;

  for (const ep of eps) {
    if (!ep.duration) continue;
    const parts = ep.duration.split(":").map(Number);
    let secs = 0;
    if (parts.length === 3) secs = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) secs = parts[0] * 60 + parts[1];
    else continue;

    if (secs > 3600) {
      await prisma.episode.update({ where: { id: ep.id }, data: { contentType: "livestream" } });
      fixedLivestream++;
    } else if (secs <= 90) {
      await prisma.episode.update({ where: { id: ep.id }, data: { contentType: "short" } });
      fixedShort++;
    }
  }

  // Content type breakdown
  const byType = await prisma.episode.groupBy({ by: ["contentType"], _count: true });
  console.log(`\nFixed to livestream: ${fixedLivestream}`);
  console.log(`Fixed to short: ${fixedShort}`);
  console.log(`\nContent type breakdown:`);
  for (const row of byType) {
    console.log(`  ${row.contentType}: ${row._count}`);
  }

  await disconnect();
}

main();
