import { beforeEach, describe, expect, it, vi } from "vitest";
import { SEASON_1 } from "@/lib/cards/codex/season-1";

// A small fake of the Prisma surface codex.ts touches. Cards are "stored" as
// catalog rows with id = slug so assertions can name them directly.
const db = vi.hoisted(() => {
  const state = {
    owned: new Set<string>(),
    favorites: 0,
    initiationClaimed: false,
  };
  const card = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(async ({ where }: { where: { slug: string } }) => ({ id: where.slug })),
    update: vi.fn(async () => ({})),
  };
  const zero = () => ({ count: vi.fn(async () => 0) });
  const prisma = {
    card,
    cardPack: { upsert: vi.fn(async ({ where }: { where: { slug: string } }) => ({ id: where.slug })) },
    packCard: { createMany: vi.fn(async () => ({ count: 0 })) },
    ownedCard: {
      createMany: vi.fn(async ({ data }: { data: { cardId: string }[] }) => {
        const id = data[0].cardId;
        if (state.owned.has(id)) return { count: 0 };
        state.owned.add(id);
        return { count: 1 };
      }),
      upsert: vi.fn(async ({ create }: { create: { cardId: string } }) => { state.owned.add(create.cardId); return {}; }),
      findMany: vi.fn(async () => []),
    },
    userWallet: {
      upsert: vi.fn(async () => ({ id: "w1" })),
      findUnique: vi.fn(async () => ({ longestStreak: 0 })),
      updateMany: vi.fn(async () => {
        if (state.initiationClaimed) return { count: 0 };
        state.initiationClaimed = true;
        return { count: 1 };
      }),
    },
    creditTransaction: { create: vi.fn(async () => ({})) },
    favorite: { count: vi.fn(async () => state.favorites) },
    codexComment: zero(), savedQuote: zero(), episodeReaction: zero(), reading: zero(), annotation: zero(),
    salonPost: zero(), savedTopic: zero(), savedSearch: zero(), packPurchase: zero(),
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(prisma)),
  };
  return { prisma, state };
});

vi.mock("@/lib/db", () => ({ prisma: db.prisma }));
vi.mock("@/lib/subscription", () => ({ isSubscribed: async () => false, hasSystemTier: async () => false }));

import { checkTrials, claimInitiationPack, claimSecret } from "@/lib/cards/codex/codex";

const row = (slug: string) => {
  const def = SEASON_1.cards.find((c) => c.slug === slug)!;
  return { id: slug, slug, title: def.title, rarity: def.rarity, obtainMethod: def.obtain, season: 1 };
};

beforeEach(() => {
  db.state.owned.clear();
  db.state.favorites = 0;
  db.state.initiationClaimed = false;
  db.prisma.card.findMany.mockImplementation(async (args: { where?: { obtainMethod?: unknown } }) => {
    const om = args?.where?.obtainMethod;
    if (om === "quest") {
      return SEASON_1.cards.filter((c) => c.obtain === "quest").map((c) => ({
        ...row(c.slug),
        ownedCards: db.state.owned.has(c.slug) ? [{ id: "o" }] : [],
      }));
    }
    if (om && typeof om === "object") return SEASON_1.cards.filter((c) => c.obtain === "pack" || c.obtain === "signup").map((c) => row(c.slug));
    return [];
  });
  db.prisma.card.findUnique.mockImplementation(async ({ where }: { where: { slug: string } }) => row(where.slug));
});

describe("claimSecret", () => {
  it("ignores unknown codes", async () => {
    expect(await claimSecret("u1", "not-a-code")).toBeNull();
  });

  it("grants a secret card once", async () => {
    expect((await claimSecret("u1", "seventh-knock"))?.slug).toBe("s1-seventh-knock");
    expect(await claimSecret("u1", "seventh-knock")).toBeNull();
  });
});

describe("claimInitiationPack", () => {
  it("gives five cards including the signup exclusive as a foil, plus credits", async () => {
    const res = await claimInitiationPack("u1");
    expect(res.cards).toHaveLength(5);
    expect(res.bonusCredits).toBe(100);
    const eye = res.cards.find((c) => c.slug === "s1-initiates-eye");
    expect(eye?.isFoil).toBe(true);
    expect(res.cards.filter((c) => c.obtainMethod !== "pack" && c.obtainMethod !== "signup")).toHaveLength(0);
  });

  it("refuses a second claim", async () => {
    await claimInitiationPack("u1");
    await expect(claimInitiationPack("u1")).rejects.toThrow(/already claimed/);
  });
});

describe("checkTrials", () => {
  it("grants completed Trials retroactively and reports the rest", async () => {
    db.state.favorites = 3;
    const { granted, progress } = await checkTrials("u1");
    expect(granted.map((g) => g.slug)).toEqual(["s1-kept-flame"]);
    expect(progress.find((p) => p.trialId === "favorite-10")).toEqual({ trialId: "favorite-10", current: 3, target: 10 });
  });

  it("does not grant the same Trial card twice", async () => {
    db.state.favorites = 1;
    await checkTrials("u1");
    const again = await checkTrials("u1");
    expect(again.granted).toHaveLength(0);
  });
});
