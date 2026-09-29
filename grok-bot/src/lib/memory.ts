import type { ChatMessage } from "./grok.js";
import type { PersonaId } from "./personas.js";

interface Conversation {
  persona?: PersonaId;
  messages: ChatMessage[];
  touchedAt: number;
}

/**
 * In-memory, per-channel conversation history. Keeps the last `maxTurns`
 * user/assistant pairs, caps total characters so prompts stay cheap, and
 * forgets channels that have been quiet longer than `ttlMs`.
 */
export class ConversationMemory {
  private readonly store = new Map<string, Conversation>();

  constructor(
    private readonly maxTurns: number,
    private readonly ttlMs: number,
    private readonly maxChars = 24_000,
    private readonly now: () => number = Date.now,
  ) {}

  private get(key: string): Conversation | undefined {
    const convo = this.store.get(key);
    if (convo && this.now() - convo.touchedAt > this.ttlMs) {
      // Keep the chosen persona, drop the stale history.
      convo.messages = [];
    }
    return convo;
  }

  private ensure(key: string): Conversation {
    let convo = this.get(key);
    if (!convo) {
      convo = { messages: [], touchedAt: this.now() };
      this.store.set(key, convo);
    }
    return convo;
  }

  history(key: string): ChatMessage[] {
    return [...(this.get(key)?.messages ?? [])];
  }

  append(key: string, user: string, assistant: string): void {
    const convo = this.ensure(key);
    convo.messages.push({ role: "user", content: user }, { role: "assistant", content: assistant });
    const maxMessages = this.maxTurns * 2;
    if (convo.messages.length > maxMessages) convo.messages.splice(0, convo.messages.length - maxMessages);
    let total = convo.messages.reduce((n, m) => n + m.content.length, 0);
    // Drop oldest pairs until under the character budget (always keep the newest pair).
    while (total > this.maxChars && convo.messages.length > 2) {
      const [a, b] = convo.messages.splice(0, 2);
      total -= a.content.length + b.content.length;
    }
    convo.touchedAt = this.now();
  }

  persona(key: string): PersonaId | undefined {
    return this.store.get(key)?.persona;
  }

  setPersona(key: string, persona: PersonaId): void {
    const convo = this.ensure(key);
    convo.persona = persona;
    convo.touchedAt = this.now();
  }

  reset(key: string): void {
    const convo = this.store.get(key);
    if (convo) convo.messages = [];
  }

  /** Removes fully idle channels; call periodically. */
  sweep(): number {
    let removed = 0;
    for (const [key, convo] of this.store) {
      if (this.now() - convo.touchedAt > this.ttlMs) {
        this.store.delete(key);
        removed++;
      }
    }
    return removed;
  }
}
