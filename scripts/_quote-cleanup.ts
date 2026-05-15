/**
 * QUOTE CLEANUP + REMAINING DEDUP
 *
 * 1. Merge leftover VA and Beta records into Bea
 * 2. Remove 49 duplicate quotes
 * 3. Attribute speakerless quotes to Psyche where clearly his
 * 4. Remove very short meaningless quotes
 * 5. Reassign "Unknown" speaker quotes where identity is clear
 */

import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();
  let stats = { mergedPeople: 0, removedDupeQuotes: 0, attributedQuotes: 0, removedJunkQuotes: 0 };

  console.log("=== QUOTE CLEANUP ===\n");

  // =============================================
  // PHASE 1: Merge leftover VA and Beta into Bea
  // =============================================
  console.log("--- Phase 1: Merge VA and Beta into Bea ---");
  const bea = await prisma.person.findFirst({ where: { slug: "bea" }, select: { id: true } });
  if (!bea) { console.log("Bea not found!"); await disconnect(); return; }

  const leftoverSlugs = ["va", "beta"];
  for (const slug of leftoverSlugs) {
    const src = await prisma.person.findFirst({
      where: { slug },
      select: { id: true, displayName: true, _count: { select: { guestAppearances: true, quotes: true } } },
    });
    if (!src) { console.log(`  "${slug}" not found`); continue; }

    // Move appearances
    const apps = await prisma.episodeGuest.findMany({ where: { personId: src.id } });
    let moved = 0, skipped = 0;
    for (const app of apps) {
      const exists = await prisma.episodeGuest.findFirst({
        where: { personId: bea.id, episodeId: app.episodeId },
      });
      if (exists) {
        await prisma.episodeGuest.delete({
          where: { episodeId_personId: { episodeId: app.episodeId, personId: src.id } },
        });
        skipped++;
      } else {
        await prisma.episodeGuest.update({
          where: { episodeId_personId: { episodeId: app.episodeId, personId: src.id } },
          data: { personId: bea.id },
        });
        moved++;
      }
    }

    // Move quotes
    const qr = await prisma.quote.updateMany({
      where: { speakerPersonId: src.id },
      data: { speakerPersonId: bea.id },
    });

    // Move topics
    const topics = await prisma.personTopic.findMany({ where: { personId: src.id } });
    for (const t of topics) {
      const exists = await prisma.personTopic.findFirst({
        where: { personId: bea.id, topicId: t.topicId },
      });
      if (exists) {
        await prisma.personTopic.delete({
          where: { personId_topicId: { personId: src.id, topicId: t.topicId } },
        });
      } else {
        await prisma.personTopic.update({
          where: { personId_topicId: { personId: src.id, topicId: t.topicId } },
          data: { personId: bea.id },
        });
      }
    }

    await prisma.person.delete({ where: { id: src.id } });
    stats.mergedPeople++;
    console.log(`  "${src.displayName}" → Bea: ${moved} eps, ${skipped} dups, ${qr.count} quotes`);
  }

  // Update Bea altNames to include VA and Beta
  const beaRecord = await prisma.person.findUnique({
    where: { id: bea.id },
    select: { altNames: true },
  });
  const currentAlts = beaRecord?.altNames as string[] || [];
  if (!currentAlts.includes("VA")) currentAlts.push("VA");
  if (!currentAlts.includes("Beta")) currentAlts.push("Beta");
  await prisma.person.update({
    where: { id: bea.id },
    data: { altNames: currentAlts },
  });

  // =============================================
  // PHASE 2: Remove duplicate quotes
  // =============================================
  console.log("\n--- Phase 2: Remove duplicate quotes ---");
  const allQuotes = await prisma.quote.findMany({
    select: { id: true, text: true, speakerPersonId: true, episodeId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const textMap = new Map<string, string[]>(); // normalized text → [ids]
  for (const q of allQuotes) {
    const key = q.text.toLowerCase().trim();
    if (!textMap.has(key)) textMap.set(key, []);
    textMap.get(key)!.push(q.id);
  }

  const dupeIdsToDelete: string[] = [];
  for (const [, ids] of textMap) {
    if (ids.length > 1) {
      // Keep the first one, delete the rest
      for (let i = 1; i < ids.length; i++) {
        dupeIdsToDelete.push(ids[i]);
      }
    }
  }

  if (dupeIdsToDelete.length > 0) {
    const result = await prisma.quote.deleteMany({
      where: { id: { in: dupeIdsToDelete } },
    });
    stats.removedDupeQuotes = result.count;
    console.log(`  Removed ${result.count} duplicate quotes`);
  }

  // =============================================
  // PHASE 3: Remove junk quotes (very short, meaningless)
  // =============================================
  console.log("\n--- Phase 3: Remove junk quotes ---");
  const junkQuotes = await prisma.quote.findMany({
    where: {
      OR: [
        { text: { in: ["What the", "Yeah, go ahead.", "No. Hell no.", "హియర్ ఐ యమ"] } },
      ],
    },
    select: { id: true, text: true },
  });

  // Also find single-word filler quotes
  const fillerPatterns = /^(yeah|yes|no|ok|okay|hmm|um|uh|wow|oh|ha|haha|lol|right|sure|hey|hi|hello|bye|what|why|how|well|so|like|just|really)\.?!?$/i;
  const allRemaining = await prisma.quote.findMany({
    select: { id: true, text: true },
  });
  const fillerIds = allRemaining
    .filter(q => fillerPatterns.test(q.text.trim()) || q.text.trim().length < 8)
    .map(q => q.id);

  const junkIds = [...junkQuotes.map(q => q.id), ...fillerIds];
  if (junkIds.length > 0) {
    const unique = [...new Set(junkIds)];
    const result = await prisma.quote.deleteMany({
      where: { id: { in: unique } },
    });
    stats.removedJunkQuotes = result.count;
    console.log(`  Removed ${result.count} junk/filler quotes`);
  }

  // =============================================
  // PHASE 4: Attribute speakerless quotes
  // =============================================
  console.log("\n--- Phase 4: Attribute speakerless quotes ---");
  const psyche = await prisma.person.findFirst({ where: { slug: "psyche" }, select: { id: true } });
  if (!psyche) { console.log("Psyche not found!"); await disconnect(); return; }

  // Speakerless quotes that are clearly Psyche based on content
  const speakerless = await prisma.quote.findMany({
    where: { speakerPersonId: null },
    select: { id: true, text: true, context: true, episode: { select: { episodeNumber: true } } },
  });

  let psycheAttributed = 0;
  const psychePatterns = [
    /psyche/i, /my show/i, /my channel/i, /my panel/i, /cult of/i,
    /my cat/i, /trix/i, /lenore/i,
    /born in the hush/i, /rahu raised/i, // Psyche's poetry
    /wake.*burn.*become/i, /neon priestess/i,
    /speak to me/i, /i love you/i, /nobody loves me/i,
    /as above.*so below/i,
    /welcome to a place where minds awaken/i,
    /every conversation sparks/i,
    /join us.*let your psyche/i,
    /you're projecting/i,
    /shut.*up.*mute/i,
  ];

  for (const q of speakerless) {
    let isPsyche = false;
    for (const pat of psychePatterns) {
      if (pat.test(q.text)) { isPsyche = true; break; }
    }
    // Also check context field for clues
    if (!isPsyche && q.context) {
      const ctx = q.context.toLowerCase();
      if (ctx.includes("host") || ctx.includes("psyche") || ctx.includes("the streamer")) {
        isPsyche = true;
      }
    }
    if (isPsyche) {
      await prisma.quote.update({
        where: { id: q.id },
        data: { speakerPersonId: psyche.id },
      });
      psycheAttributed++;
    }
  }
  stats.attributedQuotes = psycheAttributed;
  console.log(`  Attributed ${psycheAttributed} speakerless quotes to Psyche`);

  // =============================================
  // PHASE 5: Merge "Unknown Drummer" → Mason
  // =============================================
  console.log("\n--- Phase 5: Merge identifiable Unknowns ---");
  // Unknown Drummer → Mason (28yo drummer)
  const mason = await prisma.person.findFirst({ where: { slug: "mason" }, select: { id: true } });
  const unknownDrummer = await prisma.person.findFirst({ where: { slug: "unknown-drummer" }, select: { id: true, displayName: true } });
  if (mason && unknownDrummer) {
    const qr = await prisma.quote.updateMany({
      where: { speakerPersonId: unknownDrummer.id },
      data: { speakerPersonId: mason.id },
    });
    const apps = await prisma.episodeGuest.findMany({ where: { personId: unknownDrummer.id } });
    for (const app of apps) {
      const exists = await prisma.episodeGuest.findFirst({
        where: { personId: mason.id, episodeId: app.episodeId },
      });
      if (exists) {
        await prisma.episodeGuest.delete({
          where: { episodeId_personId: { episodeId: app.episodeId, personId: unknownDrummer.id } },
        });
      } else {
        await prisma.episodeGuest.update({
          where: { episodeId_personId: { episodeId: app.episodeId, personId: unknownDrummer.id } },
          data: { personId: mason.id },
        });
      }
    }
    await prisma.person.delete({ where: { id: unknownDrummer.id } });
    console.log(`  Unknown Drummer → Mason: ${qr.count} quotes`);
    stats.mergedPeople++;
  }

  // Unknown Interviewer → merge into episode, delete record
  const unknownInterviewer = await prisma.person.findFirst({ where: { slug: "unknown-interviewer" }, select: { id: true } });
  if (unknownInterviewer) {
    // Attribute quotes to Psyche (he's the interviewer on his own show)
    const qr = await prisma.quote.updateMany({
      where: { speakerPersonId: unknownInterviewer.id },
      data: { speakerPersonId: psyche.id },
    });
    const apps = await prisma.episodeGuest.findMany({ where: { personId: unknownInterviewer.id } });
    for (const app of apps) {
      await prisma.episodeGuest.delete({
        where: { episodeId_personId: { episodeId: app.episodeId, personId: unknownInterviewer.id } },
      });
    }
    await prisma.person.delete({ where: { id: unknownInterviewer.id } });
    console.log(`  Unknown Interviewer → Psyche: ${qr.count} quotes, deleted record`);
    stats.mergedPeople++;
  }

  // =============================================
  // PHASE 6: Add categories via significance field
  // =============================================
  console.log("\n--- Phase 6: Categorize quotes ---");
  // Use significance field as category since no tags column exists
  // We'll categorize based on content analysis
  const remaining = await prisma.quote.findMany({
    select: { id: true, text: true, significance: true },
  });

  let categorized = 0;
  for (const q of remaining) {
    const text = q.text.toLowerCase();
    let category = "";

    if (/tarot|card|reading|deck|pentacles|cups|wands|swords|major arcana|fool|emperor|empress|high priestess|tower|moon|sun|star|chariot|magician|death card|wheel of fortune/i.test(text)) {
      category = "Tarot & Divination";
    } else if (/god|spirit|soul|divine|pray|prayer|faith|bible|church|sacred|angel|demon|heaven|hell|karma|universe|cosmic|chakra|energy|manifest|meditat|enlighten|awaken/i.test(text)) {
      category = "Spirituality & Philosophy";
    } else if (/music|song|rap|lyric|beat|rhythm|melody|album|perform|stage|guitar|drum|piano|sing|rapper|hip hop|freestyle/i.test(text)) {
      category = "Music & Performance";
    } else if (/stream|youtube|channel|subscriber|viewer|chat|panel|live|broadcast|content|creator|troll|mod|ban/i.test(text)) {
      category = "Streaming & Community";
    } else if (/love|heart|relationship|boyfriend|girlfriend|married|wife|husband|dating|romance|breakup|trust|loyalty|friend/i.test(text)) {
      category = "Love & Relationships";
    } else if (/cat|kitten|pet|dog|animal|fur|paw|meow|purr/i.test(text)) {
      category = "Cats & Animals";
    } else if (/life|grow|learn|change|struggle|overcome|strong|wisdom|truth|real|fake|genuine|authentic|honest/i.test(text)) {
      category = "Life Wisdom";
    } else if (/funny|laugh|joke|lmao|hilarious|comedy|roast|clown/i.test(text)) {
      category = "Humor";
    } else if (/born|hush|storm|neon|psyche awaken|silver spun|whisper|blade|shadow|verse|rhyme|poetry|poem/i.test(text)) {
      category = "Poetry & Lore";
    }

    if (category && (!q.significance || q.significance.length < 10)) {
      // Only update if no meaningful significance exists
    }
    // Store category in context prefix if we had a tag system
    // For now, track count
    if (category) categorized++;
  }
  console.log(`  ${categorized} quotes categorizable across themes`);

  // =============================================
  // FINAL STATS
  // =============================================
  const finalTotal = await prisma.quote.count();
  const finalWithSpeaker = await prisma.quote.count({ where: { speakerPersonId: { not: null } } });
  const finalNoSpeaker = await prisma.quote.count({ where: { speakerPersonId: null } });
  const beaFinal = await prisma.person.findUnique({
    where: { id: bea.id },
    select: { _count: { select: { guestAppearances: true, quotes: true } } },
  });
  const totalPeople = await prisma.person.count();

  console.log(`\n=== RESULTS ===`);
  console.log(`People merged: ${stats.mergedPeople}`);
  console.log(`Duplicate quotes removed: ${stats.removedDupeQuotes}`);
  console.log(`Junk quotes removed: ${stats.removedJunkQuotes}`);
  console.log(`Quotes attributed to Psyche: ${stats.attributedQuotes}`);
  console.log(`\nFinal: ${finalTotal} quotes (${finalWithSpeaker} with speaker, ${finalNoSpeaker} without)`);
  console.log(`Bea: ${beaFinal?._count.guestAppearances} eps, ${beaFinal?._count.quotes} quotes`);
  console.log(`Total people: ${totalPeople}`);

  // Rebuild searchText for Bea
  const p = await prisma.person.findUnique({
    where: { id: bea.id },
    select: { displayName: true, altNames: true, shortBio: true, loreSummary: true },
  });
  if (p) {
    const searchText = [p.displayName, ...(p.altNames as string[]), p.shortBio, p.loreSummary].filter(Boolean).join(" ");
    await prisma.person.update({ where: { id: bea.id }, data: { searchText } });
  }

  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
