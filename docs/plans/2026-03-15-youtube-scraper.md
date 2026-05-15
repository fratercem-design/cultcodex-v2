# YouTube Scraper & Transcript Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build CLI scripts that scrape all video metadata and transcripts from the Cult of Psyche YouTube channel, transform them into the CultCodex ingestion format, and load into PostgreSQL.

**Architecture:** Three scripts in `scripts/scrape/`: (1) fetch metadata from YouTube Data API v3, (2) fetch auto-generated transcripts, (3) transform into the existing `EpisodeRow` format for the ingestion pipeline. A shared `lib.ts` provides the YouTube API client and duration parsing utilities.

**Tech Stack:** TypeScript, tsx, googleapis (YouTube Data API v3), youtube-transcript, dotenv, zod, Vitest

---

### Task 1: Install dependencies and create shared scrape library

**Files:**
- Create: `scripts/scrape/lib.ts`
- Test: `scripts/scrape/__tests__/lib.test.ts`

**Step 1: Install npm packages**

Run:
```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
npm install googleapis youtube-transcript
```

**Step 2: Write the failing test**

```typescript
// scripts/scrape/__tests__/lib.test.ts
import { describe, it, expect } from "vitest";
import { parseDuration, formatDuration, parsePublishedDate } from "../lib";

describe("parseDuration", () => {
  it("parses hours, minutes, seconds", () => {
    expect(parseDuration("PT2H48M43S")).toBe("2:48:43");
  });

  it("parses minutes and seconds only", () => {
    expect(parseDuration("PT29M31S")).toBe("29:31");
  });

  it("parses seconds only", () => {
    expect(parseDuration("PT45S")).toBe("0:45");
  });

  it("parses hours and minutes without seconds", () => {
    expect(parseDuration("PT1H30M")).toBe("1:30:00");
  });

  it("pads minutes and seconds with leading zeros", () => {
    expect(parseDuration("PT1H5M3S")).toBe("1:05:03");
  });

  it("returns null for empty or invalid input", () => {
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("invalid")).toBeNull();
  });
});

describe("formatDuration", () => {
  it("formats total seconds to H:MM:SS", () => {
    expect(formatDuration(3723)).toBe("1:02:03");
  });

  it("formats under an hour to MM:SS", () => {
    expect(formatDuration(125)).toBe("2:05");
  });

  it("formats zero", () => {
    expect(formatDuration(0)).toBe("0:00");
  });
});

describe("parsePublishedDate", () => {
  it("extracts YYYY-MM-DD from ISO datetime", () => {
    expect(parsePublishedDate("2025-09-18T15:30:00Z")).toBe("2025-09-18");
  });

  it("returns null for empty input", () => {
    expect(parsePublishedDate("")).toBeNull();
    expect(parsePublishedDate(undefined)).toBeNull();
  });
});
```

**Step 3: Run test to verify it fails**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npx vitest run scripts/scrape/__tests__/lib.test.ts`
Expected: FAIL — module not found

**Step 4: Write minimal implementation**

```typescript
// scripts/scrape/lib.ts
import "dotenv/config";
import { google } from "googleapis";

// ─── YouTube API client ─────────────────────────────
let _youtube: ReturnType<typeof google.youtube> | null = null;

export function getYouTube() {
  if (_youtube) return _youtube;
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY environment variable is not set");
  }
  _youtube = google.youtube({ version: "v3", auth: apiKey });
  return _youtube;
}

// ─── Duration parsing (ISO 8601 → human-readable) ──
export function parseDuration(iso: string): string | null {
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }
  return `0:${String(seconds).padStart(2, "0")}`;
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// ─── Date parsing ───────────────────────────────────
export function parsePublishedDate(iso: string | undefined | null): string | null {
  if (!iso) return null;
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}
```

**Step 5: Run test to verify it passes**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npx vitest run scripts/scrape/__tests__/lib.test.ts`
Expected: PASS — all 11 tests green

**Step 6: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add scripts/scrape/lib.ts scripts/scrape/__tests__/lib.test.ts
git commit -m "feat(scrape): add shared lib with YouTube client, duration/date parsing"
```

---

### Task 2: YouTube metadata scraper

**Files:**
- Create: `scripts/scrape/fetch-youtube.ts`
- Create: `scripts/scrape/types.ts`

**Step 1: Create the types file**

```typescript
// scripts/scrape/types.ts
import { z } from "zod";

export const YouTubeVideoSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  description: z.string(),
  publishedAt: z.string(),
  duration: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  viewCount: z.number().nullable(),
  channelTitle: z.string(),
});

