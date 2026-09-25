-- Codex seasons: seasonal card sets, task/secret/signup-only cards, guaranteed
-- pack slots and the one-per-account Initiation Pack.
ALTER TABLE "Card" ADD COLUMN "season" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Card" ADD COLUMN "collectorNo" INTEGER;
ALTER TABLE "Card" ADD COLUMN "obtainMethod" TEXT NOT NULL DEFAULT 'pack';
CREATE INDEX "Card_season_obtainMethod_idx" ON "Card"("season", "obtainMethod");

ALTER TABLE "CardPack" ADD COLUMN "season" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CardPack" ADD COLUMN "guaranteeRarity" "Rarity";

ALTER TABLE "UserWallet" ADD COLUMN "initiationClaimedAt" TIMESTAMP(3);
