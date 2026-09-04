import { describe, it, expect } from "vitest";
import {
  personNameBase,
  curateReportPeople,
  isJunkPersonName,
} from "../content-hygiene";

type P = { displayName: string; appearances: number };
const p = (displayName: string, appearances: number): P => ({ displayName, appearances });

describe("personNameBase", () => {
  it("strips a trailing parenthetical qualifier", () => {
    expect(personNameBase("Psyche (Trix)")).toBe("psyche");
    expect(personNameBase("Psyche")).toBe("psyche");
  });
  it("leaves inner text and multi-word names intact", () => {
    expect(personNameBase("Emma Leviathan")).toBe("emma leviathan");
    expect(personNameBase("Alexander McQueen")).toBe("alexander mcqueen");
  });
});

describe("curateReportPeople — the reports-grid bug", () => {
  // Reproduces exactly what the live grid showed: Psyche listed twice
  // (host + a "(Trix)" variant), Beeta absent.
  const ranked: P[] = [
    p("Psyche", 1430),
    p("Alexander McQueen", 82),
    p("Psyche (Trix)", 69), // ← the duplicate to fold away
    p("Joker", 38),
    p("Janet", 34),
    p("Lanore", 34),
    p("Emma Leviathan", 34),
    p("Jay Dog", 32),
    p("Michael", 30),
    p("Norca", 28), // next in line — should fill the freed slot
    p("Beeta", 12), // real recurring figure, ranked too low to make top 9
  ];
  const pinned: P[] = [p("Beeta", 12)];

  const out = curateReportPeople(ranked, pinned, ["Beeta"], 9);
  const names = out.map((o) => o.displayName);

  it("lists Psyche exactly once", () => {
    expect(names.filter((n) => personNameBase(n) === "psyche")).toEqual(["Psyche"]);
  });
  it("drops the (Trix) variant, keeping the higher-appearance row", () => {
    expect(names).not.toContain("Psyche (Trix)");
    expect(names).toContain("Psyche");
  });
  it("fills the freed slot with Beeta, not the next raw rank", () => {
    // Removing "Psyche (Trix)" frees one slot; the Beeta pin fills it, so the
    // roster stays at 9 real people and Norca (rank 10) stays out.
    expect(names).toContain("Michael");
    expect(names).not.toContain("Norca");
    expect(names).toEqual([
      "Beeta",
      "Psyche",
      "Alexander McQueen",
      "Joker",
      "Janet",
      "Lanore",
      "Emma Leviathan",
      "Jay Dog",
      "Michael",
    ]);
  });
  it("guarantees Beeta is listed, at the front", () => {
    expect(names).toContain("Beeta");
    expect(names[0]).toBe("Beeta");
  });
  it("returns a full grid of 9 with no duplicate base names", () => {
    expect(out).toHaveLength(9);
    const bases = names.map(personNameBase);
    expect(new Set(bases).size).toBe(bases.length);
  });
});

describe("curateReportPeople — guardrails", () => {
  it("never merges two distinct bare names", () => {
    const rows = [p("Michael", 30), p("Michael Jordan", 5)];
    const out = curateReportPeople(rows, [], [], 9);
    expect(out.map((o) => o.displayName)).toEqual(["Michael", "Michael Jordan"]);
  });
  it("does not duplicate a pinned person who is also ranked", () => {
    const rows = [p("Psyche", 1430), p("Beeta", 40)];
    const out = curateReportPeople(rows, [p("Beeta", 40)], ["Beeta"], 9);
    expect(out.map((o) => o.displayName)).toEqual(["Beeta", "Psyche"]);
  });
  it("filters extraction-artifact names", () => {
    expect(isJunkPersonName("Unknown")).toBe(true);
    const rows = [p("Unknown", 900), p("Janet", 34)];
    const out = curateReportPeople(rows, [], [], 9);
    expect(out.map((o) => o.displayName)).toEqual(["Janet"]);
  });
});

describe("isJunkPersonName — placeholder patterns", () => {
  it("flags generic placeholder people", () => {
    for (const junk of [
      "Guest", "Narrator", "The Narrator", "Host 1", "Host 2", "Speaker 3",
      "None mentioned", "Various Guests", "Various Panel Members",
      "Guest (Grimaldi claimant)", "Guest (appears ~9:37)",
      "Unknown Panel Participant 2", "Open Panel Participants",
    ]) {
      expect(isJunkPersonName(junk), junk).toBe(true);
    }
  });
  it("does NOT flag real names, including ones that merely contain a keyword", () => {
    for (const real of [
      "Psyche", "Alexander McQueen", "Beeta", "Mr. Trix", "Emma Leviathan",
      "Hostetler", "Guesterson", "Nonso", "Variana", "Host of Eagles",
    ]) {
      expect(isJunkPersonName(real), real).toBe(false);
    }
  });
});
