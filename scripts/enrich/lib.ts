// scripts/enrich/lib.ts
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { EnrichmentResultSchema, type EnrichmentResult } from "./schemas";

interface RawSegment {
  offset: number;
  duration: number;
  text: string;
}

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function buildTranscriptText(segments: RawSegment[]): string {
  if (segments.length === 0) return "";
  return segments
    .map((seg) => `[${formatTimestamp(seg.offset)}] ${seg.text}`)
    .join("\n");
}

export const SYSTEM_PROMPT = `You are an expert analyst for the "Cult of Psyche" podcast/livestream archive. This show features tarot readings, open panel discussions, consciousness exploration, mythology deep-dives, and occult topics. The host is known as "Psyche" or "Trix."

Your task: analyze the provided episode transcript and extract structured data. Be accurate — only extract what is genuinely present in the transcript. Do not hallucinate guests, quotes, or lore that aren't discussed.

Return a JSON object with this exact structure:
{
  "summaryShort": "1-2 sentence summary of the episode",
  "summaryLong": "2-3 paragraph comprehensive summary covering main topics, key moments, and themes",
  "cutOfPsyche": "A characteristic or memorable quote/moment from this episode (verbatim from transcript if possible)",
  "guests": [
    {
      "name": "Display name of the person",
      "personType": "guest|host|mentioned|recurring",
      "shortBio": "Brief description based on what's known from the episode"
    }
  ],
  "quotes": [
    {
      "text": "Exact quote text from the transcript",
      "speaker": "Name of the speaker",
      "timestampSeconds": 1234,
      "context": "What was being discussed when this was said",
      "significance": "Why this quote is notable"
    }
  ],
  "lore": [
    {
      "title": "Name of the concept, myth, or recurring theme",
      "summary": "Brief explanation of this lore element",
      "canonStatus": "canonical|speculative|community_myth|disputed|humorous",
      "category": "cosmology|character|event|concept|ritual|prophecy|artifact|location"
    }
  ],
  "topics": ["topic1", "topic2"]
}

Guidelines:
- For guests: include the host as personType "host". Panel participants are "guest". People discussed but not present are "mentioned".
- For quotes: extract the 3-5 most notable, interesting, or representative quotes. Include timestamp in seconds if identifiable from transcript timestamps.
- For lore: identify mythology references, recurring show concepts, tarot interpretations, or spiritual/occult ideas discussed. Use canonStatus to reflect how definitively the idea is presented.
- For topics: list the main subjects discussed (e.g., "tarot", "consciousness", "astrology", "Greek mythology").
- Return ONLY valid JSON. No markdown, no code fences, no explanation.`;

interface UserMessageInput {
  title: string;
  episodeNumber: number;
  airDate: string;
  description: string;
  transcript: string;
}

export function buildUserMessage(input: UserMessageInput): string {
  return `Episode: "${input.title}"
Episode ${input.episodeNumber} — Aired ${input.airDate}

Description:
${input.description}

Transcript:
${input.transcript}`;
}

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  _client = new Anthropic({ apiKey });
  return _client;
}

export async function enrichEpisode(
  input: UserMessageInput
): Promise<EnrichmentResult> {
  const client = getClient();
  const model = process.env.ENRICHMENT_MODEL ?? "claude-sonnet-4-6-20250514";

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(input) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  let jsonText = textBlock.text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(jsonText);
  return EnrichmentResultSchema.parse(parsed);
}
