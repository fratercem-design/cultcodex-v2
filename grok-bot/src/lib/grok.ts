import { ChatStreamParser } from "./sse.js";

export type Role = "system" | "user" | "assistant";
export interface ChatMessage {
  role: Role;
  content: string;
}

export class GrokError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "GrokError";
  }
}

export interface GrokClientOptions {
  apiKey: string;
  baseUrl: string;
  chatModel: string;
  imageModel: string;
  fetchImpl?: typeof fetch;
}

/** Pulls a readable message out of an xAI/OpenAI-style error body. */
export function errorMessage(body: string): string {
  try {
    const json = JSON.parse(body) as { error?: string | { message?: string } };
    if (typeof json.error === "string") return json.error;
    if (json.error?.message) return json.error.message;
  } catch {
    /* not JSON */
  }
  return body.slice(0, 300);
}

/** Minimal xAI client: streaming chat completions + image generation. */
export class GrokClient {
  private readonly fetch: typeof fetch;

  constructor(private readonly opts: GrokClientOptions) {
    this.fetch = opts.fetchImpl ?? fetch;
  }

  private async post(path: string, body: unknown, signal?: AbortSignal): Promise<Response> {
    const res = await this.fetch(`${this.opts.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new GrokError(`xAI ${res.status}: ${errorMessage(text) || res.statusText}`, res.status);
    }
    return res;
  }

  /** Streams content deltas as they arrive. */
  async *streamChat(
    messages: ChatMessage[],
    { temperature = 0.7, signal }: { temperature?: number; signal?: AbortSignal } = {},
  ): AsyncGenerator<string> {
    const res = await this.post(
      "/chat/completions",
      { model: this.opts.chatModel, messages, temperature, stream: true },
      signal,
    );
    if (!res.body) throw new GrokError("xAI returned an empty stream");
    const parser = new ChatStreamParser();
    const decoder = new TextDecoder();
    for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
      for (const delta of parser.push(decoder.decode(chunk, { stream: true }))) yield delta;
      if (parser.done) return;
    }
  }

  /** Convenience wrapper that collects the full streamed reply. */
  async chat(messages: ChatMessage[], opts?: { temperature?: number; signal?: AbortSignal }) {
    let out = "";
    for await (const delta of this.streamChat(messages, opts)) out += delta;
    return out.trim();
  }

  /** Returns a PNG/JPEG buffer for the prompt, plus any revised prompt. */
  async imagine(prompt: string, signal?: AbortSignal): Promise<{ image: Buffer; revisedPrompt?: string }> {
    const res = await this.post(
      "/images/generations",
      { model: this.opts.imageModel, prompt, n: 1, response_format: "b64_json" },
      signal,
    );
    const json = (await res.json()) as {
      data?: { b64_json?: string; url?: string; revised_prompt?: string }[];
    };
    const item = json.data?.[0];
    if (item?.b64_json) return { image: Buffer.from(item.b64_json, "base64"), revisedPrompt: item.revised_prompt };
    if (item?.url) {
      const img = await this.fetch(item.url, { signal });
      if (!img.ok) throw new GrokError(`Image download failed: ${img.status}`, img.status);
      return { image: Buffer.from(await img.arrayBuffer()), revisedPrompt: item.revised_prompt };
    }
    throw new GrokError("xAI returned no image data");
  }
}
