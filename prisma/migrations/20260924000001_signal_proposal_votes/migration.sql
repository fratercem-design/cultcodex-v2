-- One vote per member per proposal. Existing vote counts are kept as-is (there's
-- no record of who cast them); new votes are deduplicated from here on.

-- CreateTable
CREATE TABLE "SignalProposalVote" (
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignalProposalVote_pkey" PRIMARY KEY ("proposalId","userId")
);

-- CreateIndex
CREATE INDEX "SignalProposalVote_userId_idx" ON "SignalProposalVote"("userId");

-- AddForeignKey
ALTER TABLE "SignalProposalVote" ADD CONSTRAINT "SignalProposalVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "SignalProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalProposalVote" ADD CONSTRAINT "SignalProposalVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CodexUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

