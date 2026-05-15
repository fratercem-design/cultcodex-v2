// scripts/ingest/auto-categorize.ts
// Auto-tags untagged episodes with topics, series, and content types based on title patterns
import { getPrisma, disconnect, slugify, buildSearchText } from "./lib";

// ─── Topic keyword maps ───
// Each key is a topic title, values are keywords/phrases to match in episode titles
const TOPIC_KEYWORDS: Record<string, string[]> = {
  "tarot": ["tarot", "tarot reading", "tarot card", "pick a pile", "free reading", "card reading"],
  "open panels": ["open panel", "panel discussion", "panel tarot"],
  "cats": ["cats", "cat ", "kitty", "meow", "cates"],
  "astrology": ["astrology", "horoscope", "zodiac", "loveoscope", "horroroscope", "all signs", "mercury retrograde", "scorpio season", "lilith in"],
  "live streaming": ["live stream", "chill stream", "fun stream", "midnight stream", "morning stream", "afternoon stream", "night stream", "hangout", "hang out", "checking in", "check in", "im back", "i'm back", "we back", "im awake", "i'm awake"],
  "spirituality": ["spiritual", "spirit", "sacred", "divine", "soul", "chakra", "meditation", "awakening", "enlightenment", "prophecy", "prophecies", "psalms", "bible", "biblical"],
  "community": ["open panel", "panel", "community", "cult of psyche", "kult of psyche", "cultist"],
  "Halloween": ["halloween", "ghostober", "ghostoween", "ghostoberfest", "spooky", "ghost ", "👻", "boo"],
  "personal sharing": ["apolog", "confession", "announcement", "important news", "big changes", "public statement", "addressing", "truth", "revelation"],
  "music": ["music", "song", "dj ", "ai music"],
  "IRL content": ["irl ", "bike ride", "pier", "mcdonalds", "wendys", "taco bell", "fish taco"],
  "drama": ["drama", "hater", "troll", "crash out", "salty", "beef", "calling out", "gloves are off", "purge"],
  "late night": ["midnight", "late night", "middle of the night", "last call", "goodnight", "wind down"],
  "morning shows": ["good morning", "morning madness", "morning stream", "morning hang", "breakfast", "coffee", "bagel"],
  "weekend vibes": ["friday night", "saturday night", "sunday night", "saturday morning", "sunday afternoon", "friday hangout", "weekend"],
  "holiday specials": ["christmas", "new year", "valentines", "july 4", "4th of july", "thanksgiving", "halloween", "holiday extravaganza", "persian new year"],
  "occult": ["occult", "witch", "magic", "magick", "spell", "sigil", "ritual", "candle magic", "necromancy", "aleister crowley"],
  "mythology": ["mythology", "myth", "psyche", "cupid", "norse", "celtic", "greek", "egyptian", "roman"],
  "rebranding": ["rebrand", "relaunch", "kult of psyche", "cult of psyche"],
};

