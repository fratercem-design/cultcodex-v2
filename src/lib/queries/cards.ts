import { prisma } from "@/lib/db";
import type { Rarity, CardType } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { rollRarity, rollFoil, cardPoints, RARITY_BONUS_CREDITS } from "@/lib/cards/rarity";

// ─── Vault (all cards) ───────────────────────────────────────────────────────

export async function getAllCards() {
  return prisma.card.findMany({
    where: { isActive: true },
    orderBy: [{ cardType: "asc" }, { title: "asc" }],
  });
}

// ─── Collection ─────────────────────────────────────────────────────────────

export async function getUserCollection(userId: string) {
  return prisma.ownedCard.findMany({
    where: { userId },
    include: { card: true },
    orderBy: [
      { card: { rarity: "desc" } },
      { obtainedAt: "desc" },
    ],
  });
}

export async function getCollectionPower(userId: string): Promise<number> {
  const owned = await prisma.ownedCard.findMany({
    where: { userId },
    select: { card: { select: { rarity: true } }, isFoil: true, quantity: true },
  });
  return owned.reduce(
    (sum, oc) => sum + cardPoints(oc.card.rarity as Rarity, oc.isFoil) * oc.quantity,
    0
  );
}

export async function getUserCollectionStats(userId: string, { includeWallet = true } = {}) {
  const [owned, wallet, total, power] = await Promise.all([
    prisma.ownedCard.count({ where: { userId } }),
    includeWallet ? prisma.userWallet.findUnique({ where: { userId } }) : Promise.resolve(null),
    prisma.card.count({ where: { isActive: true } }),
    getCollectionPower(userId),
  ]);
  return {
    ownedCount: owned,
    totalCards: total,
    completionPct: total > 0 ? Math.round((owned / total) * 100) : 0,
    signalCredits: wallet?.balance ?? 0,
    lastDailyClaimAt: wallet?.lastDailyClaimAt ?? null,
    dailyStreak: wallet?.dailyStreak ?? 0,
    longestStreak: wallet?.longestStreak ?? 0,
    collectionPower: power,
  };
}

// ─── Card sets (grouped by CardType) ─────────────────────────────────────────
// A "set" is every active card sharing a CardType — no separate curation/
// schema needed, the grouping already exists in the data. Completing one
// pays a one-time bonus, sized to the set (bigger set = bigger payout).

const SET_BONUS_PER_CARD = 20;

export interface CollectionSet {
  cardType: CardType;
  total: number;
  owned: number;
  completionPct: number;
  isComplete: boolean;
  bonusAmount: number;
  claimed: boolean;
}

export async function getCollectionSets(userId: string): Promise<CollectionSet[]> {
  const [totals, ownedRows, claims] = await Promise.all([
    prisma.card.groupBy({
      by: ["cardType"],
      where: { isActive: true },
      _count: { _all: true },
    }),
    prisma.ownedCard.findMany({
      where: { userId },
      select: { card: { select: { cardType: true } } },
      distinct: ["cardId"],
    }),
    prisma.creditTransaction.findMany({
      where: { userId, reason: "set_complete" },
      select: { referenceId: true },
    }),
  ]);

  const ownedCounts = new Map<CardType, number>();
  for (const row of ownedRows) {
    const t = row.card.cardType;
    ownedCounts.set(t, (ownedCounts.get(t) ?? 0) + 1);
  }
  const claimedTypes = new Set(claims.map((c) => c.referenceId));

  return totals
    .map(({ cardType, _count }) => {
      const total = _count._all;
      const owned = Math.min(ownedCounts.get(cardType) ?? 0, total);
      return {
        cardType,
        total,
        owned,
        completionPct: total > 0 ? Math.round((owned / total) * 100) : 0,
        isComplete: total > 0 && owned >= total,
        bonusAmount: total * SET_BONUS_PER_CARD,
        claimed: claimedTypes.has(cardType),
      };
    })
    .sort((a, b) => b.completionPct - a.completionPct);
}