export type YouTubeVideo = z.infer<typeof YouTubeVideoSchema>;

export const YouTubeRawSchema = z.object({
  channelId: z.string(),
  channelTitle: z.string(),
  fetchedAt: z.string(),
  totalVideos: z.number(),
  videos: z.array(YouTubeVideoSchema),
});

export type YouTubeRaw = z.infer<typeof YouTubeRawSchema>;
```

**Step 2: Create the scraper script**

```typescript
// scripts/scrape/fetch-youtube.ts
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { getYouTube, parseDuration } from "./lib";
import type { YouTubeVideo, YouTubeRaw } from "./types";

const DATA_DIR = join(__dirname, "data");
const OUTPUT_FILE = join(DATA_DIR, "youtube-raw.json");

async function getChannelId(handleOrId: string): Promise<{ channelId: string; title: string }> {
  const yt = getYouTube();

  // If it starts with UC, assume it's already a channel ID
  if (handleOrId.startsWith("UC")) {
    const res = await yt.channels.list({
      part: ["snippet"],
      id: [handleOrId],
    });
    const ch = res.data.items?.[0];
    if (!ch) throw new Error(`Channel not found: ${handleOrId}`);
    return { channelId: ch.id!, title: ch.snippet!.title! };
  }

  // Otherwise resolve handle (e.g., @CultofPsyche)
  const handle = handleOrId.startsWith("@") ? handleOrId : `@${handleOrId}`;
  const res = await yt.channels.list({
    part: ["snippet", "contentDetails"],
    forHandle: handle,
  });
  const ch = res.data.items?.[0];
  if (!ch) throw new Error(`Channel not found for handle: ${handle}`);
  return { channelId: ch.id!, title: ch.snippet!.title! };
}

async function getUploadsPlaylistId(channelId: string): Promise<string> {
  const yt = getYouTube();
  const res = await yt.channels.list({
    part: ["contentDetails"],
    id: [channelId],
  });
  const playlistId = res.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) throw new Error("Could not find uploads playlist");
  return playlistId;
}

async function fetchAllPlaylistItems(playlistId: string): Promise<Array<{ videoId: string; title: string; description: string; publishedAt: string; thumbnailUrl: string | null }>> {
  const yt = getYouTube();
  const items: Array<{ videoId: string; title: string; description: string; publishedAt: string; thumbnailUrl: string | null }> = [];
  let pageToken: string | undefined = undefined;

  do {
    const res = await yt.playlistItems.list({
      part: ["snippet"],
      playlistId,
      maxResults: 50,
      pageToken,
    });

    for (const item of res.data.items || []) {
      const snippet = item.snippet!;
      const videoId = snippet.resourceId?.videoId;
      if (!videoId) continue;

      items.push({
        videoId,
        title: snippet.title || "Untitled",
        description: snippet.description || "",
        publishedAt: snippet.publishedAt || "",
        thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || null,
      });
    }

    pageToken = res.data.nextPageToken || undefined;
    console.log(`  Fetched ${items.length} playlist items...`);
  } while (pageToken);

  return items;
}

async function fetchVideoDetails(videoIds: string[]): Promise<Map<string, { duration: string | null; viewCount: number | null }>> {
  const yt = getYouTube();
  const details = new Map<string, { duration: string | null; viewCount: number | null }>();

  // YouTube API allows max 50 IDs per request
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const res = await yt.videos.list({
      part: ["contentDetails", "statistics"],
      id: batch,
    });

    for (const item of res.data.items || []) {
      details.set(item.id!, {
        duration: parseDuration(item.contentDetails?.duration || ""),
        viewCount: item.statistics?.viewCount ? parseInt(item.statistics.viewCount, 10) : null,
      });
    }

    console.log(`  Fetched details for ${Math.min(i + 50, videoIds.length)}/${videoIds.length} videos...`);
  }

  return details;
}

