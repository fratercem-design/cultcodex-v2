import { getPrisma, disconnect } from "./ingest/lib";

/**
 * TOPIC DEDUP — Merge singular/plural pairs and near-dupes.
 * Strategy: keep the one with more episodes, merge the other into it.
 */

const prisma = getPrisma();

// Each pair: [slugA, slugB] — we auto-pick the one with more episodes as primary
const MERGE_PAIRS: [string, string][] = [
  // Singular/plural pairs — merge into whichever has more episodes
  ["hindu-traditions", "hindu-tradition"],
  ["aesthetics", "aesthetic"],
  ["ancient-religions", "ancient-religion"],
  ["archetypes", "archetype"],
  ["arguments", "argument"],
  ["astral-realms", "astral-realm"],
  ["birth-charts", "birth-chart"],
  ["collective-readings", "collective-reading"],
  ["community-conflicts", "community-conflict"],
  ["confessions", "confession"],
  ["consequences", "consequence"],
  ["content-creator-conflicts", "content-creator-conflict"],
  ["family-connections", "family-connection"],
  ["feminine-archetypes", "feminine-archetype"],
  ["friendships", "friendship"],
  ["interpersonal-conflicts", "interpersonal-conflict"],
  ["live-streams", "live-stream"],
  ["mantras", "mantra"],
  ["memberships", "membership"],
  ["metaphors", "metaphor"],
  ["misunderstandings", "misunderstanding"],
  ["music-videos", "music-video"],
  ["occult-rituals", "occult-ritual"],
  ["one-on-one-conversations", "one-on-one-conversation"],
  ["open-panel-discussions", "open-panel-discussion"],
  ["open-panels", "open-panel"],
  ["outcasts", "outcast"],
  ["panel-discussions", "panel-discussion"],
  ["personal-confessions", "personal-confession"],
  ["personal-disputes", "personal-dispute"],
  ["personal-experiences", "personal-experience"],
  ["predictions", "prediction"],
  ["prophetic-visions", "prophetic-vision"],
  ["rap-battles", "rap-battle"],
  ["social-connections", "social-connection"],
  ["social-gatherings", "social-gathering"],
  ["social-interactions", "social-interaction"],
  ["spiritual-missions", "spiritual-mission"],
  ["spiritual-practices", "spiritual-practice"],
  ["spiritual-services", "spiritual-service"],
  ["tarot-readings", "tarot-reading"],
  // Near-dupes
  ["panelverse", "panel-verse"],
  ["live-stream", "livestream"],      // live-stream may already be merged above
  ["live-streaming", "livestreaming"],
  ["shadow-banning", "shadowbanning"],
];

// Orphans to delete
const ORPHAN_SLUGS = [
  "baital-pachchisi-tales",
  "quantum-scary-tales",
  "fashion-beauty",
  "food-cooking",
  "science",
];

async function mergeTopic(primaryId: string, secondaryId: string) {
  // 1. EpisodeTopic
  const epTopics = await prisma.episodeTopic.findMany({ where: { topicId: secondaryId } });
  for (const et of epTopics) {
    const exists = await prisma.episodeTopic.findUnique({
      where: { episodeId_topicId: { episodeId: et.episodeId, topicId: primaryId } },
    });
    if (exists) {
      await prisma.episodeTopic.delete({
        where: { episodeId_topicId: { episodeId: et.episodeId, topicId: secondaryId } },
      });
    } else {
      await prisma.episodeTopic.update({
        where: { episodeId_topicId: { episodeId: et.episodeId, topicId: secondaryId } },
        data: { topicId: primaryId },
      });
    }
  }

  // 2. PersonTopic
  const pTopics = await prisma.personTopic.findMany({ where: { topicId: secondaryId } });
  for (const pt of pTopics) {
    const exists = await prisma.personTopic.findUnique({
      where: { personId_topicId: { personId: pt.personId, topicId: primaryId } },
    });
    if (exists) {
      await prisma.personTopic.delete({
        where: { personId_topicId: { personId: pt.personId, topicId: secondaryId } },
      });
    } else {
      await prisma.personTopic.update({
        where: { personId_topicId: { personId: pt.personId, topicId: secondaryId } },
        data: { topicId: primaryId },
      });
    }
  }

  // 3. Delete secondary
  await prisma.topic.delete({ where: { id: secondaryId } });
}

async function main() {
  console.log("TOPIC DEDUP");
  console.log("===========\n");

  const before = await prisma.topic.count();
  console.log(`Topics before: ${before}\n`);

  let merged = 0;

  for (const [slugA, slugB] of MERGE_PAIRS) {
    const a = await prisma.topic.findUnique({
      where: { slug: slugA },
      select: { id: true, title: true, slug: true, _count: { select: { episodes: true, people: true } } },
    });
    const b = await prisma.topic.findUnique({
      where: { slug: slugB },
      select: { id: true, title: true, slug: true, _count: { select: { episodes: true, people: true } } },
    });

    if (!a || !b) continue;

    // Pick the one with more episodes as primary
    const aTotal = a._count.episodes + a._count.people;
    const bTotal = b._count.episodes + b._count.people;
    const [primary, secondary] = aTotal >= bTotal ? [a, b] : [b, a];

    await mergeTopic(primary.id, secondary.id);
    merged++;
    console.log(`  OK: "${secondary.title}" (${secondary.slug}) -> "${primary.title}" (${primary.slug})`);
  }

  // Delete orphans
  let orphansDeleted = 0;
  for (const slug of ORPHAN_SLUGS) {
    const t = await prisma.topic.findUnique({ where: { slug } });
    if (t) {
      await prisma.topic.delete({ where: { id: t.id } });
      orphansDeleted++;
      console.log(`  DELETED orphan: "${t.title}" (${slug})`);
    }
  }

  const after = await prisma.topic.count();
  console.log(`\n${"=".repeat(50)}`);
  console.log(`DONE: ${merged} pairs merged, ${orphansDeleted} orphans deleted`);
  console.log(`Topics: ${before} -> ${after} (removed ${before - after})`);

  await disconnect();
}

main().catch(async (e) => { console.error(e); await disconnect(); process.exit(1); });
