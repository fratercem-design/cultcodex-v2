import OpenAI from "openai";

const MODEL = "text-embedding-3-small";

let _client: OpenAI | null = null;
function client(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPENAI_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY (or OPENAI_KEY) environment variable is not set");
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}
const DIMENSIONS = 1536;
const BATCH_SIZE = 2048;

/** Process-local LRU so repeat concepts on the same instance do not bill twice. */
const embedCache = new Map<string, number[]>();
const EMBED_CACHE_MAX = 256;

function cacheSet(text: string, vec: number[]) {
  if (embedCache.size >= EMBED_CACHE_MAX) {
    const first = embedCache.keys().next().value;
    if (first !== undefined) embedCache.delete(first);
  }
  embedCache.set(text, vec);
}

export function segmentToEmbedText(speakerLabel: string | null, text: string): string {
  return speakerLabel ? `${speakerLabel}: ${text}` : text;
}

export async function embedOne(text: string): Promise<number[]> {
  const hit = embedCache.get(text);
  if (hit) return hit;
  const res = await client().embeddings.create({
    model: MODEL,
    input: text,
    dimensions: DIMENSIONS,
  });
  const vec = res.data[0].embedding;
  cacheSet(text, vec);
  return vec;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.length > BATCH_SIZE) {
    throw new Error(`embedBatch: max ${BATCH_SIZE} inputs, got ${texts.length}`);
  }
  const res = await client().embeddings.create({
    model: MODEL,
    input: texts,
    dimensions: DIMENSIONS,
  });
  return res.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

export function vectorLiteral(v: number[]): string {
  if (!Array.isArray(v) || v.some((n) => typeof n !== "number" || !Number.isFinite(n))) {
    throw new Error("vectorLiteral: embedding is not a finite number array");
  }
  return `[${v.join(",")}]`;
}
