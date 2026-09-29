import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "fs";
import { activeOmens, isFullMoon, moonPhase } from "@/lib/easter-eggs";

describe("moon phase", () => {
  it("knows real full and new moons", () => {
    expect(isFullMoon(new Date("2024-04-23T23:49:00Z"))).toBe(true);
    expect(isFullMoon(new Date("2025-10-07T03:47:00Z"))).toBe(true);
    expect(isFullMoon(new Date("2024-04-08T18:21:00Z"))).toBe(false); // eclipse new moon
    const p = moonPhase(new Date("2024-04-08T18:21:00Z"));
    expect(Math.min(p, 1 - p)).toBeLessThan(0.02); // phase wraps at new moon
  });
});

describe("omens", () => {
  it("fires 3:33 only during that minute", () => {
    expect(activeOmens(new Date(2026, 1, 3, 3, 33))).toContain("3:33");
    expect(activeOmens(new Date(2026, 1, 3, 3, 34))).not.toContain("3:33");
  });
  it("knows Halloween and Friday the 13th", () => {
    expect(activeOmens(new Date(2026, 9, 31, 12))).toContain("halloween");
    expect(activeOmens(new Date(2026, 1, 13, 12))).toContain("friday-13"); // Fri 13 Feb 2026
    expect(activeOmens(new Date(2026, 2, 14, 12))).not.toContain("friday-13");
  });
});

describe("the Stairwell", () => {
  const page = (p: string) => readFileSync(`src/app/stairwell/${p}page.tsx`, "utf8");

  it("chains each answer to the next landing", () => {
    for (const p of ["", "echo/", "echo/lantern/", "echo/lantern/moth/", "echo/lantern/psyche/"]) {
      expect(existsSync(`src/app/stairwell/${p}page.tsx`), p).toBe(true);
    }
  });

  it("has an acrostic that spells the first answer", () => {
    const lines = page("").match(/<p className="text-text-primary\/80 italic[^>]*>([\s\S]*?)<\/p>/)![1]
      .split("<br />").map((l) => l.trim()).filter(Boolean);
    expect(lines.map((l) => l[0]).join("").toLowerCase()).toBe("echo");
  });

  it("has a cipher that decodes to the second answer with the seal's seven knocks", () => {
    const cipher = page("echo/").match(/>([A-Z]{5,})</)![1];
    const plain = [...cipher].map((c) => String.fromCharCode(((c.charCodeAt(0) - 65 - 7 + 26) % 26) + 65)).join("");
    expect(plain.toLowerCase()).toBe("lantern");
  });
});
