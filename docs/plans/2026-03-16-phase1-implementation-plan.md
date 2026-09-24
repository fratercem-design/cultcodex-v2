# Phase 1 Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Populate series, enrich episode pages, and upgrade search to close the gap between CultCodex's data depth and its public product layer.

**Architecture:** Add ContentType enum to Episode model for livestream/original/short/clip classification. Seed 18 series with regex + Claude API classification. Enhance episode detail pages with synopsis, related episodes, chapters, and CTAs. Extend search with Topics/Quotes results, filters, autocomplete, and suggested searches.

**Tech Stack:** Next.js 16, Prisma 7, PostgreSQL (local Docker + Xata), Claude API (Sonnet), Vitest, Tailwind CSS.

---

### Task 1: Add ContentType enum to schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add the enum and field**

In `prisma/schema.prisma`, add after the `MediaType` enum:

```prisma
enum ContentType {
  livestream
  original
  short
  clip
}
```

In the `Episode` model, add after `status`:

```prisma
contentType ContentType @default(original)
```

**Step 2: Generate migration and push**

Run:
```bash
npx prisma migrate dev --name add-content-type-to-episode
```
Expected: Migration created, Prisma client regenerated.

**Step 3: Push to Xata**

Run:
```bash
export DATABASE_URL=' (Xata — set locally in .env.local)'
npx prisma db push
```
Expected: "The database is already in sync" or schema applied.

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add ContentType enum to Episode model"
```

---

### Task 2: Create series seed script

**Files:**
- Create: `scripts/seed-series.ts`

**Step 1: Write the seed script**

```typescript
import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

const SERIES = [
  // Live Streams
  { title: "Psyche Awakens Tarot", slug: "psyche-awakens-tarot", type: "tarot", description: "The original daily tarot live stream that started it all. Psyche reads tarot cards with cat companions and community vibes.", sortOrder: 1 },
  { title: "Open Panel", slug: "open-panel", type: "panel", description: "Open panel sessions featuring tarot readings, community discussions, cats, and unfiltered conversation.", sortOrder: 2 },
  { title: "Midnight Madness", slug: "midnight-madness", type: "panel", description: "Late night hangout streams with tarot, open panels, and after-dark energy.", sortOrder: 3 },
  { title: "Weekday Streams", slug: "weekday-streams", type: "panel", description: "Casual day-of-week hangout streams — Tuesday afternoons, Chill Fridays, Saturday specials.", sortOrder: 4 },
  { title: "Troll Tribunal", slug: "troll-tribunal", type: "panel", description: "Episodes dedicated to confronting, debating, and roasting trolls. The panel's dark side.", sortOrder: 5 },
  { title: "Classic Cult of Psyche", slug: "classic-cult-of-psyche", type: "other", description: "Recovered and remastered classic moments from the early days of the channel.", sortOrder: 6 },
  // Original Content
  { title: "Music Videos", slug: "music-videos", type: "music_video", description: "Original music videos produced by Cult of Psyche — from Lilith in Scorpio to Diabolique.", sortOrder: 10 },
  { title: "Journey Through the Tarot", slug: "journey-through-the-tarot", type: "tarot", description: "A structured walk through the Major Arcana, one card at a time.", sortOrder: 11 },
  { title: "Baital Pachchisi Tales", slug: "baital-pachchisi-tales", type: "story", description: "Retellings of the ancient Indian Baital Pachchisi (Vikram and the Vampire) stories.", sortOrder: 12 },
  { title: "The Golden Ass", slug: "the-golden-ass", type: "story", description: "A retelling of Apuleius' The Golden Ass, featuring the tale of Cupid and Psyche.", sortOrder: 13 },
  { title: "Quantum Scary Tales", slug: "quantum-scary-tales", type: "story", description: "Classic fairy tales retold through a quantum lens — what really happened to Goldilocks, Little Red Riding Hood, and more.", sortOrder: 14 },
  { title: "Uncle Wiggly Stories", slug: "uncle-wiggly-stories", type: "story", description: "Readings from the beloved Uncle Wiggly Longears stories.", sortOrder: 15 },
  { title: "Secrets of the Mahavidyas", slug: "secrets-of-the-mahavidyas", type: "documentary", description: "Deep dives into the ten Mahavidya goddesses of Hindu tantra — Kali, Tara, Matangi, and beyond.", sortOrder: 16 },
  { title: "64 Divine Arts", slug: "64-divine-arts", type: "documentary", description: "Exploring the 64 traditional arts and sciences — voice, sound, dance, and the skills that define civilization.", sortOrder: 17 },
  { title: "Astrology Deep Dives", slug: "astrology-deep-dives", type: "documentary", description: "In-depth astrological analysis — planetary placements, zodiac signs, birth charts, and cosmic insights.", sortOrder: 18 },
  { title: "Mythology & Lore", slug: "mythology-and-lore", type: "documentary", description: "Standalone retellings and explorations of myths from Greek, Hindu, Buddhist, Tibetan, and folk traditions.", sortOrder: 19 },
  { title: "Trollopedia", slug: "trollopedia", type: "documentary", description: "The comprehensive guide to understanding, identifying, and defeating digital trolls.", sortOrder: 20 },
  { title: "Shorts & Clips", slug: "shorts-and-clips", type: "other", description: "Quick takes, TikTok highlights, viral moments, and bite-sized content.", sortOrder: 30 },
] as const;

