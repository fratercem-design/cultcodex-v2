// Optional Tavily web lookup for enrichment scripts. Off unless a script is run
// with --web; needs TAVILY_API_KEY. Returns "" on any failure so enrichment
// falls back to archive-only input.
import { tavily } from "@tavily/core";

export interface WebResult {
  title: string;
  url: string;
  content: string;
}

export function formatWebContext(results: WebResult[], maxChars = 400): string {
  return results
    .filter((r) => r.content.trim())
    .map((r) => `- ${r.title} (${r.url}): ${r.content.trim().slice(0, maxChars)}`)
    .join("\n");
}

export async function fetchWebContext(query: string, maxResults = 3): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY not set");
  try {
    const res = await tavily({ apiKey }).search(query, { maxResults, searchDepth: "basic" });
    return formatWebContext(res.results);
  } catch (err) {
    console.error(`[web-context] search failed for "${query}":`, err instanceof Error ? err.message : err);
    return "";
  }
}
