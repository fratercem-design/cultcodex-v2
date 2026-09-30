import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  CARD_BACKS, SPECIAL_EDITIONS, specialEditionAnimationUrl, specialEditionFoilUrl,
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

  it("uses unique slugs", () => {
    expect(new Set(SPECIAL_EDITIONS.map((s) => s.slug)).size).toBe(SPECIAL_EDITIONS.length);
  });
});
