-- CreateTable: Stripe webhook event deduplication
-- Stores processed Stripe event IDs to make all webhook handlers idempotent.
-- Stripe can retry a webhook if our response is slow or the connection drops;
-- without this table, side effects (welcome emails) fire multiple times.
CREATE TABLE IF NOT EXISTS "StripeWebhookEvent" (
    "id"          TEXT         NOT NULL,
    "type"        TEXT         NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StripeWebhookEvent_processedAt_idx" ON "StripeWebhookEvent"("processedAt");
