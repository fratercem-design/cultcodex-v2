-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('guest', 'host', 'mentioned', 'recurring');

-- CreateEnum
CREATE TYPE "CanonStatus" AS ENUM ('canonical', 'speculative', 'community_myth', 'disputed', 'humorous');

-- CreateEnum
CREATE TYPE "SeriesType" AS ENUM ('music_video', 'panel', 'tarot', 'story', 'documentary', 'other');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('video', 'audio', 'article');

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "episodeNumber" INTEGER,
    "airDate" TIMESTAMP(3),
    "duration" TEXT,
    "youtubeVideoId" TEXT,
    "thumbnailUrl" TEXT,
    "summaryShort" TEXT,
    "summaryLong" TEXT,
    "cutOfPsyche" TEXT,
    "transcriptRaw" TEXT,
    "transcriptHtml" TEXT,
    "transcriptJson" JSONB,
    "searchText" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "seriesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "SeriesType" NOT NULL DEFAULT 'other',
    "coverImageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "altNames" TEXT[],
    "shortBio" TEXT,
    "loreSummary" TEXT,
    "avatarUrl" TEXT,
    "personType" "PersonType" NOT NULL DEFAULT 'guest',
    "searchText" TEXT,
    "firstAppearanceEpisodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoreEntry" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT,
    "summary" TEXT,
    "fullEntry" TEXT,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'speculative',
    "searchText" TEXT,
    "firstMentionEpisodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoreEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "speakerPersonId" TEXT,
    "episodeId" TEXT,
    "transcriptSegmentId" TEXT,
    "timestampSeconds" INTEGER,
    "context" TEXT,
    "significance" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptSegment" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "startSeconds" INTEGER NOT NULL,
    "endSeconds" INTEGER NOT NULL,
    "speakerLabel" TEXT,
    "text" TEXT NOT NULL,
    "searchText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranscriptSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "MediaType" NOT NULL DEFAULT 'video',
    "youtubeVideoId" TEXT,
    "transcriptRaw" TEXT,
    "summary" TEXT,
    "seriesId" TEXT,
    "releaseDate" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpisodeGuest" (
    "episodeId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    CONSTRAINT "EpisodeGuest_pkey" PRIMARY KEY ("episodeId","personId")
);

-- CreateTable
CREATE TABLE "EpisodeMentionedPerson" (
    "episodeId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    CONSTRAINT "EpisodeMentionedPerson_pkey" PRIMARY KEY ("episodeId","personId")
);

-- CreateTable
CREATE TABLE "EpisodeLore" (
    "episodeId" TEXT NOT NULL,
    "loreEntryId" TEXT NOT NULL,

    CONSTRAINT "EpisodeLore_pkey" PRIMARY KEY ("episodeId","loreEntryId")
);

-- CreateTable
CREATE TABLE "EpisodeTopic" (
    "episodeId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "EpisodeTopic_pkey" PRIMARY KEY ("episodeId","topicId")
);

-- CreateTable
CREATE TABLE "PersonTopic" (
    "personId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "PersonTopic_pkey" PRIMARY KEY ("personId","topicId")
);

-- CreateTable
CREATE TABLE "PersonLore" (
    "personId" TEXT NOT NULL,
    "loreEntryId" TEXT NOT NULL,

    CONSTRAINT "PersonLore_pkey" PRIMARY KEY ("personId","loreEntryId")
);

-- CreateTable
CREATE TABLE "LoreTopic" (
    "loreEntryId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "LoreTopic_pkey" PRIMARY KEY ("loreEntryId","topicId")
);

-- CreateTable
CREATE TABLE "RelatedEpisode" (
    "episodeAId" TEXT NOT NULL,
    "episodeBId" TEXT NOT NULL,

    CONSTRAINT "RelatedEpisode_pkey" PRIMARY KEY ("episodeAId","episodeBId")
);

-- CreateTable
CREATE TABLE "RelatedPerson" (
    "personAId" TEXT NOT NULL,
    "personBId" TEXT NOT NULL,

    CONSTRAINT "RelatedPerson_pkey" PRIMARY KEY ("personAId","personBId")
);

