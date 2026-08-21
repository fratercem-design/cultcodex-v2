-- LlmBudget: daily/monthly LLM spend counters for the global budget breaker.
-- The table previously existed only via a runtime `CREATE TABLE IF NOT EXISTS`
-- in src/lib/llm-budget.ts; this migration makes it a first-class part of the
-- schema so the create-on-first-use race is gone.
CREATE TABLE IF NOT EXISTS "LlmBudget" (
    "bucket_day" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "LlmBudget_pkey" PRIMARY KEY ("bucket_day")
);
