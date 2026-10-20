import { describe, expect, it, vi } from "vitest";

// drawReading with charge:false touches spread, card and reading only.
const db = vi.hoisted(() => ({
  prisma: {
    spread: { findUnique: vi.fn(async () => null) },
    card: { findMany: vi.fn() },
    reading: {
      create: vi.fn(async ({ data }: { data: { cards: { create: { cardId: string; position: number }[] } } }) => ({
        id: "r1", seed: "s", question: null, spread: null,
        cards: data.cards.create.map((c, i) => ({ id: `rc${i}`, ...c })),
      })),
    },
  },
}));
vi.mock("@/lib/db", () => ({ prisma: db.prisma }));
vi.mock("../signal", () => ({ dailyGrant: vi.fn(), spendSignalTx: vi.fn() }));

import { drawReading } from "../reading";

const FOOL = {
  id: "c-fool", slug: "cop-maj-00", title: "The Fool", subtitle: null, cardType: "ORACLE", rarity: "SIGNAL",
  flavourText: null, statA: 1, statB: 2, statC: 3, abilities: [], artUrl: "/cards/art/cop-maj-00.webp",
  season: 0, collectorNo: null, maxSupply: null, obtainMethod: "pack",
  divinationStrength: 1, meaningVersion: 1, uprightMeaning: "Begin.", reversedMeaning: "Wait.",
  advice: null, oraclePrompt: null, divinationKeywords: [], element: null, archetype: null,
};

describe("drawReading", () => {
  it("returns each drawn card with its face", async () => {
    db.prisma.card.findMany.mockResolvedValueOnce([FOOL]);
    const { reading } = await drawReading({ userId: "u1", charge: false, seed: "fixed" });
    expect(reading.cards).toHaveLength(1);
    expect(reading.cards[0].face).toMatchObject({
      slug: "cop-maj-00", title: "The Fool", artUrl: "/cards/art/cop-maj-00.webp", rarity: "SIGNAL",
    });
  });
});
