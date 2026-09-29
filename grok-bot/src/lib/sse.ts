/**
 * Incremental parser for OpenAI-compatible `text/event-stream` chat
 * completions. Feed it raw text chunks; it yields content deltas and
 * tolerates events split across network chunks.
 */
export class ChatStreamParser {
  private buffer = "";
  done = false;

  push(chunk: string): string[] {
    this.buffer += chunk;
    const out: string[] = [];
    let idx: number;
    // Events are separated by a blank line; accept \n\n and \r\n\r\n.
    while ((idx = this.buffer.search(/\r?\n\r?\n/)) !== -1) {
      const raw = this.buffer.slice(0, idx);
      this.buffer = this.buffer.slice(idx).replace(/^\r?\n\r?\n/, "");
      const delta = this.parseEvent(raw);
      if (delta) out.push(delta);
    }
    return out;
  }

  private parseEvent(raw: string): string | null {
    const data = raw
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) return null;
    if (data === "[DONE]") {
      this.done = true;
      return null;
    }
    try {
      const json = JSON.parse(data) as {
        choices?: { delta?: { content?: string | null } }[];
        error?: { message?: string };
      };
      if (json.error) throw new Error(json.error.message ?? "stream error");
      return json.choices?.[0]?.delta?.content || null;
    } catch (err) {
      if (err instanceof SyntaxError) return null; // keep-alive comments / junk
      throw err;
    }
  }
}
