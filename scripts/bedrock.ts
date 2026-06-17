/**
 * Shared AI client for enrichment scripts. Picks a provider in this order:
 *   1. OpenRouter  — if OPENROUTER_API_KEY is set (or USE_OPENROUTER=true)
 *   2. AWS Bedrock — if USE_BEDROCK=true (needs AWS_* creds)
 *   3. Anthropic   — otherwise (ANTHROPIC_API_KEY)
 *
 * Every script goes through complete() so it doesn't care which backend runs.
 * Pin a model with ENRICHMENT_MODEL (or OPENROUTER_MODEL for OpenRouter).
 */
import Anthropic from "@anthropic-ai/sdk";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import OpenAI from "openai";

export type Provider = "openrouter" | "bedrock" | "anthropic";
type Logger = (msg: string) => void;

// Free OpenRouter models for enrichment, ordered most-capable → fallback. If one
// is rate-limited-out or retired, complete() advances to the next. Pin a single
// model with OPENROUTER_MODEL to skip the fallback chain.
const FREE_OPENROUTER_CANDIDATES = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
];

function flag(name: string): boolean {
  const v = (process.env[name] ?? "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

export function usingBedrock(): boolean {
  return flag("USE_BEDROCK");
}

export function usingOpenRouter(): boolean {
  return flag("USE_OPENROUTER") || !!(process.env.OPENROUTER_API_KEY ?? "").trim();
}

export function resolveProvider(): Provider {
  if (usingOpenRouter()) return "openrouter";
  if (usingBedrock()) return "bedrock";
  return "anthropic";
}

// Bedrock candidates ordered cheap-and-widely-available → more capable. Mix of
// inference-profile ids (us.*) and direct foundation-model ids so at least one
// matches whatever the account has enabled.
const BEDROCK_CANDIDATES = [
  "us.anthropic.claude-3-5-haiku-20241022-v1:0",
  "anthropic.claude-3-haiku-20240307-v1:0",
  "us.anthropic.claude-3-haiku-20240307-v1:0",
  "us.anthropic.claude-sonnet-4-5-20251115-v1:0",
  "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
  "anthropic.claude-3-5-sonnet-20240620-v1:0",
];

function isUnavailableError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes("invalid") ||
    msg.includes("not authorized") ||
    msg.includes("don't have access") ||
    msg.includes("access to the model") ||
    msg.includes("could not be found") ||
    msg.includes("not found") ||
    msg.includes("validationexception")
  );
}

async function probeBedrock(client: AnthropicBedrock, log: Logger): Promise<string> {
  for (const model of BEDROCK_CANDIDATES) {
    try {
      await client.messages.create({
        model,
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      });
      return model;
    } catch (err) {
      if (isUnavailableError(err)) {
        log(`  (skipping unavailable Bedrock model: ${model})`);
        continue;
      }
      // Non-availability error (rate limit, etc.) → model exists, use it.
      log(`  (probe of ${model} hit a transient error, using it)`);
      return model;
    }
  }
  throw new Error(
    "No Bedrock model available. Enable Claude model access in the AWS Bedrock " +
      "console (region " + (process.env.AWS_REGION ?? "us-east-1") + "), set " +
      "ENRICHMENT_MODEL to a usable id, or set OPENROUTER_API_KEY to use OpenRouter."
  );
}

let _client: Anthropic | AnthropicBedrock | OpenAI | null = null;
let _model: string | null = null;
let _provider: Provider | null = null;
let _orCandidates: string[] = [];
let _orIdx = 0;

