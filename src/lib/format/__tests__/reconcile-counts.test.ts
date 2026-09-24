import { describe, it, expect } from "vitest";
import { reconcileAppearanceCount } from "../reconcile-counts";

describe("reconcileAppearanceCount", () => {
  it("replaces a stale count with the live one", () => {
    expect(
      reconcileAppearanceCount("With 174 documented appearances, they serve as guide.", 1419),
    ).toBe("With 1,419 documented appearances, they serve as guide.");
  });
  it("leaves unrelated numbers alone", () => {
    expect(reconcileAppearanceCount("Pulled 3 cards in 2025.", 1419)).toBe("Pulled 3 cards in 2025.");
  });
  it("keeps grammar for a single appearance", () => {
    expect(reconcileAppearanceCount("Across 4 recorded appearances.", 1)).toBe("Across 1 recorded appearance.");
  });
  it("is a no-op without a live count", () => {
    expect(reconcileAppearanceCount("With 174 documented appearances.", 0)).toBe("With 174 documented appearances.");
  });
});
