# CultCodex v2: Matrix Archive — Design Document

**Date:** 2026-03-07
**Status:** Approved

## Overview

CultCodex v2 is a redesigned archival wiki platform for the Cult of Psyche show. It replaces the v1 static site with a database-driven, relational knowledge archive capable of scaling to 1000+ episodes.

The system organizes episodes, people, lore, quotes, transcripts, and media series into a searchable, cross-linked archive that feels like a sacred intelligence terminal.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Stack | Next.js 14+ App Router, TypeScript, Tailwind, shadcn/ui, Prisma, PostgreSQL | Spec-defined, proven for content-heavy apps |
| Database | PostgreSQL via Docker | Clean local dev, no cloud dependency |
| ORM | Prisma | Type-safe, migration-friendly, excellent DX |
| Project location | `C:\Users\John Bates\Projects\cultcodex-v2` | Fresh start, old scaffold untouched |
| Auth | None for now | Admin pages unprotected, auth is Phase 9 |
| Deployment | TBD (likely Vercel) | Decided after core build |
| Old scaffold | Preserved at `C:\Users\John Bates\Projects\cultcodex` | Never delete from repos |

## Visual System

### Palette

| Token | Value | Use |
|-------|-------|-----|
| `--bg-void` | `#0a0a0a` | Page background |
| `--bg-surface` | `#141414` | Cards, panels |
| `--bg-elevated` | `#1c1c1c` | Hover states, modals |
| `--border` | `#2a2a2a` | Subtle borders |
| `--text-primary` | `#e8e8e8` | Body text |
| `--text-muted` | `#6b6b6b` | Metadata, labels |
| `--accent-green` | `#39ff14` | Primary accent (neon green) |
| `--accent-green-dim` | `#39ff1433` | Glow, background tints |
| `--accent-purple` | `#b44aff` | Secondary accent |
| `--accent-purple-dim` | `#b44aff22` | Subtle purple tints |
| `--accent-gold` | `#c9a227` | Sacred/canon markers only |

### Typography

- **Mono:** JetBrains Mono (metadata, labels, timestamps, terminal elements)
- **Sans:** Inter or Geist (body text, UI)
- **Serif:** Optional, for lore entry prose

### Texture

- Subtle CSS grid/scanline overlay on backgrounds
- Restrained glow on accent elements (no cheesy halos)
- No distracting animations

## Data Model

### Core Models

- **Episode** — livestream or episode entry (title, slug, episodeNumber, airDate, duration, youtubeVideoId, thumbnailUrl, summaryShort, summaryLong, cutOfPsyche, transcriptRaw/Html/Json, status, seriesId)
- **Series** — collection of related content (title, slug, description, type, coverImageUrl, sortOrder, status)
- **Person** — guest, recurring figure, or mentioned person (displayName, altNames, shortBio, loreSummary, avatarUrl, personType, firstAppearanceEpisodeId)
- **LoreEntry** — concept, motif, myth, meme, doctrine, symbol (title, slug, category, summary, fullEntry, canonStatus, firstMentionEpisodeId)
- **Topic** — thematic classification (title, slug, description)
- **Quote** — notable quote with source provenance (text, speakerPersonId, episodeId, transcriptSegmentId, timestampSeconds, context, significance)
- **TranscriptSegment** — timestamped transcript fragment (episodeId, startSeconds, endSeconds, speakerLabel, text, searchText)
- **MediaItem** — non-live media (title, slug, type, youtubeVideoId, transcriptRaw, summary, seriesId, releaseDate, durationSeconds)

### Join Tables

- EpisodeGuest, EpisodeMentionedPerson, EpisodeLore, EpisodeTopic
- PersonTopic, PersonLore, LoreTopic
- RelatedEpisode, RelatedPerson, RelatedLore

### Enums

- ContentStatus (draft, published, archived)
- PersonType (guest, host, mentioned, recurring)
- CanonStatus (canonical, speculative, community_myth, disputed, humorous)
- SeriesType (music_video, panel, tarot, story, documentary, other)
- MediaType (video, audio, article)

### Design Rules

- All models include createdAt/updatedAt
- Content fields nullable for progressive enrichment
- searchText fields on Episode, Person, LoreEntry for full-text search
- Every extractable entity preserves provenance (episode, segment, timestamp)

## Route Structure

