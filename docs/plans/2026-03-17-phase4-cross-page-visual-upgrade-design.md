# Phase 4: Cross-Page Visual Upgrade Design

**Goal:** Bring every detail page (People, Lore, Topics, Series) to the same visual standard as the Phase 3 episode page — heroes, glance bars, stats panels, richer listings.

**Approach:** Build 4 generic shared components, then upgrade each page by swapping `PageShell` for the new components and replacing flat `EntityChipList` episode listings with richer cards.

---

## Section 1: Person Detail Page

**Hero:** Replace `PageShell` with `EntityHero`. Show person's avatar (80px circle) alongside name and short bio. Person type badge (host/recurring/guest) in top-right corner. Background: `/wiki-page-header.jpg`.

**Glance bar:** `EntityGlanceBar` with pills: person type icon, appearance count, quote count, first seen date, topic count.

**Stats panel:** `EntityStatsPanel` in sidebar with counts for guest appearances, mentions, quotes, topics, lore connections. Zero-value rows hidden.

**Quote upgrade:** Replace plain `<blockquote>` with existing `QuoteHighlightCard` component, passing speaker info and linking to source episode.

**Appearance list upgrade:** Replace flat `EntityChipList` chips with `EpisodeListItem` cards showing episode number, air date, title, summary snippet. Sorted newest first.

---

## Section 2: Lore Detail Page

**Hero:** Replace `PageShell` with `EntityHero`. Canon status badge (gold/purple/green) in top-right. Category as subtitle pill below title. Background: `/lore-header.jpg`.

**Glance bar:** `EntityGlanceBar` with pills: canon status icon, category, first mention date, episode count, people connected, topics linked.

**Stats panel:** Sidebar counts for episode appearances, connected people, linked topics.

**Episode list upgrade:** Replace `EntityChipList` for episodes with `EpisodeListItem` cards.

**Related lore:** Surface `RelatedLore` (relatedFrom/relatedTo) as a "Related Lore" grid at the bottom — currently unused data in the schema.

**People section upgrade:** Replace people `EntityChipList` with `GuestGrid` component (avatar circles with names).

---

## Section 3: Topic Detail Page

**Hero:** Replace `PageShell` with `EntityHero`. Background: `/wiki-page-header.jpg`. Title as topic name, subtitle "Topic".

**Glance bar:** `EntityGlanceBar` with pills: episode count, people count, lore count.

**Episode list upgrade:** Replace `EntityChipList` for episodes with `EpisodeListItem` cards in main content area.

**People section upgrade:** Replace sidebar `EntityChipList` with `GuestGrid` component.

**Lore section:** Keep `EntityChipList` for lore entries — chips work well since lore entries lack avatars and canon status coloring is already informative.

---

## Section 4: Series Detail Page

**Hero:** Replace `PageShell` with `EntityHero`. Use series `coverImageUrl` as background (fallback `/wiki-page-header.jpg`). Series type badge in top-right. Episode count and status in subtitle.

**Glance bar:** `EntityGlanceBar` with pills: series type icon, episode count, status badge.

**Episode list upgrade:** Enhance existing episode cards by adding `thumbnailUrl` as a small thumbnail (48x48, rounded) on the left side.

**Sidebar:** Add `EntityStatsPanel` below existing "Series Info" card showing episode count, date range (first to latest air date), series type, status. Skip "most frequent guests" query — YAGNI.

---

## Section 5: Shared Components

4 new generic components, all placed in `src/components/ui/`:

### `EntityHero`
Props: `title`, `subtitle`, `backgroundImage`, `avatarUrl?`, `badges?: { label, variant }[]`.
Used by all four detail pages. Person pages pass avatar; Series pages pass `coverImageUrl`; others use static backgrounds.

### `EntityGlanceBar`
Props: `items: { icon?, label, href? }[]`.
Generic pill strip. Each page builds its own items array. No page-specific logic in the component.

### `EntityStatsPanel`
Props: `stats: { icon, label, value }[]`.
Filters zero-value rows, renders nothing if all zero. Each page builds its own stats array.

### `EpisodeListItem`
Props: `episodeNumber?`, `airDate?`, `title`, `slug`, `summaryShort?`, `thumbnailUrl?`.
Replaces `EntityChipList` for episode listings across all pages.

### Existing components reused
- `GuestGrid` (Phase 3) — person avatars on lore and topic pages
- `QuoteHighlightCard` (Phase 3) — person page quotes
- `StatusBadge`, `SectionCard`, `MetaRow` — throughout
- `EntityChipList` — still used for topics/lore chips where avatars don't apply

### Query changes
- `buildLoreInclude()` — add `relatedFrom` and `relatedTo` includes to surface related lore
- Series page — add `thumbnailUrl` to `getSeriesEpisodes` select
- No new database queries or schema changes needed
