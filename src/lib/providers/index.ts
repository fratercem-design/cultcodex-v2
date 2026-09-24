/**
 * Provider abstraction router — selects between Gemini, Groq, Cohere, OpenRouter.
 * Falls back automatically if primary provider is unavailable.
 */

import { CompletionRequest, CompletionResponse, EmbeddingRequest, EmbeddingResponse, ProviderName, ProviderInterface } from "./types";
import { GeminiProvider } from "./gemini";
import { GroqProvider } from "./groq";
import { CohereProvider } from "./cohere";
import { OpenRouterProvider } from "./openrouter";
import { MistralProvider } from "./mistral";
import { HuggingFaceProvider } from "./huggingface";

const providers = {
  gemini: new GeminiProvider(),
  groq: new GroqProvider(),
  cohere: new CohereProvider(),
  openrouter: new OpenRouterProvider(),
  mistral: new MistralProvider(),
  huggingface: new HuggingFaceProvider(),
};

const DEFAULT_COMPLETION_PROVIDER: ProviderName = "groq"; // fastest
const DEFAULT_EMBEDDING_PROVIDER: ProviderName = "cohere"; // best embeddings

export type { CompletionRequest, CompletionResponse, EmbeddingRequest, EmbeddingResponse, ProviderName };

/**
 * Complete with fallback chain: primary → groq → gemini → openrouter
 */
export async function complete(req: CompletionRequest, preferredProvider?: ProviderName): Promise<CompletionResponse> {
  const primary = preferredProvider || (process.env.DEFAULT_LLM_PROVIDER as ProviderName) || DEFAULT_COMPLETION_PROVIDER;
  const fallbackChain: ProviderName[] = (["groq", "gemini", "mistral", "huggingface", "openrouter"] as ProviderName[]).filter((p) => p !== primary);
  fallbackChain.unshift(primary);

  let lastError: Error | null = null;

  for (const providerName of fallbackChain) {
    const provider = providers[providerName];
    if (!provider.isConfigured()) continue;

    try {
      return await provider.complete(req);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Provider ${providerName} failed:`, lastError.message);
      continue;
    }
  }

  throw new Error(`All providers failed. Last error: ${lastError?.message || "unknown"}`);
}

/**
 * Embed with fallback: primary → cohere → openrouter (if it adds support)
 */
export async function embed(req: EmbeddingRequest, preferredProvider?: ProviderName): Promise<EmbeddingResponse> {
  const primary = preferredProvider || (process.env.DEFAULT_EMBEDDING_PROVIDER as ProviderName) || DEFAULT_EMBEDDING_PROVIDER;
  const fallbackChain: ProviderName[] = (["cohere", "mistral", "huggingface", "openrouter"] as ProviderName[]).filter((p) => p !== primary);
  fallbackChain.unshift(primary);

  let lastError: Error | null = null;

  for (const providerName of fallbackChain) {
    const provider = providers[providerName];
    if (!provider.isConfigured()) continue;

    try {
      return await provider.embed(req);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Provider ${providerName} failed for embeddings:`, lastError.message);
      continue;
    }
  }

  throw new Error(`All embedding providers failed. Last error: ${lastError?.message || "unknown"}`);
}

/**
 * Check provider status — useful for admin panel
 */
export async function getProviderStatus(): Promise<Record<ProviderName, boolean>> {
  return {
    gemini: await providers.gemini.testConnection(),
    groq: await providers.groq.testConnection(),
    cohere: await providers.cohere.testConnection(),
    openrouter: await providers.openrouter.testConnection(),
    mistral: await providers.mistral.testConnection(),
    huggingface: await providers.huggingface.testConnection(),
  };
}

export { GeminiProvider, GroqProvider, CohereProvider, OpenRouterProvider, MistralProvider, HuggingFaceProvider };