async function main() {
  const prisma = getPrisma();

  for (const s of SERIES) {
    await prisma.series.upsert({
      where: { slug: s.slug },
      update: { title: s.title, description: s.description, type: s.type, sortOrder: s.sortOrder, status: "published" },
      create: { title: s.title, slug: s.slug, description: s.description, type: s.type as any, sortOrder: s.sortOrder, status: "published" },
    });
    console.log(`  ✓ ${s.title}`);
  }

  console.log(`\nSeeded ${SERIES.length} series.`);
  await disconnect();
}

main();
```

**Step 2: Run the seed script**

```bash
npx dotenvx run -- npx tsx scripts/seed-series.ts
```
Expected: 18 lines of "✓ Series Name".

**Step 3: Run against Xata**

```bash
export DATABASE_URL=' (Xata — set locally in .env.local)'
npx tsx scripts/seed-series.ts
```

**Step 4: Commit**

```bash
git add scripts/seed-series.ts
git commit -m "feat: add series seed script with 18 series definitions"
```

---

### Task 3: Create episode classification script (regex pass)

**Files:**
- Create: `scripts/classify-episodes.ts`

**Step 1: Write the classification script**

```typescript
import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

interface Rule {
  seriesSlug: string;
  contentType: "livestream" | "original" | "short" | "clip";
  match: (title: string, epNum: number | null) => boolean;
}

