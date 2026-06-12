import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";

export const anthropic = new AnthropicBedrock({
  awsRegion: process.env.AWS_REGION ?? "us-east-1",
});

export function bedrockModelId(model: string): string {
  if (model.includes(":") || model.startsWith("us.anthropic.") || model.startsWith("anthropic.")) return model;
  return `us.anthropic.${model}-v1:0`;
}
