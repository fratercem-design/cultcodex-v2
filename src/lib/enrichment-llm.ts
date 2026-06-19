import OpenAI from "openai";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import { bedrockModelId } from "@/lib/anthropic";

// Single entry point for enrichment LLM calls. Honors ENRICHMENT_PROVIDER:
// "openrouter" → Bluesminds/OpenRouter (cheap gpt-4o via prepaid credits), with
// a Bedrock fallback when the proxy 5xx's. Otherwise straight Bedrock. Returns
// the model's raw text output (callers parse the JSON themselves).
//
// Fixes the "invalid model identifier" bug where ENRICHMENT_MODEL=gpt-4o was
// passed to Bedrock as `us.anthropic.gpt-4o-v1:0`.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface EnrichArgs {
  system: string;
  user: string;
  maxTokens: number;
}

async function viaOpenRouter({ system, user, maxTokens }: EnrichArgs): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");
  const client = new OpenAI({
    apiKey,
    baseURL: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    defaultHeaders: { "HTTP-Referer": "https://cultcodex.me" },
  });
  const model = process.env.ENRICHMENT_MODEL ?? "gpt-4o";
  // Bluesminds intermittently returns 5xx — retry with backoff before failing over.
  let lastErr: unknown;
  for (let i = 0; i < 4; i++) {
    try {
      const c = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      return c.choices[0]?.message?.content ?? "";
    } catch (e) {
      lastErr = e;
      await sleep(1500 * (i + 1));
    }
  }
  throw lastErr;
}

async function viaBedrock({ system, user, maxTokens }: EnrichArgs): Promise<string> {
  const client = new AnthropicBedrock({ awsRegion: process.env.AWS_REGION ?? "us-east-1" });
  // A KNOWN-enabled Bedrock model (Opus isn't enabled on this account).
  const model = process.env.ENRICHMENT_FALLBACK_MODEL ?? "us.anthropic.claude-haiku-4-5-20251001-v1:0";
  const r = await client.messages.create({
    model: bedrockModelId(model),
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  const tb = r.content.find((b) => b.type === "text");
  return tb && tb.type === "text" ? tb.text : "";
}

export async function enrichComplete(args: EnrichArgs): Promise<string> {
  if (process.env.ENRICHMENT_PROVIDER === "openrouter") {
    try {
      return await viaOpenRouter(args);
    } catch (e) {
      console.error("[enrich] OpenRouter failed, falling back to Bedrock:", e instanceof Error ? e.message : e);
      return await viaBedrock(args);
    }
  }
  return viaBedrock(args);
}
