/**
 * Shared Anthropic / AWS Bedrock client helper for enrichment scripts.
 *
 * Set USE_BEDROCK=true to route through AWS Bedrock (needs AWS_ACCESS_KEY_ID,
 * AWS_SECRET_ACCESS_KEY, AWS_REGION). Otherwise uses the Anthropic direct API
 * with ANTHROPIC_API_KEY.
 *
 * On Bedrock, model availability varies per account/region, so resolveModel()
 * probes a list of candidates and returns the first one this account can call.
 * Set ENRICHMENT_MODEL to pin a specific model and skip probing.
 */
import Anthropic from "@anthropic-ai/sdk";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";

export type AIClient = Anthropic | AnthropicBedrock;

export function usingBedrock(): boolean {
  return process.env.USE_BEDROCK === "true";
}

export function makeClient(): AIClient {
  if (usingBedrock()) {
    return new AnthropicBedrock({ awsRegion: process.env.AWS_REGION ?? "us-east-1" });
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// Bedrock candidates ordered cheap-and-widely-available → more capable.
// Mix of inference-profile ids (us.*) and direct foundation-model ids so at
// least one matches whatever the account has enabled.
const BEDROCK_CANDIDATES = [
  "us.anthropic.claude-3-5-haiku-20241022-v1:0",
  "anthropic.claude-3-haiku-20240307-v1:0",
  "us.anthropic.claude-3-haiku-20240307-v1:0",
  "us.anthropic.claude-sonnet-4-5-20251115-v1:0",
  "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
  "anthropic.claude-3-5-sonnet-20240620-v1:0",
];

// Errors that mean "this model id won't work, try the next one" rather than a
// transient failure we should treat as success.
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

/**
 * Returns a usable model id. Direct Anthropic API uses the default below
 * (or ENRICHMENT_MODEL). Bedrock probes BEDROCK_CANDIDATES with a 1-token
 * ping and returns the first that responds, unless ENRICHMENT_MODEL pins one.
 */
export async function resolveModel(
  client: AIClient,
  log: (msg: string) => void = console.log
): Promise<string> {
  if (!usingBedrock()) {
    return process.env.ENRICHMENT_MODEL ?? "claude-haiku-4-5-20251001";
  }

  if (process.env.ENRICHMENT_MODEL) {
    return process.env.ENRICHMENT_MODEL;
  }

  for (const model of BEDROCK_CANDIDATES) {
    try {
      await client.messages.create({
        model,
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      });
      log(`Bedrock model selected: ${model}`);
      return model;
    } catch (err) {
      if (isUnavailableError(err)) {
        log(`  (skipping unavailable Bedrock model: ${model})`);
        continue;
      }
      // Non-availability error (rate limit, etc.) → model exists, use it.
      log(`Bedrock model selected: ${model} (probe hit a transient error, proceeding)`);
      return model;
    }
  }

  throw new Error(
    "No Bedrock model available. Enable Claude model access in the AWS Bedrock " +
      "console (region " + (process.env.AWS_REGION ?? "us-east-1") + "), or set " +
      "ENRICHMENT_MODEL to a model id your account can use."
  );
}
