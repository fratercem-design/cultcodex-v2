import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";

export const anthropic = new AnthropicBedrock({
  awsRegion: process.env.AWS_REGION ?? "us-east-1",
});

// Maps Anthropic direct-API model IDs → Bedrock cross-region inference profile IDs.
// Models without dates in their direct-API name need explicit mapping here.
const BEDROCK_MODEL_MAP: Record<string, string> = {
  // Claude Opus 4.x
  "claude-opus-4-8":          "us.anthropic.claude-opus-4-1-20250805-v1:0",
  "claude-opus-4-5":          "us.anthropic.claude-opus-4-20250514-v1:0",
  "claude-opus-4-0":          "us.anthropic.claude-opus-4-20250514-v1:0",
  "claude-4-opus-20250514":   "us.anthropic.claude-opus-4-20250514-v1:0",
  // Claude Sonnet 4.x
  "claude-sonnet-4-6":        "us.anthropic.claude-sonnet-4-5-20251115-v1:0",
  // Claude 3.5 (always available on Bedrock)
  "claude-3-5-sonnet-20241022": "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
  "claude-3-5-haiku-20241022":  "us.anthropic.claude-3-5-haiku-20241022-v1:0",
};

export function bedrockModelId(model: string): string {
  // Already a Bedrock ID — pass through
  if (model.includes(":") || model.startsWith("us.anthropic.") || model.startsWith("anthropic.")) return model;
  // Known mapping
  if (BEDROCK_MODEL_MAP[model]) return BEDROCK_MODEL_MAP[model];
  // Non-Anthropic input (gpt-4o, gemini-*, …) would fabricate an invalid Bedrock ID
  // like `us.anthropic.gpt-4o-v1:0` and surface later as a deep runtime error.
  // Fail fast at the seam so a misrouted *_MODEL env var is loud and immediate.
  if (!model.startsWith("claude")) {
    throw new Error(`bedrockModelId: "${model}" is not an Anthropic model — check the *_MODEL env var feeding this call`);
  }
  // Model ID already contains a date (e.g. claude-haiku-4-5-20251001) — append version suffix
  return `us.anthropic.${model}-v1:0`;
}
