/**
 * Codex server logic: catalog sync, Trial checks, secret sigils and the free
 * Initiation Pack. Every grant path is idempotent: Trial and secret cards
 * insert with `skipDuplicates` on OwnedCard's (userId, cardId, isFoil) key, and
 * the Initiation Pack claims through an atomic null→now flip on the wallet.
 */
import { prisma } from "@/lib/db";
import type { Prisma, Rarity } from "@/generated/prisma/client";
import { hasSystemTier, isSubscribed } from "@/lib/subscription";
import { rollFoil, rollRarity, rollRarityAtLeast } from "@/lib/cards/rarity";
import { SEASONS, codexStats, currentSeason } from "./catalog";
import { TRIALS, type TrialCounter, type TrialDef } from "./trials";

// ─── Catalog sync ────────────────────────────────────────────────────────────

let catalogReady: Promise<void> | null = null;

/**
 * Upserts every seasonal card and pack from the code catalog. Runs once per
 * server process (memoised); a failure clears the memo so the next request
 * retries. Adding a season is a code change plus deploy — no seed script.
 */
export function ensureCodexCatalog(): Promise<void> {
  catalogReady ??= syncCatalog().catch((err) => {
    catalogReady = null;
    throw err;
  });
  return catalogReady;
}

async function syncCatalog() {
  for (const season of SEASONS) {
    const existing = await prisma.card.findMany({
      where: { season: season.number },
      select: { id: true, slug: true },
    });
    const idBySlug = new Map(existing.map((c) => [c.slug, c.id]));

    for (const [i, def] of season.cards.entries()) {
      const [statA, statB, statC] = codexStats(def);
      const data = {
        cardType: def.cardType,
        rarity: def.rarity,
        title: def.title,
        subtitle: def.subtitle,
        flavourText: def.flavour,
        abilities: def.abilities,
        statA, statB, statC,
        maxSupply: def.maxSupply ?? null,
        season: season.number,
        collectorNo: i + 1,
        obtainMethod: def.obtain,
        sourceType: "codex",
        isActive: true,
      };
      const card = await prisma.card.upsert({
        where: { slug: def.slug },
        update: data,
        create: { slug: def.slug, ...data },
        select: { id: true },
      });
      idBySlug.set(def.slug, card.id);
    }

    for (const pack of season.packs) {
      const data = {
        name: pack.name,
        description: pack.description,
        cost: pack.cost,
        cardCount: pack.cardCount,
        sortOrder: pack.sortOrder,
        artTheme: pack.artTheme,
        guaranteeRarity: pack.guaranteeRarity,
        season: season.number,
        isAvailable: true,
        ...pack.weights,
      };
      const row = await prisma.cardPack.upsert({
        where: { slug: pack.slug },
        update: data,
        create: { slug: pack.slug, ...data },
        select: { id: true },
      });
      const poolIds = season.cards
        .filter((c) => c.obtain === "pack")
        .map((c) => idBySlug.get(c.slug))
        .filter((id): id is string => !!id);
      await prisma.packCard.createMany({
        data: poolIds.map((cardId) => ({ packId: row.id, cardId })),
        skipDuplicates: true,
      });
    }
  }
}

// ─── Grants ─────────────────────────────────────────────────────────────────

type Tx = Prisma.TransactionClient;

/** Grants one copy only if the user has none (Trial/secret cards). */
async function grantOnce(tx: Tx, userId: string, cardId: string, via: string): Promise<boolean> {
  const { count } = await tx.ownedCard.createMany({
    data: [{ userId, cardId, isFoil: false, obtainedVia: via, source: via }],
    skipDuplicates: true,
  });
  if (count > 0) {
    await tx.card.update({ where: { id: cardId }, data: { totalMinted: { increment: 1 } } });
  }
  return count > 0;
}

/** Adds a copy (pack-style: duplicates stack). */
async function grantCopy(tx: Tx, userId: string, cardId: string, isFoil: boolean, via: string) {
  await tx.ownedCard.upsert({
    where: { userId_cardId_isFoil: { userId, cardId, isFoil } },
    update: { quantity: { increment: 1 }, isNew: true },
    create: { userId, cardId, isFoil, obtainedVia: via, source: via },
  });
  await tx.card.update({ where: { id: cardId }, data: { totalMinted: { increment: 1 } } });
}

