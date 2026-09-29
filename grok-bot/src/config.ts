import { PERSONAS, type PersonaId } from "./lib/personas.js";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env var ${name} (see .env.example)`);
  return value;
}

function int(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${name} must be a positive integer, got "${raw}"`);
  return n;
}

export interface Config {
  discordToken: string;
  discordClientId: string;
  discordGuildId?: string;
  xaiApiKey: string;
  xaiBaseUrl: string;
  chatModel: string;
  imageModel: string;
  defaultPersona: PersonaId;
  memoryTurns: number;
  memoryTtlMs: number;
  ratePerMinute: number;
  messageContentIntent: boolean;
}

export function loadConfig(): Config {
  const persona = (process.env.DEFAULT_PERSONA?.trim() || "grok") as PersonaId;
  if (!(persona in PERSONAS)) {
    throw new Error(`DEFAULT_PERSONA must be one of: ${Object.keys(PERSONAS).join(", ")}`);
  }
  return {
    discordToken: required("DISCORD_TOKEN"),
    discordClientId: required("DISCORD_CLIENT_ID"),
    discordGuildId: process.env.DISCORD_GUILD_ID?.trim() || undefined,
    xaiApiKey: required("XAI_API_KEY"),
    xaiBaseUrl: (process.env.XAI_BASE_URL?.trim() || "https://api.x.ai/v1").replace(/\/$/, ""),
    chatModel: process.env.GROK_MODEL?.trim() || "grok-4.7",
    imageModel: process.env.GROK_IMAGE_MODEL?.trim() || "grok-imagine-image-2.0",
    defaultPersona: persona,
    memoryTurns: int("MEMORY_TURNS", 12),
    memoryTtlMs: int("MEMORY_TTL_MINUTES", 60) * 60_000,
    ratePerMinute: int("RATE_LIMIT_PER_MINUTE", 6),
    messageContentIntent: process.env.MESSAGE_CONTENT_INTENT?.trim() === "true",
  };
}
