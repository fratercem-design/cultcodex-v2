import { describe, expect, it, vi } from "vitest";
import { GrokClient, GrokError, errorMessage } from "../lib/grok.js";

function sseResponse(parts: string[]) {
  const enc = new TextEncoder();
  const body = new ReadableStream({
    start(c) {
      for (const p of parts) c.enqueue(enc.encode(p));
      c.close();
    },
  });
  return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } });
}

const client = (fetchImpl: typeof fetch) =>
  new GrokClient({ apiKey: "k", baseUrl: "https://api.x.ai/v1", chatModel: "grok-test", imageModel: "img-test", fetchImpl });

describe("GrokClient", () => {
  it("streams chat and sends the right request", async () => {
    const fetchImpl = vi.fn(async () =>
      sseResponse([
        'data: {"choices":[{"delta":{"content":"Don\'t "}}]}\n\ndata: {"choices":[{"del',
        'ta":{"content":"panic"}}]}\n\ndata: [DONE]\n\n',
      ]),
    );
    const text = await client(fetchImpl as unknown as typeof fetch).chat([{ role: "user", content: "hi" }], {
      temperature: 0.3,
    });
    expect(text).toBe("Don't panic");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.x.ai/v1/chat/completions");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer k");
    expect(JSON.parse(init.body as string)).toMatchObject({ model: "grok-test", stream: true, temperature: 0.3 });
  });

  it("surfaces API errors with status", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ error: { message: "bad key" } }), { status: 401 }));
    const err = await client(fetchImpl as unknown as typeof fetch)
      .chat([{ role: "user", content: "hi" }])
      .catch((e) => e);
    expect(err).toBeInstanceOf(GrokError);
    expect(err.status).toBe(401);
    expect(err.message).toContain("bad key");
  });

  it("decodes base64 images", async () => {
    const b64 = Buffer.from("png-bytes").toString("base64");
    const fetchImpl = vi.fn(async () => Response.json({ data: [{ b64_json: b64, revised_prompt: "a cat, cinematic" }] }));
    const out = await client(fetchImpl as unknown as typeof fetch).imagine("a cat");
    expect(out.image.toString()).toBe("png-bytes");
    expect(out.revisedPrompt).toBe("a cat, cinematic");
  });

  it("parses error bodies", () => {
    expect(errorMessage('{"error":"nope"}')).toBe("nope");
    expect(errorMessage('{"error":{"message":"deep"}}')).toBe("deep");
    expect(errorMessage("plain text")).toBe("plain text");
  });
});
