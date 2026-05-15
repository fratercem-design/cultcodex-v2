import { getPrisma, disconnect } from "./ingest/lib";

/**
 * BIO CLEANUP — Rewrite bios that use negative, slanderous, or judgmental language.
 * Keep factual descriptions, remove editorializing.
 */

const prisma = getPrisma();

// slug -> new bio (null = leave as-is, it's fine)
const BIO_REWRITES: Record<string, string | null> = {
  // KEEP AS-IS (factual or fine in context)
  "rusha": "The host's Russian friend who is the subject of a musical tribute, described as wild, fearless, and supportive",
  "shane": "Panel participant who had a notable exchange with Janet",
  "fuzzy-bear": "Panel participant known for lively commentary",
  "krog": "Guest who had a heated exchange with Raging Demon before leaving the panel",
  "drunk-person": "An individual who joined for a confrontational conversation with the host",
  "sati": null, // mythology figure, "self-immolated" is factual to the story
  "pg": "Panel participant involved in a dispute with BJ",
  "sig": "Recurring contrarian guest known for provocative debate",
  "yumi": "Indonesian teacher and panel regular known for strong political opinions",
  "jay-dog": "Recurring guest and moderator involved in community disputes",
  "host": "The host of the show, known as Psyche or Trix, who leads panel discussions on a wide range of topics",
  "crystal-marie": "Recurring panel figure who had a notable conflict with Christine",
  "raging-demon": "Recurring guest known for intense panel interactions and past community conflicts",
  "uncle-scram": "Guest who shared stories about his past and worked to make peace with other guests",
  "marilyn-manson": null, // public figure, "controversial" is fair, "shock-rock" is a genre
  "blogger": "A livestreamer in his mid-40s who focuses on other content creators",
  "justine": null, // "fat" was a false positive — "father" contains "fat"
  "chicago-kentucky-caller": "A caller whose claimed hometown became a running debate on the show",
  "rain": "Stream personality mentioned for interactions across multiple channels",
  "aaron-carter": "Deceased celebrity discussed in relation to online community dynamics",
  "allied-master-computer": "Guest discussed for sharing personal information and unclear motivations",
  "unnamed-person": "Individual involved in a physical confrontation with Gotti",
  "sig-signal66": "Recurring guest known for drinking on stream and provocative language, owns a black cat",
  "ty-t-ty-desantis": "A man in his 40s from Houston, Texas who shares life experiences and wisdom on the panel",
  "kanye-west": null, // public figure, "controversial" is fair use
  "beat-the-witch": "Female streamer who was a frequent topic of discussion, particularly by Sam",
  "andrew-wilson": null, // minor reference, leave
  "charlie-kirk": null, // public figure
  "eric": "Alisa's friend visiting from out of town, described as sweet and eccentric",
  "chris-k": "Recurring guest known for extreme political views and provocative statements",
  "groovy-jimmy": "Former co-host and friend of Psyche who had a falling out over personal disputes",
  "alexander-mcqueen": "Recurring guest known for energetic behavior and community involvement, formerly a moderator",
};

async function main() {
  console.log("BIO CLEANUP");
  console.log("===========\n");

  let updated = 0;
  let skipped = 0;

  for (const [slug, newBio] of Object.entries(BIO_REWRITES)) {
    if (newBio === null) {
      skipped++;
      continue;
    }

    const person = await prisma.person.findUnique({ where: { slug } });
    if (!person) {
      console.log(`  SKIP: ${slug} not found`);
      continue;
    }

    await prisma.person.update({
      where: { slug },
      data: { shortBio: newBio },
    });
    updated++;
    console.log(`  OK: ${person.displayName} — bio updated`);
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`DONE: ${updated} bios rewritten, ${skipped} left as-is`);

  await disconnect();
}

main().catch(async (e) => { console.error(e); await disconnect(); process.exit(1); });
