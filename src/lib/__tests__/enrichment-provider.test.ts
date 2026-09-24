// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { hasEnrichmentProvider } from "@/lib/enrichment-llm";

const KEYS = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_AUTH_TOKEN",
  "OPENROUTER_API_KEY",
  "GROQ_API_KEY",
  "MISTRAL_API_KEY",
] as const;

const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

function clearAll() {
  for (const k of KEYS) delete process.env[k];
}

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("hasEnrichmentProvider", () => {
  it("is false with no provider credentials", () => {
    clearAll();
    expect(hasEnrichmentProvider()).toBe(false);
  });

  it("accepts a direct Anthropic key without AWS (the Fly setup)", () => {
    clearAll();
    process.env.ANTHROPIC_API_KEY = "sk-test";
    expect(hasEnrichmentProvider()).toBe(true);
  });

  it("accepts OpenRouter alone", () => {
    clearAll();
    process.env.OPENROUTER_API_KEY = "or-test";
    expect(hasEnrichmentProvider()).toBe(true);
  });

  it("needs both AWS keys for Bedrock", () => {
    clearAll();
    process.env.AWS_ACCESS_KEY_ID = "id";
    expect(hasEnrichmentProvider()).toBe(false);
    process.env.AWS_SECRET_ACCESS_KEY = "secret";
    expect(hasEnrichmentProvider()).toBe(true);
  });
});
