# YouTube Scraper & Transcript Pipeline — Design

> **Date:** 2026-03-15
> **Status:** Approved
> **Goal:** Scrape all video metadata and transcripts from the Cult of Psyche YouTube channel, transform into the CultCodex ingestion format, and load into PostgreSQL.

---

## Overview

Three-phase pipeline that pulls data from YouTube, stores it locally as JSON, then feeds it through the existing ingestion scripts into the database. A future fourth phase (AI enrichment) will extract guests, topics, quotes, and lore from transcripts — but is out of scope for this plan.

## Data Source

- **Channel:** [@CultofPsyche](https://www.youtube.com/@CultofPsyche)
- **Content type:** Live streams (not pre-produced episodes)
- **Volume:** ~800+ videos
- **Title format:** Free-form, creative titles (no episode numbers, no guest names in titles)
- **Descriptions:** Minimal (mostly StreamYard links)
- **Durations:** Range from ~3 minutes to 6+ hours

## Design Decisions

1. **All videos become episodes** — no filtering by duration or type
2. **Auto-number chronologically** — oldest video = Episode 1
3. **Transcripts from YouTube auto-captions** — no speaker identification (auto-captions don't label speakers)
4. **Two-phase extraction** — scrape metadata first, transcripts second, AI enrichment deferred
5. **YouTube Data API v3** — official API with Google API key, free tier (10,000 units/day) sufficient for ~800 videos
6. **Decouple scraping from ingestion** — raw YouTube data stored as JSON intermediary, transformed into existing ingest format

## Architecture

### Phase 1: YouTube Metadata Scraper

**Script:** `scripts/scrape/fetch-youtube.ts`

- Takes a channel ID (resolved from handle) or playlist ID as input
- Paginates through YouTube Data API v3 (`playlistItems.list` + `videos.list`) to get all videos
- Extracts per video: `videoId`, `title`, `description`, `publishedAt`, `duration` (ISO 8601 → human-readable), `thumbnailUrl`, `viewCount`
- Auto-numbers episodes chronologically (oldest = Ep 1)
- Outputs: `scripts/scrape/data/youtube-raw.json`
- Idempotent: re-running merges/updates existing data without duplicates

**API Quota:** Each page of 50 results costs ~5 units. 800 videos ≈ 16 pages ≈ 80 units for playlist items + 16 `videos.list` calls (for duration/stats) ≈ 80 units. Total ~160 units per full scrape — well within the 10,000/day free tier.

### Phase 2: Transcript Fetcher

**Script:** `scripts/scrape/fetch-transcripts.ts`

- Reads `youtube-raw.json` for video IDs
- Uses `youtube-transcript` npm package to pull auto-generated captions
- Saves per-episode transcript files: `scripts/scrape/data/transcripts/{videoId}.json`
- Each file contains timestamped segments: `{ offset: number, duration: number, text: string }[]`
- Skips already-fetched transcripts (resumable across runs)
- Logs which videos have no captions available

### Phase 3: Import Bridge

**Script:** `scripts/scrape/youtube-to-ingest.ts`

- Reads `youtube-raw.json` and transforms into `EpisodeRow[]` format for existing `import-episodes.ts`
- Field mapping:
  - `title` → YouTube title
  - `slug` → slugified title
  - `episodeNumber` → auto-assigned chronological number
  - `airDate` → `publishedAt` (ISO date string)
  - `duration` → converted from ISO 8601 (PT1H30M → "1:30:00")
  - `youtubeVideoId` → video ID
  - `summaryShort` → YouTube description (trimmed) or null
  - `guests`, `topics`, `lore` → empty arrays (populated later by AI enrichment)
- Outputs: `scripts/ingest/data/episodes.json`
- Also generates `scripts/ingest/data/transcript-segments.json` from fetched transcripts
- Then existing `npm run ingest:episodes` loads into PostgreSQL

### Phase 4: AI Enrichment (Future — Not Built Now)

Will feed transcripts to Claude API to extract:
- Guest names mentioned
- Topics discussed
- Notable quotes with timestamps
- Lore references
- Episode summaries (replacing YouTube descriptions)

Deferred so the scraper + transcript foundation is solid first.

## Data Flow

```
YouTube Data API → youtube-raw.json → youtube-to-ingest.ts → episodes.json → import-episodes.ts → PostgreSQL
                                                            ↗
YouTube Captions → transcripts/{id}.json ─────────────────→ transcript-segments.json → (future: import-transcripts.ts)
```

## File Structure

```
scripts/scrape/
├── fetch-youtube.ts          # Phase 1: metadata scraper
├── fetch-transcripts.ts      # Phase 2: transcript fetcher
├── youtube-to-ingest.ts      # Phase 3: transform to ingest format
├── lib.ts                    # Shared utilities (API client, duration parsing)
├── __tests__/
│   ├── lib.test.ts
│   └── youtube-to-ingest.test.ts
└── data/
    ├── youtube-raw.json      # Raw API output (gitignored)
    └── transcripts/          # Per-video caption files (gitignored)
        ├── {videoId}.json
        └── ...
```

## Tech Stack

- `googleapis` — Official Google API client for Node.js (YouTube Data API v3)
- `youtube-transcript` — NPM package for fetching auto-generated captions
- Existing: `dotenv`, `tsx`, Prisma, Zod, Vitest

## Environment Variables

```env
YOUTUBE_API_KEY=your_google_api_key_here
YOUTUBE_CHANNEL_HANDLE=@CultofPsyche
```

## npm Scripts

```json
{
  "scrape:youtube": "npx tsx scripts/scrape/fetch-youtube.ts",
  "scrape:transcripts": "npx tsx scripts/scrape/fetch-transcripts.ts",
  "scrape:transform": "npx tsx scripts/scrape/youtube-to-ingest.ts"
}
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| YouTube API quota exceeded | ~160 units per full scrape, well under 10K/day limit |
| Auto-captions unavailable for some videos | Log and skip; track which videos lack transcripts |
| Auto-captions are low quality | Acceptable — AI enrichment phase will interpret, not display raw |
| Channel has non-episode content (test streams, shorts) | Import everything per user decision; can tag/filter later |
| Rate limiting on transcript fetches | Add configurable delay between requests, resumable design |
