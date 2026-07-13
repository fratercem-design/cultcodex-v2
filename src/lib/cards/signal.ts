/**
 * Daily Signal economy — the resetting allocation budget users spend on readings.
 *
 * Signal is DISTINCT from persistent Signal Credits (wallet.balance/signalCredits):
 * it resets to a daily grant at UTC midnight and is spent on divination (per
 * Spread.signalCost). Grant scales by subscription tier, mirroring the daily-credit
 * multiplier: Observer ×1 · Initiate+ ×2 · Oracle ×3 of the base.
 */
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const DAILY_SIGNAL_BASE = 10;

export function utcDayStart(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
export function nextUtcMidnight(d = new Date()): Date {
  const start = utcDayStart(d);
  return new Date(start.getTime() + 24 * 3_600_000);
}

/** Subscription-tier multiplier (1 / 2 / 3) — mirrors dailyCreditMultiplier. */
export async function signalMultiplier(userId: string): Promise<number> {
  const u = await prisma.codexUser.findUnique({
    where: { id: userId },
    select: { role: true, subscriptionStatus: true, subscriptionTier: true, currentPeriodEnd: true, isLifetimeMember: true },
  });
  if (!u) return 1;
  const active =
    u.subscriptionStatus === "active" && !!u.currentPeriodEnd && u.currentPeriodEnd > new Date();
  const isOracle =
    u.role === "admin" ||
    (u.isLifetimeMember && u.subscriptionTier === "system") ||
    (active && u.subscriptionTier === "system");
  if (isOracle) return 3;
  return u.isLifetimeMember || active ? 2 : 1;
}

export async function dailyGrant(userId: string): Promise<number> {
  return DAILY_SIGNAL_BASE * (await signalMultiplier(userId));
}

export interface SignalState {
  signal: number;
  grant: number;
  resetAt: string; // ISO — next UTC midnight
}

/**
 * Current Signal for a user, applying the daily reset (read-repair). Idempotent
 * within a UTC day. Safe to call on page load.
 */
export async function getSignalState(userId: string): Promise<SignalState> {
  const grant = await dailyGrant(userId);
  const today = utcDayStart();
  const wallet = await prisma.userWallet.findUnique({
    where: { userId },
    select: { signal: true, signalResetAt: true },
  });
  const needsReset = !wallet || !wallet.signalResetAt || wallet.signalResetAt < today;
  if (needsReset) {
    const w = await prisma.userWallet.upsert({
      where: { userId },
      update: { signal: grant, signalResetAt: new Date() },
      create: { userId, signal: grant, signalResetAt: new Date() },
      select: { signal: true },
    });
    return { signal: w.signal, grant, resetAt: nextUtcMidnight().toISOString() };
  }
  return { signal: wallet.signal, grant, resetAt: nextUtcMidnight().toISOString() };
}

/**
 * Spend Signal inside an existing Serializable transaction. Applies the daily
 * reset if the wallet hasn't rolled over yet, then checks + decrements. Throws
 * "Insufficient Signal" when the balance can't cover the cost. Ledgers the spend
 * (currency:"signal" in metadata — distinct from the persistent credit ledger).
 */
export async function spendSignalTx(
  tx: Prisma.TransactionClient,
  userId: string,
  cost: number,
  grant: number,
  reason: string,
  metadata: Record<string, unknown> = {}
): Promise<number> {
  const today = utcDayStart();
  const now = new Date();
  const wallet = await tx.userWallet.findUnique({
    where: { userId },
    select: { signal: true, signalResetAt: true },
  });
  const needsReset = !wallet || !wallet.signalResetAt || wallet.signalResetAt < today;
  const available = needsReset ? grant : wallet!.signal;
  if (available < cost) {
    throw new Error(`Insufficient Signal (need ${cost}, have ${available})`);
  }
  const remaining = available - cost;
  await tx.userWallet.upsert({
    where: { userId },
    update: { signal: remaining, ...(needsReset ? { signalResetAt: now } : {}) },
    create: { userId, signal: remaining, signalResetAt: now },
  });
  await tx.creditTransaction.create({
    data: { userId, amount: -cost, reason, metadata: { currency: "signal", ...metadata } },
  });
  return remaining;
}
