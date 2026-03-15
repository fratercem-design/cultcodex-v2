import { describe, it, expect } from "vitest";
import { loadEnrichmentFiles } from "../import-enriched";

describe("loadEnrichmentFiles", () => {
  it("is a function", () => {
    expect(typeof loadEnrichmentFiles).toBe("function");
  });

  it("returns an array", () => {
    const files = loadEnrichmentFiles();
    expect(Array.isArray(files)).toBe(true);
  });
});