const RULES: Rule[] = [
  // Shorts & Clips — check first (most specific hashtag patterns)
  { seriesSlug: "shorts-and-clips", contentType: "short", match: (t) => /#shorts/i.test(t) || /#tiktoklive/i.test(t) || /^#\w+/i.test(t) || /#livehighlights/i.test(t) },

  // Live Streams
  { seriesSlug: "psyche-awakens-tarot", contentType: "livestream", match: (t, n) => /psyche awakens tarot/i.test(t) && (n ?? 999) <= 84 },
  { seriesSlug: "open-panel", contentType: "livestream", match: (t) => /open panel/i.test(t) },
  { seriesSlug: "midnight-madness", contentType: "livestream", match: (t) => /midnight madness/i.test(t) },
  { seriesSlug: "troll-tribunal", contentType: "livestream", match: (t) => /troll tribunal/i.test(t) || /troll side of the panel/i.test(t) },
  { seriesSlug: "weekday-streams", contentType: "livestream", match: (t) => /^(tuesday|wednesday|thursday|friday|saturday|sunday)\s+(afternoon|morning|night|stream)/i.test(t) || /chill friday/i.test(t) || /friday night with psyche/i.test(t) || /saturday night alive/i.test(t) || /^happy (friday|saturday|thursday)/i.test(t) },
  { seriesSlug: "classic-cult-of-psyche", contentType: "clip", match: (t) => /^classic cult of psyche/i.test(t) },

  // Original Content
  { seriesSlug: "music-videos", contentType: "original", match: (t) => /music video/i.test(t) || /official music video/i.test(t) },
  { seriesSlug: "journey-through-the-tarot", contentType: "original", match: (t) => /journey through the tarot/i.test(t) },
  { seriesSlug: "baital-pachchisi-tales", contentType: "original", match: (t) => /bai?tal\s*(pa|ch)/i.test(t) },
  { seriesSlug: "the-golden-ass", contentType: "original", match: (t) => /the golden ass/i.test(t) },
  { seriesSlug: "quantum-scary-tales", contentType: "original", match: (t) => /scary tales?/i.test(t) || (/what really happened/i.test(t) && /(little|goldilocks|mermaid|riding hood|sleeping|duckling|frog|chicken|rumpel|beanstalk)/i.test(t)) },
  { seriesSlug: "uncle-wiggly-stories", contentType: "original", match: (t) => /uncle wigg/i.test(t) },
  { seriesSlug: "secrets-of-the-mahavidyas", contentType: "original", match: (t) => /mahavidya/i.test(t) || /secrets of the mahavidyas/i.test(t) || /(goddess\s+(kali|tara|bagalamukhi|matangi|kameshvari|lalitha|tripura))/i.test(t) },
  { seriesSlug: "64-divine-arts", contentType: "original", match: (t) => /divine art(s?)\s*(of|#|series)/i.test(t) || /^#?\d+\s*the divine art/i.test(t) },
  { seriesSlug: "astrology-deep-dives", contentType: "original", match: (t) => /astrology deep dive/i.test(t) || /astrological (deep dive|analysis)/i.test(t) || /vedic (horoscope|astrology)/i.test(t) || /sabian symbols/i.test(t) },
  { seriesSlug: "trollopedia", contentType: "original", match: (t) => /trollopedia/i.test(t) || /troll decoder/i.test(t) || /panelverse troll/i.test(t) },
  { seriesSlug: "mythology-and-lore", contentType: "original", match: (t) => /(inanna|ceridwen|taliesin|urvasi|mohini|ganesh|arachne|athena|cupid and psyche|dead sea scrolls|jezebel|yakshini|dakini)/i.test(t) },
];

async function main() {
  const prisma = getPrisma();

  // Load series slugs → IDs
  const allSeries = await prisma.series.findMany({ select: { id: true, slug: true } });
  const seriesMap = new Map(allSeries.map((s) => [s.slug, s.id]));

  // Load all episodes
  const episodes = await prisma.episode.findMany({
    select: { id: true, title: true, slug: true, episodeNumber: true, seriesId: true },
    orderBy: { episodeNumber: "asc" },
  });

  let matched = 0;
  let skipped = 0;
  const unmatched: string[] = [];

  for (const ep of episodes) {
    const rule = RULES.find((r) => r.match(ep.title, ep.episodeNumber));
    if (rule) {
      const seriesId = seriesMap.get(rule.seriesSlug);
      if (!seriesId) { console.error(`  ✗ No series ID for slug: ${rule.seriesSlug}`); continue; }
      await prisma.episode.update({
        where: { id: ep.id },
        data: { seriesId, contentType: rule.contentType },
      });
      matched++;
    } else {
      unmatched.push(`${ep.episodeNumber}|${ep.title}`);
      skipped++;
    }
  }

  console.log(`\nMatched: ${matched}, Unmatched: ${skipped}`);
  if (unmatched.length > 0) {
    const unmatchedPath = "scripts/unmatched-episodes.txt";
    require("fs").writeFileSync(unmatchedPath, unmatched.join("\n"));
    console.log(`Unmatched episodes saved to ${unmatchedPath}`);
  }

  await disconnect();
}

main();
```

**Step 2: Run locally**

```bash
npx dotenvx run -- npx tsx scripts/classify-episodes.ts
```
Expected: "Matched: ~400-500, Unmatched: ~700"

**Step 3: Run against Xata**

```bash
export DATABASE_URL='...' npx tsx scripts/classify-episodes.ts
```

**Step 4: Commit**

```bash
git add scripts/classify-episodes.ts
git commit -m "feat: add regex-based episode classification into series"
```

---

### Task 4: Classify remaining episodes with Claude API

**Files:**
- Create: `scripts/classify-remaining.ts`

**Step 1: Write the Claude classification script**

This script reads `scripts/unmatched-episodes.txt`, sends batches of 50 titles to Claude, and assigns series + contentType.

```typescript
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { getPrisma, disconnect } from "./ingest/lib";

const UNMATCHED_PATH = path.join(__dirname, "unmatched-episodes.txt");

const SERIES_SLUGS = [
  "psyche-awakens-tarot", "open-panel", "midnight-madness", "weekday-streams",
  "troll-tribunal", "classic-cult-of-psyche", "music-videos",
  "journey-through-the-tarot", "baital-pachchisi-tales", "the-golden-ass",
  "quantum-scary-tales", "uncle-wiggly-stories", "secrets-of-the-mahavidyas",
  "64-divine-arts", "astrology-deep-dives", "mythology-and-lore",
  "trollopedia", "shorts-and-clips",
];

const PROMPT = `You are classifying Cult of Psyche YouTube episodes into series.

Available series slugs: ${SERIES_SLUGS.join(", ")}
If none fit, use "NONE".

Content types: livestream, original, short, clip

For each episode, output ONE line: episodeNumber|seriesSlug|contentType

Rules:
- Music videos, songs, dedicated tracks → music-videos / original
- Tarot reading streams, panel hangouts → appropriate live series / livestream
- Short-form content (#shorts, promo, TikTok) → shorts-and-clips / short
- Mythology retellings → mythology-and-lore / original
- Astrology/horoscope content → astrology-deep-dives / original
- Goddess deep dives (Hindu) → secrets-of-the-mahavidyas / original
- Drama/roast/panel clips → NONE / clip if short, livestream if long
- Standalone vlogs, rants, stories → NONE / original
- If unclear, use NONE / original

Episodes to classify:
`;

async function main() {
  const prisma = getPrisma();
  const client = new Anthropic();

  const lines = fs.readFileSync(UNMATCHED_PATH, "utf-8").trim().split("\n");
  console.log(`${lines.length} unmatched episodes to classify`);

  // Load series map
  const allSeries = await prisma.series.findMany({ select: { id: true, slug: true } });
  const seriesMap = new Map(allSeries.map((s) => [s.slug, s.id]));

  // Process in batches of 50
  const BATCH = 50;
  let classified = 0;

  for (let i = 0; i < lines.length; i += BATCH) {
    const batch = lines.slice(i, i + BATCH);
    const batchText = batch.join("\n");

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: PROMPT + batchText }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const resultLines = text.trim().split("\n");

    for (const line of resultLines) {
      const parts = line.split("|");
      if (parts.length < 3) continue;
      const [epNumStr, seriesSlug, contentType] = parts;
      const epNum = parseInt(epNumStr.trim(), 10);
      if (isNaN(epNum)) continue;

      const data: any = { contentType: contentType.trim() };
      if (seriesSlug.trim() !== "NONE") {
        const seriesId = seriesMap.get(seriesSlug.trim());
        if (seriesId) data.seriesId = seriesId;
      }

      await prisma.episode.updateMany({
        where: { episodeNumber: epNum },
        data,
      });
      classified++;
    }

    console.log(`  Batch ${Math.floor(i / BATCH) + 1}: classified ${resultLines.length} episodes`);
    // Rate limit pause
    await new Promise((r) => setTimeout(r, 5000));
  }

  console.log(`\nTotal classified: ${classified}`);
  await disconnect();
}

main();
```

**Step 2: Run locally**

```bash
npx dotenvx run -- npx tsx scripts/classify-remaining.ts
```

**Step 3: Run against Xata, then commit**

```bash
git add scripts/classify-remaining.ts
git commit -m "feat: add Claude-based classification for remaining episodes"
```

---

### Task 5: Add related episodes query

**Files:**
- Modify: `src/lib/queries/episodes.ts`

**Step 1: Add getRelatedEpisodes function**

Append to `src/lib/queries/episodes.ts`:

```typescript
export async function getRelatedEpisodes(episodeId: string, options?: {
  limit?: number;
}) {
  const { limit = 6 } = options ?? {};

  // First try explicit relations
  const explicit = await prisma.relatedEpisode.findMany({
    where: { OR: [{ episodeAId: episodeId }, { episodeBId: episodeId }] },
    include: {
      episodeA: { select: { id: true, title: true, slug: true, episodeNumber: true, airDate: true, summaryShort: true, status: true, contentType: true } },
      episodeB: { select: { id: true, title: true, slug: true, episodeNumber: true, airDate: true, summaryShort: true, status: true, contentType: true } },
    },
    take: limit,
  });

  const explicitEps = explicit.map((r) =>
    r.episodeAId === episodeId ? r.episodeB : r.episodeA
  );

  if (explicitEps.length >= limit) return explicitEps;

  // Fallback: same series
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    select: { seriesId: true, episodeNumber: true },
  });

  if (!episode?.seriesId) return explicitEps;

  const excludeIds = [episodeId, ...explicitEps.map((e) => e.id)];
  const sameSeries = await prisma.episode.findMany({
    where: {
      seriesId: episode.seriesId,
      id: { notIn: excludeIds },
      status: "published",
    },
    select: { id: true, title: true, slug: true, episodeNumber: true, airDate: true, summaryShort: true, status: true, contentType: true },
    orderBy: { episodeNumber: "desc" },
    take: limit - explicitEps.length,
  });

  return [...explicitEps, ...sameSeries];
}
```

**Step 2: Commit**

```bash
git add src/lib/queries/episodes.ts
git commit -m "feat: add getRelatedEpisodes query with explicit + series fallback"
```

---

### Task 6: Enhance episode detail page

**Files:**
- Modify: `src/app/episodes/[slug]/page.tsx`

**Step 1: Update the episode detail page**

Add imports at top:

```typescript
import { getRelatedEpisodes } from "@/lib/queries/episodes";
import { EpisodeCard } from "@/components/archive/episode-card";
```

In the `EpisodeDetailPage` function, after fetching episode, add:

```typescript
const relatedEpisodes = await getRelatedEpisodes(episode.id, { limit: 6 });
```

Add these sections to the main content column (after quotes section):

**Short synopsis** (before long summary):
```tsx
{/* Short synopsis */}
{episode.summaryShort && (
  <div className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 p-4">
    <p className="text-sm text-text-primary leading-relaxed font-medium">
      {episode.summaryShort}
    </p>
  </div>
)}
```

**Watch on YouTube CTA** (after video embed):
```tsx
{episode.youtubeVideoId && (
  <a
    href={`https://www.youtube.com/watch?v=${episode.youtubeVideoId}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 rounded border border-red-500/30 bg-red-500/10 px-4 py-2 font-mono text-xs text-red-400 transition hover:bg-red-500/20"
  >
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/><path fill="#fff" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
    Watch on YouTube
  </a>
)}
```

**Content type badge** in the metadata sidebar:
```tsx
{episode.contentType && episode.contentType !== "original" && (
  <MetaRow
    label="Type"
    value={
      <StatusBadge
        label={episode.contentType.toUpperCase()}
        variant={episode.contentType === "livestream" ? "purple" : "muted"}
      />
    }
  />
)}
```

**Series breadcrumb** above the PageHero:
```tsx
{episode.series && (
  <nav className="mx-auto max-w-7xl px-4 pt-4">
    <ol className="flex items-center gap-2 font-mono text-xs text-text-muted">
      <li><Link href="/series" className="hover:text-accent-green transition-colors">Series</Link></li>
      <li>/</li>
      <li><Link href={`/series/${episode.series.slug}`} className="hover:text-accent-green transition-colors">{episode.series.title}</Link></li>
      <li>/</li>
      <li className="text-text-primary">{epNum ?? episode.title}</li>
    </ol>
  </nav>
)}
```

**Related episodes** at the bottom of main:
```tsx
{relatedEpisodes.length > 0 && (
  <section className="mt-8">
    <SectionCard title="Related Episodes">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {relatedEpisodes.map((ep) => (
          <Link
            key={ep.id}
            href={`/episodes/${ep.slug}`}
            className="group block rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent-green/30 hover:bg-elevated"
          >
            {ep.episodeNumber != null && (
              <span className="font-mono text-[10px] text-accent-green font-bold">
                EP.{String(ep.episodeNumber).padStart(3, "0")}
              </span>
            )}
            <h4 className="mt-1 text-sm font-medium text-text-primary group-hover:text-accent-green transition-colors line-clamp-2">
              {ep.title}
            </h4>
            {ep.summaryShort && (
              <p className="mt-1 text-xs text-text-muted line-clamp-2">{ep.summaryShort}</p>
            )}
          </Link>
        ))}
      </div>
    </SectionCard>
  </section>
)}
```

**Step 2: Update episode query to include contentType**

In `src/lib/queries/episodes.ts`, the `buildEpisodeInclude()` already includes all fields (no select filter), so `contentType` will be available automatically after the schema migration.

**Step 3: Commit**

```bash
git add src/app/episodes/[slug]/page.tsx src/lib/queries/episodes.ts
git commit -m "feat: enrich episode detail pages with synopsis, related, CTA, badges"
```

---

### Task 7: Add Topics and Quotes to search

**Files:**
- Modify: `src/lib/queries/search.ts`
- Modify: `src/app/search/page.tsx`

**Step 1: Extend search.ts**

Add to the `GlobalSearchResults` interface:
```typescript
topics: SearchResultTopic[];
quotes: SearchResultQuote[];
topicsTotalCount: number;
quotesTotalCount: number;
```

Add types:
```typescript
export interface SearchResultTopic {
  id: string;
  title: string;
  slug: string;
  description: string | null;
}

export interface SearchResultQuote {
  id: string;
  text: string;
  speakerName: string | null;
  episodeTitle: string | null;
  episodeSlug: string | null;
}
```

Add search functions:
```typescript
async function searchTopics(query: string): Promise<SearchResultTopic[]> {
  return prisma.topic.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { id: true, title: true, slug: true, description: true },
    orderBy: { title: "asc" },
    take: SEARCH_LIMIT,
  });
}

async function searchQuotes(query: string): Promise<SearchResultQuote[]> {
  const quotes = await prisma.quote.findMany({
    where: { text: { contains: query, mode: "insensitive" } },
    select: {
      id: true,
      text: true,
      speaker: { select: { displayName: true } },
      episode: { select: { title: true, slug: true } },
    },
    take: SEARCH_LIMIT,
  });
  return quotes.map((q) => ({
    id: q.id,
    text: q.text,
    speakerName: q.speaker?.displayName ?? null,
    episodeTitle: q.episode?.title ?? null,
    episodeSlug: q.episode?.slug ?? null,
  }));
}

async function countTopics(query: string): Promise<number> {
  return prisma.topic.count({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    },
  });
}

async function countQuotes(query: string): Promise<number> {
  return prisma.quote.count({
    where: { text: { contains: query, mode: "insensitive" } },
  });
}
```

Update `globalSearch` to include topics and quotes in Promise.all and return them.

**Step 2: Add Topics and Quotes sections to search page**

In `src/app/search/page.tsx`, add sections for Topics and Quotes following the same pattern as Episodes/People/Lore sections.

**Step 3: Commit**

```bash
git add src/lib/queries/search.ts src/app/search/page.tsx
git commit -m "feat: add Topics and Quotes to search results"
```

---

### Task 8: Add suggested searches and autocomplete

**Files:**
- Modify: `src/app/search/page.tsx`
- Modify: `src/components/search/search-input.tsx`
- Create: `src/app/api/search/suggest/route.ts`

**Step 1: Add suggested searches to search page**

Replace the empty state in `search/page.tsx`:

```tsx
{!results && (
  <div className="space-y-4">
    <p className="font-mono text-xs text-text-muted">Popular searches:</p>
    <div className="flex flex-wrap gap-2">
      {["tarot reading", "Lilith", "open panel", "Alexandra Mayers", "Cupid and Psyche", "astrology", "trolls", "scary tales", "Psyche Awakens", "mythology"].map((q) => (
        <Link
          key={q}
          href={`/search?q=${encodeURIComponent(q)}`}
          className="rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-xs text-text-primary transition-colors hover:border-accent-green hover:text-accent-green"
        >
          {q}
        </Link>
      ))}
    </div>
  </div>
)}
```

**Step 2: Create suggest API route**

```typescript
// src/app/api/search/suggest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const [episodes, people, lore, topics] = await Promise.all([
    prisma.episode.findMany({
      where: { title: { contains: q, mode: "insensitive" }, status: "published" },
      select: { title: true, slug: true },
      take: 3,
    }),
    prisma.person.findMany({
      where: { displayName: { contains: q, mode: "insensitive" } },
      select: { displayName: true, slug: true },
      take: 2,
    }),
    prisma.loreEntry.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      select: { title: true, slug: true },
      take: 2,
    }),
    prisma.topic.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      select: { title: true, slug: true },
      take: 2,
    }),
  ]);

  const suggestions = [
    ...episodes.map((e) => ({ label: e.title, href: `/episodes/${e.slug}`, type: "episode" })),
    ...people.map((p) => ({ label: p.displayName, href: `/people/${p.slug}`, type: "person" })),
    ...lore.map((l) => ({ label: l.title, href: `/lore/${l.slug}`, type: "lore" })),
    ...topics.map((t) => ({ label: t.title, href: `/topics/${t.slug}`, type: "topic" })),
  ].slice(0, 8);

  return NextResponse.json(suggestions);
}
```

**Step 3: Add autocomplete to SearchInput**

Update `src/components/search/search-input.tsx` to add a dropdown that fetches `/api/search/suggest?q=...` on input change with 300ms debounce. Show results in a dropdown below the input.

**Step 4: Commit**

```bash
git add src/app/search/page.tsx src/components/search/search-input.tsx src/app/api/search/suggest/route.ts
git commit -m "feat: add suggested searches and autocomplete to search"
```

---

### Task 9: Add search filters

**Files:**
- Modify: `src/app/search/page.tsx`
- Modify: `src/lib/queries/search.ts`

**Step 1: Add filter query params to search**

Extend `SearchPageProps.searchParams` to accept:
- `type`: comma-separated entity types (episodes,people,lore,topics,quotes)
- `contentType`: livestream,original,short,clip
- `series`: series slug
- `dateFrom`, `dateTo`: ISO dates
- `canon`: canon status for lore

**Step 2: Update globalSearch to accept filter options**

Add a `SearchFilters` interface and pass it through to per-entity search functions. Each function applies the relevant filters.

**Step 3: Add filter sidebar UI to search page**

Add a collapsible sidebar with checkboxes and dropdowns for each filter. Filters update URL params on change (no JS submit needed — Next.js server component re-renders).

**Step 4: Commit**

```bash
git add src/app/search/page.tsx src/lib/queries/search.ts
git commit -m "feat: add search filters for entity type, content type, series, date range"
```

---

### Task 10: Enrichment pipeline automation

**Files:**
- Create: `scripts/enrich/full-pipeline.ts`
- Modify: `scripts/enrich/enrich-episodes.ts` (add transcript truncation)

**Step 1: Add transcript truncation**

In `scripts/enrich/enrich-episodes.ts`, before calling `enrichEpisode()`, add:

```typescript
// Truncate very long transcripts to ~150k tokens (~600k chars)
const MAX_CHARS = 600_000;
const truncatedTranscript = transcriptText.length > MAX_CHARS
  ? transcriptText.slice(0, MAX_CHARS) + "\n\n[TRANSCRIPT TRUNCATED — original was " + transcriptText.length + " chars]"
  : transcriptText;
```

Pass `truncatedTranscript` instead of `transcriptText` to `enrichEpisode()`.

**Step 2: Create full pipeline script**

```typescript
// scripts/enrich/full-pipeline.ts
import "dotenv/config";
import { execSync } from "child_process";

const DATABASE_URL = process.env.DATABASE_URL!; // Xata — set in .env.local

function run(cmd: string, env?: Record<string, string>) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
}

async function main() {
  const batch = process.argv[2] ?? "100";

  console.log("═══ STEP 1: Enrich episodes ═══");
  run(`npx tsx scripts/enrich/enrich-episodes.ts --batch ${batch}`);

  console.log("\n═══ STEP 2: Import to local DB ═══");
  run("npx tsx scripts/enrich/import-enriched.ts");

  console.log("\n═══ STEP 3: Import to Xata ═══");
  run("npx tsx scripts/enrich/import-enriched.ts", { DATABASE_URL: DATABASE_URL });

  console.log("\n═══ STEP 4: Deploy to Vercel ═══");
  run("npx vercel --prod --yes");

  console.log("\n✅ Full pipeline complete!");
}

main().catch((err) => {
  console.error("Pipeline failed:", err.message);
  process.exit(1);
});
```

**Step 3: Add npm script**

In `package.json`, add:
```json
"enrich:pipeline": "npx dotenvx run -- npx tsx scripts/enrich/full-pipeline.ts"
```

**Step 4: Commit**

```bash
git add scripts/enrich/full-pipeline.ts scripts/enrich/enrich-episodes.ts package.json
git commit -m "feat: add full enrichment pipeline and transcript truncation"
```

---

### Task 11: Final deploy and verify

**Step 1: Run full build locally**

```bash
npm run build
```
Expected: Build succeeds with no type errors.

**Step 2: Deploy to Vercel**

```bash
npx vercel --prod
```

**Step 3: Verify on live site**

- Visit https://cultcodex.me/series — should show 18 series
- Visit https://cultcodex.me/episodes — episodes should have content type badges
- Visit an enriched episode — should show synopsis, related, YouTube CTA
- Visit https://cultcodex.me/search — should show suggested searches
- Search "Lilith" — should show Topics and Quotes in results

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: final adjustments from Phase 1 verification"
```
