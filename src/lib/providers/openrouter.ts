/**
 * OpenRouter provider — access to 100+ models, fallback routing.
 * API: https://openrouter.ai/docs/
 */

import {
  CompletionRequest,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderInterface,
} from "./types";

export class OpenRouterProvider implements ProviderInterface {
  name: "openrouter" = "openrouter";
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || "";
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const res = await fetch(`${this.baseUrl}/auth/key`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    if (!this.isConfigured()) {
      throw new Error("OpenRouter API key not configured");
    }

    // OpenRouter-free rotating models (as of 2026)
    // Falls back to these if specified model unavailable
    const model = req.model || "openai/gpt-3.5-turbo";

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cultcodex.me",
        "X-Title": "Cult Codex",
      },
      body: JSON.stringify({
        model,
        messages: req.messages,
        max_tokens: req.maxTokens || 2048,
        temperature: req.temperature ?? 0.7,
        top_p: req.topP ?? 1.0,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(
        `OpenRouter API error: ${res.status} - ${err.slice(0, 200)}`
      );
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
      model: string;
    };

    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      model: data.model,
      provider: "openrouter",
    };
  }

  async embed(req: EmbeddingRequest): Promise<EmbeddingResponse> {
    // OpenRouter doesn't provide embeddings. Use Cohere.
    throw new Error(
      "OpenRouter does not support embeddings. Use Cohere instead."
    );
  }
}
