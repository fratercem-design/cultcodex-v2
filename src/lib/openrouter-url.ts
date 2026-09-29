export const OPENROUTER_DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * The base URL for an OpenRouter-compatible client: the override when one is
 * set (OPENROUTER_BASE_URL, e.g. the Bluesminds proxy), else OpenRouter.
 * Refuses anything but https, since the client sends the API key on every
 * request and an http:// override would put it on the wire in cleartext.
 */
export function openRouterBaseURL(override: string | undefined): string {
  const baseURL = override || OPENROUTER_DEFAULT_BASE_URL;
  if (new URL(baseURL).protocol !== "https:") {
    throw new Error("OPENROUTER_BASE_URL must use https");
  }
  return baseURL;
}
