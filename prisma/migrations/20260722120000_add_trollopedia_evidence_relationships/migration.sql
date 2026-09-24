-- Trollopedia Phase 1: Evidence + Relationship Engine

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('friend', 'former_friend', 'ally', 'frequent_collaborator', 'debate_rival', 'enemy', 'occasional_guest', 'moderator', 'supporter', 'critic', 'student', 'mentor', 'community_member', 'unknown');

-- CreateEnum
CREATE TYPE "EvidenceSourceType" AS ENUM ('youtube_video', 'livestream_transcript', 'chat_log', 'video_description', 'comment', 'screenshot', 'community_submission', 'archived_social_media', 'other');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('confirmed', 'strong', 'moderate', 'weak', 'rumor');

-- CreateEnum
CREATE TYPE "ClaimNature" AS ENUM ('documented', 'opinion', 'satire', 'rumor', 'disputed');

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "nature" "ClaimNature" NOT NULL DEFAULT 'documented',
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'moderate',
    "sourceType" "EvidenceSourceType" NOT NULL,
    "sourceUrl" TEXT,
    "episodeId" TEXT,
    "timestampSeconds" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipEvent" (
    "id" TEXT NOT NULL,
    "personAId" TEXT NOT NULL,
    "personBId" TEXT NOT NULL,
    "relationType" "RelationType" NOT NULL DEFAULT 'unknown',
    "headline" TEXT NOT NULL,
    "details" TEXT,
    "episodeId" TEXT,
    "occurredAt" TIMESTAMP(3),
    "evidenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelationshipEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "episodeId" TEXT,
    "evidenceId" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Evidence_episodeId_idx" ON "Evidence"("episodeId");
CREATE INDEX "Evidence_confidence_idx" ON "Evidence"("confidence");
CREATE INDEX "Evidence_nature_idx" ON "Evidence"("nature");
CREATE INDEX "RelationshipEvent_personAId_personBId_idx" ON "RelationshipEvent"("personAId", "personBId");
CREATE INDEX "RelationshipEvent_episodeId_idx" ON "RelationshipEvent"("episodeId");
CREATE INDEX "RelationshipEvent_relationType_idx" ON "RelationshipEvent"("relationType");
CREATE UNIQUE INDEX "TimelineEvent_slug_key" ON "TimelineEvent"("slug");
CREATE INDEX "TimelineEvent_date_idx" ON "TimelineEvent"("date");
CREATE INDEX "TimelineEvent_category_idx" ON "TimelineEvent"("category");

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RelationshipEvent" ADD CONSTRAINT "RelationshipEvent_personAId_fkey" FOREIGN KEY ("personAId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RelationshipEvent" ADD CONSTRAINT "RelationshipEvent_personBId_fkey" FOREIGN KEY ("personBId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RelationshipEvent" ADD CONSTRAINT "RelationshipEvent_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RelationshipEvent" ADD CONSTRAINT "RelationshipEvent_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
