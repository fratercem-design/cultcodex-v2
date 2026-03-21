# Phase 10: Transcript Search & Episode Deep-Dive — Design

## Overview

Surface transcript data through full-text search, upgrade the transcript viewer with interactive features, and reorganize episode detail pages with a tab layout. Add a dedicated `/transcripts` index page as an entry point for transcript browsing and search.

## Section 1: Transcript Search in Global Search

- New `searchTranscripts(query)` function in `src/lib/queries/search.ts`
- Searches `TranscriptSegment.text` with `contains` + `mode: insensitive`
- Returns: segment text, speaker label, timestamp, episode title/slug
- Results grouped by episode on the search results page
- New "Transcripts" filter pill on `/search` alongside existing entity types
- Each result links to `/episodes/{slug}?t={startSeconds}` to jump to the moment
- Result card format: `[HH:MM:SS] SPEAKER: "matched text..." — in EP.XXX — Title`

## Section 2: Transcript Viewer Upgrade

Upgrades to the existing `TranscriptViewer` client component:

- **In-transcript search** — Search box at top, filters segments to matches, highlights matched text in accent-green, shows "X of Y segments match" count
- **Speaker color-coding** — Each unique speaker gets a consistent color (accent-gold, accent-green, accent-cyan, accent-purple)
- **Active segment tracking** — Current segment highlights with left border + background pulse when YouTube embed is playing, auto-scrolls to keep active segment in view
- **Keyboard nav** — `↑`/`↓` arrow keys move between segments, `Enter` seeks to timestamp
- **Copy segment** — Small copy button on hover per segment, copies `"[HH:MM:SS] SPEAKER: text"` to clipboard

## Section 3: Episode Detail Tab Layout

Replace stacked layout below hero/glance bar with tabs:

| Tab | Contents |
|-----|----------|
| Overview (default) | Summaries, metadata, guest grid, topics/lore chips |
| Transcript | Upgraded transcript viewer with in-transcript search, full height |
| Quotes | All quotes from this episode with share buttons, speaker attribution |
| Discussion | Comment section + reaction bar |

- New `EpisodeTabLayout` client component
- Tab state via URL search param (`?tab=transcript`) for linkable/bookmarkable tabs
- `?t=` param auto-selects Transcript tab and scrolls to segment
- YouTube embed stays above the tabs (always visible)
- Mobile: tabs become horizontal scroll strip

## Section 4: Dedicated Transcript Page (`/transcripts`)

- PageHero with "TRANSCRIPTS" title
- Search box searching all transcript segments
- Paginated episode directory (episodes with transcripts only):
  - Episode number, title, air date
  - Segment count + total duration
  - Unique speaker labels
  - Link to `/episodes/{slug}?tab=transcript`
- Search results mode: matching segments grouped by episode with timestamps and speaker labels
- Clicking a result goes to `/episodes/{slug}?tab=transcript&t={startSeconds}`

## Section 5: Components

**New components:**

| Component | Type | Purpose |
|-----------|------|---------|
| `EpisodeTabLayout` | Client | Tab container for episode detail (Overview/Transcript/Quotes/Discussion) |
| `TranscriptSearchBar` | Client | In-transcript search input with match count |
| `TranscriptSegmentRow` | Client | Single segment with speaker color, copy button, active highlight |

**Modified components:**

| Component | Changes |
|-----------|---------|
| `TranscriptViewer` | Speaker colors, active tracking, keyboard nav, search integration |
| Search page + `globalSearch` | Add "Transcripts" filter pill, transcript result cards |

**New queries:**

| Function | File |
|----------|------|
| `searchTranscripts` | `src/lib/queries/search.ts` |
| `getEpisodesWithTranscripts` | `src/lib/queries/transcripts.ts` |
| `searchWithinTranscripts` | `src/lib/queries/transcripts.ts` |
| `getTranscriptStats` | `src/lib/queries/transcripts.ts` |

**Nav update:** Add "Transcripts" link to site header between "Quotes" and "Live".

## Routes

| Route | Purpose |
|-------|---------|
| `/transcripts` | Transcript directory + search |
| `/episodes/[slug]?tab=transcript` | Episode transcript tab |
| `/episodes/[slug]?tab=quotes` | Episode quotes tab |
| `/episodes/[slug]?tab=discussion` | Episode discussion tab |
| `/search?type=transcripts` | Global search filtered to transcripts |
