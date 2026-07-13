/**
 * The reading engine — draws a spread from divination-eligible cards, rolls
 * orientation, and SNAPSHOTS each card's meaning into ReadingCard at draw time
 * (so historical readings never change when meanings are revised).
 *
 * Three modes: arcana (tarot only) · archive (CultCodex collectible cards) ·
 * hybrid (both — the flagship). Draws are strength-weighted and reproducible
 * from Reading.seed.
 */
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { dailyGrant, spendSignalTx } from "./signal";

export type ReadingMode = "arcana" | "archive" | "hybrid";

export const REVERSAL_PROBABILITY = 0.32;

// ── Deterministic PRNG so a stored seed reproduces the exact draw ──
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a: number): () => number {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function modeWhere(mode: ReadingMode): Prisma.CardWhereInput {
  if (mode === "arcana") return { sourceType: "tarot" };
  if (mode === "archive") return { OR: [{ sourceType: null }, { sourceType: { not: "tarot" } }] };
  return {}; // hybrid — everything eligible
}

function weightedSampleWithoutReplacement<T>(
  pool: T[], k: number, rng: () => number, weight: (t: T) => number
): T[] {
  const items = [...pool];
  const chosen: T[] = [];
  for (let n = 0; n < k && items.length > 0; n++) {
    const total = items.reduce((s, c) => s + Math.max(1, weight(c)), 0);
    let r = rng() * total;
    let idx = 0;
    for (; idx < items.length - 1; idx++) { r -= Math.max(1, weight(items[idx])); if (r <= 0) break; }
    chosen.push(items[idx]);
    items.splice(idx, 1);
  }
  return chosen;
}

export interface DrawOptions {
  userId: string;
  mode?: ReadingMode;        // default hybrid
  spreadSlug?: string;       // default 'single'
  question?: string;
  seed?: string;             // default derived from userId + time
  ownedOnly?: boolean;       // draw only from cards the user owns
  charge?: boolean;          // default true — spend the spread's Signal cost
}

export async function drawReading(opts: DrawOptions) {
  const mode: ReadingMode = opts.mode ?? "hybrid";
  const spreadSlug = opts.spreadSlug ?? "single";
  const seed = opts.seed ?? `${opts.userId}:${mode}:${spreadSlug}:${Date.now()}`;

  const spread = await prisma.spread.findUnique({
    where: { slug: spreadSlug },
    include: { positions: { orderBy: { index: "asc" } } },
  });
  const count = spread?.cardCount ?? 1;

  const pool = await prisma.card.findMany({
    where: {
      isActive: true,
      divinationEligible: true,
      ...modeWhere(mode),
      ...(opts.ownedOnly ? { ownedCards: { some: { userId: opts.userId } } } : {}),
    },
    select: {
      id: true, title: true, divinationStrength: true, meaningVersion: true,
      uprightMeaning: true, reversedMeaning: true, advice: true, oraclePrompt: true,
      divinationKeywords: true, element: true, archetype: true,
    },
  });
  if (pool.length === 0) throw new Error(`No divination-eligible cards for mode "${mode}"`);

  const rng = mulberry32(hashSeed(seed));
  const drawn = weightedSampleWithoutReplacement(pool, count, rng, (c) => c.divinationStrength);

  const cardsData: Prisma.ReadingCardCreateWithoutReadingInput[] = drawn.map((c, i) => ({
    cardId: c.id,
    position: i,
    positionName: spread?.positions[i]?.name ?? null,
    orientation: rng() < REVERSAL_PROBABILITY ? "reversed" : "upright",
    borrowed: false,
    drawnMeaningVersion: c.meaningVersion,
    titleSnapshot: c.title,
    uprightMeaning: c.uprightMeaning,
    reversedMeaning: c.reversedMeaning,
    advice: c.advice,
    oraclePrompt: c.oraclePrompt,
    keywords: c.divinationKeywords,
    element: c.element,
    archetype: c.archetype,
  }));

  const createReading = (client: Prisma.TransactionClient | typeof prisma) =>
    client.reading.create({
      data: {
        userId: opts.userId,
        spreadId: spread?.id ?? null,
        question: opts.question ?? null,
        seed,
        cards: { create: cardsData },
      },
      include: { cards: { orderBy: { position: "asc" } }, spread: true },
    });

  const cost = spread?.signalCost ?? 1;
  if (opts.charge === false || cost <= 0) {
    const reading = await createReading(prisma);
    return { reading, signalRemaining: null as number | null };
  }

  // Spend Signal + persist the reading atomically — either both or neither.
  const grant = await dailyGrant(opts.userId);
  return prisma.$transaction(
    async (tx) => {
      const signalRemaining = await spendSignalTx(
        tx, opts.userId, cost, grant, "reading_draw",
        { spread: spread?.slug ?? spreadSlug, mode }
      );
      const reading = await createReading(tx);
      return { reading, signalRemaining };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}
