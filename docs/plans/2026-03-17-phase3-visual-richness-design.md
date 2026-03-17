# Phase 3: Visual Richness & Episode Polish — Design Document

**Goal:** Enhance episode pages with 5 visual component upgrades that make enriched data shine. No schema changes — purely presentational improvements using existing data.

**Approach:** Component-first upgrades. All data already exists in the DB. Ships fast, immediately improves the ~363 enriched episodes.

---

## Section 1: Episode Stats Panel

New sidebar widget below the Metadata card. At-a-glance counts with icons.

**Rows:**
- Guests — count from `episode.guests.length`
- Quotes — count from `episode.quotes.length`
- Transcript — segment count from `episode.segments.length`
- Reactions — total reaction count (sum of all reaction types)
- Comments — from `commentsData.totalCount`

**Styling:** Icon + label + count per row, monospace font, muted text. Compact layout inside a `SectionCard`. All data already loaded on the episode page — zero additional queries.

---

## Section 2: Guest Photo Grid

Replace the text-only `EntityChipList` for guests with a visual avatar grid.

**Layout:**
- Grid of circular avatars (40x40px), 4 per row
- Each avatar links to `/people/[slug]`
- Fallback: gold initial letter circle (same pattern as comment avatars)
- Display name below each avatar, truncated 1 line, `text-[10px]` mono
- Hover: gold ring border, name highlights gold

**Data:** `Person.avatarUrl` and `Person.slug` already available via the `guests` relation include. Topics and Lore chip lists remain unchanged.

**Component:** New `GuestGrid` component in `src/components/episodes/`.

---

## Section 3: Quote Highlight Cards

Upgrade plain blockquotes to visually distinct, screenshot-friendly cards.

**Per-card layout:**
- Bordered card with 3px gold left border
- Large gold opening quotation mark watermark (faded, decorative, top-left)
- Quote text: `text-base` (up from `text-sm`), italic
- Speaker attribution: avatar circle + name in gold + episode timestamp if available
- Share button (existing `QuoteShareButton`) positioned bottom-right with icon
- `bg-elevated` background to separate from page

**Data:** `Quote.text`, `Quote.speaker.displayName`, `Quote.speaker.avatarUrl`, `Quote.timestampSeconds` — all already loaded.

**Component:** New `QuoteHighlightCard` component in `src/components/episodes/`.

---

## Section 4: Enhanced Hero Section

Dynamic hero background using YouTube thumbnails instead of static image.

**Behavior:**
- If `episode.thumbnailUrl` exists: use as hero background with dark overlay (`bg-black/70`) + `backdrop-blur-sm`
- Episode number badge: gold pill, top-left float
- Content type badge: top-right float (LIVESTREAM purple, SHORT/CLIP muted), only if not "original"
- Series name: linked chip below the title, routes to `/series/[slug]`
- Fallback: current static `wiki-page-header.jpg` background

**Data:** `Episode.thumbnailUrl` (from YouTube scrape), `Episode.contentType`, `Episode.series`.

**Implementation:** Extend `PageHero` component to accept optional `dynamicBackground` URL and render badges via new props or create an `EpisodeHero` wrapper component.

---

## Section 5: Episode "At a Glance" Bar

Compact horizontal strip between hero and main content grid.

**Pills (left to right):**
- Content type with icon (Livestream / Original / Short / Clip)
- Series name (linked to `/series/[slug]`)
- Air date
- Duration
- Guest count (e.g. "3 guests")

**Styling:** Single row, `flex-wrap` on desktop, horizontally scrollable on mobile. Monospace, muted text, small rounded pills with `border-border` borders. Replaces metadata duplication between hero subtitle and sidebar.

**Component:** New `EpisodeGlanceBar` component in `src/components/episodes/`.

---

## Non-Goals (Phase 3)

- Schema changes or migrations
- Re-enrichment of episodes
- New data fields
- Homepage redesign
- Mobile-specific layouts beyond responsive basics