// ─── Trials ─────────────────────────────────────────────────────────────────

const COUNTERS: Record<TrialCounter, (userId: string) => Promise<number>> = {
  favorites:     (userId) => prisma.favorite.count({ where: { userId } }),
  comments:      (userId) => prisma.codexComment.count({ where: { userId } }),
  savedQuotes:   (userId) => prisma.savedQuote.count({ where: { userId } }),
  reactions:     (userId) => prisma.episodeReaction.count({ where: { userId } }),
  longestStreak: async (userId) =>
    (await prisma.userWallet.findUnique({ where: { userId }, select: { longestStreak: true } }))?.longestStreak ?? 0,
  readings:      (userId) => prisma.reading.count({ where: { userId } }),
  annotations:   (userId) => prisma.annotation.count({ where: { userId } }),
  salonPosts:    (userId) => prisma.salonPost.count({ where: { userId } }),
  savedTopics:   (userId) => prisma.savedTopic.count({ where: { userId } }),
  savedSearches: (userId) => prisma.savedSearch.count({ where: { userId } }),
  packsOpened:   (userId) => prisma.packPurchase.count({ where: { userId } }),
  seasonCards:   (userId) =>
    prisma.ownedCard
      .findMany({
        where: { userId, card: { season: currentSeason().number } },
        select: { cardId: true },
        distinct: ["cardId"],
      })
      .then((rows) => rows.length),
  subscriber:    async (userId) => ((await isSubscribed(userId)) ? 1 : 0),
  oracleTier:    async (userId) => ((await hasSystemTier(userId)) ? 1 : 0),
};

export interface TrialProgress {
  trialId: string;
  current: number;
  target: number;
}

/** Evaluates only the counters the given Trials need, each at most once. */
export async function measureTrials(userId: string, trials: TrialDef[]): Promise<Map<string, TrialProgress>> {
  const needed = [...new Set(trials.map((t) => t.counter))];
  const values = await Promise.all(needed.map((c) => COUNTERS[c](userId).catch(() => 0)));
  const byCounter = new Map(needed.map((c, i) => [c, values[i]]));
  return new Map(
    trials.map((t) => [t.id, { trialId: t.id, current: Math.min(byCounter.get(t.counter) ?? 0, t.target), target: t.target }]),
  );
}

export interface GrantedCard {
  id: string;
  slug: string;
  title: string;
  rarity: Rarity;
  via: string;
}

/**
 * Checks every Trial whose card the user doesn't own yet and grants the ones
 * now complete. Returns newly granted cards (for the unlock toast) and
 * progress on the rest (for the Codex page).
 */
export async function checkTrials(userId: string): Promise<{ granted: GrantedCard[]; progress: TrialProgress[] }> {
  await ensureCodexCatalog();
  const questCards = await prisma.card.findMany({
    where: { obtainMethod: "quest", isActive: true, season: { gt: 0 } },
    select: { id: true, slug: true, title: true, rarity: true, ownedCards: { where: { userId }, select: { id: true }, take: 1 } },
  });
  const trialBySlug = new Map<string, TrialDef>();
  for (const season of SEASONS) {
    for (const def of season.cards) {
      const trial = def.questId ? TRIALS.find((t) => t.id === def.questId) : undefined;
      if (trial) trialBySlug.set(def.slug, trial);
    }
  }

  const open = questCards.filter((c) => c.ownedCards.length === 0 && trialBySlug.has(c.slug));
  if (open.length === 0) return { granted: [], progress: [] };

  const progress = await measureTrials(userId, open.map((c) => trialBySlug.get(c.slug)!));
  const complete = open.filter((c) => {
    const p = progress.get(trialBySlug.get(c.slug)!.id);
    return !!p && p.current >= p.target;
  });

  const granted: GrantedCard[] = [];
  for (const card of complete) {
    const trialId = trialBySlug.get(card.slug)!.id;
    const isNew = await prisma.$transaction((tx) => grantOnce(tx, userId, card.id, `trial:${trialId}`));
    if (isNew) granted.push({ id: card.id, slug: card.slug, title: card.title, rarity: card.rarity, via: "trial" });
  }

  const grantedIds = new Set(complete.map((c) => c.id));
  return {
    granted,
    progress: open.filter((c) => !grantedIds.has(c.id)).map((c) => progress.get(trialBySlug.get(c.slug)!.id)!),
  };
}

