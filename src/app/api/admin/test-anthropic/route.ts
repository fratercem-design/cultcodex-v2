import { NextResponse } from "next/server";
import { anthropic as client, bedrockModelId } from "@/lib/anthropic";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return NextResponse.json({ error: "AWS Bedrock credentials not set" }, { status: 500 });
  }

  const start = Date.now();
  try {
    const msg = await client.messages.create({
      model: bedrockModelId(process.env.ENRICHMENT_FALLBACK_MODEL ?? "us.anthropic.claude-haiku-4-5-20251001-v1:0"),
      max_tokens: 10,
      messages: [{ role: "user", content: "Say OK" }],
    });
    return NextResponse.json({
      ok: true,
      response: msg.content[0],
      ms: Date.now() - start,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      ms: Date.now() - start,
    }, { status: 500 });
  }
}
