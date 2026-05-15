# UI Features Design — Video Embed, Transcript Display, Quotes & Series Pages

> **Date:** 2026-03-15
> **Status:** Approved

## Overview

Four UI features to build on top of the 1,173 scraped episodes now in the database: YouTube video embedding on episode pages, improved transcript display, quotes index page, and series index + detail pages.

## Feature 1: YouTube Video Embedding

A `YouTubeEmbed` client component renders a responsive 16:9 iframe on episode detail pages. Placed at the top of the main content area, above the summary. Uses `youtubeVideoId` from the episode — if null, no embed shown. Privacy-enhanced mode (`youtube-nocookie.com`). No third-party dependencies — just a styled iframe with the project's dark theme border treatment.

## Feature 2: Transcript Display

Improved transcript section on episode detail pages:
- Collapsible section (default collapsed for long transcripts, expanded if short)
- Clickable timestamps that update the YouTube embed to that time
- Max-height scrollable container with "Show all" toggle
- Format: `[HH:MM:SS] text` per segment, mono font, muted timestamps
- Uses existing `TranscriptSegment` model data

## Feature 3: Quotes Pages

- `/quotes` — Index page with paginated quote cards, filterable by speaker
- Each card shows: quote text, speaker name (linked to person page), episode title (linked), timestamp
- No detail page — quotes are short text, no dedicated route needed
- Query: `getQuotes()` with pagination and optional speaker filter
- Empty state: "No quotes archived yet."

## Feature 4: Series Pages

- `/series` — Index page showing series cards with title, type badge, episode count, description
- `/series/[slug]` — Detail page showing series info + paginated episode list
- Uses existing `Series` model (title, slug, description, type, coverImageUrl, sortOrder)
- Empty state: "No series catalogued yet."

## Design System

All new components follow existing patterns:
- Dark theme: void (#0a0a0a) background, surface (#141414) cards, accent-green (#39ff14) highlights
- Mono font (JetBrains Mono) for metadata, timestamps, labels
- `TerminalPanel` for transcript sections
- `StatusBadge` for series type badges
- `SectionCard` for content groupings
- `PaginationControls` for paginated lists
