import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { anthropic, bedrockModelId } from "@/lib/anthropic";

const SYSTEM_PROMPT = `You are an expert in behavioral analysis, psychological profiling, and conversational power dynamics. Your task is to analyze a conversation transcript and extract:
1. Psychological patterns
2. Power dynamics between participants
3. Manipulation tactics (if present)
4. Emotional undercurrents
5. Behavioral archetypes

Rules: Be precise, not vague. Avoid moral judgment. Focus on observable behavior and patterns. Use structured output. Do not summarize the conversation — analyze it.

You must respond with valid JSON only. No prose before or after. No markdown code fences.`;

const ANALYSIS_PROMPT = `Analyze this episode transcript and return a JSON object with exactly this shape:

{
  "psychological_breakdown": [
    { "speaker": "speaker label or name", "traits": ["trait1", "trait2"], "drivers": ["underlying motivation"], "signals": ["observable behavior that reveals this"] }
  ],
  "power_dynamics": {
    "dominant": "who holds power most of the time",
    "evidence": ["specific moment or exchange as evidence"],
    "shifts": ["describe any power shift with timestamp or context"]
  },
  "manipulation_signals": [
    { "tactic": "name of tactic", "who": "who deployed it", "evidence": "direct quote or paraphrase showing the tactic" }
  ],
  "archetypes": [
    { "speaker": "name or label", "archetype": "archetype name (e.g. The Challenger, The Deflector, The Oracle)", "supporting": "brief justification" }
  ],
  "key_patterns": [
    "A recurring dynamic or theme observed across the episode"
  ]
}

Transcript:
`;

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
      title: true,
      transcriptRaw: true,
      segments: {
        select: { speakerLabel: true, text: true, startSeconds: true },
        orderBy: { startSeconds: "asc" },
        take: 250,
      },
    },
  });

  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  // Build transcript text — prefer segments (speaker-labeled), fall back to raw
  let transcriptText: string;
  if (episode.segments.length > 0) {
    transcriptText = episode.segments
      .map((s) => (s.speakerLabel ? `${s.speakerLabel}: ${s.text}` : s.text))
      .join("\n");
  } else if (episode.transcriptRaw) {
    transcriptText = episode.transcriptRaw.slice(0, 40000);
  } else {
    return NextResponse.json({ error: "No transcript available for this episode" }, { status: 422 });
  }

  const message = await anthropic.messages.create({
    model: bedrockModelId(process.env.ENRICHMENT_MODEL ?? "claude-opus-4-8"),
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: ANALYSIS_PROMPT + transcriptText,
      },
    ],
  });

  const rawText = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  let decodeData: unknown;
  try {
    decodeData = JSON.parse(rawText);
  } catch {
    return NextResponse.json(
      { error: "Model returned non-JSON output", raw: rawText.slice(0, 500) },
      { status: 502 }
    );
  }

  const saved = await prisma.episode.update({
    where: { id: episodeId },
    data: {
      decodeData: {
        ...(decodeData as Record<string, unknown>),
        generated_at: new Date().toISOString(),
      },
    },
    select: { id: true, decodeData: true },
  });

  return NextResponse.json({ ok: true, episodeId: saved.id, decodeData: saved.decodeData });
}
