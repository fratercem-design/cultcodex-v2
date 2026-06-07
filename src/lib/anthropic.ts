import Anthropic from "@anthropic-ai/sdk";

// Pinned base URL prevents ANTHROPIC_BASE_URL env var from silently routing
// API calls through a proxy that may not support all Claude models.
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: "https://api.anthropic.com",
});
