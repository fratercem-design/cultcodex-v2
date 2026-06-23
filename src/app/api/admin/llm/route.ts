import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { complete, type CompletionRequest, type ProviderName } from "@/lib/providers";

// General-purpose multi-provider completion endpoint backed by the free stack
// (Groq → Gemini → Mistral → HuggingFace → OpenRouter, with automatic fallback).
// Admin-gated; rate-limited. POST /api/admin/llm
//   { prompt | messages, provider?, model?, maxTokens?, temperature? }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser().catch(() => null);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const rl = rateLimit(clientKey(req, user.id), { limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limited", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    prompt?: string;
    messages?: CompletionRequest["messages"];
    system?: string;
    provider?: ProviderName;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  };

  const messages: CompletionRequest["messages"] = body.messages
    ? body.messages
    : [
        ...(body.system ? [{ role: "system" as const, content: body.system }] : []),
        { role: "user" as const, content: body.prompt ?? "" },
      ];

  if (!messages.some((m) => m.content?.trim())) {
    return NextResponse.json({ error: "Provide `prompt` or `messages`" }, { status: 400 });
  }

  const start = Date.now();
  try {
    const result = await complete(
      {
        messages,
        model: body.model,
        maxTokens: body.maxTokens,
        temperature: body.temperature,
      },
      body.provider
    );
    return NextResponse.json({ ...result, ms: Date.now() - start });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err), ms: Date.now() - start },
      { status: 502 }
    );
  }
}
