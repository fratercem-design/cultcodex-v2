import { describe, expect, it } from "vitest";
import { checkRewrite, findSlop, parseRewrite, type ChapterProse } from "@/lib/psychenomicon-slop";

describe("findSlop", () => {
  it("flags stock words and phrases", () => {
    const hits = findSlop("The stream was a testament to a rich tapestry of pivotal moments.");
    const matches = hits.map((h) => h.match);
    expect(matches).toContain("tapestry");
    expect(matches).toContain("pivotal");
    expect(matches).toContain("a testament to");
  });

  it("flags not-X-but-Y contrasts", () => {
    const hits = findSlop("This was not just a stream, but a reckoning.");
    expect(hits.some((h) => h.kind === "contrast")).toBe(true);
  });

  it("flags sentences with two or more em dashes", () => {
    const hits = findSlop("Psyche paused — briefly — and went on. Then chat moved on.");
    expect(hits.filter((h) => h.kind === "dashes")).toHaveLength(1);
  });

  it("leaves in-world vocabulary and plain prose alone", () => {
    expect(findSlop("Psyche read the signal from chat and logged a new transmission in the vault.")).toEqual([]);
  });
});

describe("checkRewrite", () => {
  const before: ChapterProse = {
    canonText: 'Psyche opened the stream and said "we are not doing this again tonight" before taking calls.',
    interpretationText: "He set the tone early.",
    mythicText: "The gate held.",
    emergingSignals: ["a", "b"],
  };

  it("accepts a faithful rewrite", () => {
    expect(checkRewrite(before, { ...before, interpretationText: "He set the tone at the start." })).toEqual([]);
  });

  it("rejects a dropped quote, a changed signal count and introduced she/her", () => {
    const problems = checkRewrite(before, {
      ...before,
      canonText: "Psyche opened the stream and took calls. She was tired.",
      emergingSignals: ["a"],
    });
    expect(problems.some((p) => p.includes("quote"))).toBe(true);
    expect(problems.some((p) => p.includes("she/her"))).toBe(true);
    expect(problems.some((p) => p.startsWith("emergingSignals"))).toBe(true);
  });
});

describe("parseRewrite", () => {
  it("strips a code fence", () => {
    expect(parseRewrite('```json\n{"mythicText":"x"}\n```')).toEqual({ mythicText: "x" });
  });
  it("returns null on junk", () => {
    expect(parseRewrite("nope")).toBeNull();
  });
});
