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
      findMany: vi.fn(),
    },
  },
}));
vi.mock("@/lib/db", () => ({ prisma: db.prisma }));
vi.mock("../signal", () => ({ dailyGrant: vi.fn(), spendSignalTx: vi.fn() }));

import { drawReading, getUserReadings } from "../reading";

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

describe("getUserReadings", () => {
  it("attaches each saved card's face, looking each card up once", async () => {
    db.prisma.reading.findMany.mockResolvedValueOnce([
      { id: "r1", spread: null, cards: [{ id: "a", cardId: "c-fool", position: 0 }, { id: "b", cardId: "c-gone", position: 1 }] },
      { id: "r2", spread: null, cards: [{ id: "c", cardId: "c-fool", position: 0 }] },
    ]);
    db.prisma.card.findMany.mockResolvedValueOnce([FOOL]);
    const readings = await getUserReadings("u1");

    expect(db.prisma.card.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { id: { in: ["c-fool", "c-gone"] } } }),
    );
    expect(readings[0].cards[0].face?.title).toBe("The Fool");
    expect(readings[0].cards[1].face).toBeNull(); // card since deleted: no face, entry still shown
    expect(readings[1].cards[0].face?.artUrl).toBe("/cards/art/cop-maj-00.webp");
  });

  it("skips the card lookup when there are no readings", async () => {
    db.prisma.reading.findMany.mockResolvedValueOnce([]);
    db.prisma.card.findMany.mockClear();
    expect(await getUserReadings("u1")).toEqual([]);
    expect(db.prisma.card.findMany).not.toHaveBeenCalled();
  });
});
