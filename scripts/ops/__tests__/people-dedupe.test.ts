import { describe, expect, it, vi } from "vitest";

vi.mock("../../ingest/lib", () => ({ getPrisma: vi.fn(), disconnect: vi.fn() }));

import { matchesNamed, nameKey, nameParts, NAMED } from "../people-dedupe";

const named = (keep: string) => NAMED.find((n) => n.keep === keep)!;
const yes = (keep: string, names: string[]) => names.forEach((n) => expect(matchesNamed(named(keep), n), n).toBe(true));
const no = (keep: string, names: string[]) => names.forEach((n) => expect(matchesNamed(named(keep), n), n).toBe(false));

describe("named clusters", () => {
  it("gathers Mayers spellings, never McQueen", () => {
    yes("Alexandra Mayers", ["Alexandra Mayers", "Alexander Mayors", "Alex Myers", "Alexandra Mayers / Monica Foster", "Alexandra Mayers (AM)", "Alexandra", "Alexandra/Alex", "Alexandra Melody Mayers"]);
    no("Alexandra Mayers", ["Alexander McQueen", "Alex", "Alexandra (Alexander McQueen)", "Alexandra Mayers / Bita", "INX (Alexandra)"]);
  });

  it("gathers McQueen spellings, not other McQueens or rows naming someone else", () => {
    yes("Alexander McQueen", ["Alexander McQueen", "Alex McQueen", "McQueen", "Alexander McQueen / Alex", "Alex / A.M. / Alexander McQueen", "Alex McQueen / Alice McQueen"]);
    no("Alexander McQueen", ["Peter Mason McQueen", "Alexander McQueen (Ghost)", "Mr. Extendo (Alex McQueen)", "Alexandra Mayers"]);
  });

  it("gathers Beeta and Beta but not rows that also name another person", () => {
    yes("Beeta", ["Beeta", "Beta", "Bita", "Beta (Beeta)", "Beeda (Beeta)", "Beat (or Bita)", "Bea / Beeta"]);
    no("Beeta", ["Saman / Beeta", "Bita / Christine", "Summer/Beta", "Beta / VA / Beeta", "Beta Tester", "Bea"]);
  });

  it("gathers Psyche's names", () => {
    yes("Psyche", ["Psyche", "Psyche (Trix)", "Trix / Psyche", "Psyche (John Bates / Trix)", "John / Psyche", "Psyche / Trix (Host)"]);
    no("Psyche", ["John", "Tricks / Trixie", "Psyche / Christine"]);
  });

  it("gathers Samman spellings", () => {
    yes("Samman", ["Samman", "Saman", "Sam Man", "Sandman", "Samman (Sam Man)", "Sam/Samman", "Saman / SamanMan NYC"]);
    no("Samman", ["Sam", "Good Times / Sam-Man", "Sam Man / Samian / Samuel Torres"]);
  });
});

describe("name parts and keys", () => {
  it("splits every name a row carries", () => {
    expect(nameParts("Beeta (Beeda) / Bita")).toEqual(["beeta", "beeda", "bita"]);
    expect(nameParts("Beat (or Bita)")).toEqual(["beat", "bita"]);
  });

  it("keys drop case, punctuation and trailing aliases", () => {
    expect(nameKey("Chris Kay")).toBe(nameKey("chris  kay."));
    expect(nameKey("Samman (Sam Man)")).toBe("samman");
    expect(nameKey("Eldo / Eldorado")).toBe("eldo");
    expect(nameKey("Bay Clips")).toBe(nameKey("BayClips"));
    expect(nameKey("Money 420")).toBe(nameKey("Money420"));
    expect(nameKey("Kate the Turtle")).not.toBe(nameKey("Kate"));
  });
});
