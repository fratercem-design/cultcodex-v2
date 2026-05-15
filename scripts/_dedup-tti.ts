/**
 * Merge the duplicate "Thing That Is" record into the canonical "ThingThatIs"
 * record. The "Thing That Is/Mason" hybrid record is intentionally LEFT ALONE
 * per the project rule that ThingThatIs and Mason are different people.
 *
 * Dry run by default. Pass --execute to apply.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const KEEPER_ID = "cmo3e3awl066ucktt1u82nus5"; // "ThingThatIs" (slug=thingthatis, has altNames)
const DUPE_ID = "cmoc5l5ee05s72ottovrkucn5"; // "Thing That Is" (slug=thing-that-is)

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes("--execute");

  const keeper = await prisma.person.findUnique({
    where: { id: KEEPER_ID },
    select: { id: true, displayName: true, slug: true, altNames: true },
  });
  const dupe = await prisma.person.findUnique({
    where: { id: DUPE_ID },
    select: { id: true, displayName: true, slug: true },
  });

  if (!keeper) {
    console.error(`Keeper ${KEEPER_ID} not found — aborting.`);
    process.exit(1);
  }
  if (!dupe) {
    console.log(`Dupe ${DUPE_ID} not found — already merged. Nothing to do.`);
    await prisma.$disconnect();
    return;
  }

  const dupeGuests = await prisma.episodeGuest.findMany({
    where: { personId: DUPE_ID },
    select: { episodeId: true },
  });
  const dupeQuotes = await prisma.quote.count({ where: { speakerPersonId: DUPE_ID } });
  const dupeMentions = await prisma.episodeMentionedPerson.count({
    where: { personId: DUPE_ID },
  });

  console.log(`Keeper:  "${keeper.displayName}" (slug=${keeper.slug})`);
  console.log(`Dupe:    "${dupe.displayName}" (slug=${dupe.slug})`);
  console.log(`Dupe payload: ${dupeGuests.length} guest, ${dupeQuotes} quote, ${dupeMentions} mention rows`);

  if (!execute) {
    console.log("\nDry run. Pass --execute to apply.");
    await prisma.$disconnect();
    return;
  }

  // Find episodes the keeper already appears in as guest, to avoid PK collisions.
  const keeperGuestEpisodes = new Set(
    (
      await prisma.episodeGuest.findMany({
        where: { personId: KEEPER_ID },
        select: { episodeId: true },
      })
    ).map((g) => g.episodeId),
  );

  console.log("\nMoving guest appearances...");
  for (const g of dupeGuests) {
    if (keeperGuestEpisodes.has(g.episodeId)) {
      // Keeper already on this episode — drop the dupe row.
      await prisma.episodeGuest.delete({
        where: { episodeId_personId: { episodeId: g.episodeId, personId: DUPE_ID } },
      });
      console.log(`  - dropped dupe guest row on ep ${g.episodeId} (keeper already present)`);
    } else {
      await prisma.episodeGuest.update({
        where: { episodeId_personId: { episodeId: g.episodeId, personId: DUPE_ID } },
        data: { personId: KEEPER_ID },
      });
      console.log(`  - moved guest row on ep ${g.episodeId} -> keeper`);
    }
  }

  // Quotes
  await prisma.quote.updateMany({
    where: { speakerPersonId: DUPE_ID },
    data: { speakerPersonId: KEEPER_ID },
  });

  // Mentions — re-key, avoiding collisions
  const keeperMentionEpisodes = new Set(
    (
      await prisma.episodeMentionedPerson.findMany({
        where: { personId: KEEPER_ID },
        select: { episodeId: true },
      })
    ).map((m) => m.episodeId),
  );
  const dupeMentionRows = await prisma.episodeMentionedPerson.findMany({
    where: { personId: DUPE_ID },
  });
  for (const m of dupeMentionRows) {
    if (keeperMentionEpisodes.has(m.episodeId)) {
      await prisma.episodeMentionedPerson.delete({
        where: { episodeId_personId: { episodeId: m.episodeId, personId: DUPE_ID } },
      });
    } else {
      await prisma.episodeMentionedPerson.update({
        where: { episodeId_personId: { episodeId: m.episodeId, personId: DUPE_ID } },
        data: { personId: KEEPER_ID },
      });
    }
  }

  // Topics, lore, related — re-key with collision skipping
  for (const [model, pkParts] of [
    ["personTopic", ["personId", "topicId"]],
    ["personLore", ["personId", "loreEntryId"]],
  ] as const) {
    const dupeRows = await (prisma as any)[model].findMany({
      where: { personId: DUPE_ID },
    });
    for (const row of dupeRows) {
      const otherFieldName = pkParts[1];
      const otherValue = row[otherFieldName];
      const exists = await (prisma as any)[model].findUnique({
        where: {
          [`personId_${otherFieldName}`]: { personId: KEEPER_ID, [otherFieldName]: otherValue },
        },
      });
      if (exists) {
        await (prisma as any)[model].delete({
          where: {
            [`personId_${otherFieldName}`]: { personId: DUPE_ID, [otherFieldName]: otherValue },
          },
        });
      } else {
        await (prisma as any)[model].update({
          where: {
            [`personId_${otherFieldName}`]: { personId: DUPE_ID, [otherFieldName]: otherValue },
          },
          data: { personId: KEEPER_ID },
        });
      }
    }
  }

  // Add the dupe's display name to keeper's altNames if not already there
  const newAltNames = Array.from(
    new Set([...(keeper.altNames ?? []), dupe.displayName]),
  );
  await prisma.person.update({
    where: { id: KEEPER_ID },
    data: { altNames: newAltNames },
  });

  // Finally delete the dupe person record
  await prisma.person.delete({ where: { id: DUPE_ID } });
  console.log(`\nDeleted dupe person record. Keeper altNames now: ${JSON.stringify(newAltNames)}`);

  // Report
  const finalGuests = await prisma.episodeGuest.count({ where: { personId: KEEPER_ID } });
  const finalQuotes = await prisma.quote.count({ where: { speakerPersonId: KEEPER_ID } });
  console.log(`\nFinal: ThingThatIs has ${finalGuests} guest appearances, ${finalQuotes} quotes.`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