// ─── Secrets ────────────────────────────────────────────────────────────────

/**
 * Hidden sigil codes → card slug. The codes also live in the components that
 * render each sigil; this map is what makes them worth anything.
 */
export const SECRET_CODES: Record<string, string> = {
  "lost-page-404": "s1-lost-page",
  "footnote-ghost": "s1-footnote-ghost",
  "seventh-knock": "s1-seventh-knock",
};

export async function claimSecret(userId: string, code: string): Promise<GrantedCard | null> {
  const slug = SECRET_CODES[code];
  if (!slug) return null;
  await ensureCodexCatalog();
  const card = await prisma.card.findUnique({ where: { slug }, select: { id: true, slug: true, title: true, rarity: true } });
  if (!card) return null;
  const isNew = await prisma.$transaction((tx) => grantOnce(tx, userId, card.id, `secret:${code}`));
  return isNew ? { ...card, via: "secret" } : null;
}

// ─── Initiation Pack ────────────────────────────────────────────────────────

export const INITIATION_BONUS_CREDITS = 100;

export async function hasClaimedInitiation(userId: string): Promise<boolean> {
  const wallet = await prisma.userWallet.findUnique({ where: { userId }, select: { initiationClaimedAt: true } });
  return !!wallet?.initiationClaimedAt;
}

/**
 * Five cards, once per account: the season's signup-only card (always foil),
 * one guaranteed Anomaly-or-better, three rolled at booster odds, plus enough
 * credits for a first booster. Throws "already claimed" on a second attempt.
 */
export async function claimInitiationPack(userId: string) {
  await ensureCodexCatalog();
  const season = currentSeason();
  const booster = season.packs[0];

  const pool = await prisma.card.findMany({
    where: { season: season.number, isActive: true, obtainMethod: { in: ["pack", "signup"] } },
  });
  const signupCards = pool.filter((c) => c.obtainMethod === "signup");
  const byRarity = new Map<Rarity, typeof pool>();
  for (const c of pool.filter((c) => c.obtainMethod === "pack")) {
    byRarity.set(c.rarity, [...(byRarity.get(c.rarity) ?? []), c]);
  }
  const pick = (rarity: Rarity) => {
    const list = byRarity.get(rarity) ?? byRarity.get("STATIC") ?? [];
    return list[Math.floor(Math.random() * list.length)];
  };

  const drawn: { card: (typeof pool)[number]; isFoil: boolean }[] = [];
  for (let i = 0; i < 3; i++) {
    const r = rollRarity(booster.weights);
    const card = pick(r);
    if (card) drawn.push({ card, isFoil: rollFoil(r) });
  }
  const rare = pick(rollRarityAtLeast(booster.weights, "ANOMALY"));
  if (rare) drawn.push({ card: rare, isFoil: rollFoil(rare.rarity) });
  for (const card of signupCards) drawn.push({ card, isFoil: true });

  await prisma.$transaction(async (tx) => {
    const wallet = await tx.userWallet.upsert({
      where: { userId },
      update: {},
      create: { userId },
      select: { id: true },
    });
    // Atomic claim: a concurrent second request blocks on the row lock, then
    // re-checks the null filter and updates nothing.
    const { count } = await tx.userWallet.updateMany({
      where: { userId, initiationClaimedAt: null },
      data: {
        initiationClaimedAt: new Date(),
        balance: { increment: INITIATION_BONUS_CREDITS },
        totalEarned: { increment: INITIATION_BONUS_CREDITS },
      },
    });
    if (count === 0) throw new Error("Initiation Pack already claimed");

    await tx.creditTransaction.create({
      data: { userId, walletId: wallet.id, amount: INITIATION_BONUS_CREDITS, reason: "initiation_bonus", metadata: { season: season.number } },
    });
    for (const { card, isFoil } of drawn) {
      await grantCopy(tx, userId, card.id, isFoil, "initiation");
    }
  });

  return {
    bonusCredits: INITIATION_BONUS_CREDITS,
    cards: drawn.map(({ card, isFoil }) => ({ ...card, isFoil, isNew: true })),
  };
}
