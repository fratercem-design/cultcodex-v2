import { describe, expect, it } from "vitest";
import { ChatStreamParser } from "../lib/sse.js";

const ev = (content: string) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;

describe("ChatStreamParser", () => {
  it("yields deltas and stops on [DONE]", () => {
    const p = new ChatStreamParser();
    expect(p.push(ev("Hel") + ev("lo") + "data: [DONE]\n\n")).toEqual(["Hel", "lo"]);
    expect(p.done).toBe(true);
  });

  it("handles events split across chunks and CRLF", () => {
    const p = new ChatStreamParser();
    const raw = ev("split").replace(/\n/g, "\r\n");
    expect(p.push(raw.slice(0, 10))).toEqual([]);
    expect(p.push(raw.slice(10))).toEqual(["split"]);
  });

  it("ignores comments, role-only deltas and junk", () => {
    const p = new ChatStreamParser();
    const roleOnly = `data: ${JSON.stringify({ choices: [{ delta: { role: "assistant" } }] })}\n\n`;
    expect(p.push(": keep-alive\n\n" + roleOnly + "data: {not json\n\n" + ev("ok"))).toEqual(["ok"]);
  });

  it("throws on in-stream errors", () => {
    const p = new ChatStreamParser();
    expect(() => p.push(`data: ${JSON.stringify({ error: { message: "boom" } })}\n\n`)).toThrow("boom");
  });
});
