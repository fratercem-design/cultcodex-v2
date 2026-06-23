/**
 * Mistral provider — fast, efficient open-weight models + embeddings.
 * API: https://docs.mistral.ai/
 */

import {
  CompletionRequest,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderInterface,
} from "./types";

export class MistralProvider implements ProviderInterface {
  name: "mistral" = "mistral";
  private apiKey: string;
  private baseUrl = "https://api.mistral.ai/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.MISTRAL_API_KEY || "";
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    if (!this.isConfigured()) {
      throw new Error("Mistral API key not configured");
    }

    const model = req.model || "mistral-small-latest";
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
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
      throw new Error(`Mistral API error: ${res.status} - ${err.slice(0, 200)}`);
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
      provider: "mistral",
    };
  }

  async embed(req: EmbeddingRequest): Promise<EmbeddingResponse> {
    if (!this.isConfigured()) {
      throw new Error("Mistral API key not configured");
    }

    const texts = Array.isArray(req.text) ? req.text : [req.text];
    const model = req.model || "mistral-embed";

    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, input: texts }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Mistral embeddings error: ${res.status} - ${err.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      data: Array<{ embedding: number[] }>;
      model: string;
    };

    return {
      embeddings: data.data.map((d) => d.embedding),
      model: data.model,
      provider: "mistral",
    };
  }
}
