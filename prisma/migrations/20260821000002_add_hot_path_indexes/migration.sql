-- Indexes for hot query paths, from the 2026-08-21 audit of src/lib/queries/*:
--   * Episode (airDate, status)  — the two hottest predicates (episodes.ts,
--     graph.ts, eras.ts filter status='published' + airDate ranges)
--   * Person (displayName)       — primary list/order/sort column (people.ts)
--   * Topic (title)              — ordering in topics.ts / searchTopics
--   * LoreEntry (title)          — ordering in lore.ts / searchLore
--   * Quote (createdAt)          — getQuotes orders by createdAt desc
-- All IF NOT EXISTS so this is safe to re-run.
CREATE INDEX IF NOT EXISTS "Episode_airDate_status_idx"
    ON "Episode" ("airDate", "status");

CREATE INDEX IF NOT EXISTS "Person_displayName_idx"
    ON "Person" ("displayName");

CREATE INDEX IF NOT EXISTS "Topic_title_idx"
    ON "Topic" ("title");

CREATE INDEX IF NOT EXISTS "LoreEntry_title_idx"
    ON "LoreEntry" ("title");

CREATE INDEX IF NOT EXISTS "Quote_createdAt_idx"
    ON "Quote" ("createdAt");
