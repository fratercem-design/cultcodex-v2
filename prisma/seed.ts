import "dotenv/config";
import { PrismaClient, ContentStatus, PersonType, CanonStatus, SeriesType } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create a series
  const mainSeries = await prisma.series.create({
    data: {
      title: "The Cult of Psyche",
      slug: "cult-of-psyche",
      description: "The main livestream series exploring consciousness, tarot, and the mysteries of the psyche.",
      type: SeriesType.panel,
      sortOrder: 1,
      status: ContentStatus.published,
    },
  });

  // Create people
  const host = await prisma.person.create({
    data: {
      displayName: "Psyche",
      slug: "psyche",
      shortBio: "Host of the Cult of Psyche.",
      personType: PersonType.host,
      searchText: "psyche host cult",
    },
  });

  const guest1 = await prisma.person.create({
    data: {
      displayName: "Dr. Arcana",
      slug: "dr-arcana",
      altNames: ["The Doctor", "Arcana"],
      shortBio: "Recurring guest and occult scholar.",
      personType: PersonType.recurring,
      searchText: "dr arcana doctor occult scholar",
    },
  });

  const guest2 = await prisma.person.create({
    data: {
      displayName: "Luna Veil",
      slug: "luna-veil",
      shortBio: "Tarot reader and consciousness researcher.",
      personType: PersonType.guest,
      searchText: "luna veil tarot consciousness",
    },
  });

  // Create topics
  const topicTarot = await prisma.topic.create({
    data: { title: "Tarot", slug: "tarot", description: "Tarot card readings, symbolism, and divination." },
  });

  const topicConsciousness = await prisma.topic.create({
    data: { title: "Consciousness", slug: "consciousness", description: "Exploration of awareness, perception, and the mind." },
  });

  const topicMythology = await prisma.topic.create({
    data: { title: "Mythology", slug: "mythology", description: "Ancient myths, archetypes, and storytelling." },
  });

  // Create lore entries
  const lore1 = await prisma.loreEntry.create({
    data: {
      title: "The Psyche Protocol",
      slug: "psyche-protocol",
      category: "doctrine",
      summary: "The founding principles of the Cult of Psyche.",
      canonStatus: CanonStatus.canonical,
      searchText: "psyche protocol founding principles doctrine",
    },
  });

  const lore2 = await prisma.loreEntry.create({
    data: {
      title: "The Veil Theory",
      slug: "veil-theory",
      category: "concept",
      summary: "The hypothesis that reality consists of layered veils of perception.",
      canonStatus: CanonStatus.speculative,
      searchText: "veil theory reality perception layers",
    },
  });

  // Create episodes
  const ep1 = await prisma.episode.create({
    data: {
      title: "Welcome to the Cult",
      slug: "welcome-to-the-cult",
      episodeNumber: 1,
      airDate: new Date("2023-01-15"),
      duration: "2:15:30",
      summaryShort: "The inaugural episode establishing the Cult of Psyche.",
      summaryLong: "In this first episode, Psyche introduces the mission of the Cult — to explore consciousness, tarot, and the hidden architecture of reality. Dr. Arcana joins as the first guest.",
      status: ContentStatus.published,
      seriesId: mainSeries.id,
      searchText: "welcome cult inaugural first episode psyche arcana",
      guests: { create: [{ personId: guest1.id }] },
      topics: { create: [{ topicId: topicConsciousness.id }, { topicId: topicTarot.id }] },
      loreEntries: { create: [{ loreEntryId: lore1.id }] },
    },
  });

  const ep2 = await prisma.episode.create({
    data: {
      title: "Beyond the Veil",
      slug: "beyond-the-veil",
      episodeNumber: 2,
      airDate: new Date("2023-01-22"),
      duration: "1:45:00",
      summaryShort: "Luna Veil explores perception and the nature of reality.",
      summaryLong: "Luna Veil joins to discuss her Veil Theory — the idea that reality consists of layered veils of perception that can be traversed through altered states of consciousness.",
      status: ContentStatus.published,
      seriesId: mainSeries.id,
      searchText: "beyond veil luna perception reality layers consciousness",
      guests: { create: [{ personId: guest2.id }] },
      topics: { create: [{ topicId: topicConsciousness.id }, { topicId: topicMythology.id }] },
      loreEntries: { create: [{ loreEntryId: lore2.id }] },
    },
  });

  const ep3 = await prisma.episode.create({
    data: {
      title: "The Arcana Codex",
      slug: "the-arcana-codex",
      episodeNumber: 3,
      airDate: new Date("2023-01-29"),
      duration: "2:30:00",
      summaryShort: "Dr. Arcana reveals the hidden codex of tarot symbolism.",
      status: ContentStatus.published,
      seriesId: mainSeries.id,
      searchText: "arcana codex tarot symbolism hidden",
      guests: { create: [{ personId: guest1.id }] },
      topics: { create: [{ topicId: topicTarot.id }, { topicId: topicMythology.id }] },
    },
  });

  // Create transcript segments for episode 1
  await prisma.transcriptSegment.createMany({
    data: [
      { episodeId: ep1.id, startSeconds: 0, endSeconds: 30, speakerLabel: "Psyche", text: "Welcome to the Cult of Psyche. I am your host, and tonight we begin something extraordinary.", searchText: "welcome cult psyche host tonight begin extraordinary" },
      { episodeId: ep1.id, startSeconds: 31, endSeconds: 75, speakerLabel: "Psyche", text: "Joining me is Dr. Arcana, one of the foremost scholars of the occult tradition.", searchText: "joining dr arcana foremost scholars occult tradition" },
      { episodeId: ep1.id, startSeconds: 76, endSeconds: 120, speakerLabel: "Dr. Arcana", text: "Thank you for having me. The Cult of Psyche represents something rare — a genuine attempt to bridge ancient wisdom and modern consciousness research.", searchText: "thank you cult psyche rare genuine bridge ancient wisdom modern consciousness research" },
    ],
  });

  // Create quotes
  await prisma.quote.create({
    data: {
      text: "Welcome to the Cult of Psyche. I am your host, and tonight we begin something extraordinary.",
      speakerPersonId: host.id,
      episodeId: ep1.id,
      timestampSeconds: 0,
      context: "Opening words of the first episode",
      significance: "The founding statement of the entire archive",
    },
  });

  await prisma.quote.create({
    data: {
      text: "The Cult of Psyche represents something rare — a genuine attempt to bridge ancient wisdom and modern consciousness research.",
      speakerPersonId: guest1.id,
      episodeId: ep1.id,
      timestampSeconds: 76,
      context: "Dr. Arcana's first appearance on the show",
      significance: "Defines the show's mission from an outside perspective",
    },
  });

  // Link people to lore
  await prisma.personLore.createMany({
    data: [
      { personId: host.id, loreEntryId: lore1.id },
      { personId: guest2.id, loreEntryId: lore2.id },
    ],
  });

  // Set first appearances
  await prisma.person.update({
    where: { id: host.id },
    data: { firstAppearanceEpisodeId: ep1.id },
  });
  await prisma.person.update({
    where: { id: guest1.id },
    data: { firstAppearanceEpisodeId: ep1.id },
  });
  await prisma.person.update({
    where: { id: guest2.id },
    data: { firstAppearanceEpisodeId: ep2.id },
  });

  // Set first mentions
  await prisma.loreEntry.update({
    where: { id: lore1.id },
    data: { firstMentionEpisodeId: ep1.id },
  });
  await prisma.loreEntry.update({
    where: { id: lore2.id },
    data: { firstMentionEpisodeId: ep2.id },
  });

  console.log("✅ Seed complete:");
  console.log("   Episodes: 3");
  console.log("   People: 3 (1 host, 1 recurring, 1 guest)");
  console.log("   Topics: 3");
  console.log("   Lore entries: 2");
  console.log("   Transcript segments: 3");
  console.log("   Quotes: 2");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