```
/                          Homepage (stats, recent, featured)
/episodes                  Episode index (filter, search, paginate)
/episodes/[slug]           Episode detail
/series                    Series overview
/series/[slug]             Series detail
/people                    People index
/people/[slug]             Person dossier
/lore                      Lore archive
/lore/[slug]               Lore entry
/topics                    Topic index
/topics/[slug]             Topic detail
/quotes                    Quote vault
/search                    Full search page
/timeline                  Chronological explorer
/random                    Random jump
/about                     Archive explainer
/admin                     Internal dashboard
/api/search                Search endpoint
/api/admin/reports         Gap reports
```

## Component Architecture

### Layout
- `site-header.tsx` — Navigation, search trigger, archive identity
- `site-footer.tsx` — Footer links, archive status
- `command-bar.tsx` — Global search/command entry

### Shared UI
- `page-shell.tsx` — Consistent page layout
- `section-card.tsx` — Reusable card shell
- `terminal-panel.tsx` — Matrix-style content block
- `meta-row.tsx` — Standardized metadata rows
- `status-badge.tsx` — Status/type/canon tags
- `empty-state.tsx` — Missing data handling

### Archive
- `episode-card.tsx`, `person-card.tsx`, `lore-card.tsx`, `series-card.tsx`, `quote-card.tsx`
- `related-entities.tsx` — Related items section
- `entity-chip-list.tsx` — Linked entity chips
- `archive-stats.tsx` — Count/summary blocks

### Transcript
- `transcript-viewer.tsx` — Render segments, search, highlight, timestamp links
- `transcript-search.tsx` — Transcript filtering
- `transcript-segment.tsx` — Individual segment row
- `quote-extracts.tsx` — Notable quotes from transcript

### Search
- `search-input.tsx`, `search-result-group.tsx`, `search-result-item.tsx`, `search-filters.tsx`

## Query Layer

Reusable query helpers in `lib/queries/`:
- `episodes.ts`, `people.ts`, `lore.ts`, `search.ts`, `series.ts`, `topics.ts`, `quotes.ts`

Formatting utilities in `lib/format/`:
- `date.ts`, `duration.ts`, `text.ts`

Transcript utilities in `lib/transcript/`:
- `highlight.ts`, `segment.ts`

Entity resolution in `lib/entities/`:
- `resolve-person.ts`, `resolve-lore.ts`

## Scripts

Located in `scripts/`:
- `import-youtube.ts` — Import metadata from YouTube
- `import-transcripts.ts` — Fetch/import/segment transcripts
- `enrich-episodes.ts` — Generate summaries, quotes, entities, topics
- `resolve-entities.ts` — Merge duplicates, alias resolution
- `rebuild-search.ts` — Refresh searchable fields
- `report-missing.ts` — List episodes missing content
- `check-broken-links.ts` — Validate external links

## Build Phases

| Phase | Goal | Key Deliverables |
|-------|------|-----------------|
| 0 | Foundation | Project scaffold, Docker, Prisma schema, design tokens |
| 1 | App Shell | Layout, nav, homepage, UI primitives |
| 2 | Database | Migrations, seed data, query helpers |
| 3 | Vertical Slice | Episodes index, episode detail, person page, lore page, transcript viewer, search bar |
| 4 | Archive Sections | People/lore/series/quotes/topics indexes, timeline, random |
| 5 | Search | Full search page, grouped results, filters, transcript snippets |
| 6 | Ingestion | YouTube import, transcript import, enrichment, entity resolution |
| 7 | Admin Tools | Missing content reports, duplicate resolution, broken links |
| 8 | Hardening | Pagination, caching, SEO, performance |
| 9 | Expansion | Graph view, semantic search, curated paths, auth |

**Critical constraint:** Phase 3 must feel complete before expanding. One perfect lane proves the whole system.

## Acceptance Criteria

### Functional
- Episodes can be listed, filtered, paginated, and opened
- Episode pages show summaries, transcript, quotes, guests, linked entities
- Person pages show appearances, mentions, and relationships
- Lore pages show linked episodes, people, and canon status
- Series pages organize playable media with transcripts
- Search works across transcripts and structured content

### Technical
- Prisma schema is normalized and stable
- No content hardcoded in route components
- Long transcript pages remain usable
- Code is strongly typed and organized
- Import scripts can ingest a sample batch cleanly

### Design
- Theme feels mysterious, technical, elegant
- Typography remains readable
- Mobile and desktop layouts work
- UI is visually consistent

### Maintainability
- Scripts separate from presentation logic
- Queries in reusable helpers
- Sensible component boundaries
- Future admin tools addable without major rewrites
