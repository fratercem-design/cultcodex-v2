import { describe, expect, it } from "vitest";
import { feudSlug, mentionNames, orderFeudItems, parseFeudSlug, type FeudItem } from "../feuds";

describe("feud slugs", () => {
  it("gives one URL per pair in either order", () => {
    expect(feudSlug("psyche", "beeta")).toBe("beeta--vs--psyche");
    expect(feudSlug("beeta", "psyche")).toBe("beeta--vs--psyche");
    expect(parseFeudSlug("beeta--vs--psyche")).toEqual(["beeta", "psyche"]);
    for (const bad of ["beeta", "beeta--vs--", "beeta--vs--beeta", "a--vs--b--vs--c"]) expect(parseFeudSlug(bad), bad).toBeNull();
  });
});

describe("mentionNames", () => {
  it("uses full names, alt names and distinctive first names only", () => {
    const names = mentionNames({ displayName: "Alexandra Mayers", altNames: ["Alex Myers", "Alexandra (AM)", "[MERGED] AM"] });
    expect(names).toContain("Alexandra Mayers");
    expect(names).toContain("Alexandra");
    expect(names).toContain("Alex Myers");
    expect(names).not.toContain("Alex");
    expect(names).not.toContain("AM");
    expect(names.some((n) => /merged/i.test(n))).toBe(false);
  });
});

describe("orderFeudItems", () => {
  const quote = (id: string, at: string | null): FeudItem => ({
    kind: "quote", id, at: at ? new Date(at) : null, text: "x", speaker: { slug: "a", displayName: "A" },
    timestampSeconds: 1, episode: { slug: "e", title: "E" },
  });
  it("puts dated items in date order and undated ones last, stably", () => {
    const out = orderFeudItems([quote("u1", null), quote("b", "2026-02-01"), quote("a", "2025-12-01"), quote("u2", null)]);
    expect(out.map((i) => i.id)).toEqual(["a", "b", "u1", "u2"]);
  });
});
