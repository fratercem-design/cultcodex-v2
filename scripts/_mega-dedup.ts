import { getPrisma, disconnect } from "./ingest/lib";

/**
 * MEGA DEDUP — Fine-tooth comb pass over all 652 people.
 *
 * Strategy: merge secondary slugs into primary slug by reassigning
 * EpisodeGuest, Quote, PersonTopic records. Then delete the secondary.
 *
 * RULES:
 * - ThingThatIs and Mason are DIFFERENT people — do NOT merge
 * - Psyche is male, Trix is his cat
 */

const prisma = getPrisma();

const MERGE_GROUPS: { primary: string; secondaries: string[] }[] = [
  // PSYCHE (the host)
  {
    primary: "psyche",
    secondaries: [
      "psyche-trix", "trix-psyche", "psych", "psyche-psych",
      "host-psyche", "host-psyche-trix", "host-trix",
      "father-psyche", "father-psyche-psyche-trix", "father-psyche-trix",
      "john-psyche-trix", "psyche-trix-john-bates", "psyche-trix-tracy",
      "psyche-awakens", "etruth",
      "tracy", "tracy-x", "tracy-x-tracy",
      "emma-psyche",
      "host-narrator", "host-moderator",
      "unknown-host", "unknown-host-moderator",
    ],
  },
  // BEA (Beta/VA/Vita/Bita/Be)
  {
    primary: "bea",
    secondaries: [
      "beta", "va", "bita", "vita", "be",
      "ba-bea", "bea-beanie", "bea-beas-kitties", "bea-va",
      "beas-kitties", "beata", "beatas",
    ],
  },
  // TIGER BUTTERFLY
  {
    primary: "tiger-butterfly",
    secondaries: [
      "tiger", "butterfly", "tig-tiger-butterfly",
      "laura-tiger-butterfly", "bea-v-tiger-butterfly",
    ],
  },
  // ALEXANDRA MAYERS
  {
    primary: "alexandra-mayers",
    secondaries: ["alex-mayer"],
  },
  // BENNY BLANCO
  {
    primary: "benny-blanco",
    secondaries: ["benny", "benny-benny-blanco", "blanco", "benny-brand"],
  },
  // BLADE (Big Tall Sexy Rob)
  {
    primary: "blade",
    secondaries: [
      "big-rob-blade", "blade-big-tall", "big-tall",
      "big-tall-sexy-rob", "big-tall-rob-sexy-rob", "big-tall-sex",
    ],
  },
  // BRONZE BIRD
  {
    primary: "bronze-bird",
    secondaries: [
      "bronze", "bronberg", "bronzeberg", "bronzeburg",
      "bronzbird-bronberg", "bronze-chicken",
    ],
  },
  // GHOST
  {
    primary: "ghost",
    secondaries: ["crucible", "crucible-ghost", "ghost-crucible-ghost"],
  },
  // CLUMSY CLAIRVOYANT
  {
    primary: "clumsy-clairvoyant",
    secondaries: ["clumsy", "clumsy-clair", "clumsy-clairvoyance"],
  },
  // CRYSTAL MARIE
  {
    primary: "crystal-marie",
    secondaries: ["crystal"],
  },
  // EMMA LEVIATHAN
  {
    primary: "emma-leviathan",
    secondaries: ["emma", "leviathan"],
  },
  // FLIRTY DIAMOND
  {
    primary: "flirty-diamond",
    secondaries: ["flirty", "diamond", "flirty-diamond-david"],
  },
  // JANET (Empress Janet)
  {
    primary: "janet",
    secondaries: ["empress-janet", "janet-empress-janet"],
  },
  // JAMIE
  { primary: "jamie", secondaries: ["jamie-cowboys"] },
  // JAY DOG
  { primary: "jay-dog", secondaries: ["jay-dog-jd"] },
  // JOKER
  { primary: "joker", secondaries: ["joker-tv"] },
  // JONAH (Chona)
  { primary: "jonah", secondaries: ["chona", "jonah-chona"] },
  // CARL
  { primary: "carl", secondaries: ["ld", "carl-ld", "carl-aging-demon"] },
  // JIM NICK
  { primary: "jim-nick", secondaries: ["jimnik", "jim-jimny", "jim-jimny-jimnik"] },
  // MICHAEL
  { primary: "michael", secondaries: ["michael-l", "michael-leguizamon"] },
  // MISER
  { primary: "miser", secondaries: ["maser", "miser-maser"] },
  // MUSIC BIZ MARTY
  { primary: "music-biz-marty", secondaries: ["marty", "music-is-marty"] },
  // NICK
  { primary: "nick", secondaries: ["nick-nitro-nick"] },
  // NICK JOHNSON
  {
    primary: "nick-johnson",
    secondaries: [
      "nick-johnson-erica-abadu", "nick-johnson-erica-b",
      "nick-wayne-johnson", "nick-nick-johnson",
    ],
  },
  // NICK WINTERS
  { primary: "nick-winters", secondaries: ["nick-nick-winters-syrup-wizard"] },
  // PAIGE (Prairie Paige / Pi)
  {
    primary: "paige",
    secondaries: [
      "prairie-paige", "prairie-page", "prairie",
      "paige-prairie-paige", "pi-paige", "pi",
    ],
  },
  // RANDO
  { primary: "rando", secondaries: ["random-guy-rando"] },
  // SAM MAN
  { primary: "sam", secondaries: ["arthur-sam-man-elo"] },
  // SCHOOL OF ATHENS
  {
    primary: "school-of-athens",
    secondaries: ["athens-school-of-athens", "isaiah-school-of-athens"],
  },
  // SPUNKY
  { primary: "spunky", secondaries: ["stephanie", "spunky-stephanie"] },
  // SUMMER
  {
    primary: "summer",
    secondaries: ["summer-dickerson-hotmesssummer", "summer-hot-summer", "sweet-summer"],
  },
  // TERESA (Traveling Gypsy)
  {
    primary: "teresa",
    secondaries: [
      "traveling-gypsy", "traveling-gypsy-teresa",
      "teresa-traveling-gypsy", "ty-traveling-gypsy", "gypsy",
    ],
  },
  // TREVOR
  { primary: "trevor", secondaries: ["trevor-ryan"] },
  // JOE
  { primary: "joe", secondaries: ["joe-shipley"] },
  // LENOR
  { primary: "lenor", secondaries: ["lenora", "lenore", "lenor-lunar"] },
  // MEER
  {
    primary: "meer",
    secondaries: ["meer-caesar", "caesar-meer", "meer-me", "cesar-me"],
  },
  // MEEZER
  { primary: "meezer", secondaries: ["meezer-measor"] },
  // ROGUE NOMAD
  { primary: "rogue-nomad", secondaries: ["rogue"] },
  // BARRY
  { primary: "barry", secondaries: ["barry-the-turtle", "barry-the-turtle-tortuga"] },
  // ARUSHI
  { primary: "arushi", secondaries: ["arushi-roshi"] },
  // SAMANTHA
  { primary: "samantha", secondaries: ["samantha-avery"] },
  // VICTORIA
  { primary: "victoria", secondaries: ["victoria-jay"] },
  // SHAN
  { primary: "shan", secondaries: ["shan-camp"] },
  // LOLA
  { primary: "lola", secondaries: ["lola-laura", "laura"] },
  // SLEEPING ENERGY
  { primary: "sleeping-energy", secondaries: ["sleeping"] },
  // MINNIE MANSON
  { primary: "minnie-manson", secondaries: ["minnie-mans"] },
  // GROOVY JIMMY
  { primary: "groovy-jimmy", secondaries: ["groovy"] },
  // UNCOMFORTABLY NUMB
  { primary: "uncomfortably-numb", secondaries: ["katie-uncomfortably-numb"] },
  // RAGING DEMON
  { primary: "raging-demon", secondaries: ["demon"] },
  // BRADLEY
  { primary: "bradley", secondaries: ["bradley-crusty"] },
  // DJ ELECTRA
  { primary: "dj-electra", secondaries: ["electra"] },
  // NORCAL
  { primary: "norcal", secondaries: ["norca"] },
  // PSYCHE'S CATS
  { primary: "psyches-cats", secondaries: ["psyches-cat", "lenore-pie-mr-kitty", "mr-trix", "trix"] },
  // CRACKODANA
  { primary: "crackodana", secondaries: ["crackodan"] },
  // FUZZY BEAR
  { primary: "fuzzy-bear", secondaries: ["fuzzy"] },
  // UNKNOWN SPEAKERS — consolidate
  {
    primary: "unknown-speaker",
    secondaries: [
      "unknown-speaker-1", "unknown-speaker-2", "unknown-speaker-3",
      "unknown-speaker-performer",
    ],
  },
  // UNKNOWN GUESTS — consolidate
  {
    primary: "unknown-guest",
    secondaries: [
      "unknown-guests", "unknown-female-guest", "unknown-male-guest",
      "unnamed-guest", "unnamed-guests", "unidentified-guest",
      "anonymous-guest", "guest", "the-guest",
      "various-guests", "unspecified-guest", "unspecified-guests",
      "open-panel-guests",
    ],
  },
  // UNKNOWN PARTICIPANTS — consolidate
  {
    primary: "unknown-participant",
    secondaries: [
      "unknown-participant-1", "unknown-participant-2",
      "unknown-participants",
      "unnamed-participant", "unnamed-participant-1", "unnamed-participant-2",
      "unnamed-speaker-1", "unnamed-speaker-2",
      "unknown-rapper-1", "unknown-rapper-2",
    ],
  },
  // RECURRING PANEL — consolidate
  {
    primary: "recurring-panel",
    secondaries: [
      "recurring-panel-guest-1", "recurring-panel-guest-2",
      "recurring-panelist", "recurring-panelist-1", "recurring-panelist-2",
      "recurring-guests", "recurring-panel-guests",
    ],
  },
];

