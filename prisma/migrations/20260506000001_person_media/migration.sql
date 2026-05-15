-- CreateTable: PersonMedia — external video/wiki content linked to a person by slug
CREATE TABLE IF NOT EXISTS "PersonMedia" (
    "id"           TEXT NOT NULL,
    "personSlug"   TEXT NOT NULL,
    "source"       TEXT NOT NULL,
    "sourceId"     TEXT,
    "sourceUrl"    TEXT NOT NULL,
    "title"        TEXT NOT NULL,
    "description"  TEXT,
    "thumbnailUrl" TEXT,
    "publishedAt"  TIMESTAMP(3),
    "durationStr"  TEXT,
    "viewCount"    INTEGER,
    "rawContent"   TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonMedia_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PersonMedia_source_sourceId_key" ON "PersonMedia"("source", "sourceId") WHERE "sourceId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "PersonMedia_personSlug_source_idx" ON "PersonMedia"("personSlug", "source");
CREATE INDEX IF NOT EXISTS "PersonMedia_publishedAt_idx" ON "PersonMedia"("publishedAt");
