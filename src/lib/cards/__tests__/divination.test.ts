import { describe, expect, it } from "vitest";
import { SEASON_1 } from "@/lib/cards/codex/season-1";
import { CARD_MEANINGS } from "@/lib/cards/codex/meanings";
import { describeDraw, drawOracleCard, oracleDeck, spokenPartOfReading } from "@/lib/cards/codex/divination";
import { parseReading } from "@/components/oracle/divination-reading";

describe("the Oracle's deck", () => {
  it("holds every non-secret Season I card, each with a meaning", () => {
    const deck = oracleDeck();
    const nonSecret = SEASON_1.cards.filter((c) => c.obtain !== "secret");
    expect(deck).toHaveLength(nonSecret.length);
    for (const c of nonSecret) expect(CARD_MEANINGS[c.slug], c.slug).toBeDefined();
  });

  it("never contains a secret card, so a reading can't spoil one", () => {
    const secrets = SEASON_1.cards.filter((c) => c.obtain === "secret").map((c) => c.slug);
    expect(secrets.length).toBeGreaterThan(0);
    expect(oracleDeck().some((e) => secrets.includes(e.def.slug))).toBe(false);
    for (const s of secrets) expect(CARD_MEANINGS[s]).toBeUndefined();
  });

  it("has no meanings for cards that don't exist", () => {
    const slugs = new Set(SEASON_1.cards.map((c) => c.slug));
    for (const slug of Object.keys(CARD_MEANINGS)) expect(slugs.has(slug), slug).toBe(true);
  });
});

describe("drawOracleCard", () => {
  it("uses the random source for both the card and its position", () => {
    const upright = drawOracleCard((n) => (n === 1000 ? 999 : 0));
    expect(upright.def.slug).toBe(oracleDeck()[0].def.slug);
    expect(upright.reversed).toBe(false);
    expect(drawOracleCard(() => 0).reversed).toBe(true);
  });

  it("describes the card with its fixed meanings and position", () => {
    const draw = drawOracleCard(() => 0);
    const text = describeDraw(draw);
    expect(text).toContain(draw.def.title);
    expect(text).toContain("(REVERSED)");
    expect(text).toContain(draw.meaning.reversed);
  });
});

describe("reading helpers", () => {
  const reading = [
    "THE CARD — The Antenna lies upright.",
    "WHAT THE ARCHIVE REMEMBERS — Psyche said it first.",
    "**THE SHADOW** — Don't listen for the wrong station.",
    "THE OMEN — Keep the dial still.",
  ].join("\n\n");

  it("voices only the card and the omen, without their labels", () => {
    expect(spokenPartOfReading(reading)).toBe("The Antenna lies upright. Keep the dial still.");
  });

  it("splits a reading into labelled sections, tolerating stray markdown", () => {
    const parts = parseReading(reading);
    expect(parts.map((p) => p.label)).toEqual(["THE CARD", "WHAT THE ARCHIVE REMEMBERS", "THE SHADOW", "THE OMEN"]);
    expect(parts[2].body).toBe("Don't listen for the wrong station.");
    expect(parseReading("Just prose.")).toEqual([{ label: null, body: "Just prose." }]);
  });
});
