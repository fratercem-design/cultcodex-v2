-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "SearchKind" AS ENUM ('simple', 'deep', 'oracle');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "SavedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "SearchKind" NOT NULL,
    "query" TEXT NOT NULL DEFAULT '',
    "concepts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thresholds" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
    "eraId" TEXT,
    "personSlug" TEXT,
    "archetype" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "CodexUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SavedSearch_userId_idx" ON "SavedSearch"("userId");
CREATE INDEX IF NOT EXISTS "SavedSearch_userId_pinned_idx" ON "SavedSearch"("userId", "pinned");
CREATE INDEX IF NOT EXISTS "SavedSearch_userId_kind_idx" ON "SavedSearch"("userId", "kind");
