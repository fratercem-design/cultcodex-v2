// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
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

describe("enrichComplete", () => {
  it("reports every tier's failure, Anthropic's first, not just Bedrock's", async () => {
    vi.resetModules();
    vi.doMock("@anthropic-ai/sdk", () => ({
      default: class {
        messages = { create: () => Promise.reject(new Error("credit balance is too low")) };
      },
    }));
    vi.doMock("@anthropic-ai/bedrock-sdk", () => ({
      default: class {
        messages = {
          create: () => Promise.reject(new Error("Failed to resolve AWS credentials from the credential provider chain.")),
        };
      },
    }));
    clearAll();
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const { enrichComplete } = await import("@/lib/enrichment-llm");

    const err = await enrichComplete({ system: "s", user: "u", maxTokens: 10 }).catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    const msg = (err as Error).message;
    expect(msg.startsWith("anthropic: credit balance is too low")).toBe(true);
    expect(msg).toContain("bedrock: Failed to resolve AWS credentials");

    vi.doUnmock("@anthropic-ai/sdk");
    vi.doUnmock("@anthropic-ai/bedrock-sdk");
  });
});
