-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('STATIC', 'SIGNAL', 'TRANSMISSION', 'ANOMALY', 'ORACLE');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('VOICE', 'TRANSMISSION', 'LORE', 'SIGNAL', 'ORACLE', 'CIPHER');

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "cardType" "CardType" NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "flavourText" TEXT,
    "artUrl" TEXT,
    "statA" INTEGER NOT NULL DEFAULT 50,
    "statB" INTEGER NOT NULL DEFAULT 50,
    "statC" INTEGER NOT NULL DEFAULT 50,
    "abilities" TEXT[],
    "totalMinted" INTEGER NOT NULL DEFAULT 0,
    "maxSupply" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardPack" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost" INTEGER NOT NULL DEFAULT 100,
    "cardCount" INTEGER NOT NULL DEFAULT 5,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "weightStatic" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "weightSignal" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "weightTransmission" DOUBLE PRECISION NOT NULL DEFAULT 14,
    "weightAnomaly" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "weightOracle" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackCard" (
    "packId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,

    CONSTRAINT "PackCard_pkey" PRIMARY KEY ("packId","cardId")
);

-- CreateTable
CREATE TABLE "OwnedCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isNew" BOOLEAN NOT NULL DEFAULT true,
    "isFoil" BOOLEAN NOT NULL DEFAULT false,
    "obtainedVia" TEXT NOT NULL DEFAULT 'pack',
    "obtainedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnedCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteReaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "reactionType" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWallet" (
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "lastDailyClaimAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserWallet_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "cardsDrawn" TEXT[],
    "creditsCost" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Card_slug_key" ON "Card"("slug");
CREATE INDEX "Card_rarity_idx" ON "Card"("rarity");
CREATE INDEX "Card_cardType_idx" ON "Card"("cardType");

-- CreateIndex
CREATE UNIQUE INDEX "CardPack_slug_key" ON "CardPack"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OwnedCard_userId_cardId_key" ON "OwnedCard"("userId", "cardId");
CREATE INDEX "OwnedCard_userId_idx" ON "OwnedCard"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteReaction_userId_quoteId_reactionType_key" ON "QuoteReaction"("userId", "quoteId", "reactionType");
CREATE INDEX "QuoteReaction_quoteId_idx" ON "QuoteReaction"("quoteId");
CREATE INDEX "QuoteReaction_userId_idx" ON "QuoteReaction"("userId");

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_idx" ON "CreditTransaction"("userId");
CREATE INDEX "CreditTransaction_userId_reason_createdAt_idx" ON "CreditTransaction"("userId", "reason", "createdAt");

-- CreateIndex
CREATE INDEX "PackPurchase_userId_idx" ON "PackPurchase"("userId");

-- AddForeignKey
ALTER TABLE "PackCard" ADD CONSTRAINT "PackCard_packId_fkey" FOREIGN KEY ("packId") REFERENCES "CardPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PackCard" ADD CONSTRAINT "PackCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnedCard" ADD CONSTRAINT "OwnedCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CodexUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OwnedCard" ADD CONSTRAINT "OwnedCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWallet" ADD CONSTRAINT "UserWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CodexUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CodexUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackPurchase" ADD CONSTRAINT "PackPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CodexUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PackPurchase" ADD CONSTRAINT "PackPurchase_packId_fkey" FOREIGN KEY ("packId") REFERENCES "CardPack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteReaction" ADD CONSTRAINT "QuoteReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CodexUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteReaction" ADD CONSTRAINT "QuoteReaction_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