-- CreateTable
CREATE TABLE "RelatedLore" (
    "loreAId" TEXT NOT NULL,
    "loreBId" TEXT NOT NULL,

    CONSTRAINT "RelatedLore_pkey" PRIMARY KEY ("loreAId","loreBId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Episode_slug_key" ON "Episode"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_episodeNumber_key" ON "Episode"("episodeNumber");

-- CreateIndex
CREATE INDEX "Episode_airDate_idx" ON "Episode"("airDate");

-- CreateIndex
CREATE INDEX "Episode_status_idx" ON "Episode"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Series_slug_key" ON "Series"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Person_slug_key" ON "Person"("slug");

-- CreateIndex
CREATE INDEX "Person_personType_idx" ON "Person"("personType");

-- CreateIndex
CREATE UNIQUE INDEX "LoreEntry_slug_key" ON "LoreEntry"("slug");

-- CreateIndex
CREATE INDEX "LoreEntry_canonStatus_idx" ON "LoreEntry"("canonStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "Quote_speakerPersonId_idx" ON "Quote"("speakerPersonId");

-- CreateIndex
CREATE INDEX "Quote_episodeId_idx" ON "Quote"("episodeId");

-- CreateIndex
CREATE INDEX "TranscriptSegment_episodeId_idx" ON "TranscriptSegment"("episodeId");

-- CreateIndex
CREATE INDEX "TranscriptSegment_startSeconds_idx" ON "TranscriptSegment"("startSeconds");

-- CreateIndex
CREATE UNIQUE INDEX "MediaItem_slug_key" ON "MediaItem"("slug");

-- CreateIndex
CREATE INDEX "MediaItem_seriesId_idx" ON "MediaItem"("seriesId");

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_firstAppearanceEpisodeId_fkey" FOREIGN KEY ("firstAppearanceEpisodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoreEntry" ADD CONSTRAINT "LoreEntry_firstMentionEpisodeId_fkey" FOREIGN KEY ("firstMentionEpisodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_speakerPersonId_fkey" FOREIGN KEY ("speakerPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_transcriptSegmentId_fkey" FOREIGN KEY ("transcriptSegmentId") REFERENCES "TranscriptSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeGuest" ADD CONSTRAINT "EpisodeGuest_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeGuest" ADD CONSTRAINT "EpisodeGuest_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeMentionedPerson" ADD CONSTRAINT "EpisodeMentionedPerson_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeMentionedPerson" ADD CONSTRAINT "EpisodeMentionedPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeLore" ADD CONSTRAINT "EpisodeLore_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeLore" ADD CONSTRAINT "EpisodeLore_loreEntryId_fkey" FOREIGN KEY ("loreEntryId") REFERENCES "LoreEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeTopic" ADD CONSTRAINT "EpisodeTopic_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeTopic" ADD CONSTRAINT "EpisodeTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonTopic" ADD CONSTRAINT "PersonTopic_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonTopic" ADD CONSTRAINT "PersonTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonLore" ADD CONSTRAINT "PersonLore_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonLore" ADD CONSTRAINT "PersonLore_loreEntryId_fkey" FOREIGN KEY ("loreEntryId") REFERENCES "LoreEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoreTopic" ADD CONSTRAINT "LoreTopic_loreEntryId_fkey" FOREIGN KEY ("loreEntryId") REFERENCES "LoreEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoreTopic" ADD CONSTRAINT "LoreTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedEpisode" ADD CONSTRAINT "RelatedEpisode_episodeAId_fkey" FOREIGN KEY ("episodeAId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedEpisode" ADD CONSTRAINT "RelatedEpisode_episodeBId_fkey" FOREIGN KEY ("episodeBId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedPerson" ADD CONSTRAINT "RelatedPerson_personAId_fkey" FOREIGN KEY ("personAId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedPerson" ADD CONSTRAINT "RelatedPerson_personBId_fkey" FOREIGN KEY ("personBId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedLore" ADD CONSTRAINT "RelatedLore_loreAId_fkey" FOREIGN KEY ("loreAId") REFERENCES "LoreEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedLore" ADD CONSTRAINT "RelatedLore_loreBId_fkey" FOREIGN KEY ("loreBId") REFERENCES "LoreEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
