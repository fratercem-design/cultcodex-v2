// @vitest-environment node
import { describe, expect, it } from "vitest";
import { isOutOfCredit, openRouterBaseURL, pickChapters } from "../psychenomicon-deslop";

const chapter = (n: number, canonText: string) => ({
  n,
  canonText,
  interpretationText: "",
  mythicText: "",
  emergingSignals: [],
});

describe("pickChapters", () => {
  it("keeps chapters at or above the threshold, worst first", () => {
    const rows = [
      chapter(1, "A pivotal night."),
      chapter(2, "A pivotal, crucial, intricate night."),
      chapter(3, "Plain prose."),
      chapter(4, "A pivotal, crucial night."),
    ];
    expect(pickChapters(rows, 2).map((r) => [r.n, r.hits])).toEqual([[2, 3], [4, 2]]);
  });

  it("does not count in-world words", () => {
    expect(pickChapters([chapter(1, "The labyrinth and the crucible.")], 1)).toEqual([]);
  });
});

describe("isOutOfCredit", () => {
  it("recognises Anthropic's and OpenRouter's out-of-credit errors", () => {
    expect(isOutOfCredit("anthropic: 400 Your credit balance is too low to access the Anthropic API")).toBe(true);
    expect(isOutOfCredit("402 Insufficient credits. Add more using https://openrouter.ai/settings/credits")).toBe(true);
  });

  it("does not stop the run for a single chapter's error", () => {
    expect(isOutOfCredit("400 Provider returned error: input rejected")).toBe(false);
    expect(isOutOfCredit("model returned invalid JSON")).toBe(false);
  });
});

describe("openRouterBaseURL", () => {
  it("defaults to OpenRouter over https and keeps an https override", () => {
    expect(openRouterBaseURL(undefined)).toBe("https://openrouter.ai/api/v1");
    expect(openRouterBaseURL("https://proxy.example/v1")).toBe("https://proxy.example/v1");
  });

  it("refuses a cleartext override so the key is never sent over http", () => {
    expect(() => openRouterBaseURL("http://proxy.example/v1")).toThrow(/https/);
  });
});
