import { describe, expect, it } from "vitest";
import {
  FREE_ORACLE_MONTHLY_LIMIT,
  INITIATE_ORACLE_MONTHLY_LIMIT,
  getTier,
} from "./subscription-tiers";

describe("subscription tier contract", () => {
  it("keeps the enforced Oracle allowances in the public tier definition", () => {
    const initiate = getTier("access");
    const oracle = getTier("system");

    expect(FREE_ORACLE_MONTHLY_LIMIT).toBe(3);
    expect(INITIATE_ORACLE_MONTHLY_LIMIT).toBe(100);
    expect(initiate.features.join(" ")).toContain("100 Oracle questions a month");
    expect(initiate.features.join(" ").toLowerCase()).not.toContain("unlimited oracle");
    expect(oracle.features.join(" ").toLowerCase()).toContain("no monthly cap on oracle questions");
    // The route still rate-limits per minute, so "unlimited" would overstate it.
    expect(oracle.features.join(" ").toLowerCase()).not.toContain("unlimited oracle");
  });
});