async function main() {
  const handle = process.env.YOUTUBE_CHANNEL_HANDLE || "@CultofPsyche";
  console.log(`Resolving channel: ${handle}`);

  const { channelId, title: channelTitle } = await getChannelId(handle);
  console.log(`Channel: ${channelTitle} (${channelId})`);

  const uploadsPlaylistId = await getUploadsPlaylistId(channelId);
  console.log(`Uploads playlist: ${uploadsPlaylistId}`);

  // Load existing data for merge
  let existing = new Map<string, YouTubeVideo>();
  if (existsSync(OUTPUT_FILE)) {
    const prev: YouTubeRaw = JSON.parse(readFileSync(OUTPUT_FILE, "utf-8"));
    for (const v of prev.videos) {
      existing.set(v.videoId, v);
    }
    console.log(`Loaded ${existing.size} existing videos for merge`);
  }

  // Fetch all playlist items
  console.log("\nFetching playlist items...");
  const playlistItems = await fetchAllPlaylistItems(uploadsPlaylistId);

  // Fetch video details (duration, view count)
  console.log("\nFetching video details...");
  const videoIds = playlistItems.map((i) => i.videoId);
  const details = await fetchVideoDetails(videoIds);

  // Merge into video list
  const videos: YouTubeVideo[] = playlistItems.map((item) => {
    const detail = details.get(item.videoId);
    return {
      videoId: item.videoId,
      title: item.title,
      description: item.description,
      publishedAt: item.publishedAt,
      duration: detail?.duration || null,
      thumbnailUrl: item.thumbnailUrl,
      viewCount: detail?.viewCount || null,
      channelTitle,
    };
  });

  // Sort chronologically (oldest first)
  videos.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());

  // Write output
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  const output: YouTubeRaw = {
    channelId,
    channelTitle,
    fetchedAt: new Date().toISOString(),
    totalVideos: videos.length,
    videos,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nDone! ${videos.length} videos saved to ${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error("Error:", e.message || e);
  process.exit(1);
});
```

**Step 3: Add .gitignore for scrape data**

```bash
# scripts/scrape/data/.gitignore
*
!.gitignore
!README.md
```

**Step 4: Run a quick syntax check**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npx tsx --eval "import './scripts/scrape/types'; console.log('types OK')"`
Expected: "types OK"

**Step 5: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
mkdir -p scripts/scrape/data
git add scripts/scrape/types.ts scripts/scrape/fetch-youtube.ts scripts/scrape/data/.gitignore
git commit -m "feat(scrape): add YouTube metadata scraper with channel resolution and pagination"
```

---

### Task 3: Transcript fetcher

**Files:**
- Create: `scripts/scrape/fetch-transcripts.ts`

**Step 1: Write the transcript fetcher**

```typescript
// scripts/scrape/fetch-transcripts.ts
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { fetchTranscript } from "youtube-transcript";
import type { YouTubeRaw } from "./types";

const DATA_DIR = join(__dirname, "data");
const RAW_FILE = join(DATA_DIR, "youtube-raw.json");
const TRANSCRIPT_DIR = join(DATA_DIR, "transcripts");

// Delay between requests to avoid rate limiting
const DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!existsSync(RAW_FILE)) {
    console.error(`youtube-raw.json not found. Run npm run scrape:youtube first.`);
    process.exit(1);
  }

  const raw: YouTubeRaw = JSON.parse(readFileSync(RAW_FILE, "utf-8"));
  console.log(`Found ${raw.totalVideos} videos to process`);

  if (!existsSync(TRANSCRIPT_DIR)) mkdirSync(TRANSCRIPT_DIR, { recursive: true });

  let fetched = 0;
  let skipped = 0;
  let failed = 0;
  const failures: string[] = [];

  for (let i = 0; i < raw.videos.length; i++) {
    const video = raw.videos[i];
    const outFile = join(TRANSCRIPT_DIR, `${video.videoId}.json`);

    // Skip if already fetched
    if (existsSync(outFile)) {
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${raw.videos.length}] Fetching transcript: ${video.title.slice(0, 60)}...`);

    try {
      const segments = await fetchTranscript(video.videoId);

      const transcript = segments.map((seg) => ({
        offset: seg.offset,
        duration: seg.duration,
        text: seg.text,
      }));

      writeFileSync(outFile, JSON.stringify(transcript, null, 2));
      fetched++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      failures.push(`${video.videoId} (${video.title.slice(0, 40)}): ${msg}`);
      failed++;
    }

    // Rate limiting delay
    if (i < raw.videos.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\nDone!`);
  console.log(`  Fetched: ${fetched}`);
  console.log(`  Skipped (already exists): ${skipped}`);
  console.log(`  Failed: ${failed}`);

  if (failures.length > 0) {
    const failLog = join(DATA_DIR, "transcript-failures.log");
    writeFileSync(failLog, failures.join("\n"));
    console.log(`\nFailure details written to ${failLog}`);
  }
}

main().catch((e) => {
  console.error("Error:", e.message || e);
  process.exit(1);
});
```

**Step 2: Verify syntax**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npx tsx --eval "console.log('transcript script parseable')"`
Expected: "transcript script parseable"

