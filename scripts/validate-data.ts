/**
 * CultCodex Data Validation Script
 * Checks for common data integrity issues across the database.
 * Run: npx tsx scripts/validate-data.ts
 */

import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const p = new PrismaClient({ adapter });

interface Issue {
  severity: "error" | "warning" | "info";
  category: string;
  message: string;
}

const issues: Issue[] = [];

function report(severity: Issue["severity"], category: string, message: string) {
  issues.push({ severity, category, message });
}

async function validateEpisodes() {
  // Episodes with no airDate
  const noDate = await p.episode.count({ where: { airDate: null } });
  if (noDate > 0) {
    report("warning", "episodes", `${noDate} episodes have no airDate`);
  }

  // Episodes with no summary (unenriched)
  const noSummary = await p.episode.count({ where: { summaryLong: null } });
  if (noSummary > 0) {
    report("warning", "episodes", `${noSummary} episodes have no summaryLong (unenriched)`);
  }

  // Episodes with no transcript segments
  const noTranscript = await p.episode.count({
    where: { segments: { none: {} } },
  });
  report("info", "episodes", `${noTranscript} episodes have no transcript segments`);

  // Duplicate slugs (should be impossible with unique constraint, but check)
  const slugCounts = await p.episode.groupBy({
    by: ["slug"],
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } },
  });
  if (slugCounts.length > 0) {
    report("error", "episodes", `${slugCounts.length} duplicate episode slugs found`);
  }

  // Episodes with status "unavailable" that still have a youtubeVideoId
  const unavailableWithYt = await p.episode.count({
    where: { status: "unavailable", youtubeVideoId: { not: null } },
  });
  if (unavailableWithYt > 0) {
    report("info", "episodes", `${unavailableWithYt} unavailable episodes still have a youtubeVideoId`);
  }
}

async function validatePeople() {
  // Duplicate host records
  const hostCount = await p.person.count({ where: { personType: "host" } });
  if (hostCount > 5) {
    report("warning", "people", `${hostCount} records with personType=host (likely duplicates — expected 1-3)`);
  }

  // People with no appearances and no mentions
  const orphans = await p.person.findMany({
    where: {
      guestAppearances: { none: {} },
      mentions: { none: {} },
      quotes: { none: {} },
    },
    select: { displayName: true, personType: true },
  });
  if (orphans.length > 0) {
    report("warning", "people", `${orphans.length} people have no appearances, mentions, or quotes`);
  }

  // Duplicate display names (case-insensitive)
  const people = await p.person.findMany({
    select: { displayName: true, slug: true, personType: true },
  });
  const nameMap = new Map<string, typeof people>();
  for (const person of people) {
    const key = person.displayName.toLowerCase().trim();
    if (!nameMap.has(key)) nameMap.set(key, []);
    nameMap.get(key)!.push(person);
  }
  const dupes = [...nameMap.entries()].filter(([, v]) => v.length > 1);
  if (dupes.length > 0) {
    report("warning", "people", `${dupes.length} duplicate display names found (case-insensitive)`);
    for (const [name, records] of dupes.slice(0, 5)) {
      report("info", "people", `  "${name}": ${records.map(r => `${r.slug} (${r.personType})`).join(", ")}`);
    }
  }
}

async function validateQuotes() {
  // Quotes with no speaker
  const noSpeaker = await p.quote.count({ where: { speakerPersonId: null } });
  if (noSpeaker > 0) {
    report("warning", "quotes", `${noSpeaker} quotes have no speaker assigned`);
  }

  // Quotes with no episode
  const noEpisode = await p.quote.count({ where: { episodeId: null } });
  if (noEpisode > 0) {
    report("error", "quotes", `${noEpisode} quotes have no episode assigned`);
  }
}

async function validateTopics() {
  // Topics with no episodes
  const orphanTopics = await p.topic.count({
    where: { episodes: { none: {} } },
  });
  if (orphanTopics > 0) {
    report("info", "topics", `${orphanTopics} topics are not linked to any episodes`);
  }

  // Duplicate topic slugs
  const topicSlugCounts = await p.topic.groupBy({
    by: ["slug"],
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } },
  });
  if (topicSlugCounts.length > 0) {
    report("error", "topics", `${topicSlugCounts.length} duplicate topic slugs found`);
  }
}

async function validateLore() {
  // Lore entries with no firstMentionEpisode
  const noFirstMention = await p.loreEntry.count({
    where: { firstMentionEpisodeId: null },
  });
  if (noFirstMention > 0) {
    report("info", "lore", `${noFirstMention} lore entries have no firstMentionEpisode`);
  }
}

async function validateRelationships() {
  // Hosts appearing as guests (data quality issue)
  const hosts = await p.person.findMany({
    where: { personType: "host" },
    select: { id: true, displayName: true },
  });
  for (const host of hosts) {
    const guestCount = await p.episodeGuest.count({ where: { personId: host.id } });
    if (guestCount > 10) {
      report("warning", "relationships", `Host "${host.displayName}" appears as guest in ${guestCount} episodes`);
    }
  }
}

async function main() {
  console.log("CultCodex Data Validation");
  console.log("=".repeat(50));

  await validateEpisodes();
  await validatePeople();
  await validateQuotes();
  await validateTopics();
  await validateLore();
  await validateRelationships();

  // Summary
  const errors = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");
  const infos = issues.filter(i => i.severity === "info");

  console.log("");
  if (errors.length > 0) {
    console.log("ERRORS:");
    errors.forEach(i => console.log(`  [ERROR] ${i.category}: ${i.message}`));
  }
  if (warnings.length > 0) {
    console.log("WARNINGS:");
    warnings.forEach(i => console.log(`  [WARN]  ${i.category}: ${i.message}`));
  }
  if (infos.length > 0) {
    console.log("INFO:");
    infos.forEach(i => console.log(`  [INFO]  ${i.category}: ${i.message}`));
  }

  console.log("");
  console.log(`Total: ${errors.length} errors, ${warnings.length} warnings, ${infos.length} info`);

  await p.$disconnect();
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
