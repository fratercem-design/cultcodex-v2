import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { SPECIAL_EDITIONS } from "../special-editions";

describe("SPECIAL_EDITIONS", () => {
  it("has art on disk for every card", () => {
    for (const s of SPECIAL_EDITIONS) {
      const file = path.join(process.cwd(), "public", "cards", "art", `${s.slug}.webp`);
      expect(fs.existsSync(file), file).toBe(true);
    }
  });

  it("uses unique slugs", () => {
    expect(new Set(SPECIAL_EDITIONS.map((s) => s.slug)).size).toBe(SPECIAL_EDITIONS.length);
  });
});
