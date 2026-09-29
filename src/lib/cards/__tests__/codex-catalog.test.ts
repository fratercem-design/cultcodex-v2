import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: {} }));

import { SEASON_1 } from "@/lib/cards/codex/season-1";
import { SEASONS, catalogEntry, clueFor, codexStats, currentSeason } from "@/lib/cards/codex/catalog";
import { TRIALS } from "@/lib/cards/codex/trials";
import { SECRET_CODES } from "@/lib/cards/codex/codex";
import { RARITY_ORDER, rollRarityAtLeast } from "@/lib/cards/rarity";

describe("Season I catalog", () => {
  const cards = SEASON_1.cards;
  const by = (m: string) => cards.filter((c) => c.obtain === m);

  it("has 50 cards with unique, season-prefixed slugs", () => {
    expect(cards).toHaveLength(50);
    expect(new Set(cards.map((c) => c.slug)).size).toBe(50);
    for (const c of cards) expect(c.slug.startsWith("s1-")).toBe(true);
  });

  it("splits 30 pack / 16 Trial / 3 secret / 1 Initiation", () => {
    expect(by("pack")).toHaveLength(30);
    expect(by("quest")).toHaveLength(16);
    expect(by("secret")).toHaveLength(3);
    expect(by("signup")).toHaveLength(1);
  });

  it("gives every non-pack card a written clue", () => {
    for (const c of cards.filter((c) => c.obtain !== "pack")) expect(c.clue, c.slug).toBeTruthy();
    for (const c of cards) expect(clueFor(c).length).toBeGreaterThan(0);
  });

  it("maps each Trial to exactly one card", () => {
    const used = by("quest").map((c) => c.questId);
    expect(new Set(used).size).toBe(used.length);
    for (const id of used) expect(TRIALS.some((t) => t.id === id), id).toBe(true);
    for (const t of TRIALS) expect(used).toContain(t.id);
  });

  it("points every secret code at a secret card", () => {
    const secretSlugs = by("secret").map((c) => c.slug).sort();
    expect(Object.values(SECRET_CODES).sort()).toEqual(secretSlugs);
  });

  it("has pack cards at every rarity a guaranteed slot can land on", () => {
    for (const pack of SEASON_1.packs) {
      for (const [rarity, weight] of Object.entries({
        STATIC: pack.weights.weightStatic, SIGNAL: pack.weights.weightSignal, TRANSMISSION: pack.weights.weightTransmission,
        ANOMALY: pack.weights.weightAnomaly, ORACLE: pack.weights.weightOracle, LEGENDARY: pack.weights.weightLegendary,
        MYTHIC: pack.weights.weightMythic, FORBIDDEN: pack.weights.weightForbidden,
      })) {
        if (weight > 0) expect(by("pack").some((c) => c.rarity === rarity), `${pack.slug} ${rarity}`).toBe(true);
      }
    }
  });

  it("derives stable stats in 1–99 that rise with rarity", () => {
    for (const c of cards) {
      const stats = codexStats(c);
      expect(stats).toEqual(codexStats(c));
      for (const s of stats) expect(s).toBeGreaterThanOrEqual(1), expect(s).toBeLessThanOrEqual(99);
    }
    const avg = (r: string) => {
      const pool = cards.filter((c) => c.rarity === r).map((c) => codexStats(c).reduce((a, b) => a + b, 0));
      return pool.reduce((a, b) => a + b, 0) / pool.length;
    };
    expect(avg("LEGENDARY")).toBeGreaterThan(avg("STATIC"));
  });

  it("looks cards up by slug with their collector number", () => {
    expect(catalogEntry("s1-dead-air")?.no).toBe(1);
    expect(catalogEntry("s1-seventh-knock")?.no).toBe(50);
    expect(catalogEntry("nope")).toBeUndefined();
  });

  it("picks the latest started season", () => {
    expect(currentSeason(new Date("2026-10-01T00:00:00Z")).number).toBe(1);
    expect(currentSeason(new Date("2020-01-01T00:00:00Z"))).toBe(SEASONS[0]);
  });
});

describe("rollRarityAtLeast", () => {
  const w = { weightStatic: 50, weightSignal: 30, weightTransmission: 14, weightAnomaly: 5, weightOracle: 1, weightLegendary: 0.5, weightMythic: 0, weightForbidden: 0 };

  it("never rolls below the minimum", () => {
    for (let i = 0; i < 500; i++) {
      expect(RARITY_ORDER[rollRarityAtLeast(w, "ANOMALY")]).toBeGreaterThanOrEqual(RARITY_ORDER.ANOMALY);
    }
  });

  it("keeps relative weights and skips zero-weight tiers", () => {
    expect(rollRarityAtLeast(w, "ANOMALY", () => 0)).toBe("ANOMALY");
    expect(rollRarityAtLeast(w, "ANOMALY", () => 0.999)).toBe("LEGENDARY");
  });

  it("falls back to the minimum when nothing above it has weight", () => {
    expect(rollRarityAtLeast(w, "MYTHIC")).toBe("MYTHIC");
  });
});
