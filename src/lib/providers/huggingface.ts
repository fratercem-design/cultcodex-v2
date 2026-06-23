/**
 * Hugging Face provider — OpenAI-compatible router for chat + feature-extraction embeddings.
 * API: https://huggingface.co/docs/inference-providers
 */

import {
  CompletionRequest,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderInterface,
} from "./types";

export class HuggingFaceProvider implements ProviderInterface {
  name: "huggingface" = "huggingface";
  private apiKey: string;
  private routerUrl = "https://router.huggingface.co/v1";
  private hfInferenceUrl = "https://router.huggingface.co/hf-inference";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || "";
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const res = await fetch("https://huggingface.co/api/whoami-v2", {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    if (!this.isConfigured()) {
      throw new Error("Hugging Face token not configured");
    }

    const model = req.model || "meta-llama/Llama-3.3-70B-Instruct";
    const res = await fetch(`${this.routerUrl}/chat/completions`, {
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
      throw new Error(`Hugging Face API error: ${res.status} - ${err.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
      model: string;
    };

    return {
      content: data.choices[0].message.content,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
      model: data.model,
      provider: "huggingface",
    };
  }

  async embed(req: EmbeddingRequest): Promise<EmbeddingResponse> {
    if (!this.isConfigured()) {
      throw new Error("Hugging Face token not configured");
    }

    const model = req.model || "sentence-transformers/all-MiniLM-L6-v2";
    const texts = Array.isArray(req.text) ? req.text : [req.text];

    // HF feature-extraction handles one input at a time most reliably; map over them.
    const embeddings: number[][] = [];
    for (const text of texts) {
      const res = await fetch(
        `${this.hfInferenceUrl}/models/${model}/pipeline/feature-extraction`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: text }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Hugging Face embeddings error: ${res.status} - ${err.slice(0, 200)}`);
      }

      const vec = (await res.json()) as number[];
      embeddings.push(vec);
    }

    return { embeddings, model, provider: "huggingface" };
  }
}
