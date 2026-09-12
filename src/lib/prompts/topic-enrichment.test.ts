import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TOPIC_ENRICHMENT_SYSTEM_PROMPT,
  buildTopicEnrichmentMessage,
} from "./topic-enrichment";

const ROOT = join(__dirname, "..", "..", "..");
const CALL_SITES = [
  "scripts/enrich/enrich-topics.ts",
  "src/app/api/admin/enrich-topics/route.ts",
];

describe("topic enrichment prompt", () => {
  it("tells the model Psyche's pronouns", () => {
    // The whole reason this module exists. 644 live descriptions say "she" of
    // Psyche because the copy that wrote them was missing this line.
    expect(TOPIC_ENRICHMENT_SYSTEM_PROMPT).toContain("he/him/his");
    expect(TOPIC_ENRICHMENT_SYSTEM_PROMPT).toMatch(/Psyche is MALE/);
  });

  it("still asks for the two-part shape the topic pages render", () => {
    expect(TOPIC_ENRICHMENT_SYSTEM_PROMPT).toContain("In the Psycheverse:");
    expect(TOPIC_ENRICHMENT_SYSTEM_PROMPT).toContain("separated by a blank line");
  });

  describe("no call site may keep its own copy", () => {
    // Two copies drifted apart once already; this is the guard that says so
    // out loud instead of letting the next run silently misgender someone.
    it.each(CALL_SITES)("%s imports the shared prompt", (rel) => {
      const src = readFileSync(join(ROOT, rel), "utf8");
      expect(src).toContain("topic-enrichment");
      expect(src).toContain("TOPIC_ENRICHMENT_SYSTEM_PROMPT");
    });

    it.each(CALL_SITES)("%s defines no local SYSTEM_PROMPT", (rel) => {
      const src = readFileSync(join(ROOT, rel), "utf8");
      expect(src).not.toMatch(/const\s+SYSTEM_PROMPT\s*=/);
      expect(src).not.toMatch(/function\s+buildUserMessage\s*\(/);
    });
  });
});

describe("buildTopicEnrichmentMessage", () => {
  const base = {
    title: "tarot cards",
    episodeTitles: [],
    loreTitles: [],
    peopleNames: [],
    sampleSummaries: [],
  };

  it("always names the topic", () => {
    expect(buildTopicEnrichmentMessage(base)).toContain('Topic: "tarot cards"');
  });

  it("prefers summaries over titles when both exist", () => {
    const out = buildTopicEnrichmentMessage({
      ...base,
      sampleSummaries: ["Psyche reads the Tower for a caller."],
      episodeTitles: ["Tower Night"],
    });
    expect(out).toContain("Sample episode summaries:");
    expect(out).not.toContain("Episode titles:");
  });

  it("falls back to titles when there are no summaries", () => {
    const out = buildTopicEnrichmentMessage({ ...base, episodeTitles: ["Tower Night"] });
    expect(out).toContain("Episode titles:");
    expect(out).toContain("- Tower Night");
  });

  it("caps summaries at 5, titles at 10, lore and people at 5", () => {
    const many = (n: number, p: string) => Array.from({ length: n }, (_, i) => `${p}${i}`);
    const withSummaries = buildTopicEnrichmentMessage({
      ...base,
      sampleSummaries: many(9, "s"),
      loreTitles: many(9, "l"),
      peopleNames: many(9, "p"),
    });
    expect(withSummaries).toContain("- s4");
    expect(withSummaries).not.toContain("- s5");
    expect(withSummaries).toContain("l4");
    expect(withSummaries).not.toContain("l5");
    expect(withSummaries).toContain("p4");
    expect(withSummaries).not.toContain("p5");

    const withTitles = buildTopicEnrichmentMessage({ ...base, episodeTitles: many(14, "t") });
    expect(withTitles).toContain("- t9");
    expect(withTitles).not.toContain("- t10");
  });

  it("omits empty sections entirely", () => {
    const out = buildTopicEnrichmentMessage(base);
    expect(out).not.toContain("Related lore");
    expect(out).not.toContain("People:");
    expect(out.trim()).toBe('Topic: "tarot cards"');
  });
});
