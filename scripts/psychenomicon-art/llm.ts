// scripts/psychenomicon-art/llm.ts
//
// Shared LLM caller for the art pipeline. Primary path is Bluesminds
// (OpenAI-compatible, the user's prepaid credit); it's provider-flaky, so we
// retry a few times then fall back to AWS Bedrock (Claude Sonnet). This keeps
// the pipeline off the out-of-credit direct Anthropic API.

import OpenAI from "openai";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";

const ART_MODEL = process.env.ART_MODEL ?? "gpt-4o";
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
      throw new Error("empty response from Bluesminds");
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
