import { describe, it, expect } from "vitest";
import {
  FRONT_DOOR_BLOCKED_TERMS,
  frontDoorTextExclusions,
  isFrontDoorSafe,
} from "@/lib/content-hygiene";

// The homepage rotates a quote drawn from the whole archive. On 2026-09-12 it
// surfaced the EP.316 "free freak offs" line as the first sentence a stranger
// read. The filter is deliberately narrow: it gates the front door only, and
// the quote stays readable on the episode page.

describe("front-door quote filter", () => {
  it("rejects the line that triggered this filter", () => {
    expect(
      isFrontDoorSafe("Have you been to one of my free freak offs? I have freakoffs backstage")
    ).toBe(false);
  });

  it("is case insensitive", () => {
    expect(isFrontDoorSafe("FREAK OFF")).toBe(false);
  });

  it("keeps ordinary archive material", () => {
    expect(isFrontDoorSafe("The tarot is a mirror, not a map.")).toBe(true);
    expect(isFrontDoorSafe("We talked about Jung for three hours straight.")).toBe(true);
  });

  it("treats empty or missing text as unsafe rather than showing it", () => {
    expect(isFrontDoorSafe("")).toBe(false);
    expect(isFrontDoorSafe(null)).toBe(false);
  });

  it("builds one insensitive NOT clause per term", () => {
    const clauses = frontDoorTextExclusions("text");
    expect(clauses).toHaveLength(FRONT_DOOR_BLOCKED_TERMS.length);
    expect(clauses[0]).toEqual({
      NOT: { text: { contains: FRONT_DOOR_BLOCKED_TERMS[0], mode: "insensitive" } },
    });
  });
});
