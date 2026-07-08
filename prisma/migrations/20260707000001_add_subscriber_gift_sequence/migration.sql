-- Track the gift/Initiate email drip sequence per subscriber.
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "giftStage" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "lastEmailAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Subscriber_giftStage_idx" ON "Subscriber"("giftStage");
