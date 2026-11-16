import { describe, expect, it } from "vitest";
import { PANEL, PANEL_PACK, panelCard, panelStats } from "../panel";
import { composeDivination } from "../card-divination";

describe("The Panel", () => {
  it("has 25 distinct cards for 25 distinct people", () => {
    expect(PANEL).toHaveLength(25);
    expect(new Set(PANEL.map((c) => c.slug)).size).toBe(25);
    expect(new Set(PANEL.map((c) => c.personSlug)).size).toBe(25);
    for (const c of PANEL) expect(c.slug.startsWith("panel-"), c.slug).toBe(true);
  });

  it("fills every field a card and its painting need", () => {
    for (const c of PANEL) {
      for (const v of [c.title, c.subtitle, c.flavourText, c.artPrompt, ...c.abilities]) expect(v.trim(), c.slug).not.toBe("");
    }
  });

  it("only gives the pack odds on rarities the set has, so pulls never fall back to other cards", () => {
    const has = new Set(PANEL.map((c) => c.rarity));
    const odds: Record<string, number> = {
      STATIC: PANEL_PACK.weights.weightStatic, SIGNAL: PANEL_PACK.weights.weightSignal,
      TRANSMISSION: PANEL_PACK.weights.weightTransmission, ANOMALY: PANEL_PACK.weights.weightAnomaly,
      ORACLE: PANEL_PACK.weights.weightOracle, LEGENDARY: PANEL_PACK.weights.weightLegendary,
      MYTHIC: PANEL_PACK.weights.weightMythic, FORBIDDEN: PANEL_PACK.weights.weightForbidden,
    };
    for (const [rarity, w] of Object.entries(odds)) expect(w > 0, rarity).toBe(has.has(rarity as never));
    expect(has.has(PANEL_PACK.guaranteeRarity)).toBe(true);
  });

  it("gives steady stats within each rarity's band", () => {
    for (const c of PANEL) {
      const stats = panelStats(c);
      expect(panelStats(c)).toEqual(stats);
      for (const s of stats) {
        expect(s).toBeGreaterThanOrEqual(46);
        expect(s).toBeLessThan(100);
      }
    }
  });

  it("composes a reading meaning for every card", () => {
    for (const c of PANEL) {
      const d = composeDivination({ ...c, abilities: [...c.abilities] });
      expect(d.upright).toContain(c.flavourText);
      expect(d.strength).toBeGreaterThan(0);
    }
  });

  it("looks cards up by slug", () => {
    expect(panelCard("panel-gotti")?.title).toBe("Gotti");
    expect(panelCard("s1-dead-air")).toBeUndefined();
  });
});