async function renameEmmaAlexandra() {
  const record = await prisma.person.findUnique({ where: { slug: "emma-alexandra" } });
  if (!record) {
    console.log("  emma-alexandra not found, skipping");
    return;
  }
  await prisma.person.update({
    where: { slug: "emma-alexandra" },
    data: {
      displayName: "Emma (Streamer)",
      slug: "emma-streamer",
      searchText: "emma streamer leaving streaming universe",
    },
  });
  console.log("  Renamed emma-alexandra -> emma-streamer");
}

async function mergePerson(primarySlug: string, secondarySlug: string): Promise<boolean> {
  const primary = await prisma.person.findUnique({ where: { slug: primarySlug } });
  const secondary = await prisma.person.findUnique({ where: { slug: secondarySlug } });

  if (!primary) {
    console.log(`    WARN: Primary ${primarySlug} not found`);
    return false;
  }
  if (!secondary) return false;

  const pId = primary.id;
  const sId = secondary.id;

  // 1. EpisodeGuest
  const guests = await prisma.episodeGuest.findMany({ where: { personId: sId } });
  for (const g of guests) {
    const exists = await prisma.episodeGuest.findUnique({
      where: { episodeId_personId: { episodeId: g.episodeId, personId: pId } },
    });
    if (exists) {
      await prisma.episodeGuest.delete({
        where: { episodeId_personId: { episodeId: g.episodeId, personId: sId } },
      });
    } else {
      await prisma.episodeGuest.update({
        where: { episodeId_personId: { episodeId: g.episodeId, personId: sId } },
        data: { personId: pId },
      });
    }
  }

  // 2. Quotes
  await prisma.quote.updateMany({ where: { speakerPersonId: sId }, data: { speakerPersonId: pId } });

  // 3. PersonTopic
  const topics = await prisma.personTopic.findMany({ where: { personId: sId } });
  for (const t of topics) {
    const exists = await prisma.personTopic.findUnique({
      where: { personId_topicId: { personId: pId, topicId: t.topicId } },
    });
    if (exists) {
      await prisma.personTopic.delete({
        where: { personId_topicId: { personId: sId, topicId: t.topicId } },
      });
    } else {
      await prisma.personTopic.update({
        where: { personId_topicId: { personId: sId, topicId: t.topicId } },
        data: { personId: pId },
      });
    }
  }

  // 4. EpisodeMention
  try {
    const mentions = await (prisma as any).episodeMention.findMany({ where: { personId: sId } });
    for (const m of mentions) {
      const exists = await (prisma as any).episodeMention.findUnique({
        where: { episodeId_personId: { episodeId: m.episodeId, personId: pId } },
      });
      if (exists) {
        await (prisma as any).episodeMention.delete({
          where: { episodeId_personId: { episodeId: m.episodeId, personId: sId } },
        });
      } else {
        await (prisma as any).episodeMention.update({
          where: { episodeId_personId: { episodeId: m.episodeId, personId: sId } },
          data: { personId: pId },
        });
      }
    }
  } catch {}

  // 5. PersonLoreEntry
  try {
    const lore = await (prisma as any).personLoreEntry.findMany({ where: { personId: sId } });
    for (const l of lore) {
      const exists = await (prisma as any).personLoreEntry.findUnique({
        where: { personId_loreEntryId: { personId: pId, loreEntryId: l.loreEntryId } },
      });
      if (exists) {
        await (prisma as any).personLoreEntry.delete({
          where: { personId_loreEntryId: { personId: sId, loreEntryId: l.loreEntryId } },
        });
      } else {
        await (prisma as any).personLoreEntry.update({
          where: { personId_loreEntryId: { personId: sId, loreEntryId: l.loreEntryId } },
          data: { personId: pId },
        });
      }
    }
  } catch {}

  // 6. Merge altNames
  const newAltNames = new Set([
    ...primary.altNames,
    secondary.displayName,
    ...secondary.altNames,
  ]);
  newAltNames.delete(primary.displayName);

  await prisma.person.update({
    where: { id: pId },
    data: { altNames: [...newAltNames] },
  });

  // 7. Delete secondary
  await prisma.person.delete({ where: { id: sId } });
  return true;
}

