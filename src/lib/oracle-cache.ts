import { createHash } from "crypto";
import type { OracleCitation } from "@/app/api/oracle/ask/route";

const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface CachedResponse {
  answer: string;
  citations: OracleCitation[];
  audioBase64: string | null;
  expiresAt: number;
}

const cache = new Map<string, CachedResponse>();

export function oracleCacheKey(question: string, searchContext: unknown): string {
  const normalized = question.trim().toLowerCase();
  const payload = normalized + "\x00" + JSON.stringify(searchContext ?? null);
  return createHash("sha256").update(payload).digest("hex");
}

export function oracleCacheGet(key: string): CachedResponse | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry;
}

export function oracleCacheSet(
  key: string,
  value: Pick<CachedResponse, "answer" | "citations" | "audioBase64">
): void {
  // Opportunistic sweep: evict expired entries when cache grows large.
  if (cache.size > 2000) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (v.expiresAt <= now) cache.delete(k);
    }
  }
  cache.set(key, { ...value, expiresAt: Date.now() + TTL_MS });
}

export function oracleCacheSize(): number {
  return cache.size;
}

export function oracleCacheClear(): void {
  cache.clear();
}