/**
 * Grants the one-time set-completion bonus. Re-verifies completion and
 * idempotency server-side rather than trusting the client — a prior
 * CreditTransaction with reason "set_complete" + this cardType as
 * referenceId means it was already paid out.
 */
export async function claimSetBonus(
  userId: string,
  cardType: CardType
): Promise<{ granted: number; alreadyClaimed: boolean; incomplete: boolean }> {
  return prisma.$transaction(async (tx) => {
    const [total, owned, existingClaim] = await Promise.all([
      tx.card.count({ where: { isActive: true, cardType } }),
      tx.ownedCard.count({ where: { userId, card: { cardType, isActive: true } } }),
      tx.creditTransaction.findFirst({
        where: { userId, reason: "set_complete", referenceId: cardType },
        select: { id: true },
      }),
    ]);

    if (existingClaim) return { granted: 0, alreadyClaimed: true, incomplete: false };
    if (total === 0 || owned < total) return { granted: 0, alreadyClaimed: false, incomplete: true };

    const granted = total * SET_BONUS_PER_CARD;
    const wallet = await tx.userWallet.upsert({
      where: { userId },
      update: { balance: { increment: granted }, totalEarned: { increment: granted } },
      create: { userId, balance: granted, totalEarned: granted },
      select: { id: true },
    });

    await tx.creditTransaction.create({
      data: {
        userId,
        walletId: wallet.id,
        amount: granted,
        reason: "set_complete",
        referenceId: cardType,
        metadata: { cardType, setSize: total },
      },
    });

    return { granted, alreadyClaimed: false, incomplete: false };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

// ─── Packs ──────────────────────────────────────────────────────────────────

export async function getActivePacks() {
  return prisma.cardPack.findMany({
    where: { isAvailable: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { packCards: true } } },
  });
}

export async function getPackBySlug(slug: string) {
  return prisma.cardPack.findUnique({
    where: { slug },
    include: { packCards: { include: { card: true } } },
  });
}

// ─── Pack opening ────────────────────────────────────────────────────────────

export async function openPack(userId: string, packSlug: string) {
  const pack = await prisma.cardPack.findUnique({
    where: { slug: packSlug },
    include: { packCards: { include: { card: true } } },
  });
  if (!pack) throw new Error("Pack not found");
  if (!pack.isAvailable) throw new Error("Pack not available");

  // Group available cards by rarity
  const byRarity = new Map<Rarity, typeof pack.packCards[0]["card"][]>();
  for (const pc of pack.packCards) {
    const r = pc.card.rarity as Rarity;
    if (!byRarity.has(r)) byRarity.set(r, []);
    byRarity.get(r)!.push(pc.card);
  }

  // All active cards as fallback pool
  const allCards = await prisma.card.findMany({ where: { isActive: true } });
  const allByRarity = new Map<Rarity, typeof allCards>();
  for (const c of allCards) {
    const r = c.rarity as Rarity;
    if (!allByRarity.has(r)) allByRarity.set(r, []);
    allByRarity.get(r)!.push(c);
  }

  const drawn: { cardId: string; isFoil: boolean; rarity: Rarity }[] = [];

  for (let i = 0; i < pack.cardCount; i++) {
    const rarity = rollRarity({
      weightStatic:       pack.weightStatic,
      weightSignal:       pack.weightSignal,
      weightTransmission: pack.weightTransmission,
      weightAnomaly:      pack.weightAnomaly,
      weightOracle:       pack.weightOracle,
      weightLegendary:    pack.weightLegendary,
      weightMythic:       pack.weightMythic,
      weightForbidden:    pack.weightForbidden,
    });
    // Try pack-specific pool, fall back to global pool, then lower rarity
    const packPool = byRarity.get(rarity) ?? [];
    const globalPool = allByRarity.get(rarity) ?? [];
    const pool = packPool.length > 0
      ? packPool
      : globalPool.length > 0
      ? globalPool
      : (allByRarity.get("STATIC") ?? []);

    if (pool.length === 0) continue;

    const card = pool[Math.floor(Math.random() * pool.length)];
    drawn.push({ cardId: card.id, isFoil: rollFoil(rarity), rarity });
  }

  if (drawn.length === 0) throw new Error("No cards available in this pack");

  // Serializable transaction keeps the balance check + deduct atomic —
  // prevents two concurrent pack opens from both passing when balance = cost.
  await prisma.$transaction(async (tx) => {
    const wallet = await tx.userWallet.findUnique({ where: { userId } });
    const balance = wallet?.balance ?? 0;
    if (balance < pack.cost) {
      throw new Error(`Insufficient credits (need ${pack.cost}, have ${balance})`);
    }

    await tx.userWallet.upsert({
      where: { userId },
      update: { balance: { decrement: pack.cost }, totalSpent: { increment: pack.cost } },
      create: { userId, balance: -(pack.cost), totalSpent: pack.cost, totalEarned: 0 },
    });

    await tx.creditTransaction.create({
      data: { userId, amount: -pack.cost, reason: "pack_purchase", metadata: { packSlug } },
    });

    for (const { cardId, isFoil } of drawn) {
      await tx.ownedCard.upsert({
        where: { userId_cardId_isFoil: { userId, cardId, isFoil } },
        update: { quantity: { increment: 1 }, isNew: true },
        create: { userId, cardId, isFoil, obtainedVia: "pack" },
      });
    }

    await tx.packPurchase.create({
      data: { userId, packId: pack.id, cardsDrawn: drawn.map((d) => d.cardId), creditsCost: pack.cost },
    });

    await tx.card.updateMany({
      where: { id: { in: drawn.map((d) => d.cardId) } },
      data: { totalMinted: { increment: 1 } },
    });

    // Award bonus Signal Credits for rare pulls
    const totalBonus = drawn.reduce(
      (sum, d) => sum + RARITY_BONUS_CREDITS[d.rarity] * (d.isFoil ? 2 : 1),
      0
    );
    if (totalBonus > 0) {
      await tx.userWallet.update({
        where: { userId },
        data: { balance: { increment: totalBonus }, totalEarned: { increment: totalBonus } },
      });
      await tx.creditTransaction.create({
        data: { userId, amount: totalBonus, reason: "pack_bonus", metadata: { packSlug } },
      });
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  // Return full card data for the opener UI
  const cards = await prisma.card.findMany({ where: { id: { in: drawn.map((d) => d.cardId) } } });
  return drawn.map(({ cardId, isFoil, rarity }) => ({
    ...cards.find((c) => c.id === cardId)!,
    isFoil,
    isNew: true,
    bonusCredits: RARITY_BONUS_CREDITS[rarity] * (isFoil ? 2 : 1),
    signalPower: cardPoints(rarity, isFoil),
  }));
}

// ─── Daily reward ────────────────────────────────────────────────────────────

const DAILY_CREDITS = 25;
// Loss-aversion retention loop (Dossier Ch. VI): an escalating bonus for
// consecutive-day claims, capped so it never dwarfs the base reward.
const STREAK_BONUS_PER_DAY = 2;
const STREAK_BONUS_CAP = 20;

/**
 * Daily Signal Credits multiplier by subscription tier — a real, merchandised
 * perk of the paid tiers (see subscription-tiers.ts features):
 *   Observer (free) ×1 · Initiate+ ×2 · Oracle ×3.
 * Mirrors isSubscribed()/hasSystemTier() in a single query.
 */
async function dailyCreditMultiplier(userId: string): Promise<number> {
  const u = await prisma.codexUser.findUnique({
    where: { id: userId },
    select: {
      role: true,
      subscriptionStatus: true,
      subscriptionTier: true,
      currentPeriodEnd: true,
      isLifetimeMember: true,
    },
  });
  if (!u) return 1;
  const active =
    u.subscriptionStatus === "active" && !!u.currentPeriodEnd && u.currentPeriodEnd > new Date();
  const isOracle =
    u.role === "admin" ||
    (u.isLifetimeMember && u.subscriptionTier === "system") ||
    (active && u.subscriptionTier === "system");
  if (isOracle) return 3;
  const subscribed = u.isLifetimeMember || active;
  return subscribed ? 2 : 1;
}

export async function claimDailyReward(userId: string): Promise<{
  granted: number;
  nextClaimAt: Date;
  streak: number;
  longestStreak: number;
  streakBonus: number;
}> {
  const multiplier = await dailyCreditMultiplier(userId);
  const now = new Date();

  // Interactive transaction keeps the cooldown check + streak computation +
  // wallet write + credit record atomic — prevents double-payout (and a
  // double-incremented streak) from concurrent claim requests. Serializable
  // isolation ensures concurrent readers can't both pass the check before
  // either commits.
  const result = await prisma.$transaction(async (tx) => {
    const wallet = await tx.userWallet.findUnique({ where: { userId } });
    const msSinceLast = wallet?.lastDailyClaimAt
      ? now.getTime() - wallet.lastDailyClaimAt.getTime()
      : null;

    if (msSinceLast !== null) {
      const hoursLeft = 24 - msSinceLast / 3_600_000;
      if (hoursLeft > 0) {
        throw new Error(`Daily already claimed. Next claim in ${Math.ceil(hoursLeft)}h`);
      }
    }

    // Streak continues inside the 24-48h grace window; a longer gap resets it.
    const streakContinues = msSinceLast !== null && msSinceLast <= 48 * 3_600_000;
    const streak = streakContinues ? (wallet?.dailyStreak ?? 0) + 1 : 1;
    const longestStreak = Math.max(streak, wallet?.longestStreak ?? 0);
    const streakBonus = Math.min((streak - 1) * STREAK_BONUS_PER_DAY, STREAK_BONUS_CAP);
    const granted = DAILY_CREDITS * multiplier + streakBonus;

    const upserted = await tx.userWallet.upsert({
      where: { userId },
      update: {
        balance: { increment: granted },
        totalEarned: { increment: granted },
        lastDailyClaimAt: now,
        dailyStreak: streak,
        longestStreak,
      },
      create: {
        userId,
        balance: granted,
        totalEarned: granted,
        lastDailyClaimAt: now,
        dailyStreak: streak,
        longestStreak,
      },
      select: { id: true },
    });

    await tx.creditTransaction.create({
      data: {
        userId,
        walletId: upserted.id,
        amount: granted,
        reason: "daily_login",
        metadata: { multiplier, streak, streakBonus },
      },
    });

    return { granted, streak, longestStreak, streakBonus };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  return { ...result, nextClaimAt: new Date(now.getTime() + 24 * 3_600_000) };
}

// ─── Passive credit earning ───────────────────────────────────────────────────

const CREDIT_LIMITS = {
  episode_read: { amount: 5, dailyCap: 3 },
  lore_read:    { amount: 8, dailyCap: 2 },
} as const;
type EarnReason = keyof typeof CREDIT_LIMITS;

export async function earnCreditsForActivity(
  userId: string,
  reason: EarnReason,
  metadata?: { contentId?: string },
) {
  const { amount, dailyCap } = CREDIT_LIMITS[reason];
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const contentId = metadata?.contentId;

  // The cap check and the mint must be one Serializable unit, or concurrent
  // requests all read the same pre-cap count and each mint free Signal Credits
  // (the spend currency). Mirrors openPack / claimDailyReward in this file.
  return prisma.$transaction(async (tx) => {
    // Reward reading DISTINCT content, not re-hitting the endpoint. Without
    // this, a user can farm up to `dailyCap` grants from the same page. Only
    // enforceable when the caller supplies a contentId (episode/lore id).
    if (contentId) {
      const already = await tx.creditTransaction.findFirst({
        where: {
          userId,
          reason,
          createdAt: { gte: todayStart },
          metadata: { path: ["contentId"], equals: contentId },
        },
        select: { id: true },
      });
      if (already) return { granted: 0, reason: "already_earned" };
    }

    const todayCount = await tx.creditTransaction.count({
      where: { userId, reason, createdAt: { gte: todayStart } },
    });
    if (todayCount >= dailyCap) return { granted: 0, reason: "daily_cap" };

    await tx.userWallet.upsert({
      where: { userId },
      update: { balance: { increment: amount }, totalEarned: { increment: amount } },
      create: { userId, balance: amount, totalEarned: amount },
    });
    await tx.creditTransaction.create({
      data: { userId, amount, reason, metadata: metadata ?? {} },
    });

    return { granted: amount };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

// ─── Deck Builder ─────────────────────────────────────────────────────────────

const MAX_DECK_SIZE = 20;
const MAX_DECKS_PER_USER = 10;

export async function getUserDecks(userId: string) {
  return prisma.deck.findMany({
    where: { userId },
    include: {
      deckCards: {
        include: { card: { select: { id: true, rarity: true, cardType: true, title: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getDeckById(deckId: string, userId: string) {
  return prisma.deck.findFirst({
    where: { id: deckId, userId },
    include: { deckCards: { include: { card: true } } },
  });
}

export async function createDeck(userId: string, name: string, description?: string) {
  const count = await prisma.deck.count({ where: { userId } });
  if (count >= MAX_DECKS_PER_USER) throw new Error(`Maximum of ${MAX_DECKS_PER_USER} arrays reached`);
  return prisma.deck.create({
    data: { userId, name: name.trim(), description: description?.trim() || null },
    include: { deckCards: { include: { card: true } } },
  });
}

export async function updateDeck(
  deckId: string,
  userId: string,
  data: { name?: string; description?: string | null; cardIds?: string[]; isPublic?: boolean }
) {
  const deck = await prisma.deck.findFirst({ where: { id: deckId, userId } });
  if (!deck) throw new Error("Array not found");

  const updates: Prisma.DeckUpdateInput = {};
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.description !== undefined) updates.description = data.description?.trim() || null;
  if (data.isPublic !== undefined) updates.isPublic = data.isPublic;

  if (data.cardIds !== undefined) {
    const unique = [...new Set(data.cardIds)];
    if (unique.length > MAX_DECK_SIZE) throw new Error(`Max ${MAX_DECK_SIZE} cards per array`);
    if (unique.length > 0) {
      const owned = await prisma.ownedCard.findMany({
        where: { userId, cardId: { in: unique } },
        select: { cardId: true },
      });
      const ownedSet = new Set(owned.map((o) => o.cardId));
      const missing = unique.filter((id) => !ownedSet.has(id));
      if (missing.length > 0) throw new Error("You don't own all specified cards");
    }
    updates.deckCards = {
      deleteMany: {},
      create: unique.map((cardId) => ({ cardId })),
    };
  }

  return prisma.deck.update({
    where: { id: deckId },
    data: updates,
    include: { deckCards: { include: { card: true } } },
  });
}

export async function deleteDeck(deckId: string, userId: string) {
  const deck = await prisma.deck.findFirst({ where: { id: deckId, userId } });
  if (!deck) throw new Error("Array not found");
  await prisma.deck.delete({ where: { id: deckId } });
}

// ─── Onboarding starter card ─────────────────────────────────────────────────

export async function grantStarterCard(userId: string, cardType: string) {
  // Prefer a card of the requested type; fall back to any STATIC card
  const target =
    (await prisma.card.findFirst({
      where: { isActive: true, cardType: cardType as CardType },
      orderBy: [{ rarity: "asc" }, { createdAt: "asc" }],
    })) ??
    (await prisma.card.findFirst({
      where: { isActive: true },
      orderBy: [{ rarity: "asc" }, { createdAt: "asc" }],
    }));

  if (!target) return null;

  await prisma.$transaction([
    prisma.ownedCard.upsert({
      where: { userId_cardId_isFoil: { userId, cardId: target.id, isFoil: false } },
      update: { isNew: true },
      create: { userId, cardId: target.id, isFoil: false, obtainedVia: "starter" },
    }),
    prisma.card.update({
      where: { id: target.id },
      data: { totalMinted: { increment: 1 } },
    }),
  ]);

  return target;
}
