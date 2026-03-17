# Phase 5: Homepage & List Page Overhaul — Design

## Overview

The detail pages now have full visual richness (Phases 3-4), but the homepage and index/list pages are still plain. This phase brings the same polish to the homepage and all six index pages (episodes, people, lore, topics, series, quotes).

## Section 1: Homepage Redesign

Replace the current basic homepage with a dashboard-style landing page:

- **Hero section:** Full-width hero with `/hero-bg.jpg` background, CULT CODEX title, tagline ("The Living Archive of the Cult of Psyche"), and a prominent search bar. If a stream is live, show a pulsing "LIVE NOW" banner linking to `/live`.
- **Featured Episode:** Large spotlight card for the most recent episode — thumbnail, title, air date, summary, guest avatars, "Watch / Read" CTA. Query: `airDate DESC`, limit 1.
- **Archive Stats Bar:** Horizontal row of animated counters: total episodes, people, lore entries, quotes, topics. Simple `COUNT(*)` queries.
- **Recent Transmissions:** Grid of 6 most recent episodes as `EpisodeCard` components. "View All Episodes" link.
- **Recent Quotes:** 2-3 random notable quotes using `QuoteHighlightCard`. "Explore Quotes" link.
- **Quick Links Grid:** 6 visual cards linking to each index page (Episodes, People, Lore, Topics, Series, Quotes) with icons, counts, and descriptions.

## Section 2: Episodes Index Page Upgrade

- **Stats bar:** `EntityGlanceBar` below hero — total episodes, date range, total guests.
- **Card enhancement:** Add `thumbnailUrl` support to `EpisodeCard` — small thumbnail on left side of each card, placeholder gradient if none.
- **Filter upgrade:** Add content type filtering (livestream/original/short/clip) alongside existing sort options.
- **View toggle:** Compact list view (`EpisodeListItem`) vs card grid view (`EpisodeCard`). URL param `?view=list`.

## Section 3: People Index Page Upgrade

- **Stats bar:** `EntityGlanceBar` below hero — total people, hosts count, recurring guests count, one-time guests count.
- **Card enhancement:** Add `avatarUrl` to `PersonCard` — 40px circle with fallback initial letter. Add appearance count badge.
- **Layout:** Switch from 3-column to 2-column grid on desktop for more breathing room.

## Section 4: Lore Index Page Upgrade

- **Stats bar:** `EntityGlanceBar` below hero — total lore, canonical/speculative/community myth counts.
- **Card enhancement:** Add color-coded left border by canon status (gold/purple/green). Add episode count and people count metadata below summary.

## Section 5: Topics, Series, Quotes Index Pages

- **Topics:** Add `EntityGlanceBar` with total topics and linked episodes count. No card changes.
- **Series:** Add `EntityGlanceBar` with total series and total episodes. Enhance cards with episode count badge, status badge, and `coverImageUrl` thumbnail.
- **Quotes:** Add `EntityGlanceBar` with total quotes count. Swap `QuoteCard` for `QuoteHighlightCard` for visual consistency.

## Section 6: Components

**New components (2):**
- `ArchiveStatsBar` — horizontal animated counters for homepage. Props: `stats: { label, value, icon }[]`. CSS count-up animation.
- `ViewToggle` — client component for episodes list/card view toggle. Two icon buttons updating `?view=` URL param.

**Modified components (3):**
- `EpisodeCard` — add `thumbnailUrl` support
- `PersonCard` — add `avatarUrl` support with initial letter fallback
- `LoreCard` — add canon status left border color + episode/people count metadata

**Reused from Phases 3-4:** EntityGlanceBar, EntityStatsPanel, EpisodeListItem, QuoteHighlightCard, GuestGrid, PageHero, SortFilterBar.

**Total scope:** 2 new components, 3 modified components, 7 new/modified pages.
