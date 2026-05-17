import OpenAI from "openai";

const MODEL = "text-embedding-3-small";

let _client: OpenAI | null = null;
function client(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}
const DIMENSIONS = 1536;
// OpenAI max inputs per batch call
const BATCH_SIZE = 2048;

/** Format a segment for embedding — speaker label gives retrieval signal. */
export function segmentToEmbedText(speakerLabel: string | null, text: string): string {
  return speakerLabel ? `${speakerLabel}: ${text}` : text;
}

/** Embed a single string. Returns a 1536-dim float array. */
export async function embedOne(text: string): Promise<number[]> {
  const res = await client().embeddings.create({
    model: MODEL,
    input: text,
    dimensions: DIMENSIONS,
  });
  return res.data[0].embedding;
}

/** Embed up to BATCH_SIZE strings in one API call. Returns parallel array of vectors. */
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
  // OpenAI returns results sorted by index
  return res.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

/** Postgres literal for a float array: '[0.1,0.2,...]'::vector */
export function vectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}
