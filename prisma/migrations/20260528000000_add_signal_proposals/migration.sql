-- CreateTable
CREATE TABLE "SignalProposal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "context" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "votes" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignalProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SignalProposal_userId_idx" ON "SignalProposal"("userId");

-- CreateIndex
CREATE INDEX "SignalProposal_status_idx" ON "SignalProposal"("status");

-- CreateIndex
CREATE INDEX "SignalProposal_createdAt_idx" ON "SignalProposal"("createdAt");

-- AddForeignKey
ALTER TABLE "SignalProposal" ADD CONSTRAINT "SignalProposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CodexUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
