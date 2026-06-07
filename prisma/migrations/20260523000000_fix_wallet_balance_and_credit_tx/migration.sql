-- Fix 1: Add `balance` column to UserWallet (missing from original migration).
-- Copy from signalCredits so existing wallets keep their value.
ALTER TABLE "UserWallet" ADD COLUMN IF NOT EXISTS "balance" INTEGER NOT NULL DEFAULT 0;
UPDATE "UserWallet" SET "balance" = "signalCredits" WHERE "balance" = 0 AND "signalCredits" > 0;

-- Fix 2: Make CreditTransaction.walletId nullable so the daily-claim and pack-open
-- routes can create transactions by userId without a wallet join.
ALTER TABLE "CreditTransaction" ALTER COLUMN "walletId" DROP NOT NULL;
