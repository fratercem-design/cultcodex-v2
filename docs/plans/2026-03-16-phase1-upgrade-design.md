# Phase 1 Upgrade Design — CultCodex v2

**Date:** 2026-03-16
**Status:** Approved

## Overview

Phase 1 addresses the four highest-priority gaps identified in the CultCodex audit:
1. Series population & classification
2. Rich episode pages
3. Search upgrades
4. Enrichment coverage (parallel track)

## 1. Series Population & Classification

### Series List (18 total)

**Live Streams:**
| Series | Slug | Type | Pattern |
|--------|------|------|---------|
| Psyche Awakens Tarot | psyche-awakens-tarot | tarot | "Psyche Awakens Tarot" in title |
| Open Panel | open-panel | panel | "Open Panel" in title |
| Midnight Madness | midnight-madness | panel | "Midnight Madness" in title |
| Weekday Streams | weekday-streams | panel | Day-of-week casual streams |
| Troll Tribunal | troll-tribunal | panel | "Troll Tribunal", "Troll Side" in title |
| Classic Cult of Psyche | classic-cult-of-psyche | other | "Classic Cult of Psyche:" prefix |

**Original Content:**
| Series | Slug | Type | Pattern |
|--------|------|------|---------|
| Music Videos | music-videos | music_video | "Music Video" in title or known song titles |
| Journey Through the Tarot | journey-through-the-tarot | tarot | "Journey Through the Tarot" in title |
| Baital Pachchisi Tales | baital-pachchisi-tales | story | "Baital/Batital" in title |
| The Golden Ass | the-golden-ass | story | "The Golden Ass" in title |
| Quantum Scary Tales | quantum-scary-tales | story | "Scary Tales", "What Really Happened" fairy tales |
| Uncle Wiggly Stories | uncle-wiggly-stories | story | "Uncle Wiggly" in title |
| Secrets of the Mahavidyas | secrets-of-the-mahavidyas | documentary | Mahavidya goddess names, "Secrets of the Mahavidyas" |
| 64 Divine Arts | 64-divine-arts | documentary | "Divine Art" numbered series |
| Astrology Deep Dives | astrology-deep-dives | documentary | "Astrology Deep Dive", planetary placements |
| Mythology & Lore | mythology-and-lore | documentary | Standalone myth retellings |
| Trollopedia | trollopedia | documentary | "Trollopedia", "Troll Decoder" |
| Shorts & Clips | shorts-and-clips | other | "#shorts", TikTok highlights |

### Schema Addition

```prisma
enum ContentType {
  livestream
  original
  short
  clip
}

// Add to Episode model:
contentType ContentType @default(original)
```

### Classification Approach

1. Create seed script that inserts all 18 series rows
2. Regex pass assigns episodes by title patterns (~70%)
3. Claude API classifies remaining ambiguous episodes using title + summary
4. Each episode gets one primary series + contentType tag

## 2. Rich Episode Pages

### Already Exists
- YouTube video embed
- Long summary section
- Transcript viewer with timestamps
- Notable quotes with speaker attribution
- Sidebar with guests, topics, lore chip lists
- Series link, metadata panel

### New Features

1. **Short synopsis callout** — Render `summaryShort` as a styled lead paragraph above the long summary
2. **Related episodes** — Up to 6 cards below main content. Use `RelatedEpisode` join table, fallback to same-series or shared guests/topics
3. **Chapter/timestamp navigation** — Collapsible panel listing speaker transitions as clickable timestamps that seek the YouTube embed
4. **"Watch on YouTube" CTA** — Prominent button linking to `youtube.com/watch?v={videoId}`
5. **Content type badge** — "LIVESTREAM" / "ORIGINAL" / "SHORT" badge on card and detail hero
6. **Series breadcrumb** — `Series > Series Name > EP.XXX` above hero when episode has a series

### Schema Changes
None. All data fields already exist.

## 3. Search Upgrades

### Current State
Server-side ILIKE search across Episodes, People, Lore. Grouped results with highlight matching. No Topics/Quotes, no autocomplete, no filters.

### New Features

1. **Topics + Quotes in results** — Extend `globalSearch()` with `searchTopics()` and `searchQuotes()`
2. **Suggested searches** — 8-10 hardcoded popular queries shown in empty state
3. **Filters sidebar:**
   - Entity type checkboxes (Episodes/People/Lore/Topics/Quotes)
   - Content type (Livestream/Original/Short)
   - Date range pickers
   - Series dropdown
   - Canon status (for lore)
4. **Autocomplete** — `/api/search/suggest` endpoint, top 5 matches, 300ms debounce
5. **Tab-based results** — Clickable tabs with counts: "Episodes (42) | People (8) | ..."

### New API Route
`/api/search/suggest` — Returns top 5 entity names matching partial input.

### Schema Changes
None.

## 4. Enrichment Coverage (Parallel Track)

### Current State
171 of ~1,060 episodes enriched (16%).

### Plan
- Run batches of 100 via `npm run enrich:episodes -- --batch 100`
- After each batch: import local → import Neon → deploy Vercel
- ~890 remaining × $0.01/ep = ~$9 more API cost
- ~9 more batches, ~75 min each
- Create `scripts/enrich/full-pipeline.ts` to chain enrich → import → deploy

### Transcript Truncation
Episodes exceeding 200k tokens: truncate to first 150k tokens before sending to Claude API.

## Priority Order

1. Schema migration (add ContentType enum) — unblocks everything
2. Series seed script + regex classification — fills the empty Series section
3. Episode page enrichments (synopsis, related, chapters, CTA, badges, breadcrumb)
4. Search upgrades (topics/quotes, suggestions, filters, autocomplete, tabs)
5. Enrichment pipeline running continuously in parallel
