import { describe, expect, it } from "vitest";
import { isIndexablePerson, isRemovedPerson } from "./noise-slugs";

describe("isIndexablePerson", () => {
  it("keeps named hosts, recurring figures, and established guests", () => {
    expect(isIndexablePerson({ slug: "psyche", displayName: "Psyche", personType: "host", appearanceCount: 1 })).toBe(true);
    expect(isIndexablePerson({ slug: "joni-patry", displayName: "Joni Patry", personType: "recurring", appearanceCount: 1 })).toBe(true);
    expect(isIndexablePerson({ slug: "jane-doe", displayName: "Jane Doe", personType: "guest", appearanceCount: 2 })).toBe(true);
  });

  it("drops catch-alls, unnamed labels, mentions, and one-off guest stubs", () => {
    expect(isIndexablePerson({ slug: "unknown", displayName: "Unknown", personType: "guest", appearanceCount: 99 })).toBe(false);
    expect(isIndexablePerson({ slug: "indian-guy", displayName: "Indian Guy", personType: "recurring", appearanceCount: 9 })).toBe(false);
    expect(isIndexablePerson({ slug: "psyche-community-figure", displayName: "Psyche Community Figure", personType: "recurring", appearanceCount: 9 })).toBe(false);
    expect(isIndexablePerson({ slug: "public-figure", displayName: "Public Figure", personType: "mentioned", appearanceCount: 5 })).toBe(false);
    expect(isIndexablePerson({ slug: "minty-20", displayName: "Minty 20", personType: "guest", appearanceCount: 1 })).toBe(false);
  });
});

describe("isRemovedPerson", () => {
  it("blocks removed people everywhere, including search indexing", () => {
    expect(isRemovedPerson("alexandra-mayers")).toBe(true);
    expect(isRemovedPerson("psyche")).toBe(false);
    expect(isIndexablePerson({ slug: "alexandra-mayers", displayName: "Alexandra Mayers", personType: "recurring", appearanceCount: 50 })).toBe(false);
  });
});
