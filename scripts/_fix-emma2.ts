import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();
  
  const EMMA_ALEX_ID = "cmn46uzw7011rb0tte1aajtwc"; // Emma/Alexandra
  const EMMA_LEV_ID = "emma-leviathan"; // need actual ID
  
  // Get Emma Leviathan's actual ID
  const emmaLev = await prisma.person.findFirst({
    where: { slug: "emma-leviathan" },
    select: { id: true, displayName: true, slug: true }
  });
  
  if (!emmaLev) { console.log("Emma Leviathan not found"); await disconnect(); return; }
  
  console.log(`Emma Leviathan ID: ${emmaLev.id}`);
  
  // Check EP.1260 summary for context
  const ep = await prisma.episode.findFirst({
    where: { episodeNumber: 1260 },
    select: { summaryLong: true, title: true }
  });
  console.log(`\nEP.1260: ${ep?.title}`);
  console.log(ep?.summaryLong?.substring(0, 500));
  
  // Move EP.1260 appearance from Emma/Alexandra to Emma Leviathan
  const appearance = await prisma.episodeGuest.findFirst({
    where: { personId: EMMA_ALEX_ID },
  });
  
  if (!appearance) { console.log("No appearance found"); await disconnect(); return; }
  
  // Check if Emma Leviathan already appears in EP.1260
  const existing = await prisma.episodeGuest.findFirst({
    where: { personId: emmaLev.id, episodeId: appearance.episodeId }
  });
  
  if (existing) {
    // Just delete the duplicate
    await prisma.episodeGuest.delete({
      where: { episodeId_personId: { episodeId: appearance.episodeId, personId: EMMA_ALEX_ID } }
    });
    console.log("Deleted duplicate appearance (Emma Leviathan already in EP.1260)");
  } else {
    // Reassign to Emma Leviathan
    await prisma.episodeGuest.update({
      where: { episodeId_personId: { episodeId: appearance.episodeId, personId: EMMA_ALEX_ID } },
      data: { personId: emmaLev.id }
    });
    console.log("Moved EP.1260 appearance to Emma Leviathan");
  }
  
  // Delete the empty Emma/Alexandra record
  await prisma.person.delete({ where: { id: EMMA_ALEX_ID } });
  console.log("Deleted 'Emma/Alexandra' record");
  
  // Update Emma Leviathan with better info
  await prisma.person.update({
    where: { id: emmaLev.id },
    data: {
      altNames: ["Emma", "Satan's Ex-Wife"],
      shortBio: "Tarot reader and streamer known as 'Satan's Ex-Wife.' Fellow tarot content creator who built a following of over 16,000 YouTube subscribers. Recurring panel guest and community figure in the streaming world.",
    }
  });
  
  // Rebuild searchText
  const updated = await prisma.person.findUnique({
    where: { id: emmaLev.id },
    select: { displayName: true, altNames: true, shortBio: true, loreSummary: true }
  });
  if (updated) {
    const searchText = [updated.displayName, ...updated.altNames, updated.shortBio, updated.loreSummary].filter(Boolean).join(" ");
    await prisma.person.update({ where: { id: emmaLev.id }, data: { searchText } });
  }
  
  // Final count
  const final = await prisma.person.findUnique({
    where: { id: emmaLev.id },
    select: { displayName: true, _count: { select: { guestAppearances: true, quotes: true } } }
  });
  console.log(`\nEmma Leviathan now: ${final?._count.guestAppearances} eps, ${final?._count.quotes} quotes`);
  
  await disconnect();
}
main();