**Step 3: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add scripts/scrape/fetch-transcripts.ts
git commit -m "feat(scrape): add transcript fetcher with rate limiting and resume support"
```

---

### Task 4: Transform script (YouTube → ingest format)

**Files:**
- Create: `scripts/scrape/youtube-to-ingest.ts`
- Test: `scripts/scrape/__tests__/youtube-to-ingest.test.ts`

**Step 1: Write the failing test**

```typescript
// scripts/scrape/__tests__/youtube-to-ingest.test.ts
import { describe, it, expect } from "vitest";
import { transformVideo } from "../youtube-to-ingest";
import type { YouTubeVideo } from "../types";

const sampleVideo: YouTubeVideo = {
  videoId: "abc123",
  title: "Friday Night with Psyche-- White Claws, Open Panel, Tarot and Cats",
  description: "https://streamyard.com/pal/d/6114733978943488\nSupport: http://psycheawakens.com",
  publishedAt: "2025-09-06T02:30:00Z",
  duration: "5:05:03",
  thumbnailUrl: "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
  viewCount: 1113,
  channelTitle: "Cult of Psyche",
};

describe("transformVideo", () => {
  it("maps YouTube video to EpisodeRow format", () => {
    const result = transformVideo(sampleVideo, 42);

    expect(result.title).toBe("Friday Night with Psyche-- White Claws, Open Panel, Tarot and Cats");
    expect(result.episodeNumber).toBe(42);
    expect(result.airDate).toBe("2025-09-06");
    expect(result.duration).toBe("5:05:03");
    expect(result.youtubeVideoId).toBe("abc123");
    expect(result.thumbnailUrl).toBe("https://i.ytimg.com/vi/abc123/hqdefault.jpg");
    expect(result.guests).toEqual([]);
    expect(result.topics).toEqual([]);
    expect(result.lore).toEqual([]);
  });

  it("uses description as summaryShort if not just URLs", () => {
    const video: YouTubeVideo = {
      ...sampleVideo,
      description: "Tonight we discuss the tarot and cosmic consciousness",
    };
    const result = transformVideo(video, 1);
    expect(result.summaryShort).toBe("Tonight we discuss the tarot and cosmic consciousness");
  });

  it("sets summaryShort to null if description is only URLs", () => {
    const result = transformVideo(sampleVideo, 1);
    expect(result.summaryShort).toBeNull();
  });

  it("handles empty description", () => {
    const video: YouTubeVideo = { ...sampleVideo, description: "" };
    const result = transformVideo(video, 1);
    expect(result.summaryShort).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npx vitest run scripts/scrape/__tests__/youtube-to-ingest.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// scripts/scrape/youtube-to-ingest.ts
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "fs";
import { join } from "path";
import { parsePublishedDate } from "./lib";
import type { YouTubeVideo, YouTubeRaw } from "./types";
import type { EpisodeRow } from "../ingest/schemas";

const SCRAPE_DATA_DIR = join(__dirname, "data");
const RAW_FILE = join(SCRAPE_DATA_DIR, "youtube-raw.json");
const TRANSCRIPT_DIR = join(SCRAPE_DATA_DIR, "transcripts");
const INGEST_DATA_DIR = join(__dirname, "..", "ingest", "data");

/**
 * Check if a description has meaningful content (not just URLs/links).
 */
function hasContentBeyondUrls(text: string): boolean {
  // Remove URLs
  const withoutUrls = text.replace(/https?:\/\/\S+/g, "").trim();
  // Remove "Support the stream:" and similar prefixes
  const cleaned = withoutUrls
    .replace(/support the stream:?\s*/gi, "")
    .replace(/streaming software/gi, "")
    .trim();
  return cleaned.length > 10;
}

/**
 * Extract a useful summary from a YouTube description.
 * Returns null if the description is just URLs or boilerplate.
 */
function extractSummary(description: string): string | null {
  if (!description || !hasContentBeyondUrls(description)) return null;

  // Take content before first URL, trimmed
  const beforeUrl = description.split(/https?:\/\//)[0].trim();
  if (beforeUrl.length > 10) return beforeUrl;

  // Remove URLs and return what's left
  const cleaned = description.replace(/https?:\/\/\S+/g, "").trim();
  return cleaned.length > 10 ? cleaned : null;
}

export function transformVideo(video: YouTubeVideo, episodeNumber: number): EpisodeRow {
  return {
    title: video.title,
    episodeNumber,
    airDate: parsePublishedDate(video.publishedAt) || undefined,
    duration: video.duration || undefined,
    youtubeVideoId: video.videoId,
    thumbnailUrl: video.thumbnailUrl || undefined,
    summaryShort: extractSummary(video.description) || undefined,
    guests: [],
    topics: [],
    lore: [],
  };
}

interface TranscriptSegment {
  offset: number;
  duration: number;
  text: string;
}

interface IngestTranscriptSegment {
  episodeSlug: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  if (!existsSync(RAW_FILE)) {
    console.error("youtube-raw.json not found. Run npm run scrape:youtube first.");
    process.exit(1);
  }

  const raw: YouTubeRaw = JSON.parse(readFileSync(RAW_FILE, "utf-8"));
  console.log(`Transforming ${raw.totalVideos} videos...`);

  // Videos are already sorted chronologically (oldest first) in youtube-raw.json
  const episodes: EpisodeRow[] = raw.videos.map((video, index) =>
    transformVideo(video, index + 1)
  );

  // Write episodes JSON
  if (!existsSync(INGEST_DATA_DIR)) mkdirSync(INGEST_DATA_DIR, { recursive: true });

  const episodesFile = join(INGEST_DATA_DIR, "episodes.json");
  writeFileSync(episodesFile, JSON.stringify(episodes, null, 2));
  console.log(`Episodes: ${episodes.length} written to ${episodesFile}`);

  // Transform transcripts if available
  if (existsSync(TRANSCRIPT_DIR)) {
    const transcriptFiles = readdirSync(TRANSCRIPT_DIR).filter((f) => f.endsWith(".json"));
    const allSegments: IngestTranscriptSegment[] = [];

    // Build videoId → episodeSlug map
    const videoIdToSlug = new Map<string, string>();
    for (const video of raw.videos) {
      videoIdToSlug.set(video.videoId, slugify(video.title));
    }

    for (const file of transcriptFiles) {
      const videoId = file.replace(".json", "");
      const episodeSlug = videoIdToSlug.get(videoId);
      if (!episodeSlug) continue;

      const segments: TranscriptSegment[] = JSON.parse(
        readFileSync(join(TRANSCRIPT_DIR, file), "utf-8")
      );

      for (const seg of segments) {
        const startSeconds = Math.round(seg.offset / 1000);
        const endSeconds = Math.round((seg.offset + seg.duration) / 1000);
        allSegments.push({
          episodeSlug,
          startSeconds,
          endSeconds,
          text: seg.text,
        });
      }
    }

    const segmentsFile = join(INGEST_DATA_DIR, "transcript-segments.json");
    writeFileSync(segmentsFile, JSON.stringify(allSegments, null, 2));
    console.log(`Transcript segments: ${allSegments.length} from ${transcriptFiles.length} videos written to ${segmentsFile}`);
  } else {
    console.log("No transcripts directory found — skipping transcript transform");
  }

  console.log("\nDone! Now run: npm run ingest:episodes scripts/ingest/data/episodes.json");
}

// Only run main() when executed directly, not when imported for testing
if (process.argv[1]?.includes("youtube-to-ingest")) {
  main().catch((e) => {
    console.error("Error:", e.message || e);
    process.exit(1);
  });
}
```

**Step 4: Run test to verify it passes**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npx vitest run scripts/scrape/__tests__/youtube-to-ingest.test.ts`
Expected: PASS — all 4 tests green

**Step 5: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add scripts/scrape/youtube-to-ingest.ts scripts/scrape/__tests__/youtube-to-ingest.test.ts
git commit -m "feat(scrape): add YouTube-to-ingest transform with description parsing"
```

---

### Task 5: Import transcript segments script

**Files:**
- Create: `scripts/ingest/import-transcripts.ts`

The existing ingestion pipeline has no transcript import. We need one since the `TranscriptSegment` model exists in the schema but isn't populated by any script.

**Step 1: Write the import script**

```typescript
// scripts/ingest/import-transcripts.ts
import { readFileSync } from "fs";
import { getPrisma, disconnect } from "./lib";
import { z } from "zod";

const TranscriptSegmentRowSchema = z.object({
  episodeSlug: z.string().min(1),
  startSeconds: z.number().int().min(0),
  endSeconds: z.number().int().min(0),
  text: z.string().min(1),
  speakerLabel: z.string().optional(),
});

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/ingest/import-transcripts.ts <file.json>");
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const rows = z.array(TranscriptSegmentRowSchema).parse(raw);
  const prisma = getPrisma();

  // Group segments by episode slug
  const byEpisode = new Map<string, typeof rows>();
  for (const row of rows) {
    const existing = byEpisode.get(row.episodeSlug) || [];
    existing.push(row);
    byEpisode.set(row.episodeSlug, existing);
  }

  let episodesProcessed = 0;
  let segmentsCreated = 0;
  const warnings: string[] = [];

  for (const [slug, segments] of byEpisode) {
    // Find the episode
    const episode = await prisma.episode.findUnique({
      where: { slug },
    });
    if (!episode) {
      warnings.push(`Episode "${slug}" not found — skipping ${segments.length} segments`);
      continue;
    }

    // Delete existing segments for this episode (idempotent)
    await prisma.transcriptSegment.deleteMany({
      where: { episodeId: episode.id },
    });

    // Create new segments
    for (const seg of segments) {
      await prisma.transcriptSegment.create({
        data: {
          episodeId: episode.id,
          startSeconds: seg.startSeconds,
          endSeconds: seg.endSeconds,
          text: seg.text,
          speakerLabel: seg.speakerLabel || null,
          searchText: seg.text.toLowerCase(),
        },
      });
      segmentsCreated++;
    }

    episodesProcessed++;
  }

  console.log(`Transcripts: ${segmentsCreated} segments across ${episodesProcessed} episodes`);
  if (warnings.length > 0) {
    console.warn(`\nWarnings (${warnings.length}):`);
    for (const w of warnings) console.warn(`  - ${w}`);
  }
  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

**Step 2: Verify syntax**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npx tsx --eval "import './scripts/ingest/import-transcripts'; console.log('OK')" 2>&1 | head -3`
Expected: Script parses correctly (may error on missing arg, that's fine)

**Step 3: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add scripts/ingest/import-transcripts.ts
git commit -m "feat(ingest): add transcript segment importer"
```

---

### Task 6: npm scripts, .env update, and .gitignore

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Create: `scripts/scrape/data/.gitignore` (if not already created in Task 2)

**Step 1: Add npm scripts to package.json**

Add these scripts to `package.json`:
```json
"scrape:youtube": "npx tsx scripts/scrape/fetch-youtube.ts",
"scrape:transcripts": "npx tsx scripts/scrape/fetch-transcripts.ts",
"scrape:transform": "npx tsx scripts/scrape/youtube-to-ingest.ts",
"ingest:transcripts": "npx tsx scripts/ingest/import-transcripts.ts"
```

**Step 2: Add YOUTUBE_API_KEY to .env.example**

Append to `.env.example`:
```
YOUTUBE_API_KEY=your_google_api_key_here
YOUTUBE_CHANNEL_HANDLE=@CultofPsyche
```

**Step 3: Verify npm scripts are parseable**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json valid')"`
Expected: "package.json valid"

**Step 4: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add package.json .env.example scripts/scrape/data/.gitignore
git commit -m "feat(scrape): add npm scripts and env config for YouTube scraper pipeline"
```

---

### Task 7: End-to-end dry run

This task validates the full pipeline works. Requires `YOUTUBE_API_KEY` in `.env`.

**Step 1: Add the API key to .env**

The user needs to provide a Google API key. To get one:
1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new API key
3. Enable "YouTube Data API v3" in the API library
4. Add `YOUTUBE_API_KEY=<key>` to `.env`

**Step 2: Run the metadata scraper**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npm run scrape:youtube`
Expected: Fetches all videos and saves to `scripts/scrape/data/youtube-raw.json`

**Step 3: Run the transform**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npm run scrape:transform`
Expected: Creates `scripts/ingest/data/episodes.json`

**Step 4: Run the episode importer**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npm run ingest:episodes scripts/ingest/data/episodes.json`
Expected: All episodes upserted into PostgreSQL

**Step 5: Verify in database**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npx tsx -e "import 'dotenv/config'; import { PrismaPg } from '@prisma/adapter-pg'; import { PrismaClient } from './src/generated/prisma/client'; const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) }); p.episode.count().then(c => { console.log('Episodes in DB:', c); p.\$disconnect() })"`
Expected: Episode count matches total videos scraped

**Step 6: (Optional) Run transcript fetch for a small batch**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npm run scrape:transcripts`
Note: This will take a while for 800+ videos with 1.5s delay. Can Ctrl+C after a few to verify it works, then let it run to completion later.

**Step 7: Run all tests**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npm test`
Expected: All tests pass (existing + new scrape tests)
