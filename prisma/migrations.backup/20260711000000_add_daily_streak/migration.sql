-- Track consecutive daily-claim streaks on the wallet (Dossier Ch. VI —
-- "Daily sigil + streak counter" loss-aversion retention loop).
ALTER TABLE "UserWallet" ADD COLUMN IF NOT EXISTS "dailyStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserWallet" ADD COLUMN IF NOT EXISTS "longestStreak" INTEGER NOT NULL DEFAULT 0;
