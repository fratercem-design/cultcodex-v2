-- CreateTable
CREATE TABLE IF NOT EXISTS "CommunityPost" (
    "id"            TEXT NOT NULL,
    "youtubePostId" TEXT NOT NULL,
    "text"          TEXT NOT NULL,
    "imageUrls"     TEXT[] NOT NULL DEFAULT '{}',
    "likeCount"     INTEGER,
    "commentCount"  INTEGER,
    "publishedAt"   TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CommunityPost_youtubePostId_key" ON "CommunityPost"("youtubePostId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CommunityPost_publishedAt_idx" ON "CommunityPost"("publishedAt");
