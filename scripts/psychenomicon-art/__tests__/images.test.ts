import { describe, expect, it } from "vitest";
import { prepareImagePrompt, stableSeed } from "../images";

describe("prepareImagePrompt", () => {
  it("normalizes whitespace without changing a short prompt", () => {
    expect(prepareImagePrompt("  obsidian   gate\n violet light  ", 512)).toBe(
      "obsidian gate violet light"
    );
  });

  it("keeps provider-bound prompts within the requested limit", () => {
    const prompt = `${"fractured silver halo, ".repeat(40)}final candlelight.`;
    const prepared = prepareImagePrompt(prompt, 512);

    expect(prepared.length).toBeLessThanOrEqual(512);
    expect(prepared.endsWith("…")).toBe(true);
  });

  it("rejects unusable prompt limits", () => {
    expect(() => prepareImagePrompt("test", 20)).toThrow(
      "Invalid ART_IMAGE_PROMPT_MAX_CHARS"
    );
  });
});

describe("stableSeed", () => {
  it("is deterministic and slot-sensitive", () => {
    const first = stableSeed("keeper at the gate", 0);
    expect(stableSeed("keeper at the gate", 0)).toBe(first);
    expect(stableSeed("keeper at the gate", 1)).not.toBe(first);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(2147483647);
  });
});
