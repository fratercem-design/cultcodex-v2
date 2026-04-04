import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();
  
  // Find both records
  const alisa = await prisma.person.findFirst({ where: { slug: "alisa-jordana" }, select: { id: true, displayName: true, _count: { select: { guestAppearances: true, quotes: true } } } });
  const elisa = await prisma.person.findFirst({ where: { slug: "elisa-jordana" }, select: { id: true, displayName: true, _count: { select: { guestAppearances: true, quotes: true } } } });
  const elisaMentioned = await prisma.person.findFirst({ where: { slug: "elisa" }, select: { id: true, displayName: true, _count: { select: { guestAppearances: true, quotes: true } } } });
  
  console.log("Alisa Jordana:", alisa?.displayName, alisa?._count);
  console.log("Elisa Jordana:", elisa?.displayName, elisa?._count);
  console.log("Elisa (mentioned):", elisaMentioned?.displayName, elisaMentioned?._count);
  
  if (!alisa) { console.log("Alisa Jordana not found"); await disconnect(); return; }
  
  // Merge Elisa Jordana (2 eps) and Elisa (mentioned, 0 eps) into Alisa Jordana, then rename
  const targetId = alisa.id;
  
  for (const src of [elisa, elisaMentioned]) {
    if (!src) continue;
    const appearances = await prisma.episodeGuest.findMany({ where: { personId: src.id } });
    let moved = 0, skipped = 0;
    for (const app of appearances) {
      const exists = await prisma.episodeGuest.findFirst({ where: { personId: targetId, episodeId: app.episodeId } });
      if (exists) {
        await prisma.episodeGuest.delete({ where: { episodeId_personId: { episodeId: app.episodeId, personId: src.id } } });
        skipped++;
      } else {
        await prisma.episodeGuest.update({ where: { episodeId_personId: { episodeId: app.episodeId, personId: src.id } }, data: { personId: targetId } });
        moved++;
      }
    }
    const q = await prisma.quote.updateMany({ where: { speakerPersonId: src.id }, data: { speakerPersonId: targetId } });
    await prisma.person.delete({ where: { id: src.id } });
    console.log(`"${src.displayName}" → target: ${moved} eps, ${skipped} dups, ${q.count} quotes — deleted`);
  }
  
  // Rename to Elisa Jordana with proper details
  await prisma.person.update({
    where: { id: targetId },
    data: {
      displayName: "Elisa Jordana",
      slug: "elisa-jordana",
      altNames: ["Alisa Jordana", "Alisa Jordan", "Alisa", "Elisa"],
      shortBio: "IRL streamer connected to the Howard Stern universe. Psyche regularly calls and raids her streams. Known for her dramatic on-stream moments, her connections to the wider streaming and entertainment world, and her memorable interactions with the community.",
      personType: "recurring",
    }
  });
  
  // Rebuild searchText
  const p = await prisma.person.findUnique({ where: { id: targetId }, select: { displayName: true, altNames: true, shortBio: true, loreSummary: true } });
  if (p) {
    const searchText = [p.displayName, ...(p.altNames as string[]), p.shortBio, p.loreSummary].filter(Boolean).join(" ");
    await prisma.person.update({ where: { id: targetId }, data: { searchText } });
  }
  
  const final = await prisma.person.findUnique({ where: { id: targetId }, select: { displayName: true, slug: true, altNames: true, _count: { select: { guestAppearances: true, quotes: true } } } });
  console.log(`\nFinal: ${final?.displayName} (${final?.slug}): ${final?._count.guestAppearances} eps, ${final?._count.quotes} quotes, altNames: ${JSON.stringify(final?.altNames)}`);
  
  await disconnect();
}
main();
