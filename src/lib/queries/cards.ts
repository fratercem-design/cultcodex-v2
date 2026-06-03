import { prisma } from "@/lib/db";
import type { Rarity, CardType, Prisma } from "@/generated/prisma/client";
import { rollRarity, rollFoil } from "@/lib/cards/rarity";

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

export async function getUserCollectionStats(userId: string) {
  const [owned, wallet, total] = await Promise.all([
    prisma.ownedCard.count({ where: { userId } }),
    prisma.userWallet.findUnique({ where: { userId } }),
    prisma.card.count({ where: { isActive: true } }),
  ]);
  return {
    ownedCount: owned,
    totalCards: total,
    completionPct: total > 0 ? Math.round((owned / total) * 100) : 0,
    signalCredits: wallet?.balance ?? 0,
    lastDailyClaimAt: wallet?.lastDailyClaimAt ?? null,
  };
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

  const wallet = await prisma.userWallet.findUnique({ where: { userId } });
  const balance = wallet?.balance ?? 0;
  if (balance < pack.cost) throw new Error(`Insufficient credits (need ${pack.cost}, have ${balance})`);

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

  const drawn: { cardId: string; isFoil: boolean }[] = [];

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
    drawn.push({ cardId: card.id, isFoil: rollFoil(rarity) });
  }

  if (drawn.length === 0) throw new Error("No cards available in this pack");

  // Transactionally: deduct credits, upsert owned cards, record purchase
  await prisma.$transaction([
    prisma.userWallet.upsert({
      where: { userId },
      update: { balance: { decrement: pack.cost }, totalSpent: { increment: pack.cost } },
      create: { userId, balance: -(pack.cost), totalSpent: pack.cost, totalEarned: 0 },
    }),
    prisma.creditTransaction.create({
      data: { userId, amount: -pack.cost, reason: "pack_purchase", metadata: { packSlug } },
    }),
    ...drawn.map(({ cardId, isFoil }) =>
      prisma.ownedCard.upsert({
        where: { userId_cardId_isFoil: { userId, cardId, isFoil } },
        update: { quantity: { increment: 1 }, isNew: true },
        create: { userId, cardId, isFoil, obtainedVia: "pack" },
      })
    ),
    prisma.packPurchase.create({
      data: { userId, packId: pack.id, cardsDrawn: drawn.map((d) => d.cardId), creditsCost: pack.cost },
    }),
    prisma.card.updateMany({
      where: { id: { in: drawn.map((d) => d.cardId) } },
      data: { totalMinted: { increment: 1 } },
    }),
  ]);

  // Return full card data for the opener UI
  const cards = await prisma.card.findMany({ where: { id: { in: drawn.map((d) => d.cardId) } } });
  return drawn.map(({ cardId, isFoil }) => ({
    ...cards.find((c) => c.id === cardId)!,
    isFoil,
    isNew: true,
  }));
}

// ─── Daily reward ────────────────────────────────────────────────────────────

const DAILY_CREDITS = 25;

export async function claimDailyReward(userId: string): Promise<{ granted: number; nextClaimAt: Date }> {
  const wallet = await prisma.userWallet.findUnique({ where: { userId } });
  const now = new Date();

  if (wallet?.lastDailyClaimAt) {
    const msSinceLast = now.getTime() - wallet.lastDailyClaimAt.getTime();
    const hoursLeft = 24 - msSinceLast / 3_600_000;
    if (hoursLeft > 0) {
      const nextClaim = new Date(wallet.lastDailyClaimAt.getTime() + 24 * 3_600_000);
      throw new Error(`Daily already claimed. Next claim in ${Math.ceil(hoursLeft)}h`);
    }
  }

  await prisma.$transaction([
    prisma.userWallet.upsert({
      where: { userId },
      update: {
        balance: { increment: DAILY_CREDITS },
        totalEarned: { increment: DAILY_CREDITS },
        lastDailyClaimAt: now,
      },
      create: {
        userId,
        balance: DAILY_CREDITS,
        totalEarned: DAILY_CREDITS,
        lastDailyClaimAt: now,
      },
    }),
    prisma.creditTransaction.create({
      data: { userId, amount: DAILY_CREDITS, reason: "daily_login" },
    }),
  ]);

  return { granted: DAILY_CREDITS, nextClaimAt: new Date(now.getTime() + 24 * 3_600_000) };
}

// ─── Passive credit earning ───────────────────────────────────────────────────

const CREDIT_LIMITS = {
  episode_read: { amount: 5, dailyCap: 3 },
  lore_read:    { amount: 8, dailyCap: 2 },
} as const;
type EarnReason = keyof typeof CREDIT_LIMITS;

export async function earnCreditsForActivity(userId: string, reason: EarnReason, metadata?: object) {
  const { amount, dailyCap } = CREDIT_LIMITS[reason];
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const todayCount = await prisma.creditTransaction.count({
    where: { userId, reason, createdAt: { gte: todayStart } },
  });
  if (todayCount >= dailyCap) return { granted: 0, reason: "daily_cap" };

  await prisma.$transaction([
    prisma.userWallet.upsert({
      where: { userId },
      update: { balance: { increment: amount }, totalEarned: { increment: amount } },
      create: { userId, balance: amount, totalEarned: amount },
    }),
    prisma.creditTransaction.create({
      data: { userId, amount, reason, metadata: metadata ?? {} },
    }),
  ]);

  return { granted: amount };
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
