#!/usr/bin/env node

import {
  GEMINI_DEFAULT_MODEL,
  GeminiProvider,
} from "../../src/lib/providers/gemini.ts";

const apiKey = process.env.GEMINI_API_KEY?.trim();

if (!apiKey) {
  console.error("Gemini smoke test failed: GEMINI_API_KEY is not configured.");
  process.exit(1);
}

try {
  const provider = new GeminiProvider(apiKey);
  const response = await provider.complete({
    messages: [{ role: "user", content: "Reply with exactly: OK" }],
    temperature: 0,
    maxTokens: 16,
  });

  if (response.content !== "OK") {
    throw new Error(
      `Unexpected model response: ${JSON.stringify(response.content ?? "(empty)")}`,
    );
  }

  console.log(
    `Gemini smoke test passed: model=${GEMINI_DEFAULT_MODEL}, response=OK`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Gemini smoke test failed: ${message.replaceAll(apiKey, "[REDACTED]")}`);
  process.exitCode = 1;
}
