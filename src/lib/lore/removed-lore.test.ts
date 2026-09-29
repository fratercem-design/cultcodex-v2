import { describe, expect, it } from "vitest";
import { NOT_REMOVED_LORE, REMOVED_LORE_SLUGS, isRemovedLore } from "./removed-lore";

describe("removed lore", () => {
  it("blocks the removed entries and nothing else", () => {
    expect(isRemovedLore("the-sperm-donor-dispute")).toBe(true);
    expect(isRemovedLore("the-five-drinks-dinner")).toBe(true);
    expect(isRemovedLore("the-neon-priestess")).toBe(false);
  });

  it("filters exactly the removed slugs", () => {
    expect(NOT_REMOVED_LORE.slug.notIn).toEqual([...REMOVED_LORE_SLUGS]);
    expect(new Set(REMOVED_LORE_SLUGS).size).toBe(REMOVED_LORE_SLUGS.length);
  });
});
