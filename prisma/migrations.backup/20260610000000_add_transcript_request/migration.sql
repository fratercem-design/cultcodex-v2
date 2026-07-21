-- CreateTable
CREATE TABLE "TranscriptRequest" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "TranscriptRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TranscriptRequest_episodeId_idx" ON "TranscriptRequest"("episodeId");

-- CreateIndex
CREATE INDEX "TranscriptRequest_email_idx" ON "TranscriptRequest"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TranscriptRequest_episodeId_email_key" ON "TranscriptRequest"("episodeId", "email");

-- AddForeignKey
ALTER TABLE "TranscriptRequest" ADD CONSTRAINT "TranscriptRequest_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
