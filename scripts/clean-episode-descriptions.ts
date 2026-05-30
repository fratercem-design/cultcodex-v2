#!/usr/bin/env npx tsx
/**
 * Scrubs promotional injections and YouTube boilerplate from episode descriptions.
 *
 * Patterns removed:
 *   - vidIQ promotional lines
 *   - "Hello, future initiate!" AI preamble
 *   - "like and subscribe" / "subscribe for more" boilerplate
 *   - Standalone emoji-only lines
 *   - Excessive blank lines collapsed to one
 *
 * Usage:
 *   npx tsx scripts/clean-episode-descriptions.ts            # dry run (shows changes, writes nothing)
 *   npx tsx scripts/clean-episode-descriptions.ts --apply   # writes cleaned descriptions to DB
 */

import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient();

const BOILERPLATE_PATTERNS: RegExp[] = [
  /get vidiq[^\n]*/gi,
  /vidiq[^\n]*/gi,
  /hello,?\s*(future\s+initiate|initiate)[^\n]*/gi,
  /like\s+and\s+subscribe[^\n]*/gi,
  /subscribe\s+for\s+more[^\n]*/gi,
  /don't\s+forget\s+to\s+(like|subscribe|comment)[^\n]*/gi,
  /join\s+this\s+channel[^\n]*/gi,
  /🚀\s*[^\n]*/g,
  /^\s*[📌🔗💬🔔]+\s*$/gm,  // lines that are only emoji
];

function cleanDescription(raw: string): string {
  let text = raw;

  for (const pattern of BOILERPLATE_PATTERNS) {
    text = text.replace(pattern, "");
  }

  // Collapse 3+ blank lines into one
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

async function main() {
  const apply = process.argv.includes("--apply");

  const episodes = await prisma.episode.findMany({
    where: { description: { not: null } },
    select: { id: true, episodeNumber: true, title: true, description: true },
  });

  let changed = 0;
  const updates: { id: string; cleaned: string }[] = [];

  for (const ep of episodes) {
    if (!ep.description) continue;
    const cleaned = cleanDescription(ep.description);
    if (cleaned !== ep.description) {
      changed++;
      updates.push({ id: ep.id, cleaned });
      if (!apply) {
        console.log(`\nEP.${ep.episodeNumber ?? "?"} — ${ep.title?.slice(0, 60)}`);
        console.log(`  BEFORE: ${ep.description.slice(0, 120).replace(/\n/g, " ")}`);
        console.log(`  AFTER:  ${cleaned.slice(0, 120).replace(/\n/g, " ")}`);
      }
    }
  }

  console.log(`\n${changed} of ${episodes.length} descriptions need cleaning.`);

  if (apply) {
    for (const { id, cleaned } of updates) {
      await prisma.episode.update({ where: { id }, data: { description: cleaned } });
    }
    console.log(`Applied ${changed} updates.`);
  } else {
    console.log("Dry run — pass --apply to write changes to DB.");
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
