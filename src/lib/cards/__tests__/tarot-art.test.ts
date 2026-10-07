import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { ALL_TAROT_CARDS } from "../tarot-data";
import { tarotArtUrl } from "../tarot-art";

describe("tarotArtUrl", () => {
  it("points every listed card at a file that exists", () => {
    for (const card of ALL_TAROT_CARDS) {
      const url = tarotArtUrl(card.slug);
      if (url) expect(fs.existsSync(path.join(process.cwd(), "public", url)), url).toBe(true);
    }
  });

  it("returns null for cards without art", () => {
    expect(tarotArtUrl("cop-not-a-card")).toBeNull();
  });
});
