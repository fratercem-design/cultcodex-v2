import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
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

// Free OpenAI-compatible tier (Groq / Mistral). Tried before paid Bedrock to
// cut spend and add resilience. Each is skipped silently if its key is unset.
async function viaOpenAICompatible(
  { system, user, maxTokens }: EnrichArgs,
  opts: { apiKey: string | undefined; baseURL: string; model: string; label: string }
): Promise<string> {
  if (!opts.apiKey) throw new Error(`${opts.label}: API key not set`);
  const client = new OpenAI({ apiKey: opts.apiKey, baseURL: opts.baseURL });
  const c = await client.chat.completions.create({
    model: opts.model,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return c.choices[0]?.message?.content ?? "";
}

const viaGroq = (args: EnrichArgs) =>
  viaOpenAICompatible(args, {
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
    model: process.env.ENRICHMENT_GROQ_MODEL ?? "llama-3.3-70b-versatile",
    label: "groq",
  });

const viaMistral = (args: EnrichArgs) =>
  viaOpenAICompatible(args, {
    apiKey: process.env.MISTRAL_API_KEY,
    baseURL: "https://api.mistral.ai/v1",
    model: process.env.ENRICHMENT_MISTRAL_MODEL ?? "mistral-small-latest",
    label: "mistral",
  });

// Direct Anthropic API (api.anthropic.com), billed against prepaid Anthropic
// credits. This is a SEPARATE wallet from Bedrock below, which bills through AWS
// even though it serves the same Claude models — so having Bedrock working tells
// you nothing about whether this tier will.
async function viaAnthropic({ system, user, maxTokens }: EnrichArgs): Promise<string> {
  // Zero-arg constructor also picks up ANTHROPIC_AUTH_TOKEN or an `ant auth login`
  // profile, so an unset ANTHROPIC_API_KEY doesn't necessarily mean no credentials.
  // The explicit check keeps the ladder's "skip silently if unconfigured" contract.
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new Error("anthropic: ANTHROPIC_API_KEY not set");
  }
  // An org-level (unscoped) API key must name a workspace on every request, or the
  // API returns 400 "not scoped to a workspace". Workspace-scoped keys carry it
  // implicitly and must NOT send the header. Setting ANTHROPIC_WORKSPACE_ID makes
  // an unscoped key work; leaving it unset is correct for a scoped key.
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
  const client = new Anthropic(
    workspaceId ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } } : {},
  );
  const model = process.env.ENRICHMENT_ANTHROPIC_MODEL ?? "claude-opus-5";
  const effort = (process.env.ENRICHMENT_EFFORT ?? "medium") as
    | "low"
    | "medium"
    | "high"
    | "xhigh"
    | "max";

  // Thinking is on by default on Opus 5 and its tokens count toward max_tokens,
  // so give headroom — 4096 can truncate the JSON body mid-object. max_tokens is
  // a ceiling, not a charge: only tokens actually produced are billed.
  const r = await client.messages.create({
    model,
    max_tokens: Math.max(maxTokens, 16000),
    output_config: { effort },
    system,
    messages: [{ role: "user", content: user }],
  });

  // Callers JSON.parse this. Return only the text block — a thinking block
  // reaching the parser would throw.
  const tb = r.content.find((b) => b.type === "text");
  return tb && tb.type === "text" ? tb.text : "";
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

// Fallback ladder: try each tier in order, returning the first non-empty result.
// Free tiers (Groq, Mistral) sit before paid Bedrock to cut spend; Bedrock is the
// guaranteed backstop. Set ENRICHMENT_PROVIDER=bedrock to skip straight to it.
type Tier = { name: string; run: (a: EnrichArgs) => Promise<string> };

function ladder(): Tier[] {
  if (process.env.ENRICHMENT_PROVIDER === "bedrock") {
    return [{ name: "bedrock", run: viaBedrock }];
  }
  if (process.env.ENRICHMENT_PROVIDER === "anthropic") {
    return [{ name: "anthropic", run: viaAnthropic }];
  }
  // Default ladder: prepaid Anthropic credits → cheap proxy → free Groq → free
  // Mistral → paid Bedrock backstop. Anthropic leads when a key is present so
  // prepaid credits are actually consumed; it throws and falls through when not.
  return [
    { name: "anthropic", run: viaAnthropic },
    { name: "openrouter", run: viaOpenRouter },
    { name: "groq", run: viaGroq },
    { name: "mistral", run: viaMistral },
    { name: "bedrock", run: viaBedrock },
  ];
}

/**
 * True when at least one tier of the ladder has credentials. Routes gate on
 * this rather than on Bedrock alone: an AWS-only check rejected requests a
 * working Anthropic / OpenRouter / Groq / Mistral key could have served.
 */
export function hasEnrichmentProvider(): boolean {
  return Boolean(
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.ANTHROPIC_AUTH_TOKEN ||
      process.env.OPENROUTER_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.MISTRAL_API_KEY,
  );
}

export const NO_ENRICHMENT_PROVIDER_ERROR =
  "No enrichment provider configured. Set one of ANTHROPIC_API_KEY, OPENROUTER_API_KEY, GROQ_API_KEY, MISTRAL_API_KEY, or AWS credentials for Bedrock.";

export async function enrichComplete(args: EnrichArgs): Promise<string> {
  const tiers = ladder();
  let lastErr: unknown;
  for (const tier of tiers) {
    try {
      const out = await tier.run(args);
      if (out && out.trim()) return out;
      // Empty output → treat as a miss and try the next tier.
      lastErr = new Error(`${tier.name} returned empty output`);
    } catch (e) {
      lastErr = e;
      console.error(`[enrich] ${tier.name} failed, trying next tier:`, e instanceof Error ? e.message : e);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("all enrichment tiers failed");
}
