-- Salon: Oracle-tier members discussion space

-- CreateTable
CREATE TABLE IF NOT EXISTS "SalonThread" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalonThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SalonPost" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flaggedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalonPost_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "SalonPost" ADD CONSTRAINT "SalonPost_threadId_fkey"
    FOREIGN KEY ("threadId") REFERENCES "SalonThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "SalonPost" ADD CONSTRAINT "SalonPost_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "CodexUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SalonThread_pinned_createdAt_idx" ON "SalonThread"("pinned", "createdAt");
CREATE INDEX IF NOT EXISTS "SalonPost_threadId_createdAt_idx" ON "SalonPost"("threadId", "createdAt");
CREATE INDEX IF NOT EXISTS "SalonPost_userId_idx" ON "SalonPost"("userId");

-- Seed a welcome thread so the Salon is not empty on first open
INSERT INTO "SalonThread" ("id", "title", "prompt", "pinned", "updatedAt")
VALUES (
  'salon_welcome',
  'Welcome to the Salon',
  'This is the Oracle-tier salon — the room behind the room. Introduce yourself: what first pulled you into the archive, and what pattern are you still trying to decode?',
  true,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
