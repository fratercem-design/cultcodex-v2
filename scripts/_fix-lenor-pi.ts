import { getPrisma, disconnect } from "./ingest/lib";

async function mergeTo(prisma: any, primaryId: string, secondaryId: string) {
  const guests = await prisma.episodeGuest.findMany({ where: { personId: secondaryId } });
  for (const g of guests) {
    const exists = await prisma.episodeGuest.findUnique({
      where: { episodeId_personId: { episodeId: g.episodeId, personId: primaryId } },
    });
    if (exists) {
      await prisma.episodeGuest.delete({ where: { episodeId_personId: { episodeId: g.episodeId, personId: secondaryId } } });
    } else {
      await prisma.episodeGuest.update({ where: { episodeId_personId: { episodeId: g.episodeId, personId: secondaryId } }, data: { personId: primaryId } });
    }
  }
  await prisma.quote.updateMany({ where: { speakerPersonId: secondaryId }, data: { speakerPersonId: primaryId } });
  const topics = await prisma.personTopic.findMany({ where: { personId: secondaryId } });
  for (const t of topics) {
    const exists = await prisma.personTopic.findUnique({
      where: { personId_topicId: { personId: primaryId, topicId: t.topicId } },
    });
    if (exists) {
      await prisma.personTopic.delete({ where: { personId_topicId: { personId: secondaryId, topicId: t.topicId } } });
    } else {
      await prisma.personTopic.update({ where: { personId_topicId: { personId: secondaryId, topicId: t.topicId } }, data: { personId: primaryId } });
    }
  }
  try {
    const mentions = await prisma.episodeMention.findMany({ where: { personId: secondaryId } });
    for (const m of mentions) {
      const exists = await prisma.episodeMention.findUnique({
        where: { episodeId_personId: { episodeId: m.episodeId, personId: primaryId } },
      });
      if (exists) {
        await prisma.episodeMention.delete({ where: { episodeId_personId: { episodeId: m.episodeId, personId: secondaryId } } });
      } else {
        await prisma.episodeMention.update({ where: { episodeId_personId: { episodeId: m.episodeId, personId: secondaryId } }, data: { personId: primaryId } });
      }
    }
  } catch {}
  try {
    const lore = await prisma.personLoreEntry.findMany({ where: { personId: secondaryId } });
    for (const l of lore) {
      const exists = await prisma.personLoreEntry.findUnique({
        where: { personId_loreEntryId: { personId: primaryId, loreEntryId: l.loreEntryId } },
      });
      if (exists) {
        await prisma.personLoreEntry.delete({ where: { personId_loreEntryId: { personId: secondaryId, loreEntryId: l.loreEntryId } } });
      } else {
        await prisma.personLoreEntry.update({ where: { personId_loreEntryId: { personId: secondaryId, loreEntryId: l.loreEntryId } }, data: { personId: primaryId } });
      }
    }
  } catch {}
  await prisma.person.delete({ where: { id: secondaryId } });
}

async function main() {
  const prisma = getPrisma();

  // 1. Lenor = Lanore the cat -> merge into psyches-cats
  console.log("=== Merging Lenor -> psyches-cats ===");
  const lenor = await prisma.person.findUnique({ where: { slug: "lenor" } });
  const cats = await prisma.person.findUnique({ where: { slug: "psyches-cats" } });
  if (lenor && cats) {
    await mergeTo(prisma, cats.id, lenor.id);
    console.log("  OK: Lenor merged into psyches-cats");
  } else {
    console.log("  SKIP: not found");
  }

  // 2. Pi = Piranha. Rename "pie" to "Piranha", merge pie-p, piranha-pie, pi-pie into it
  console.log("\n=== Pi = Piranha ===");
  const pieRecord = await prisma.person.findUnique({ where: { slug: "pie" } });
  if (pieRecord) {
    await prisma.person.update({
      where: { slug: "pie" },
      data: {
        displayName: "Piranha",
        slug: "piranha",
        altNames: [...new Set([...pieRecord.altNames, "Pie", "Pi", "Piranha/Pie", "Pie/P"])],
      },
    });
    console.log("  Renamed pie -> piranha");

    const piranha = await prisma.person.findUnique({ where: { slug: "piranha" } });
    if (piranha) {
      for (const sec of ["pie-p", "piranha-pie", "pi-pie"]) {
        const s = await prisma.person.findUnique({ where: { slug: sec } });
        if (s) {
          await mergeTo(prisma, piranha.id, s.id);
          console.log("  OK:", sec, "-> piranha");
        }
      }
    }
  } else {
    console.log("  pie not found");
  }

  // 3. Clean Pi from Paige altNames (was incorrectly merged earlier)
  console.log("\n=== Cleaning Paige ===");
  const paige = await prisma.person.findUnique({ where: { slug: "paige" } });
  if (paige) {
    const cleaned = paige.altNames.filter((a: string) => !["Pi", "Pi/Paige"].includes(a));
    await prisma.person.update({ where: { slug: "paige" }, data: { altNames: cleaned } });
    console.log("  Removed Pi from Paige altNames");
  }

  const count = await prisma.person.count();
  console.log("\nFinal people count:", count);
  await disconnect();
}

main().catch(async (e) => { console.error(e); await disconnect(); process.exit(1); });
