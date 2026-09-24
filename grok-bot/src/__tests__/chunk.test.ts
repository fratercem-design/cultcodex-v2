import { describe, expect, it } from "vitest";
import { chunkMessage, previewText } from "../lib/chunk.js";

describe("chunkMessage", () => {
  it("returns short text untouched", () => {
    expect(chunkMessage("hello")).toEqual(["hello"]);
  });

  it("splits long text on paragraph boundaries within the limit", () => {
    const para = "word ".repeat(150).trim();
    const chunks = chunkMessage(Array(6).fill(para).join("\n\n"), 2000);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(2000);
    expect(chunks.join(" ").split(/\s+/).filter(Boolean)).toHaveLength(900);
  });

  it("keeps code fences balanced across chunks", () => {
    const code = Array.from({ length: 200 }, (_, n) => `console.log(${n}); // line`).join("\n");
    const chunks = chunkMessage("Here:\n```ts\n" + code + "\n```\nDone.", 2000);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(2000);
      expect((c.match(/```/g) ?? []).length % 2).toBe(0);
    }
    expect(chunks[1].startsWith("```ts\n")).toBe(true);
  });

  it("hard-splits a single giant word", () => {
    const chunks = chunkMessage("a".repeat(5000), 2000);
    expect(chunks.join("")).toBe("a".repeat(5000));
  });
});

describe("previewText", () => {
  it("adds a cursor and keeps the tail when too long", () => {
    expect(previewText("hi")).toBe("hi ▌");
    const p = previewText("x".repeat(3000) + "END", 2000);
    expect(p.length).toBe(2000);
    expect(p.endsWith("END ▌")).toBe(true);
  });
});
