-- AddIndex: Card.isActive
-- Used by getAllCards() and getUserCollectionStats() on every /cards page load.
CREATE INDEX IF NOT EXISTS "Card_isActive_idx" ON "Card"("isActive");
