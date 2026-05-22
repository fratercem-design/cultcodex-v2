-- Set a DB-level default for the abilities column so new cards never store NULL.
-- Existing NULL rows are tolerated by optional-chaining in the TradingCard component.
ALTER TABLE "Card" ALTER COLUMN "abilities" SET DEFAULT ARRAY[]::TEXT[];
