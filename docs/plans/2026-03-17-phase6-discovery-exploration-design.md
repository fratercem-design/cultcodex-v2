# Phase 6: Discovery & Exploration — Design

## Goal

Make the archive feel explorable, not just searchable. Add cross-entity discovery features, navigation aids, and serendipity tools.

## Section 1: Related Episodes on Episode Detail Page

Wire up the existing `getRelatedEpisodes()` query (already in `src/lib/queries/episodes.ts`) to the episode detail page. Render as a grid of `EpisodeListItem` cards in a `SectionCard` at the bottom of the page. Call `getRelatedEpisodes(episode.id, { limit: 6 })`. Hide the section if no related episodes are found.

## Section 2: Random Episode Button

API route `/api/episodes/random` that picks a random published episode and redirects to its slug. Uses Prisma count + random offset (no raw SQL). Client component `RandomEpisodeButton` with dice icon. Placed on:
- Episodes index page (next to ViewToggle)
- Episode detail page (below related episodes)

## Section 3: Breadcrumb Navigation

Generic `Breadcrumbs` component. Props: `items: { label: string; href?: string }[]`. Last item renders as plain text. Placed below hero, above glance bar on all detail pages (episodes, people, lore, topics, series). Mono font, `text-[11px]`, muted color, green hover on links.

## Section 4: "Frequently Appears With" on Person Pages

New query `getCoAppearances(personId, limit)`:
1. Get all episode IDs where this person appears
2. Count shared episodes per other person
3. Return top N, sorted by count

Display as `GuestGrid` with shared episode count badge. Placed in person detail page sidebar. Hidden if fewer than 2 appearances.

## Section 5: Timeline View for Episodes

Third view mode on episodes page (`?view=timeline`). `ViewToggle` gets a calendar icon button. `TimelineView` client component groups episodes by month with sticky month headers (gold text, left border line). No new queries — groups existing `EpisodeCardData` by `airDate` client-side.

## Section 6: Component & Change Summary

**New components (3):** Breadcrumbs, RandomEpisodeButton, TimelineView
**New API route (1):** `/api/episodes/random`
**New query (1):** `getCoAppearances`
**Modified components (1):** ViewToggle (add timeline button)
**Modified pages (9):** 5 detail pages (breadcrumbs) + episodes index (random + timeline) + episode detail (related + random) + person detail (co-appearances)
