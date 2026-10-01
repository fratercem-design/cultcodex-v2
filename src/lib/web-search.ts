const TAVILY_URL = "https://api.tavily.com/search";
const TIMEOUT_MS = 8000;

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
}

export function webSearchConfigured(): boolean {
  return Boolean(process.env.TAVILY_API_KEY);
}

/** Live web search via Tavily. Throws on HTTP or network failure. */
export async function webSearch(query: string, maxResults = 5): Promise<WebSearchResult[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error("TAVILY_API_KEY is not set");

  const res = await fetch(TAVILY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ query, max_results: Math.min(Math.max(maxResults, 1), 8), search_depth: "basic" }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Tavily search failed: HTTP ${res.status}`);

  const data = (await res.json()) as { results?: Array<{ title?: string; url?: string; content?: string }> };
  return (data.results ?? []).map((r) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    content: (r.content ?? "").slice(0, 600),
  }));
}
