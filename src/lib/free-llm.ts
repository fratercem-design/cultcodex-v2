import OpenAI from "openai";

// Thin helper for the free Groq tier (OpenAI-compatible). Used by the oracle
// (as a Bedrock-failure fallback) and tarot (as the preferred provider) to cut
// spend. Throws if GROQ_API_KEY is unset so callers can fall back to Bedrock.

export interface GroqChatArgs {
  system: string;
  user: string;
  maxTokens?: number;
  /** Ask Groq for a strict JSON object response (uses response_format). */
  json?: boolean;
}

export function groqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}

export async function groqChat({ system, user, maxTokens = 1024, json = false }: GroqChatArgs): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");
  const client = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
  const c = await client.chat.completions.create({
    model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    max_tokens: maxTokens,
    ...(json ? { response_format: { type: "json_object" } } : {}),
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return c.choices[0]?.message?.content ?? "";
}
