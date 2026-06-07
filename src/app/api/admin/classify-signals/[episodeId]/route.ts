import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BATCH_SIZE = 40;

const SYSTEM_PROMPT = `You classify transcript segments as signal or noise.

Signal: insight, revelation, genuine conflict, manipulation tactic exposed, authentic emotion, power shift, substantive argument, a moment that changes the dynamic.
Noise: filler, pleasantries, tangents, crosstalk, laughing/reacting, setup without payoff, topic drift, repetition.

Respond ONLY with a JSON object mapping each startSeconds to its classification. Nothing else.
Example: {"0": "signal", "45": "noise", "90": "signal"}`;

type Classification = "signal" | "noise" | "neutral";

async function classifyBatch(
  batch: Array<{ startSeconds: number; speakerLabel: string | null; text: string }>
): Promise<Record<string, Classification>> {
  const input = batch
    .map((s) => `[${s.startSeconds}]${s.speakerLabel ? ` ${s.speakerLabel}:` : ""} ${s.text}`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: input }],
  });

  const raw = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  try {
    return JSON.parse(raw) as Record<string, Classification>;
  } catch {
    return {};
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ episodeId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { episodeId } = await params;

  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    select: {
      id: true,
      decodeData: true,
      segments: {
        select: { startSeconds: true, speakerLabel: true, text: true },
        orderBy: { startSeconds: "asc" },
        take: 300,
      },
    },
  });

  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  if (episode.segments.length === 0) {
    return NextResponse.json({ error: "No segments to classify" }, { status: 422 });
  }

  // Process in batches to stay within token limits
  const batches: typeof episode.segments[] = [];
  for (let i = 0; i < episode.segments.length; i += BATCH_SIZE) {
    batches.push(episode.segments.slice(i, i + BATCH_SIZE));
  }

  const signalNoise: Record<string, Classification> = {};
  for (const batch of batches) {
    const result = await classifyBatch(batch);
    Object.assign(signalNoise, result);
  }

  // Merge into existing decodeData or create stub
  const existing = (episode.decodeData ?? {}) as Record<string, unknown>;
  const updated = await prisma.episode.update({
    where: { id: episodeId },
    data: {
      decodeData: {
        ...existing,
        signal_noise: signalNoise,
        signal_noise_generated_at: new Date().toISOString(),
      },
    },
    select: { id: true },
  });

  const signalCount = Object.values(signalNoise).filter((v) => v === "signal").length;
  const noiseCount = Object.values(signalNoise).filter((v) => v === "noise").length;

  return NextResponse.json({
    ok: true,
    episodeId: updated.id,
    classified: Object.keys(signalNoise).length,
    signal: signalCount,
    noise: noiseCount,
  });
}
