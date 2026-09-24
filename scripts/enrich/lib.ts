// scripts/enrich/lib.ts
import { config } from "dotenv";
config({ override: true });
import Anthropic from "@anthropic-ai/sdk";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import OpenAI from "openai";
import { EnrichmentResultSchema, type EnrichmentResult } from "./schemas";

interface RawSegment {
  offset: number;
  duration: number;
  text: string;
}

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function buildTranscriptText(segments: RawSegment[]): string {
  if (segments.length === 0) return "";
  return segments
    .map((seg) => `[${formatTimestamp(seg.offset)}] ${seg.text}`)
    .join("\n");
}

export const SYSTEM_PROMPT = `You are an expert analyst for the "Cult of Psyche" podcast/livestream archive. This show features tarot readings, open panel discussions, consciousness exploration, mythology deep-dives, and occult topics. The host is known as "Psyche" or "Trix."

Your task: analyze the provided episode transcript and extract structured data. Be accurate — only extract what is genuinely present in the transcript. Do not hallucinate guests, quotes, or lore that aren't discussed.

Return a JSON object with this exact structure:
{
  "summaryShort": "1-2 sentence summary of the episode",
  "summaryFacts": "WHAT HAPPENED — 2-3 paragraphs, transcript-grounded. Cover who appeared, what was discussed, key events and exchanges, in the order they occurred. Embed [MM:SS] or [H:MM:SS] timestamps when referencing specific moments. Use only timestamps from the provided transcript. Aim for 3–6 timestamp references. Write like a TV recap — clear, specific, no interpretation.",
  "summaryThemes": "INTERPRETIVE LAYER — 1-2 paragraphs. Identify recurring patterns, thematic threads, and what this episode represents in the context of the show. Explicitly frame everything as interpretation: 'appears to', 'suggests', 'continues the pattern of'. Do NOT repeat facts from summaryFacts — only add the layer of meaning. Keep it grounded; avoid mythology (that belongs to the Psychenomicon).",
  "cutOfPsyche": "A characteristic or memorable quote/moment from this episode (verbatim from transcript if possible)",
  "guests": [
    {
      "name": "Display name of the person",
      "personType": "guest|host|mentioned|recurring",
      "shortBio": "Brief description based on what's known from the episode"
    }
  ],
  "quotes": [
    {
      "text": "Exact quote text from the transcript",
      "speaker": "Name of the speaker",
      "timestampSeconds": 1234,
      "context": "What was being discussed when this was said",
      "significance": "Why this quote is notable"
    }
  ],
  "lore": [
    {
      "title": "Name of the concept, myth, or recurring theme",
      "summary": "Brief explanation of this lore element",
      "canonStatus": "canonical|speculative|community_myth|disputed|humorous",
      "category": "cosmology|character|event|concept|ritual|prophecy|artifact|location"
    }
  ],
  "topics": ["topic1", "topic2"]
}

Guidelines:
- For guests: include the host as personType "host". Panel participants are "guest". People discussed but not present are "mentioned".
- For quotes: extract the 3-5 most notable, interesting, or representative quotes. Include timestamp in seconds if identifiable from transcript timestamps.
- For summaryFacts: embed [MM:SS] or [H:MM:SS] timestamps for specific moments. Use only timestamps from the transcript. Omit if no transcript available.
- For summaryThemes: frame as interpretation — "appears to", "suggests", "continues the pattern of". Never assert facts; those go in summaryFacts.
- For lore: identify mythology references, recurring show concepts, tarot interpretations, or spiritual/occult ideas discussed. Use canonStatus to reflect how definitively the idea is presented.
- For topics: list the main subjects discussed (e.g., "tarot", "consciousness", "astrology", "Greek mythology").
- Return ONLY valid JSON. No markdown, no code fences, no explanation.

LANGUAGE RULES — CRITICAL:
- Use observational, on-stream descriptive language. Summaries describe what happened and was discussed on stream.
- Never use clinical or psychiatric terminology (e.g. "paranoid," "delusional," "narcissistic," "erratic," "unstable," "psychotic," "manipulative").
- Describe what people expressed or said — not diagnoses. E.g. "expressed suspicion about…" not "displayed paranoia about…"; "reacted with visible frustration" not "had an erratic episode."`;

