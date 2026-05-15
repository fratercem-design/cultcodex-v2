-- CreateTable
CREATE TABLE "SavedTopic" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedQuote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedQuote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedTopic_userId_idx" ON "SavedTopic"("userId");

-- CreateIndex
CREATE INDEX "SavedTopic_topicId_idx" ON "SavedTopic"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedTopic_userId_topicId_key" ON "SavedTopic"("userId", "topicId");

-- CreateIndex
CREATE INDEX "SavedQuote_userId_idx" ON "SavedQuote"("userId");

-- CreateIndex
CREATE INDEX "SavedQuote_quoteId_idx" ON "SavedQuote"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedQuote_userId_quoteId_key" ON "SavedQuote"("userId", "quoteId");

-- AddForeignKey
ALTER TABLE "SavedTopic" ADD CONSTRAINT "SavedTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CodexUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedTopic" ADD CONSTRAINT "SavedTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedQuote" ADD CONSTRAINT "SavedQuote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CodexUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedQuote" ADD CONSTRAINT "SavedQuote_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
