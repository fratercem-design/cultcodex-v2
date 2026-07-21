-- GameScore: Panelverse Game Show leaderboard runs. Idempotent DDL so it is
-- safe alongside the one-shot raw table creation used on production.
CREATE TABLE IF NOT EXISTS "GameScore" (
  "id" TEXT NOT NULL,
  "handle" TEXT NOT NULL,
  "userId" TEXT,
  "score" INTEGER NOT NULL,
  "correct" INTEGER NOT NULL,
  "total" INTEGER NOT NULL,
  "round" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GameScore_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "GameScore_createdAt_idx" ON "GameScore"("createdAt");
CREATE INDEX IF NOT EXISTS "GameScore_score_idx" ON "GameScore"("score");
