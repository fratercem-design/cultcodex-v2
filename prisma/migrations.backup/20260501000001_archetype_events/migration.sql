-- ArchetypeEvent: timestamped record of archetype state at each chapter appearance
-- Enables the weighted-decay evolution timeline graph

ALTER TABLE "PsychenomiconEntity"
    ADD COLUMN IF NOT EXISTS "archetypeState" JSONB;

CREATE TABLE IF NOT EXISTS "ArchetypeEvent" (
    "id"                  TEXT NOT NULL,
    "entityId"            TEXT NOT NULL,
    "chapterId"           TEXT,
    "chapterNumber"       INTEGER NOT NULL,
    "primaryArchetype"    TEXT NOT NULL,
    "secondaryArchetypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "confidenceScore"     DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "triggerEvent"        TEXT,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchetypeEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ArchetypeEvent_entityId_idx"     ON "ArchetypeEvent"("entityId");
CREATE INDEX IF NOT EXISTS "ArchetypeEvent_chapterNumber_idx" ON "ArchetypeEvent"("chapterNumber");

ALTER TABLE "ArchetypeEvent"
    ADD CONSTRAINT "ArchetypeEvent_entityId_fkey"
    FOREIGN KEY ("entityId") REFERENCES "PsychenomiconEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArchetypeEvent"
    ADD CONSTRAINT "ArchetypeEvent_chapterId_fkey"
    FOREIGN KEY ("chapterId") REFERENCES "PsychenomiconChapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
