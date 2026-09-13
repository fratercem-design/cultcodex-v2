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

export const GEMINI_DEFAULT_MODEL = "gemini-3.5-flash-lite";

const GEMINI_REQUEST_TIMEOUT_MS = 30_000;

type GeminiPart = {
  text?: string;
  thought?: boolean;
};

export class GeminiProvider implements ProviderInterface {
  name = "gemini" as const;
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(
        `${this.baseUrl}/${GEMINI_DEFAULT_MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": this.apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: "hi" }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 8,
              temperature: 0,
            },
          }),
          signal: controller.signal,
        }
      );
      return res.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    if (!this.isConfigured()) {
      throw new Error("Gemini API key not configured");
    }

    const model = req.model || GEMINI_DEFAULT_MODEL;
    const lastMessage = req.messages.at(-1);
    if (!lastMessage) {
      throw new Error("Gemini completion requires at least one message");
    }

    const contents = [
      {
        role: "user",
        parts: [{ text: lastMessage.content }],
      },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_REQUEST_TIMEOUT_MS);
    let res: Response;

    try {
      res = await fetch(`${this.baseUrl}/${model}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: req.maxTokens || 2048,
            temperature: req.temperature ?? 0.7,
            topP: req.topP ?? 1.0,
          },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const err = (await res.text()).replaceAll(this.apiKey, "[REDACTED]");
      throw new Error(`Gemini API error: ${res.status} - ${err.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: GeminiPart[] };
      }>;
      usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
      };
    };

    const content = data.candidates?.[0]?.content?.parts
      ?.filter((part) => part.thought !== true)
      .map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!content) {
      throw new Error("Gemini API returned no text content");
    }

    return {
      content,
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
    void req;
    // Gemini doesn't have native embeddings; use Cohere
    throw new Error("Gemini does not support embeddings. Use Cohere instead.");
  }
}
