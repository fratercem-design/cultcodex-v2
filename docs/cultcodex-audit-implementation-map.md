# CultCodex Audit Implementation Map

## Repo Structure (Actual)

### Database / Schema
| Planned | Actual | Status |
|---------|--------|--------|
| prisma/schema.prisma | prisma/schema.prisma | EXISTS - 18 models, 15 enums |
| prisma/migrations/* | prisma/migrations/* | EXISTS |

### Core Query Layer (existing)
| File | Purpose |
|------|---------|
| src/lib/queries/stats.ts | getArchiveStats(), getMostQuotedPeople(), getTopTopicsByEpisodes(), getCanonBreakdown() |
| src/lib/queries/episodes.ts | getEpisodes(), getEpisodeCount(), getEpisodeAggregates(), formatEpisodeForCard() |
| src/lib/queries/people.ts | getPeople(), getPersonCount(), getPeopleAggregates() |
| src/lib/queries/search.ts | globalSearch() with entity type filtering |
| src/lib/queries/quotes.ts | getQuotes() |
| src/lib/queries/topics.ts | getTopic(), getTopics() |
| src/lib/queries/lore.ts | getLoreEntry(), getLoreEntries() |
| src/lib/queries/series.ts | getSeries(), getSeriesAggregates() |
| src/lib/queries/transcripts.ts | Transcript segment queries |
| src/lib/db.ts | Prisma client singleton |
| src/lib/pagination.ts | DEFAULT_PAGE_SIZE, parsePage(), paginationArgs(), buildPaginationMeta() |
| src/lib/format/date.ts | formatDate() |

### Page Routes (existing)
| Route | File | Notes |
|-------|------|-------|
| / | src/app/page.tsx | Homepage with stats, featured content |
| /episodes | src/app/episodes/page.tsx | Listing with sort/filter/pagination |
| /episodes/[slug] | src/app/episodes/[slug]/page.tsx | Detail with tabs, guests, transcript |
| /people | src/app/people/page.tsx | Directory with type filtering |
| /people/[slug] | src/app/people/[slug]/page.tsx | Person detail |
| /stats | src/app/stats/page.tsx | Archive statistics dashboard |
| /search | src/app/search/page.tsx | Multi-faceted global search |
| /series | src/app/series/page.tsx | DB-driven series listing |
| /collections | src/app/collections/page.tsx | Hardcoded curated collections |
| /lore | src/app/lore/page.tsx | Lore entries listing |
| /topics | src/app/topics/page.tsx | Topics listing |
| /topics/[slug] | src/app/topics/[slug]/page.tsx | Topic detail |
| /quotes | src/app/quotes/page.tsx | Quotes listing |
| /timeline | src/app/timeline/page.tsx | Timeline view |
| /start-here | src/app/start-here/page.tsx | Onboarding page |

### Components (existing)
| Component | File |
|-----------|------|
| EpisodeCard | src/components/archive/episode-card.tsx |
| EpisodeListItem | src/components/archive/episode-list-item.tsx |
| SortFilterBar | src/components/archive/sort-filter-bar.tsx |
| ViewToggle | src/components/archive/view-toggle.tsx |
| TimelineView | src/components/archive/timeline-view.tsx |
| RandomEpisodeButton | src/components/archive/random-episode-button.tsx |
| SearchInput | src/components/search/search-input.tsx |
| PageHero | src/components/ui/page-hero.tsx |
| SectionCard | src/components/ui/section-card.tsx |
| EntityGlanceBar | src/components/ui/entity-glance-bar.tsx |
| PaginationControls | src/components/ui/pagination-controls.tsx |
| EmptyState | src/components/ui/empty-state.tsx |
| ArchiveDisclaimer | src/components/ui/archive-disclaimer.tsx |
| GuestGrid | src/components/episodes/guest-grid.tsx (inferred) |
| CodexIcons | src/components/graphics/codex-icons.tsx |

### Key Schema Models
- **Episode**: episodeNumber, title, slug, contentType, status, airDate, duration, hasTranscript, summaryShort, summaryLong
- **Person**: displayName, slug, personType (guest/host/mentioned/recurring), shortBio, longBio, status
- **EpisodeGuest**: join table Episode<->Person (NO role field currently)
- **EpisodeMentionedPerson**: separate join table for mentions
- **Quote**: text, speakerId (FK Person), episodeId, timestampSeconds
- **TranscriptSegment**: episodeId, startSeconds, endSeconds, speakerLabel, text
- **LoreEntry**: title, slug, summary, canonStatus, firstMentionEpisodeId
- **Topic**: title, slug, description
- **Series**: title, slug, type (enum), description

## Ticket-to-File Mapping

### CC-101: Canonical stats service
- MODIFY: src/lib/queries/stats.ts (getArchiveStats already exists, needs single-source enforcement)
- CREATE: src/lib/stats/definitions.ts (metric inclusion rules)

### CC-102: Refactor count consumers
- MODIFY: src/app/page.tsx (homepage counts)
- MODIFY: src/app/stats/page.tsx (stats page counts)
- MODIFY: src/app/episodes/page.tsx (episode count)
- MODIFY: src/app/people/page.tsx (people count)
- MODIFY: src/app/quotes/page.tsx (quotes count)
- MODIFY: src/app/topics/page.tsx (topics count)
- MODIFY: src/app/lore/page.tsx (lore count)
- MODIFY: src/app/timeline/page.tsx (timeline count)

### CC-103: Canonical chronology
- MODIFY: src/lib/queries/episodes.ts (sort logic)
- MODIFY: src/app/episodes/page.tsx (resolveSort function)
- MODIFY: src/app/page.tsx (recent episodes)
- MODIFY: src/app/timeline/page.tsx (timeline order)

### CC-201: Participant role normalization
- MODIFY: prisma/schema.prisma (add ParticipantRole enum to EpisodeGuest)
- MODIFY: src/app/episodes/[slug]/page.tsx (host vs guest rendering)
- MODIFY: src/components/episodes/guest-grid.tsx (role-aware display)

### CC-203: Summary provenance
- MODIFY: prisma/schema.prisma (add SummarySource enum to Episode)
- MODIFY: src/app/episodes/[slug]/page.tsx (provenance labels)
- CREATE: src/components/badges/TranscriptStatusBadge.tsx
- CREATE: src/components/badges/ProvenanceBadge.tsx

### CC-301: Governance pages
- CREATE: src/app/methodology/page.tsx
- CREATE: src/app/corrections/page.tsx
- CREATE: src/app/content-policy/page.tsx

### CC-302: High-risk people pages
- MODIFY: src/app/people/[slug]/page.tsx
- CREATE: src/components/notices/RiskNotice.tsx
- CREATE: src/components/notices/ArchiveNotice.tsx (upgraded)

### CC-303: Selective noindex
- MODIFY: src/app/people/[slug]/page.tsx (metadata generation)
- MODIFY: src/app/robots.ts (if exists)

### CC-401: Topic normalization
- CREATE: scripts/normalize-topics.ts

### CC-402: Search ranking
- MODIFY: src/lib/queries/search.ts

### CC-501: Series vs Collections
- MODIFY: src/app/page.tsx (rename "Featured Collections" section)
- MODIFY: src/app/collections/page.tsx
- MODIFY: src/app/series/page.tsx

### CC-504: Sign-in cleanup
- CHECK: src/app/sign-in/page.tsx or auth pages

## Missing (to create)
- docs/baseline-audit-notes.md
- docs/manual-qa-cultcodex-audit.md
- Validation scripts (scripts/validate-*.ts)
- Backfill scripts (scripts/backfill-*.ts)
- Badge components (src/components/badges/*)
- Notice components (src/components/notices/*)
- Governance pages (methodology, corrections, content-policy)
- Tests directory and test files

## Architecture Notes
- Uses Prisma ORM with Neon Postgres
- Next.js App Router with server components
- No existing test infrastructure found
- Revalidation: 300s for dynamic pages, 3600s for stats
- Auth via NextAuth (CodexUser, CodexSession models)
- Collections are hardcoded arrays, not DB-driven
- Series are DB-driven with episode FK relationship
