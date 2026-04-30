-- Psychenomicon: living myth-engine tables

ALTER TABLE "Episode" ADD COLUMN IF NOT EXISTS "psychenomiconChapterId" TEXT;

CREATE TABLE IF NOT EXISTS "PsychenomiconChapter" (
    "id"                 TEXT NOT NULL,
    "chapterNumber"      INTEGER NOT NULL,
    "title"              TEXT NOT NULL,
    "slug"               TEXT NOT NULL,
    "episodeId"          TEXT,
    "canonText"          TEXT NOT NULL,
    "interpretationText" TEXT NOT NULL,
    "mythicText"         TEXT NOT NULL,
    "emergingSignals"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "archetypesData"     JSONB,
    "threadRefs"         JSONB,
    "isMajorEvent"       BOOLEAN NOT NULL DEFAULT false,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PsychenomiconChapter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PsychenomiconChapter_chapterNumber_key" ON "PsychenomiconChapter"("chapterNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "PsychenomiconChapter_slug_key"          ON "PsychenomiconChapter"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "PsychenomiconChapter_episodeId_key"     ON "PsychenomiconChapter"("episodeId");
CREATE INDEX        IF NOT EXISTS "PsychenomiconChapter_chapterNumber_idx" ON "PsychenomiconChapter"("chapterNumber");

ALTER TABLE "PsychenomiconChapter"
    ADD CONSTRAINT "PsychenomiconChapter_episodeId_fkey"
    FOREIGN KEY ("episodeId") REFERENCES "Episode"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PsychenomiconEntity" (
    "id"               TEXT NOT NULL,
    "name"             TEXT NOT NULL,
    "slug"             TEXT NOT NULL,
    "personSlug"       TEXT,
    "primaryArchetype" TEXT,
    "archetypeHistory" JSONB,
    "radarData"        JSONB,
    "behaviorPatterns" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status"           TEXT NOT NULL DEFAULT 'active',
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PsychenomiconEntity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PsychenomiconEntity_slug_key"    ON "PsychenomiconEntity"("slug");
CREATE INDEX        IF NOT EXISTS "PsychenomiconEntity_status_idx"  ON "PsychenomiconEntity"("status");

-- ───────────────────────���────────────────────────��──────────

CREATE TABLE IF NOT EXISTS "PsychenomiconThread" (
    "id"          TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "slug"        TEXT NOT NULL,
    "description" TEXT,
    "status"      TEXT NOT NULL DEFAULT 'active',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PsychenomiconThread_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PsychenomiconThread_slug_key"   ON "PsychenomiconThread"("slug");
CREATE INDEX        IF NOT EXISTS "PsychenomiconThread_status_idx" ON "PsychenomiconThread"("status");

-- ──────────────────────���──────────────────────────��─────────

CREATE TABLE IF NOT EXISTS "PsychenomiconEntityAppearance" (
    "id"           TEXT NOT NULL,
    "chapterId"    TEXT NOT NULL,
    "entityId"     TEXT NOT NULL,
    "archetypeAt"  TEXT,
    "significance" TEXT,

    CONSTRAINT "PsychenomiconEntityAppearance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PsychenomiconEntityAppearance_chapterId_entityId_key"
    ON "PsychenomiconEntityAppearance"("chapterId", "entityId");
CREATE INDEX IF NOT EXISTS "PsychenomiconEntityAppearance_chapterId_idx" ON "PsychenomiconEntityAppearance"("chapterId");
CREATE INDEX IF NOT EXISTS "PsychenomiconEntityAppearance_entityId_idx"  ON "PsychenomiconEntityAppearance"("entityId");

ALTER TABLE "PsychenomiconEntityAppearance"
    ADD CONSTRAINT "PsychenomiconEntityAppearance_chapterId_fkey"
    FOREIGN KEY ("chapterId") REFERENCES "PsychenomiconChapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PsychenomiconEntityAppearance"
    ADD CONSTRAINT "PsychenomiconEntityAppearance_entityId_fkey"
    FOREIGN KEY ("entityId") REFERENCES "PsychenomiconEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PsychenomiconThreadChapter" (
    "chapterId" TEXT NOT NULL,
    "threadId"  TEXT NOT NULL,

    CONSTRAINT "PsychenomiconThreadChapter_pkey" PRIMARY KEY ("chapterId", "threadId")
);

ALTER TABLE "PsychenomiconThreadChapter"
    ADD CONSTRAINT "PsychenomiconThreadChapter_chapterId_fkey"
    FOREIGN KEY ("chapterId") REFERENCES "PsychenomiconChapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PsychenomiconThreadChapter"
    ADD CONSTRAINT "PsychenomiconThreadChapter_threadId_fkey"
    FOREIGN KEY ("threadId") REFERENCES "PsychenomiconThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
