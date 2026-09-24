/**
 * Reduce an untrusted post-sign-in destination to a same-origin path.
 *
 * `startsWith("/") && !startsWith("//")` is not enough: browsers treat `\` as
 * `/` in URLs, so `/\evil.com` navigates to `//evil.com`, and tabs/newlines
 * are stripped before parsing. Anything that doesn't resolve to the same
 * origin as a plain path falls back to `fallback`.
 */
export function safeRedirectPath(raw: unknown, fallback = "/"): string {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw[1] === "/" || raw[1] === "\\") return fallback;
  // Control chars (incl. tab/CR/LF, which URL parsers drop) and backslashes.
  if (/[\u0000-\u001f\u007f\\]/.test(raw)) return fallback;
  try {
    const base = "https://cultcodex.invalid";
    const url = new URL(raw, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
