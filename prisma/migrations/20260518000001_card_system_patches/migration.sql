-- Patch Card: add fields used by UI and queries
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "artUrl" TEXT;
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "flavourText" TEXT;
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "totalMinted" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "maxSupply" INTEGER;

-- Patch CardPack: add cost + weight columns used by pack-opening logic
ALTER TABLE "CardPack" ADD COLUMN IF NOT EXISTS "cost" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "CardPack" ADD COLUMN IF NOT EXISTS "weightStatic" DOUBLE PRECISION NOT NULL DEFAULT 50;
ALTER TABLE "CardPack" ADD COLUMN IF NOT EXISTS "weightSignal" DOUBLE PRECISION NOT NULL DEFAULT 30;
ALTER TABLE "CardPack" ADD COLUMN IF NOT EXISTS "weightTransmission" DOUBLE PRECISION NOT NULL DEFAULT 14;
ALTER TABLE "CardPack" ADD COLUMN IF NOT EXISTS "weightAnomaly" DOUBLE PRECISION NOT NULL DEFAULT 5;
ALTER TABLE "CardPack" ADD COLUMN IF NOT EXISTS "weightOracle" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- Patch OwnedCard: add obtainedVia
ALTER TABLE "OwnedCard" ADD COLUMN IF NOT EXISTS "obtainedVia" TEXT NOT NULL DEFAULT 'pack';

-- Patch UserWallet: add totalEarned, totalSpent, createdAt
ALTER TABLE "UserWallet" ADD COLUMN IF NOT EXISTS "totalEarned" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserWallet" ADD COLUMN IF NOT EXISTS "totalSpent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserWallet" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Patch CreditTransaction: add userId and metadata (old schema used walletId)
ALTER TABLE "CreditTransaction" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "CreditTransaction" ADD COLUMN IF NOT EXISTS "metadata" JSONB NOT NULL DEFAULT '{}';
UPDATE "CreditTransaction" ct SET "userId" = w."userId" FROM "UserWallet" w WHERE ct."walletId" = w."id";
CREATE INDEX IF NOT EXISTS "CreditTransaction_userId_idx" ON "CreditTransaction"("userId");
CREATE INDEX IF NOT EXISTS "CreditTransaction_userId_reason_createdAt_idx" ON "CreditTransaction"("userId", "reason", "createdAt");

-- Patch PackPurchase: add cardsDrawn and creditsCost
ALTER TABLE "PackPurchase" ADD COLUMN IF NOT EXISTS "cardsDrawn" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "PackPurchase" ADD COLUMN IF NOT EXISTS "creditsCost" INTEGER NOT NULL DEFAULT 0;

-- CreateTable QuoteReaction
CREATE TABLE IF NOT EXISTS "QuoteReaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "reactionType" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuoteReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "QuoteReaction_userId_quoteId_reactionType_key" ON "QuoteReaction"("userId", "quoteId", "reactionType");
CREATE INDEX IF NOT EXISTS "QuoteReaction_quoteId_idx" ON "QuoteReaction"("quoteId");
CREATE INDEX IF NOT EXISTS "QuoteReaction_userId_idx" ON "QuoteReaction"("userId");

ALTER TABLE "QuoteReaction" ADD CONSTRAINT "QuoteReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CodexUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteReaction" ADD CONSTRAINT "QuoteReaction_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
