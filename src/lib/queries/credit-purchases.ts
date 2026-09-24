import { prisma } from "@/lib/db";

/** The CreditTransaction.reason used for paid bundles. Queried by referenceId. */
export const CREDIT_PURCHASE_REASON = "purchase";

export interface GrantPurchasedCreditsInput {
  userId: string;
  bundle: string;
  credits: number;
  /** Stripe Checkout Session id — the idempotency key for the grant. */
  stripeSessionId: string;
  amountCents: number | null;
}

export type GrantPurchasedCreditsResult =
  | { granted: true; credits: number; balance: number }
  | { granted: false; reason: "already_granted" };

/**
 * Credit a paid bundle to a user's wallet exactly once per Stripe session.
 *
 * Idempotent on `stripeSessionId`: the ledger row for a purchase carries the
 * session id as `referenceId`, and the wallet increment and ledger insert
 * happen in one transaction, so a webhook retry after a committed grant finds
 * the ledger row and does nothing. Stripe's event-level dedup in the webhook
 * is the first line of defence; this is the second, and the one that holds
 * when the dedup row is released so a failed delivery can be retried.
 *
 * `credits` comes from checkout metadata that this server wrote; the webhook
 * cross-checks it against the bundle table before calling this.
 */
export async function grantPurchasedCredits(
  input: GrantPurchasedCreditsInput
): Promise<GrantPurchasedCreditsResult> {
  const { userId, bundle, credits, stripeSessionId, amountCents } = input;
  if (!Number.isInteger(credits) || credits <= 0) {
    throw new Error(`grantPurchasedCredits: invalid credits ${credits}`);
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.creditTransaction.findFirst({
      where: { reason: CREDIT_PURCHASE_REASON, referenceId: stripeSessionId },
      select: { id: true },
    });
    if (existing) return { granted: false, reason: "already_granted" as const };

    const wallet = await tx.userWallet.upsert({
      where: { userId },
      update: {
        balance: { increment: credits },
        totalEarned: { increment: credits },
      },
      create: { userId, balance: credits, totalEarned: credits },
      select: { id: true, balance: true },
    });

    await tx.creditTransaction.create({
      data: {
        userId,
        walletId: wallet.id,
        amount: credits,
        reason: CREDIT_PURCHASE_REASON,
        referenceId: stripeSessionId,
        metadata: { bundle, amountCents },
      },
    });

    return { granted: true as const, credits, balance: wallet.balance };
  });
}