interface UserMessageInput {
  title: string;
  episodeNumber: number;
  airDate: string;
  description: string;
  transcript: string;
}

export function buildUserMessage(input: UserMessageInput): string {
  return `Episode: "${input.title}"
Episode ${input.episodeNumber} — Aired ${input.airDate}

Description:
${input.description}

Transcript:
${input.transcript}`;
}

// ── Provider setup ────────────────────────────────────────────────────────────
// ENRICHMENT_PROVIDER=bedrock    → AWS Bedrock (default)
// ENRICHMENT_PROVIDER=anthropic  → Anthropic direct API
// ENRICHMENT_PROVIDER=openai     → OpenAI, falls back to OpenRouter free on credit/rate errors
// ENRICHMENT_PROVIDER=openrouter → OpenRouter only
// ENRICHMENT_MODEL overrides the default model for the chosen provider.

let _anthropic: Anthropic | AnthropicBedrock | null = null;
let _openaiClient: OpenAI | null = null;
let _openrouterClient: OpenAI | null = null;

function getProvider(): "bedrock" | "anthropic" | "openai" | "openrouter" {
  return (process.env.ENRICHMENT_PROVIDER ?? "bedrock") as "bedrock" | "anthropic" | "openai" | "openrouter";
}

function getAnthropicClient(): Anthropic | AnthropicBedrock {
  if (_anthropic) return _anthropic;
  if (getProvider() === "bedrock") {
    _anthropic = new AnthropicBedrock({ awsRegion: process.env.AWS_REGION ?? "us-east-1" });
  } else {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
    const baseURL = process.env.ANTHROPIC_BASE_URL;
    _anthropic = new Anthropic({ apiKey, ...(baseURL ? { baseURL } : {}) });
  }
  return _anthropic;
}

function buildOpenAIClient(): OpenAI {
  if (_openaiClient) return _openaiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  _openaiClient = new OpenAI({ apiKey });
  return _openaiClient;
}

function buildOpenRouterClient(): OpenAI {
  if (_openrouterClient) return _openrouterClient;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");
  const baseURL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
  _openrouterClient = new OpenAI({
    apiKey,
    baseURL,
    defaultHeaders: { "HTTP-Referer": "https://cultcodex.me" },
  });
  return _openrouterClient;
}

function isCreditOrRateError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("insufficient_quota") ||
    msg.includes("credit balance") ||
    msg.includes("402") ||
    msg.includes("429") ||
    msg.includes("maximum context length") ||
    msg.includes("context_length_exceeded")
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callChatAPI(client: OpenAI, model: string, input: UserMessageInput, jsonMode: boolean): Promise<string> {
  // Free OpenRouter models sometimes answer 200 with an error body and no
  // `choices` (upstream rate limit / provider hiccup). Reading choices[0] off
  // that threw "Cannot read properties of undefined (reading '0')" within a
  // second - 6 of 16 episodes in run 35937449031. Surface the real error and
  // retry with backoff before giving up.
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(15_000 * attempt);
    try {
      const response = await client.chat.completions.create({
        model,
        max_tokens: 8192,
        ...(jsonMode ? { response_format: { type: "json_object" as const } } : {}),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(input) },
        ],
      });
      const text = response.choices?.[0]?.message?.content;
      if (text) return text.trim();
      const apiError = (response as unknown as { error?: { message?: string; code?: unknown } }).error;
      lastErr = new Error(
        apiError
          ? `${model} returned an error: ${apiError.message ?? JSON.stringify(apiError)}`
          : `No text response from ${model}`,
      );
    } catch (err) {
      lastErr = err;
      // Only rate limits / 5xx are worth retrying; anything else fails fast.
      const msg = err instanceof Error ? err.message : String(err);
      if (!/429|rate|5\d\d|timeout|ECONNRESET/i.test(msg)) throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/**
 * Escape raw control characters that appear inside JSON string literals.
 * Models occasionally emit a literal tab or newline inside a string, which
 * JSON.parse rejects ("Bad control character in string literal"). Whitespace
 * between tokens is left alone, so valid JSON passes through unchanged.
 */
export function escapeControlCharsInStrings(json: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (const ch of json) {
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      } else if (ch < " ") {
        const map: Record<string, string> = { "\n": "\\n", "\r": "\\r", "\t": "\\t" };
        out += map[ch] ?? `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`;
        continue;
      }
    } else if (ch === '"') {
      inString = true;
    }
    out += ch;
  }
  return out;
}

