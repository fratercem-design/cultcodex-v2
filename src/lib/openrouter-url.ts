export const OPENROUTER_DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * The base URL for an OpenRouter-compatible client: the override when one is
 * set (OPENROUTER_BASE_URL, e.g. the Bluesminds proxy), else OpenRouter.
 * Refuses anything but https, since the client sends the API key on every
 * request and an http:// override would put it on the wire in cleartext.
 */
export function openRouterBaseURL(override: string | undefined): string {
  return requireHttps(override || OPENROUTER_DEFAULT_BASE_URL, "OPENROUTER_BASE_URL");
}

/** Returns `url` unchanged, or throws when it isn't https: an API key must never go out in cleartext. */
export function requireHttps(url: string, label: string): string {
  if (new URL(url).protocol !== "https:") throw new Error(`${label} must use https`);
  return url;
}