async function ensureReady(log: Logger): Promise<void> {
  if (_client && _model) return;
  _provider = resolveProvider();

  if (_provider === "openrouter") {
    const apiKey = (process.env.OPENROUTER_API_KEY ?? "").trim();
    if (!apiKey) {
      throw new Error(
        "OPENROUTER_API_KEY is empty or missing.\n" +
        "  Env vars loaded: " + Object.keys(process.env).filter(k => !k.startsWith("npm_")).join(", ") + "\n" +
        "  Add  OPENROUTER_API_KEY=sk-or-...  as its own line in .env and re-run."
      );
    }
    const masked = apiKey.length > 8 ? apiKey.slice(0, 8) + "..." + apiKey.slice(-4) : "(short)";
    log(`Provider: OpenRouter — key: ${masked}`);
    _client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://cultcodex.me",
        "X-Title": "CultCodex enrichment",
      },
    });
    const pinned = process.env.OPENROUTER_MODEL ?? process.env.ENRICHMENT_MODEL;
    _orCandidates = pinned ? [pinned] : [...FREE_OPENROUTER_CANDIDATES];
    _orIdx = 0;
    _model = _orCandidates[0];
    log(`Provider: OpenRouter — model: ${_model}${pinned ? "" : ` (+${_orCandidates.length - 1} free fallbacks)`}`);
    return;
  }

  if (_provider === "bedrock") {
    const client = new AnthropicBedrock({ awsRegion: process.env.AWS_REGION ?? "us-east-1" });
    _client = client;
    _model = process.env.ENRICHMENT_MODEL ?? (await probeBedrock(client, log));
    log(`Provider: Bedrock — model: ${_model}`);
    return;
  }

  _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  _model = process.env.ENRICHMENT_MODEL ?? "claude-haiku-4-5-20251001";
  log(`Provider: Anthropic — model: ${_model}`);
}

/** Initialise the client + model and log the chosen provider. Returns the model id. */
export async function init(log: Logger = console.log): Promise<string> {
  await ensureReady(log);
  return _model!;
}

export interface CompleteOptions {
  system: string;
  user: string;
  maxTokens: number;
}

function isRateLimit(err: unknown): boolean {
  const status = (err as { status?: number } | null)?.status;
  if (status === 429) return true;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return msg.includes("rate limit") || msg.includes("429") || msg.includes("too many requests");
}

// A free model that's retired, has no endpoints, or hit its daily cap. Distinct
// from a transient 429 — here we should switch models, not wait and retry.
function isModelExhausted(err: unknown): boolean {
  const status = (err as { status?: number } | null)?.status;
  if (status === 402 || status === 404) return true;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes("no endpoints") ||
    msg.includes("not a valid model") ||
    msg.includes("no allowed providers") ||
    msg.includes("insufficient") ||
    msg.includes("quota") ||
    msg.includes("daily limit") ||
    msg.includes("not found")
  );
}

/** Move to the next free OpenRouter model. Returns false if none are left. */
function advanceOpenRouterModel(log: Logger): boolean {
  if (_provider !== "openrouter" || _orIdx >= _orCandidates.length - 1) return false;
  _orIdx++;
  _model = _orCandidates[_orIdx];
  log(`  (switching to next free model: ${_model})`);
  return true;
}

/** Run one completion through the active provider and return the trimmed text. */
export async function complete(opts: CompleteOptions, log: Logger = console.log): Promise<string> {
  await ensureReady(log);

  // Free OpenRouter tiers cap req/min, so back off and retry on 429.
  const maxAttempts = 5;
  for (let attempt = 1; ; attempt++) {
    try {
      return await runComplete(opts);
    } catch (err) {
      if (isModelExhausted(err) && advanceOpenRouterModel(log)) {
        attempt = 0; // fresh budget for the new model
        continue;
      }
      if (isRateLimit(err) && attempt < maxAttempts) {
        const waitMs = 2000 * attempt;
        log(`  (rate limited — waiting ${waitMs / 1000}s, attempt ${attempt}/${maxAttempts - 1})`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      throw err;
    }
  }
}

async function runComplete(opts: CompleteOptions): Promise<string> {
  if (_provider === "openrouter") {
    const res = await (_client as OpenAI).chat.completions.create({
      model: _model!,
      max_tokens: opts.maxTokens,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    });
    const text = res.choices[0]?.message?.content ?? "";
    if (!text.trim()) throw new Error("No text response");
    return text.trim();
  }

  // Anthropic and Bedrock share the Messages API shape.
  const res = await (_client as Anthropic).messages.create({
    model: _model!,
    max_tokens: opts.maxTokens,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text response");
  return block.text.trim();
}
