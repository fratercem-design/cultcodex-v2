import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  CARD_BACKS, isSpecialEdition, SPECIAL_EDITIONS, SPECIAL_EDITION_DIVINATION, SPECIAL_EDITION_DIVINATION_STRENGTH,
  specialEditionAnimationUrl, specialEditionFoilUrl,
} from "../special-editions";

const onDisk = (url: string) => fs.existsSync(path.join(process.cwd(), "public", url));

describe("SPECIAL_EDITIONS", () => {
  it("has art on disk for every card", () => {
    for (const s of SPECIAL_EDITIONS) {
      const file = path.join(process.cwd(), "public", "cards", "art", `${s.slug}.webp`);
      expect(fs.existsSync(file), file).toBe(true);
    }
  });

  it("has a foil variant and an animation for every card", () => {
    for (const s of SPECIAL_EDITIONS) {
      expect(onDisk(specialEditionFoilUrl(s.slug)), s.slug).toBe(true);
      expect(onDisk(specialEditionAnimationUrl(s.slug)), s.slug).toBe(true);
    }
  });

  it("has both card backs on disk", () => {
    for (const url of Object.values(CARD_BACKS)) expect(onDisk(url), url).toBe(true);
  });

  it("recognises special-edition slugs only", () => {
    expect(isSpecialEdition("se-10-codex-seal")).toBe(true);
    expect(isSpecialEdition("cop-00-the-fool")).toBe(false);
  });

  it("has a complete divinatory meaning for every card, and nothing extra", () => {
    expect(Object.keys(SPECIAL_EDITION_DIVINATION).sort()).toEqual(SPECIAL_EDITIONS.map((s) => s.slug).sort());
    for (const [slug, d] of Object.entries(SPECIAL_EDITION_DIVINATION)) {
      for (const field of ["upright", "reversed", "element", "planet", "archetype", "shadowAspect", "advice", "oraclePrompt"] as const) {
        expect(d[field].trim(), `${slug}.${field}`).not.toBe("");
      }
      expect(d.keywords.length, slug).toBeGreaterThan(0);
    }
  });

  it("keeps special editions rare in readings", () => {
    expect(SPECIAL_EDITION_DIVINATION_STRENGTH).toBeGreaterThanOrEqual(1);
    expect(SPECIAL_EDITION_DIVINATION_STRENGTH).toBeLessThanOrEqual(10);
  });

  it("uses unique slugs", () => {
    expect(new Set(SPECIAL_EDITIONS.map((s) => s.slug)).size).toBe(SPECIAL_EDITIONS.length);
  });
});
