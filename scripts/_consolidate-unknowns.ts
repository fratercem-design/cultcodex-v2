/**
 * Consolidate all unnamed, "guest", and non-specific person profiles into
 * a single canonical "Unknown Guest" record (slug: unknown-guest).
 *
 * Covers:
 *  - unknown-speaker*, unknown-guest*, unknown-participant*, unknown-*
 *  - unnamed-*, unidentified-*, anonymous-*, unspecified-*, various-*
 *  - recurring-panel*, guest, the-guest, open-panel-guests
 *  - Any remaining person whose displayName matches generic placeholder patterns
 *
 * Usage:  npx tsx scripts/_consolidate-unknowns.ts
 */
import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

const prisma = getPrisma();

const CANONICAL_SLUG = "unknown-guest";
const CANONICAL_NAME = "Unknown Guest";

// Hard-coded secondary slugs to absorb
const SECONDARY_SLUGS = [
  // Speakers
  "unknown-speaker", "unknown-speaker-1", "unknown-speaker-2", "unknown-speaker-3",
  "unknown-speaker-performer",
  // Participants
  "unknown-participant", "unknown-participant-1", "unknown-participant-2",
  "unknown-participants",
  "unnamed-participant", "unnamed-participant-1", "unnamed-participant-2",
  "unnamed-speaker-1", "unnamed-speaker-2",
  "unknown-rapper-1", "unknown-rapper-2",
  // Guest variants
  "unknown-guests", "unknown-female-guest", "unknown-male-guest",
  "unnamed-guest", "unnamed-guests", "unidentified-guest",
  "anonymous-guest", "guest", "the-guest",
  "various-guests", "unspecified-guest", "unspecified-guests",
  "open-panel-guests",
  // Recurring panel
  "recurring-panel", "recurring-panel-guest-1", "recurring-panel-guest-2",
  "recurring-panelist", "recurring-panelist-1", "recurring-panelist-2",
  "recurring-guests", "recurring-panel-guests",
  // Other generic patterns
  "unnamed", "unknown", "unknown-person", "unidentified",
  "unknown-male", "unknown-female", "unknown-user",
  "chat-member", "viewer", "audience-member",
];

// Regex patterns to catch any remaining generic profiles by displayName
const GENERIC_NAME_PATTERNS = [
  /^unknown\b/i,
  /^unnamed\b/i,
  /^unidentified\b/i,
  /^anonymous\b/i,
  /^unspecified\b/i,
  /^various\s+guests?$/i,
  /^recurring\s+panel/i,
  /^open.panel.guests?$/i,
  /^guest\s*\d*$/i,
  /^the\s+guest$/i,
];

async function ensureCanonical(): Promise<string> {
  let primary = await prisma.person.findUnique({ where: { slug: CANONICAL_SLUG } });
  if (!primary) {
    primary = await prisma.person.create({
      data: {
        displayName: CANONICAL_NAME,
        slug: CANONICAL_SLUG,
        personType: "guest",
        altNames: [],
        searchText: "unknown guest unnamed unidentified anonymous",
      },
    });
    console.log(`  Created canonical record: ${CANONICAL_SLUG}`);
  } else {
    console.log(`  Canonical record exists: ${primary.displayName} (${CANONICAL_SLUG})`);
  }
  return primary.id;
}

async function mergePerson(primaryId: string, secondarySlug: string): Promise<boolean> {
  const secondary = await prisma.person.findUnique({ where: { slug: secondarySlug } });
  if (!secondary) return false;

  const sId = secondary.id;
  const pId = primaryId;

  if (sId === pId) return false;

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
      await prisma.personTopic.delete({ where: { personId_topicId: { personId: sId, topicId: t.topicId } } });
    } else {
      await prisma.personTopic.update({ where: { personId_topicId: { personId: sId, topicId: t.topicId } }, data: { personId: pId } });
    }
  }

  // 4. EpisodeMention
  try {
    const mentions = await (prisma as any).episodeMentionedPerson.findMany({ where: { personId: sId } });
    for (const m of mentions) {
      const exists = await (prisma as any).episodeMentionedPerson.findUnique({
        where: { episodeId_personId: { episodeId: m.episodeId, personId: pId } },
      });
      if (exists) {
        await (prisma as any).episodeMentionedPerson.delete({
          where: { episodeId_personId: { episodeId: m.episodeId, personId: sId } },
        });
      } else {
        await (prisma as any).episodeMentionedPerson.update({
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

  // 6. Merge altNames into canonical
  const primary = await prisma.person.findUniqueOrThrow({ where: { id: pId } });
  const newAltNames = new Set([
    ...primary.altNames,
    secondary.displayName,
    ...secondary.altNames,
  ]);
  newAltNames.delete(primary.displayName);
  newAltNames.delete(CANONICAL_NAME);

  await prisma.person.update({
    where: { id: pId },
    data: { altNames: [...newAltNames] },
  });

  // 7. Delete secondary
  await prisma.person.delete({ where: { id: sId } });
  return true;
}

async function findPatternMatches(canonicalId: string): Promise<string[]> {
  const all = await prisma.person.findMany({
    where: {
      NOT: { id: canonicalId },
      personType: { not: "host" },
    },
    select: { slug: true, displayName: true },
  });

  return all
    .filter(p => GENERIC_NAME_PATTERNS.some(re => re.test(p.displayName)))
    .map(p => p.slug);
}

async function main() {
  console.log("═══ CONSOLIDATE UNKNOWNS ═══\n");

  const before = await prisma.person.count();
  console.log(`People before: ${before}\n`);

  // 1. Ensure canonical record
  const canonicalId = await ensureCanonical();

  // 2. Merge hard-coded secondary slugs
  let merged = 0;
  console.log("\n── Hard-coded secondaries ──");
  for (const slug of SECONDARY_SLUGS) {
    if (slug === CANONICAL_SLUG) continue;
    const ok = await mergePerson(canonicalId, slug);
    if (ok) {
      console.log(`  ✓ ${slug}`);
      merged++;
    }
  }

  // 3. Find and merge any remaining pattern matches
  console.log("\n── Pattern-matched additional records ──");
  const patternSlugs = await findPatternMatches(canonicalId);
  const novel = patternSlugs.filter(s => !SECONDARY_SLUGS.includes(s) && s !== CANONICAL_SLUG);
  if (novel.length === 0) {
    console.log("  (none found)");
  }
  for (const slug of novel) {
    const ok = await mergePerson(canonicalId, slug);
    if (ok) {
      console.log(`  ✓ ${slug} (pattern match)`);
      merged++;
    }
  }

  const after = await prisma.person.count();
  console.log(`\nMerged: ${merged} | People before: ${before} → after: ${after}`);

  await disconnect();
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
