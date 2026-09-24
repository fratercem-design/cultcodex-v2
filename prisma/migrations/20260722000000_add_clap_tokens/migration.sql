-- Clap Tokens (#cultofpsyche): ClapHolder = nickname with a permanent token
-- total on the public /claps board; ClapToken = each grant (stripe purchase,
-- manual cashapp credit, or admin adjustment) with a 24h clap spotlight.
-- Idempotent DDL, matching the repo convention.
CREATE TABLE IF NOT EXISTS "ClapHolder" (
  "id" TEXT NOT NULL,
  "nickname" TEXT NOT NULL,
  "tokens" INTEGER NOT NULL DEFAULT 0,
  "hidden" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClapHolder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClapHolder_nickname_key" ON "ClapHolder"("nickname");
CREATE INDEX IF NOT EXISTS "ClapHolder_tokens_idx" ON "ClapHolder"("tokens");
CREATE INDEX IF NOT EXISTS "ClapHolder_hidden_tokens_idx" ON "ClapHolder"("hidden", "tokens");

CREATE TABLE IF NOT EXISTS "ClapToken" (
  "id" TEXT NOT NULL,
  "holderId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "source" TEXT NOT NULL,
  "amountCents" INTEGER,
  "couponCode" TEXT,
  "stripeSessionId" TEXT,
  "note" TEXT,
  "spotlightUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClapToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClapToken_stripeSessionId_key" ON "ClapToken"("stripeSessionId");
CREATE INDEX IF NOT EXISTS "ClapToken_holderId_idx" ON "ClapToken"("holderId");
CREATE INDEX IF NOT EXISTS "ClapToken_spotlightUntil_idx" ON "ClapToken"("spotlightUntil");
CREATE INDEX IF NOT EXISTS "ClapToken_createdAt_idx" ON "ClapToken"("createdAt");

DO $$ BEGIN
  ALTER TABLE "ClapToken"
    ADD CONSTRAINT "ClapToken_holderId_fkey"
    FOREIGN KEY ("holderId") REFERENCES "ClapHolder"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
