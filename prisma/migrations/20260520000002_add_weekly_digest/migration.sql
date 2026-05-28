-- Weekly Digest: admin-curated "This week in the archive" selections

-- CreateTable
CREATE TABLE IF NOT EXISTS "WeeklyDigest" (
    "id" TEXT NOT NULL,
    "weekOf" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "blurb" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "quoteIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "episodeIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "personIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyDigest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "WeeklyDigest_weekOf_key" ON "WeeklyDigest"("weekOf");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WeeklyDigest_weekOf_idx" ON "WeeklyDigest"("weekOf");
