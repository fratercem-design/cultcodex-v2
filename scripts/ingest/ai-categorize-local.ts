// scripts/ingest/ai-categorize-local.ts
// Rule-based + title-analysis categorization for remaining untagged episodes
// Generates summaries and assigns topics based on deep title pattern matching
import { getPrisma, disconnect, slugify, buildSearchText } from "./lib";

// ─── Extended topic keyword maps with broader matching ───
const TOPIC_RULES: { topic: string; patterns: RegExp[] }[] = [
  // Content format topics
  { topic: "shorts", patterns: [/#shorts/i, /#tiktoklive/i, /#livehighlights/i, /ep \d+$/i] },
  { topic: "social commentary", patterns: [/social media/i, /online communit/i, /digital age/i, /internet culture/i, /online interaction/i, /cyber/i, /platform/i, /shadowban/i, /streaming platform/i, /content polic/i, /moderat/i, /chat manage/i, /freedom of speech/i] },
  { topic: "relationships", patterns: [/relationship/i, /dating/i, /love life/i, /breakup/i, /heartbreak/i, /ghosting/i, /flirt/i, /lonely/i, /solitude/i, /toxic relationship/i, /letting go/i, /ex\b/i, /romance/i, /intimacy/i] },
  { topic: "humor", patterns: [/hilarious/i, /funny/i, /joke/i, /laugh/i, /comedy/i, /roast/i, /banter/i, /absurd/i, /cringe/i, /prank/i, /savage/i, /wild/i] },
  { topic: "psychology", patterns: [/psych/i, /mental health/i, /manipulation/i, /narcis/i, /gasligh/i, /emotional/i, /mindset/i, /self.accept/i, /self.respect/i, /self.love/i, /boundaries/i, /trauma/i, /reverse psych/i, /human emotion/i] },
  { topic: "personal growth", patterns: [/motivation/i, /mindset/i, /transform/i, /growth/i, /inspiration/i, /overcom/i, /strength/i, /resilien/i, /embrace/i, /evolution/i, /authentic/i, /liberation/i, /breakthrough/i, /clarity/i, /self.discover/i] },
  { topic: "astrology", patterns: [/sagittarius/i, /scorpio/i, /capricorn/i, /aquari/i, /\bleo\b/i, /\baries\b/i, /taurus/i, /gemini/i, /cancer\b/i, /virgo/i, /libra/i, /pisces/i, /zodiac/i, /horoscope/i, /birth chart/i, /venus in/i, /mercury in/i, /moon in/i, /\bhouse\b.*placement/i, /astrolog/i] },
  { topic: "tarot", patterns: [/tarot/i, /high priestess/i, /hierophant/i, /king of pentacles/i, /major arcana/i, /the fool/i, /card reading/i, /pick a pile/i, /seven of wands/i, /the lovers/i] },
  { topic: "spirituality", patterns: [/spirit/i, /soul/i, /divine/i, /sacred/i, /prayer/i, /psalm/i, /meditat/i, /awaken/i, /enlighten/i, /energy/i, /vibrat/i, /manifest/i, /prophecy/i, /chakra/i, /third eye/i, /aura/i, /angel/i, /demon/i, /light.?work/i] },
  { topic: "mythology", patterns: [/myth/i, /goddess/i, /god of/i, /ancient/i, /underworld/i, /folklore/i, /folk tale/i, /fairy tale/i, /legend/i, /celtic/i, /norse/i, /greek/i, /roman/i, /tibetan/i, /hindu/i, /egyptian/i, /inanna/i, /orpheus/i, /cupid/i, /ganesh/i, /kali/i, /shiva/i, /vishnu/i, /mahavidya/i, /matangi/i, /lalitha/i, /bagalamukhi/i, /mohini/i, /jezebel/i, /urvasi/i] },
  { topic: "occult", patterns: [/occult/i, /witch/i, /magic\b/i, /magick/i, /spell/i, /ritual/i, /sigil/i, /esoteric/i, /alchemy/i, /grimoire/i, /ouija/i, /necromancy/i, /hex/i, /rune/i, /veil/i] },
  { topic: "religion", patterns: [/bible/i, /biblical/i, /jesus/i, /christian/i, /church/i, /sermon/i, /talmud/i, /god\b/i, /prayer/i, /psalm/i, /judas/i, /buddhis/i, /hindu/i, /polytheism/i, /monotheism/i, /religion/i, /faith/i, /martyr/i, /heretic/i] },
  { topic: "AI technology", patterns: [/\bai\b/i, /artificial intellig/i, /deepfake/i, /ai.?gen/i, /ai.?music/i, /ai.?filter/i, /ai.?art/i, /chatgpt/i, /character\.ai/i, /automation/i] },
  { topic: "pop culture", patterns: [/celebrity/i, /kardashian/i, /trump/i, /howard stern/i, /marilyn manson/i, /elvis/i, /shark tank/i, /south park/i, /peppa pig/i, /grinch/i, /willy wonka/i, /elvira/i, /nicole kidman/i, /beetlejuice/i, /diddy/i] },
  { topic: "music", patterns: [/music/i, /song\b/i, /concert/i, /album/i, /rapper/i, /rap battle/i, /dj\b/i, /drummer/i, /off.key/i, /lyric/i] },
  { topic: "health", patterns: [/health/i, /medical/i, /surgery/i, /addiction/i, /sobriety/i, /cannabis/i, /marijuana/i, /alcohol/i, /lean/i, /acne/i, /vision impair/i, /deodorant/i, /hygiene/i, /pimple/i] },
  { topic: "science", patterns: [/science/i, /mercury.*planet/i, /evolution/i, /dna/i, /neuroscien/i, /experiment/i, /quantum/i, /phenomenon/i] },
  { topic: "politics", patterns: [/politic/i, /government/i, /shutdown/i, /free speech/i, /hate speech/i, /colonial/i, /propaganda/i, /censorship/i] },
  { topic: "creative content", patterns: [/poem/i, /poetry/i, /writing/i, /creative/i, /art\b/i, /artist/i, /portrait/i, /canvas/i, /design/i, /cinematic/i, /film/i, /animation/i] },
  { topic: "community drama", patterns: [/accusat/i, /rumor/i, /beef/i, /feud/i, /confrontat/i, /dox/i, /harassment/i, /bully/i, /hate watch/i, /hater/i, /toxic/i, /betrayal/i, /trust\b/i, /disrespect/i, /slander/i, /smear/i] },
  { topic: "livestream culture", patterns: [/livestream/i, /stream.*turn/i, /going live/i, /streamer/i, /live show/i, /chat.*hype/i, /moderat/i, /panel/i, /raid/i] },
  { topic: "nature & animals", patterns: [/animal/i, /cat\b/i, /lion/i, /tiger/i, /eagle/i, /possum/i, /monkey/i, /cow\b/i, /pet\b/i, /wildlife/i, /plant/i, /crystal/i, /nature\b/i] },
  { topic: "philosophy", patterns: [/philosophy/i, /moral/i, /ethics/i, /existence/i, /consciousness/i, /karma/i, /fate/i, /paradox/i, /construct/i, /subjectiv/i] },
  { topic: "personal stories", patterns: [/my personal/i, /my journey/i, /my experience/i, /my honest/i, /i saved/i, /i survived/i, /i caught/i, /i broke/i, /i almost/i, /i wiped out/i, /i discovered/i, /dedicat/i, /tribute/i, /memorial/i, /remembering/i, /rest in peace/i, /rip\b/i] },
  { topic: "food & cooking", patterns: [/food/i, /cook/i, /recipe/i, /biscuit/i, /mcdonalds/i, /dinner/i, /restaurant/i, /coq au vin/i, /butter/i, /bagel/i] },
  { topic: "fashion & beauty", patterns: [/fashion/i, /beauty/i, /makeup/i, /style/i, /closet/i, /underwear/i, /grooming/i, /beard/i, /hair/i, /leopard/i, /cheetah/i] },
  { topic: "LGBTQ+", patterns: [/lgbtq/i, /gay/i, /gender identity/i, /bisexual/i, /queer/i, /coming out/i, /drag/i, /homosex/i, /adoption/i] },
  { topic: "history", patterns: [/histor/i, /colonial/i, /elizabeth bathory/i, /medieval/i, /ancient egypt/i, /joan crawford/i, /betty davis/i, /eva peron/i, /lincoln/i] },
  { topic: "original music", patterns: [/shadows run/i, /stronger now/i, /good guy/i, /storm in human form/i, /new start/i, /carry us away/i, /not afraid of the light/i, /lost faith/i, /dark goddess/i, /keeper of the veil/i, /honey of my own becoming/i, /aquarian exile/i, /beautiful chaos/i, /walking alone/i, /ring light hex/i, /codex conspiracy/i, /projection screen/i, /the cross i bear/i, /emerald rune/i, /moon in the skull cup/i, /the lantern/i, /the scapegoat/i, /silver threads/i, /diabolique/i, /love on the altar/i, /feral/i, /mr\. unforgiven/i, /cult of one/i, /oh,? alexandra/i, /oh,? matangi/i, /ode to shyamala/i, /to hell and back/i, /hidden arrows/i, /cosmic poetry/i] },
  { topic: "Baital Pachchisi Tales", patterns: [/baital/i, /baitâl/i, /pachchisi/i, /pachisi/i, /paichisi/i] },
  { topic: "Quantum Scary Tales", patterns: [/quantum.*scary/i, /scary.*tale.*quantum/i, /what really happened/i, /quantum jack/i, /quantum fairy/i] },
  { topic: "Uncle Wiggly Stories", patterns: [/uncle wigg/i] },
  { topic: "Secrets of the Mahavidyas", patterns: [/mahavidya/i, /goddess kali/i, /goddess tara\b/i, /bagalamukhi/i, /matangi/i, /lalitha tripura/i] },
];

// ─── Series assignment rules ───
const SERIES_RULES: { seriesSlug: string; patterns: RegExp[] }[] = [
  { seriesSlug: "shorts-clips", patterns: [/#shorts/i, /#tiktoklive/i, /#livehighlights/i] },
  { seriesSlug: "baital-pachchisi-tales", patterns: [/baital/i, /baitâl/i, /pachchisi/i, /pachisi/i, /paichisi/i] },
  { seriesSlug: "quantum-scary-tales", patterns: [/quantum.*scary/i, /quantum jack/i, /quantum fairy/i, /what really happened/i] },
  { seriesSlug: "uncle-wiggly-stories", patterns: [/uncle wigg/i] },
  { seriesSlug: "secrets-of-the-mahavidyas", patterns: [/mahavidya/i, /goddess kali.*black one/i, /goddess tara\b/i, /108 names of bagalamukhi/i] },
  { seriesSlug: "music-videos", patterns: [/shadows run/i, /stronger now/i, /beautiful chaos/i, /new start/i, /good guy/i, /storm in human form/i, /carry us away/i, /not afraid of the light/i, /lost faith/i, /dark goddess in the machine/i, /keeper of the veil/i, /honey of my own becoming/i, /aquarian exile/i, /walking alone/i, /ring light hex/i, /codex conspiracy/i, /projection screen/i, /the cross i bear/i, /emerald rune/i, /love on the altar/i, /diabolique/i, /silver threads/i, /moon in the skull cup/i, /the lantern/i, /the scapegoat/i, /cult of one/i] },
  { seriesSlug: "mythology-lore", patterns: [/goddess/i, /god of/i, /folk ?tale/i, /folklore/i, /inanna/i, /orpheus/i, /ganesh/i, /mohini/i, /jezebel/i, /urvasi/i, /descent.*tibetan/i, /dr\.? faust/i] },
  { seriesSlug: "astrology-deep-dives", patterns: [/astrological deep dive/i, /venus in/i, /mercury in.*house/i, /moon in.*house/i] },
  { seriesSlug: "open-panel", patterns: [/open panel/i] },
  { seriesSlug: "weekday-streams", patterns: [/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*(morning|afternoon|night|evening)/i] },
];

// ─── Auto-generate summary from title ───
function generateSummary(title: string, contentType: string): string {
  // Clean up title for summary
  let clean = title
    .replace(/#\w+/g, "")
    .replace(/\|/g, "—")
    .replace(/ep\.?\s*\d+/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (contentType === "short") {
    return `Short clip: ${clean}`;
  }
  if (contentType === "livestream") {
    return `Livestream: ${clean}`;
  }
  // For originals (music, mythology, stories, etc.)
  return clean;
}

async function main() {
  const prisma = getPrisma();

  // Get untagged episodes
  const untagged = await prisma.episode.findMany({
    where: { topics: { none: {} } },
    select: {
      id: true,
      title: true,
      episodeNumber: true,
      contentType: true,
      seriesId: true,
      summaryShort: true,
    },
    orderBy: { episodeNumber: "asc" },
  });

  console.log(`Untagged episodes to process: ${untagged.length}`);

  // Load existing topics and series
  const existingTopics = await prisma.topic.findMany({ select: { id: true, title: true, slug: true } });
  const existingSeries = await prisma.series.findMany({ select: { id: true, title: true, slug: true } });

  const topicsBySlug = new Map(existingTopics.map((t) => [t.slug, t]));
  const seriesBySlug = new Map(existingSeries.map((s) => [s.slug, s]));

  let topicsLinked = 0;
  let topicsCreated = 0;
  let seriesLinked = 0;
  let summariesWritten = 0;

  for (const ep of untagged) {
    const title = ep.title;

    // ── Match topics ──
    const matchedTopics = new Set<string>();
    for (const rule of TOPIC_RULES) {
      for (const pattern of rule.patterns) {
        if (pattern.test(title)) {
          matchedTopics.add(rule.topic);
          break;
        }
      }
    }

    // Always add at least one general topic for completely unmatched episodes
    if (matchedTopics.size === 0) {
      if (ep.contentType === "short") matchedTopics.add("shorts");
      else if (ep.contentType === "livestream") matchedTopics.add("live streaming");
      else matchedTopics.add("community");
    }

    // Link topics (create if needed)
    for (const topicTitle of matchedTopics) {
      const slug = slugify(topicTitle);
      let topic = topicsBySlug.get(slug);

      if (!topic) {
        // Try case-insensitive match
        topic = existingTopics.find((t) => t.title.toLowerCase() === topicTitle.toLowerCase());
      }

      if (!topic) {
        try {
          const created = await prisma.topic.create({
            data: { title: topicTitle, slug },
          });
          topic = { id: created.id, title: topicTitle, slug };
          topicsBySlug.set(slug, topic);
          topicsCreated++;
          console.log(`  + Created topic: "${topicTitle}"`);
        } catch {
          continue;
        }
      }

      try {
        await prisma.episodeTopic.create({
          data: { episodeId: ep.id, topicId: topic.id },
        });
        topicsLinked++;
      } catch {
        // Duplicate
      }
    }

    // ── Match series ──
    if (!ep.seriesId) {
      for (const rule of SERIES_RULES) {
        const matched = rule.patterns.some((p) => p.test(title));
        if (matched) {
          const series = seriesBySlug.get(rule.seriesSlug);
          if (series) {
            try {
              await prisma.episode.update({
                where: { id: ep.id },
                data: { seriesId: series.id },
              });
              seriesLinked++;
            } catch {
              // Skip
            }
            break;
          }
        }
      }
    }

    // ── Write summary if missing ──
    if (!ep.summaryShort) {
      const summary = generateSummary(ep.title, ep.contentType);
      if (summary.length > 5) {
        try {
          await prisma.episode.update({
            where: { id: ep.id },
            data: { summaryShort: summary },
          });
          summariesWritten++;
        } catch {
          // Skip
        }
      }
    }
  }

  console.log(`\n=== Local AI Categorization Results ===`);
  console.log(`Topics linked: ${topicsLinked}`);
  console.log(`New topics created: ${topicsCreated}`);
  console.log(`Series assigned: ${seriesLinked}`);
  console.log(`Summaries written: ${summariesWritten}`);

  // Final stats
  const totalEps = await prisma.episode.count();
  const withTopics = await prisma.episode.count({ where: { topics: { some: {} } } });
  const withSeries = await prisma.episode.count({ where: { seriesId: { not: null } } });
  const withSummary = await prisma.episode.count({ where: { summaryShort: { not: null } } });
  const stillUntagged = await prisma.episode.count({ where: { topics: { none: {} } } });

  console.log(`\n=== Final Archive Stats ===`);
  console.log(`Total episodes: ${totalEps}`);
  console.log(`With topics: ${withTopics}/${totalEps} (${Math.round(100 * withTopics / totalEps)}%)`);
  console.log(`With series: ${withSeries}/${totalEps} (${Math.round(100 * withSeries / totalEps)}%)`);
  console.log(`With summaries: ${withSummary}/${totalEps} (${Math.round(100 * withSummary / totalEps)}%)`);
  console.log(`Still untagged: ${stillUntagged}`);

  await disconnect();
}

main();