async function main() {
  console.log("MEGA DEDUP - Fine Tooth Comb");
  console.log("============================\n");

  const before = await prisma.person.count();
  console.log(`People before: ${before}\n`);

  // Step 1: Rename Emma/Alexandra
  console.log("-- Step 1: Rename Emma/Alexandra --");
  await renameEmmaAlexandra();

  // Step 2: Process merge groups
  let totalMerged = 0;

  for (const group of MERGE_GROUPS) {
    if (group.secondaries.length === 0) continue;

    const validSeconds: string[] = [];
    for (const sec of group.secondaries) {
      const exists = await prisma.person.findUnique({ where: { slug: sec } });
      if (exists) validSeconds.push(sec);
    }

    if (validSeconds.length === 0) continue;

    console.log(`\n-- ${group.primary} <- [${validSeconds.join(", ")}] --`);

    for (const sec of validSeconds) {
      const merged = await mergePerson(group.primary, sec);
      if (merged) {
        totalMerged++;
        console.log(`    OK: ${sec} -> ${group.primary}`);
      }
    }
  }

  const after = await prisma.person.count();
  console.log(`\n${"=".repeat(50)}`);
  console.log(`DONE: ${totalMerged} records merged`);
  console.log(`People: ${before} -> ${after} (removed ${before - after})`);

  await disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await disconnect();
  process.exit(1);
});
