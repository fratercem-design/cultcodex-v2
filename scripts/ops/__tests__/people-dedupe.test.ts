import { describe, expect, it, vi } from "vitest";

vi.mock("../../ingest/lib", () => ({ getPrisma: vi.fn(), disconnect: vi.fn() }));

import { matchesNamed, nameKey, NAMED } from "../people-dedupe";

const named = (keep: string) => NAMED.find((n) => n.keep === keep)!;

describe("named clusters", () => {
  it("gathers the Mayers spellings but never McQueen", () => {
    const m = named("Alexandra Mayers");
    for (const n of ["Alexandra Mayers", "Alexander Mayors", "Alexandra Meyers / Alexandra Mayers", "Alexandra Myers", "Alex Mayer", "Alexandra (Monica Foster)", "Alexandra"])
      expect(matchesNamed(m, [n]), n).toBe(true);
    for (const n of ["Alexander McQueen", "Alex and Me", "Alexandra McQueen Mayers", "Alexander"])
      expect(matchesNamed(m, [n]), n).toBe(false);
  });

  it("gathers McQueen spellings but not rows that also name Mayers", () => {
    const m = named("Alexander McQueen");
    for (const n of ["Alexander McQueen", "Alexander Mc Queen", "McQueen", "Alex McQueen (INX)"]) expect(matchesNamed(m, [n]), n).toBe(true);
    for (const n of ["Alexandra McQueen Mayers", "Alexandra Mayers"]) expect(matchesNamed(m, [n]), n).toBe(false);
  });

  it("gathers Beeta spellings but not the word beta", () => {
    const m = named("Beeta");
    for (const n of ["Beeta", "Beedah", "Bita", "Beeta (Beeda)"]) expect(matchesNamed(m, [n]), n).toBe(true);
    for (const n of ["Beta Tester", "Betamax"]) expect(matchesNamed(m, [n]), n).toBe(false);
  });

  it("checks alt names too", () => {
    expect(matchesNamed(named("Beeta"), ["B", "Bita"])).toBe(true);
  });
});

describe("nameKey", () => {
  it("drops case, punctuation and trailing aliases", () => {
    expect(nameKey("Chris Kay")).toBe(nameKey("chris  kay."));
    expect(nameKey("Samman (Sam Man)")).toBe("samman");
    expect(nameKey("Eldo / Eldorado")).toBe("eldo");
    expect(nameKey("Kate the Turtle")).not.toBe(nameKey("Kate"));
  });
});
