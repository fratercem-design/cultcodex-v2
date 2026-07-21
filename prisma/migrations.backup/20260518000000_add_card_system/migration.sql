-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('STATIC', 'SIGNAL', 'TRANSMISSION', 'ANOMALY', 'ORACLE');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('VOICE', 'TRANSMISSION', 'LORE', 'SIGNAL', 'ORACLE', 'CIPHER');

-- CreateTable
CREATE TABLE "Card" (
      "id" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "subtitle" TEXT,
      "cardType" "CardType" NOT NULL,
      "rarity" "Rarity" NOT NULL,
      "entitySlug" TEXT,
      "entityType" TEXT,
      "imageUrl" TEXT,
      "foilImageUrl" TEXT,
      "statA" INTEGER NOT NULL DEFAULT 50,
      "statB" INTEGER NOT NULL DEFAULT 50,
      "statC" INTEGER NOT NULL DEFAULT 50,
      "statLabelA" TEXT,
      "statLabelB" TEXT,
      "statLabelC" TEXT,
      "flavorText" TEXT,
      "abilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "weightStatic" DOUBLE PRECISION NOT NULL DEFAULT 40,
      "weightSignal" DOUBLE PRECISION NOT NULL DEFAULT 30,
      "weightTransmission" DOUBLE PRECISION NOT NULL DEFAULT 20,
      "weightAnomaly" DOUBLE PRECISION NOT NULL DEFAULT 8,
      "weightOracle" DOUBLE PRECISION NOT NULL DEFAULT 2,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
  );

-- CreateTable
CREATE TABLE "OwnedCard" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "cardId" TEXT NOT NULL,
      "isFoil" BOOLEAN NOT NULL DEFAULT false,
      "isNew" BOOLEAN NOT NULL DEFAULT true,
      "quantity" INTEGER NOT NULL DEFAULT 1,
      "obtainedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnedCard_pkey" PRIMARY KEY ("id")
  );

-- CreateTable
CREATE TABLE "CardPack" (
      "id" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "imageUrl" TEXT,
      "price" INTEGER NOT NULL,
      "cardCount" INTEGER NOT NULL DEFAULT 5,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "isAvailable" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardPack_pkey" PRIMARY KEY ("id")
  );

-- CreateTable
CREATE TABLE "PackCard" (
      "id" TEXT NOT NULL,
      "packId" TEXT NOT NULL,
      "cardId" TEXT NOT NULL,
      "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "PackCard_pkey" PRIMARY KEY ("id")
  );

-- CreateTable
CREATE TABLE "UserWallet" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "signalCredits" INTEGER NOT NULL DEFAULT 0,
      "balance" INTEGER NOT NULL DEFAULT 0,
      "lastDailyClaimAt" TIMESTAMP(3),
      "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserWallet_pkey" PRIMARY KEY ("id")
  );

-- CreateTable
CREATE TABLE "CreditTransaction" (
      "id" TEXT NOT NULL,
      "walletId" TEXT NOT NULL,
      "amount" INTEGER NOT NULL,
      "reason" TEXT NOT NULL,
      "referenceId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
  );

-- CreateTable
CREATE TABLE "PackPurchase" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "packId" TEXT NOT NULL,
      "creditsSpent" INTEGER NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackPurchase_pkey" PRIMARY KEY ("id")
  );

-- CreateIndex
CREATE UNIQUE INDEX "Card_slug_key" ON "Card"("slug");
CREATE INDEX "Card_cardType_idx" ON "Card"("cardType");
CREATE INDEX "Card_rarity_idx" ON "Card"("rarity");
CREATE INDEX "Card_entitySlug_idx" ON "Card"("entitySlug");

-- CreateIndex
CREATE UNIQUE INDEX "OwnedCard_userId_cardId_isFoil_key" ON "OwnedCard"("userId", "cardId", "isFoil");
CREATE INDEX "OwnedCard_userId_idx" ON "OwnedCard"("userId");
CREATE INDEX "OwnedCard_cardId_idx" ON "OwnedCard"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "CardPack_slug_key" ON "CardPack"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PackCard_packId_cardId_key" ON "PackCard"("packId", "cardId");
CREATE INDEX "PackCard_packId_idx" ON "PackCard"("packId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWallet_userId_key" ON "UserWallet"("userId");

-- CreateIndex
CREATE INDEX "CreditTransaction_walletId_idx" ON "CreditTransaction"("walletId");
CREATE INDEX "CreditTransaction_createdAt_idx" ON "CreditTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "PackPurchase_userId_idx" ON "PackPurchase"("userId");
CREATE INDEX "PackPurchase_packId_idx" ON "PackPurchase"("packId");

-- AddForeignKey
ALTER TABLE "OwnedCard" ADD CONSTRAINT "OwnedCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CodexUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OwnedCard" ADD CONSTRAINT "OwnedCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackCard" ADD CONSTRAINT "PackCard_packId_fkey" FOREIGN KEY ("packId") REFERENCES "CardPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PackCard" ADD CONSTRAINT "PackCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWallet" ADD CONSTRAINT "UserWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CodexUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "UserWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackPurchase" ADD CONSTRAINT "PackPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CodexUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PackPurchase" ADD CONSTRAINT "PackPurchase_packId_fkey" FOREIGN KEY ("packId") REFERENCES "CardPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
