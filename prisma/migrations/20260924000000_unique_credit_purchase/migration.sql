-- One credit grant per Stripe Checkout Session. grantPurchasedCredits checks
-- for an existing ledger row first, but two concurrent webhook deliveries can
-- both pass that check; this index makes the second insert fail (P2002).
--
-- Partial on reason = 'purchase': other reasons (e.g. "set_complete") reuse
-- referenceId across users by design.
--
-- If this fails with a duplicate-key error, a session was already credited
-- twice. Find the rows with:
--   SELECT "referenceId", count(*) FROM "CreditTransaction"
--   WHERE reason = 'purchase' GROUP BY 1 HAVING count(*) > 1;
-- reconcile the wallet by hand, then re-run.
CREATE UNIQUE INDEX "CreditTransaction_purchase_referenceId_key"
  ON "CreditTransaction"("referenceId")
  WHERE "reason" = 'purchase';
