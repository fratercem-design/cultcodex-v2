import { describe, expect, it } from "vitest";
import { ConversationMemory } from "../lib/memory.js";

describe("ConversationMemory", () => {
  it("keeps only the last N turns", () => {
    const m = new ConversationMemory(2, 60_000);
    for (let n = 1; n <= 3; n++) m.append("c", `q${n}`, `a${n}`);
    expect(m.history("c").map((x) => x.content)).toEqual(["q2", "a2", "q3", "a3"]);
  });

  it("enforces the character budget but keeps the newest pair", () => {
    const m = new ConversationMemory(10, 60_000, 25);
    m.append("c", "x".repeat(10), "y".repeat(10));
    m.append("c", "z".repeat(20), "w".repeat(20));
    expect(m.history("c")).toHaveLength(2);
    expect(m.history("c")[0].content).toBe("z".repeat(20));
  });

  it("expires history after the TTL but keeps the persona", () => {
    let now = 0;
    const m = new ConversationMemory(5, 1000, 24_000, () => now);
    m.setPersona("c", "roast");
    m.append("c", "q", "a");
    now = 2000;
    expect(m.history("c")).toEqual([]);
    expect(m.persona("c")).toBe("roast");
    expect(m.sweep()).toBe(1);
    expect(m.persona("c")).toBeUndefined();
  });

  it("isolates channels and resets", () => {
    const m = new ConversationMemory(5, 60_000);
    m.append("a", "q", "a");
    m.append("b", "q", "a");
    m.reset("a");
    expect(m.history("a")).toEqual([]);
    expect(m.history("b")).toHaveLength(2);
  });
});