// ─── Series pattern maps ───
// These match titles to existing series slugs
const SERIES_PATTERNS: Record<string, RegExp> = {
  "open-panel": /open\s*panel/i,
  "midnight-madness": /midnight\s*(madness|fun|stream)/i,
  "weekday-streams": /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*(morning|afternoon|night|evening|stream|chill|fun|hangout|hang\s*out)/i,
  "troll-tribunal": /troll\s*(tribunal|side)/i,
  "psyche-awakens-tarot": /\btarot\s*(read|card|deck|tuesday|thursday)/i,
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

async function main() {
  const prisma = getPrisma();

  // Load all existing data
  const [allTopics, allSeries, allEpisodes] = await Promise.all([
    prisma.topic.findMany({ select: { id: true, title: true, slug: true } }),
    prisma.series.findMany({ select: { id: true, title: true, slug: true } }),
    prisma.episode.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        episodeNumber: true,
        contentType: true,
        seriesId: true,
        youtubeVideoId: true,
        rumbleVideoId: true,
        duration: true,
        searchText: true,
        topics: { select: { topicId: true } },
      },
    }),
  ]);

  const topicsBySlug = new Map(allTopics.map((t) => [t.slug, t]));
  const seriesBySlug = new Map(allSeries.map((s) => [s.slug, s]));

  // Ensure all TOPIC_KEYWORDS topics exist
  const topicLookup = new Map<string, string>(); // topic title → topic ID
  for (const [topicTitle] of Object.entries(TOPIC_KEYWORDS)) {
    const slug = slugify(topicTitle);
    let topic = topicsBySlug.get(slug);
    if (!topic) {
      // Check exact title match
      topic = allTopics.find((t) => t.title.toLowerCase() === topicTitle.toLowerCase());
    }
    if (!topic) {
      // Create it
      const created = await prisma.topic.create({
        data: {
          title: topicTitle,
          slug,
        },
      });
      topic = { id: created.id, title: topicTitle, slug };
      console.log(`  Created topic: "${topicTitle}"`);
    }
    topicLookup.set(topicTitle, topic.id);
  }

  // Find untagged episodes (no topics)
  const untagged = allEpisodes.filter((e) => e.topics.length === 0);
  console.log(`\nEpisodes without topics: ${untagged.length}/${allEpisodes.length}`);

  let topicsLinked = 0;
  let seriesLinked = 0;
  let contentTypeFixed = 0;
  let searchTextFixed = 0;

  for (const ep of allEpisodes) {
    const titleNorm = normalize(ep.title);
    const existingTopicIds = new Set(ep.topics.map((t) => t.topicId));

    // ── Auto-tag topics ──
    const newTopicIds: string[] = [];
    for (const [topicTitle, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      const topicId = topicLookup.get(topicTitle);
      if (!topicId || existingTopicIds.has(topicId)) continue;

      const matched = keywords.some((kw) => titleNorm.includes(kw.toLowerCase()));
      if (matched) {
        newTopicIds.push(topicId);
      }
    }

    if (newTopicIds.length > 0) {
      await prisma.episodeTopic.createMany({
        data: newTopicIds.map((topicId) => ({
          episodeId: ep.id,
          topicId,
        })),
        skipDuplicates: true,
      });
      topicsLinked += newTopicIds.length;
    }

    // ── Auto-assign series ──
    if (!ep.seriesId) {
      for (const [seriesSlug, pattern] of Object.entries(SERIES_PATTERNS)) {
        if (pattern.test(ep.title)) {
          const series = seriesBySlug.get(seriesSlug);
          if (series) {
            await prisma.episode.update({
              where: { id: ep.id },
              data: { seriesId: series.id },
            });
            seriesLinked++;
            break; // only one series per episode
          }
        }
      }
    }

    // ── Fix content types for Rumble-only episodes (all livestreams) ──
    // Already set during import, but also fix YouTube episodes that were imported as "original"
    // but are actually livestreams (>3600s duration)
    if (ep.contentType === "original" && ep.duration) {
      const parts = ep.duration.split(":").map(Number);
      let totalSec = 0;
      if (parts.length === 3) totalSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
      else if (parts.length === 2) totalSec = parts[0] * 60 + parts[1];

      if (totalSec > 3600) {
        await prisma.episode.update({
          where: { id: ep.id },
          data: { contentType: "livestream" },
        });
        contentTypeFixed++;
      } else if (totalSec > 0 && totalSec <= 90) {
        await prisma.episode.update({
          where: { id: ep.id },
          data: { contentType: "short" },
        });
        contentTypeFixed++;
      }
    }

    // ── Fix missing searchText ──
    if (!ep.searchText) {
      await prisma.episode.update({
        where: { id: ep.id },
        data: { searchText: buildSearchText(ep.title, null) },
      });
      searchTextFixed++;
    }
  }

  console.log(`\n=== Auto-Categorize Results ===`);
  console.log(`Topic links added: ${topicsLinked}`);
  console.log(`Series assigned: ${seriesLinked}`);
  console.log(`Content types fixed: ${contentTypeFixed}`);
  console.log(`Search text fixed: ${searchTextFixed}`);

  // Final counts
  const finalTopics = await prisma.episode.count({ where: { topics: { some: {} } } });
  const finalSeries = await prisma.episode.count({ where: { seriesId: { not: null } } });
  console.log(`\nEpisodes with topics: ${finalTopics}/${allEpisodes.length}`);
  console.log(`Episodes with series: ${finalSeries}/${allEpisodes.length}`);

  await disconnect();
}

main();
