/**
 * Unified types for AI provider abstraction.
 * Abstracts over Gemini, Groq, Cohere, OpenRouter.
 */

export type ProviderName = "gemini" | "groq" | "cohere" | "openrouter" | "mistral" | "huggingface";

export interface CompletionRequest {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export interface CompletionResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: ProviderName;
}

export interface EmbeddingRequest {
  text: string | string[];
  model?: string;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  provider: ProviderName;
}

export interface ProviderConfig {
  apiKey: string;
  enabled: boolean;
  defaultModel?: string;
  rateLimitPerMinute?: number;
}

export interface ProviderInterface {
  name: ProviderName;
  complete(req: CompletionRequest): Promise<CompletionResponse>;
  embed(req: EmbeddingRequest): Promise<EmbeddingResponse>;
  isConfigured(): boolean;
  testConnection(): Promise<boolean>;
}
