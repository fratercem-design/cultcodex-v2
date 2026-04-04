# CultCodex v2 — Audit Completion Notes

## Audit Summary (2026-04-04)

### Phase 1: Data Foundation (CC-1xx)
- **CC-101**: Canonical `getArchiveStats()` in `src/lib/queries/stats.ts` — single source of truth for all 10 archive metrics (episodes, people, loreEntries, quotes, series, topics, segments, totalHours, comments, reactions)
- **CC-102**: All count consumers verified — homepage and stats use canonical function, listing pages use filtered counts (correct by design)
- **CC-103**: Chronology verified consistent — newest-first default across episodes, homepage, timeline

### Phase 2: Person & Speaker Integrity (CC-2xx)
- **CC-201**: Host filtering at UI layer — `personType !== "host"` applied to all guest displays (episode detail, cards, homepage, formatEpisodeForCard)
- **CC-203**: ProvenanceBadge component — shows TRANSCRIPT-BACKED (green), INFERRED (amber), NO SUMMARY (muted) based on hasTranscript/hasSummary
- **CC-204**: DataQualityBadge component — computed A-F grade based on 8 completeness factors, no schema changes needed

### Phase 3: Governance & Legal (CC-3xx)
- **CC-301**: Three governance pages created: `/methodology`, `/corrections`, `/content-policy`
- **CC-302**: ArchiveNotice component on all person detail pages — "Auto-Generated Profile" warning with links to corrections/content-policy
- **CC-303**: Selective noindex — `personType === "mentioned"` gets `robots: { index: false, follow: true }`; admin layout gets `robots: { index: false, follow: false }`
- **CC-304**: SuggestCorrection component on all 4 entity detail pages (episodes, people, lore, topics) — mailto link pre-populates subject/body

### Phase 4: Search & Discovery (CC-4xx)
- **CC-401**: 17 near-duplicate topic pairs merged via Levenshtein distance matching
- **CC-402**: Search ranking — tiered search (exact → contains → summary → searchText), person results re-ranked by personType priority (host > recurring > guest > mentioned), altNames array matching added
- **CC-404**: Search text rebuild — searchText fields rebuilt for all Person and Episode records

### Phase 5: Collections & Series (CC-5xx)
- **CC-501**: "Featured Collections" → "Featured Series" on homepage
- **CC-504**: Sign-in page verified at `/auth/signin` — clean Google OAuth UI
- **CC-601**: Collections page now data-driven — fetches episode counts per series from DB, shows count badges on links, total episodes in hero

### Phase 6: SEO & Infrastructure
- Sitemap expanded: 7 new static pages added (collections, timeline, start-here, stats, methodology, corrections, content-policy)
- Robots.txt: `/admin/` added to disallow list
- Admin layout: noindex/nofollow metadata added

### Data Cleanup
| Action | Count |
|--------|-------|
| Host records merged into Psyche | 27 |
| Alexandra Mayers dupes merged | 5 |
| Alexander McQueen dupes merged | 5 |
| ThingThatIs/Mason separated | 2 records fixed |
| Unknown Speaker/Performer → Psyche | 1 |
| "mentioned" → "recurring" (5+ eps) | 29 |
| "mentioned" → "guest" (1-4 eps) | 225 |
| Topic near-dupes merged | 17 pairs |
| **Total dupes eliminated** | **40** |
| **Total type corrections** | **254** |

### Final Database State
- 1,327 episodes (1,263 enriched, 64 unenriched)
- 631 people (1 host, 65 recurring, 564 guest, 1 mentioned)
- 3,423 quotes (446 without speaker)
- 3,248 topics
- 2,490 lore entries
- 15 series

### Files Created/Modified
**New components**: ProvenanceBadge, DataQualityBadge, ArchiveNotice, SuggestCorrection (on new pages)
**New pages**: /methodology, /corrections, /content-policy
**New scripts**: validate-data.ts, _merge-topics.ts, _find-topic-dupes.ts, _dedup-alex.ts, _merge-hosts.ts, _dedup-tti-mason.ts, _fix-person-types.ts, _rebuild-search-text.ts, _data-quality.ts
**New tests**: stats.test.ts, provenance-badge.test.tsx
**New docs**: qa-checklist.md, audit-completion-notes.md
