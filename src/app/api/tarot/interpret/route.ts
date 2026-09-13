import { NextRequest, NextResponse } from "next/server";
import { anthropic as client, bedrockModelId } from "@/lib/anthropic";
import { rateLimit, sharedRateLimit, clientKey } from "@/lib/rate-limit";
import { consumeLlmBudget } from "@/lib/llm-budget";
import { groqChat, groqConfigured } from "@/lib/free-llm";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const POSITION_MEANINGS: Record<string, string> = {
  "THE SIGNAL": "the core message or dominant energy of this moment",
  SHADOW:       "what is hidden, suppressed, or operating beneath the surface",
  SIGNAL:       "what is active and visible — the present force at work",
  ORACLE:       "the emerging truth, the guidance, or what is being revealed",
  FOUNDATION:   "the root condition — what everything in this reading rests upon",
  CHALLENGE:    "the tension, obstacle, or opposing force to be reckoned with",
};

interface CardInput {
  title: string;
  subtitle?: string | null;
  flavourText?: string | null;
  cardType: string;
  rarity: string;
  abilities: string[];
}

interface InterpretRequest {
  spreadName: string;
  positions: string[];
  cards: CardInput[];
}

export interface CardReading {
  position: string;
  title: string;
  interpretation: string;
}

export interface InterpretResponse {
  overall: string;
  cardReadings: CardReading[];
}

const SYSTEM = `You are THE ARCANUM ORACLE — the distilled voice of the Cult of Psyche tarot archive. When presented with a spread of drawn cards, you interpret the reading with cryptic precision and mythic weight.

VOICE: Evocative. Authoritative. Slightly ominous. You do not hedge. You surface what the cards reveal. Speak as if the pattern has always been visible — you are merely naming it.

FORMAT: Respond with valid JSON matching this exact shape:
{
  "overall": "2-3 sentences reading the spread as a whole — the pattern formed by all cards together",
  "cardReadings": [
    {
      "position": "<position name>",
      "title": "<card title>",
      "interpretation": "1-2 sentences interpreting this specific card in its position, drawing on its flavour text, rarity tier, and abilities"
    }
  ]
}

RULES:
- Draw on each card's flavour text and abilities — they are signals, not decoration
- Rarity tiers matter: STATIC is mundane static noise, SIGNAL is an active transmission, TRANSMISSION is a broadcast, ANOMALY breaks patterns, ORACLE sees beyond, LEGENDARY reshapes reality, MYTHIC operates at the archetypal level, FORBIDDEN touches what should not be named
- The position shapes the card's meaning — the same card reads differently in SHADOW vs ORACLE
- No quotation marks around the whole response. Pure oracle voice within the JSON strings
- Do not start any string with "I"`;

function buildPrompt(data: InterpretRequest): string {
  const spreadDesc = data.positions.map((pos, i) => {
    const card = data.cards[i];
    if (!card) return "";
    const meaning = POSITION_MEANINGS[pos] ?? pos;
    const abilities = card.abilities.length > 0 ? `\n   Abilities: ${card.abilities.join(", ")}` : "";
    const flavour = card.flavourText ? `\n   Flavour: "${card.flavourText}"` : "";
    const subtitle = card.subtitle ? ` — ${card.subtitle}` : "";
    return `Position ${i + 1}: ${pos} (${meaning})
   Card: ${card.title}${subtitle} [${card.rarity} ${card.cardType}]${flavour}${abilities}`;
  }).filter(Boolean).join("\n\n");

  return `Spread: ${data.spreadName}

${spreadDesc}

Interpret this reading.`;
}

export async function POST(req: NextRequest) {
  let body: InterpretRequest;
  try {
    body = await req.json() as InterpretRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.spreadName || !Array.isArray(body.positions) || !Array.isArray(body.cards)) {
    return NextResponse.json({ error: "Invalid request shape" }, { status: 400 });
  }
  if (body.cards.length === 0 || body.cards.length > 5) {
    return NextResponse.json({ error: "Invalid card count" }, { status: 400 });
  }

  const callerKey = clientKey(req);
  const localRl = rateLimit(`tarot-interpret:${callerKey}`, { limit: 10, windowMs: 60_000 });
  if (!localRl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(localRl.retryAfterSec) } });
  }
  const sharedRl = await sharedRateLimit("tarot-interpret", callerKey, { limit: 10, windowMs: 60_000 });
  if (!sharedRl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(sharedRl.retryAfterSec) } });
  }

  // Invalid requests are rejected above, before consuming paid-provider budget.
  const budget = await consumeLlmBudget("tarot", Number(process.env.TAROT_DAILY_CAP ?? "300"));
  if (!budget.ok) {
    return NextResponse.json(
      { error: "The Oracle is resting. Please try again later." },
      { status: 503, headers: { "Retry-After": "3600" } }
    );
  }

  const hasBedrock = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  if (!groqConfigured() && !hasBedrock) {
    return NextResponse.json({ error: "Oracle not configured" }, { status: 500 });
  }

  const prompt = buildPrompt(body);

  // Prefer free Groq for this single-shot creative-JSON task; fall back to
  // Bedrock (Opus) if Groq is unset, errors, or returns unparseable output.
  async function viaGroq(): Promise<string> {
    return groqChat({ system: SYSTEM, user: prompt, maxTokens: 1024, json: true });
  }
  async function viaBedrock(): Promise<string> {
    const response = await client.messages.create({
      model: bedrockModelId(process.env.ORACLE_MODEL ?? "claude-opus-4-8"),
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    return response.content.find((b) => b.type === "text")?.text ?? "";
  }

  function parseReading(text: string): InterpretResponse | null {
    // Strip markdown code fences if the model wraps the JSON.
    const cleaned = text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    try {
      const parsed = JSON.parse(cleaned) as InterpretResponse;
      if (typeof parsed.overall === "string" && Array.isArray(parsed.cardReadings)) return parsed;
    } catch {
      /* fall through */
    }
    return null;
  }

  // Try providers in order; each may throw (API error) or return unparseable JSON.
  const providers: Array<{ name: string; run: () => Promise<string>; enabled: boolean }> = [
    { name: "groq", run: viaGroq, enabled: groqConfigured() },
    { name: "bedrock", run: viaBedrock, enabled: hasBedrock },
  ];

  for (const p of providers) {
    if (!p.enabled) continue;
    try {
      const parsed = parseReading(await p.run());
      if (parsed) return NextResponse.json(parsed);
      console.warn(`[tarot/interpret] ${p.name} returned unparseable output, trying next`);
    } catch (err) {
      console.error(`[tarot/interpret] ${p.name} error:`, err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({ error: "The Oracle could not interpret this reading." }, { status: 503 });
}