function resolveEnrichModel(): string {
  const raw = process.env.ENRICHMENT_MODEL ?? "claude-sonnet-4-6";
  const provider = getProvider();
  if (provider !== "bedrock") return raw;
  if (raw.includes(":") || raw.startsWith("us.anthropic.") || raw.startsWith("anthropic.")) return raw;
  return `us.anthropic.${raw}-v1:0`;
}

async function enrichWithAnthropic(input: UserMessageInput): Promise<string> {
  const client = getAnthropicClient();
  const model = resolveEnrichModel();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (client as any).messages.create({
    model,
    // 4096 tokens is ~16.4k characters, and long episodes produce enrichment
    // JSON past that - the response is cut mid-string and JSON.parse dies with
    // "Unterminated string in JSON at position 17477". Deterministic: the same
    // episodes fail every retry. Observed on 5 of 150 in run 34568545977.
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(input) }],
  });
  const textBlock = response.content.find((b: { type: string }) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text response from Claude");
  return (textBlock as { type: "text"; text: string }).text.trim();
}

export async function enrichEpisode(
  input: UserMessageInput
): Promise<EnrichmentResult> {
  const provider = getProvider();
  let jsonText: string;

  if (provider === "bedrock" || provider === "anthropic") {
    jsonText = await enrichWithAnthropic(input);
  } else if (provider === "openai") {
    // Try OpenAI first; fall back to free OpenRouter model on credit/rate errors
    try {
      const model = process.env.ENRICHMENT_MODEL ?? "gpt-4o-mini";
      jsonText = await callChatAPI(buildOpenAIClient(), model, input, true);
    } catch (err) {
      if (isCreditOrRateError(err)) {
        console.warn(`  ⚠ OpenAI limit hit — falling back to OpenRouter free model`);
        jsonText = await callChatAPI(buildOpenRouterClient(), "google/gemma-4-26b-a4b-it:free", input, false);
      } else {
        throw err;
      }
    }
  } else if (provider === "openrouter") {
    const model = process.env.ENRICHMENT_MODEL ?? "google/gemma-4-26b-a4b-it:free";
    try {
      jsonText = await callChatAPI(buildOpenRouterClient(), model, input, false);
    } catch (err) {
      if (isCreditOrRateError(err) && process.env.OPENROUTER_FALLBACK_KEY) {
        console.warn(`  ⚠ Primary OpenRouter/Bluesminds failed — falling back to OpenRouter free`);
        const fallback = new OpenAI({ apiKey: process.env.OPENROUTER_FALLBACK_KEY, baseURL: "https://openrouter.ai/api/v1", defaultHeaders: { "HTTP-Referer": "https://cultcodex.me" } });
        jsonText = await callChatAPI(fallback, "google/gemma-4-26b-a4b-it:free", input, false);
      } else {
        throw err;
      }
    }
  }

  // Strip accidental markdown fences
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(escapeControlCharsInStrings(jsonText));
  return EnrichmentResultSchema.parse(parsed);
}
