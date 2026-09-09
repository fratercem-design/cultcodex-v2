#!/usr/bin/env node

const MODEL = "gemini-3.5-flash-lite";
const apiKey = process.env.GEMINI_API_KEY?.trim();

if (!apiKey) {
  console.error("Gemini smoke test failed: GEMINI_API_KEY is not configured.");
  process.exit(1);
}

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30_000);

try {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: "Reply with exactly: OK" }],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 16,
        },
      }),
      signal: controller.signal,
    },
  );

  if (!response.ok) {
    const body = (await response.text()).replaceAll(apiKey, "[REDACTED]");
    throw new Error(`HTTP ${response.status}: ${body.slice(0, 500)}`);
  }

  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts
    ?.filter((part) => part.thought !== true)
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (text !== "OK") {
    throw new Error(`Unexpected model response: ${JSON.stringify(text ?? "(empty)")}`);
  }

  console.log(`Gemini smoke test passed: model=${MODEL}, response=OK`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Gemini smoke test failed: ${message.replaceAll(apiKey, "[REDACTED]")}`);
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
}
