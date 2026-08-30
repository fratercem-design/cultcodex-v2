// scripts/psychenomicon-art/llm.ts
//
// Shared LLM caller for the art pipeline. HCNSEC is the preferred
// OpenAI-compatible provider when HCNSEC_API_KEY is configured. Legacy
// Bluesminds/OpenRouter settings remain supported. Bedrock is an optional
// fallback only when its credentials already exist in the process.

import OpenAI from "openai";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";

const ART_MODEL =
  process.env.ART_TEXT_MODEL ??
  process.env.ART_MODEL ??
  (process.env.HCNSEC_API_KEY ? "DeepSeek-V4-Flash" : "gpt-4o");
const BEDROCK_FALLBACK_MODEL =
  process.env.PSYCHENOMICON_FALLBACK_MODEL ?? "us.anthropic.claude-sonnet-4-6";

export async function callLLM(
  client: OpenAI,
  system: string,
  user: string,
  maxTokens = 2000
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await client.chat.completions.create({
        model: ART_MODEL,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      const text = r.choices[0]?.message?.content?.trim() ?? "";
      if (text) return text;
      throw new Error("empty response from configured art text provider");
    } catch (e) {
      lastErr = e;
      if (attempt < 3) await new Promise((res) => setTimeout(res, 1500 * attempt));
    }
  }
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    const bedrock = new AnthropicBedrock({ awsRegion: process.env.AWS_REGION ?? "us-east-1" });
    const resp = await bedrock.messages.create({
      model: BEDROCK_FALLBACK_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    });
    return resp.content.find((b) => b.type === "text")?.text?.trim() ?? "";
  }
  throw lastErr;
}
