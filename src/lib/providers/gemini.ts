/**
 * Google Gemini provider — multimodal, large context window.
 * API: https://ai.google.dev/
 */

import {
  CompletionRequest,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderInterface,
} from "./types";

export class GeminiProvider implements ProviderInterface {
  name: "gemini" = "gemini";
  private apiKey: string;
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const res = await fetch(
        `${this.baseUrl}/gemini-1.5-pro:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: "hi" }],
              },
            ],
          }),
        }
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    if (!this.isConfigured()) {
      throw new Error("Gemini API key not configured");
    }

    const model = req.model || "gemini-1.5-pro";
    const contents = [
      {
        role: "user",
        parts: [{ text: req.messages[req.messages.length - 1].content }],
      },
    ];

    const res = await fetch(
      `${this.baseUrl}/${model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: req.maxTokens || 2048,
            temperature: req.temperature ?? 0.7,
            topP: req.topP ?? 1.0,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error: ${res.status} - ${err.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      candidates: Array<{
        content: { parts: Array<{ text: string }> };
      }>;
      usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
      };
    };

    return {
      content: data.candidates[0].content.parts[0].text,
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount,
            completionTokens: data.usageMetadata.candidatesTokenCount,
            totalTokens: data.usageMetadata.totalTokenCount,
          }
        : undefined,
      model,
      provider: "gemini",
    };
  }

  async embed(req: EmbeddingRequest): Promise<EmbeddingResponse> {
    // Gemini doesn't have native embeddings; use Cohere
    throw new Error("Gemini does not support embeddings. Use Cohere instead.");
  }
}
