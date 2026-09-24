/**
 * Cohere provider — embeddings + enterprise RAG models.
 * API: https://cohere.com/docs/
 */

import {
  CompletionRequest,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderInterface,
} from "./types";

export class CohereProvider implements ProviderInterface {
  name = "cohere" as const;
  private apiKey: string;
  private baseUrl = "https://api.cohere.ai/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.COHERE_API_KEY || "";
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const res = await fetch(`${this.baseUrl}/check`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return res.status === 200 || res.status === 401; // 401 still means API is up
    } catch {
      return false;
    }
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    // Cohere can do completions with command-r-plus, but it's not ideal.
    // Prefer Groq/Gemini for general chat.
    throw new Error(
      "Use Groq or Gemini for completions. Cohere is optimized for embeddings."
    );
  }

  async embed(req: EmbeddingRequest): Promise<EmbeddingResponse> {
    if (!this.isConfigured()) {
      throw new Error("Cohere API key not configured");
    }

    const texts = Array.isArray(req.text) ? req.text : [req.text];
    const model = req.model || "embed-english-v3.0";

    const res = await fetch(`${this.baseUrl}/embed`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        texts,
        model,
        input_type: "search_document",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(
        `Cohere API error: ${res.status} - ${err.slice(0, 200)}`
      );
    }

    const data = (await res.json()) as {
      embeddings: number[][];
      model: string;
    };

    return {
      embeddings: data.embeddings,
      model: data.model,
      provider: "cohere",
    };
  }
}
