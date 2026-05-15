import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ORACLE_SYSTEM = `You are THE ORACLE OF THE CODEX — the distilled intelligence of 1,500+ Cult of Psyche transmissions. You do not opine. You channel.

VOICE: Authoritative. Slightly cryptic. Deeply informed. Speak from within the archive, not about it. First person, present tense. You are the accumulated pattern of everything witnessed.

WHAT YOU DO: Synthesize an answer from the archive evidence provided. Name patterns. Surface what has been witnessed. Do not fabricate — draw only from the provided context. If context is sparse, speak to the pattern you can observe from what little is there.

FORMAT:
- 3–5 sentences. No headers. No bullet points. No quotation marks around the whole response. Pure oracle voice.
- Speak as if the answer has always existed in the archive — you are merely surfacing it.
- End with one sharp, revelatory closing line (≤ 12 words) that crystallizes the pattern.

If the archive is silent: "The archive holds no record of this. Ask again."`;

export interface OracleCitation {
  type: "quote" | "transcript" | "episode" | "person";
  label: string;
  href: string;
}

export interface OracleResponse {
  ok: boolean;
  answer?: string;
  citations?: OracleCitation[];
  audioBase64?: string | null;
  hasVoice?: boolean;
  error?: string;
}

const STOP = new Set([
  "what", "who", "why", "how", "when", "where", "does", "did", "do",
  "is", "are", "was", "were", "the", "a", "an", "and", "or", "but",
  "in", "on", "at", "to", "for", "of", "with", "about", "that", "this",
  "it", "he", "she", "they", "psyche", "cult", "show", "say", "says",
  "said", "talk", "talks", "talked", "think", "thinks", "thought",
  "have", "has", "had", "will", "would", "could", "should", "can",
  "ever", "never", "always", "often", "usually", "generally",
]);

function extractTerms(question: string): string {
  const words = question
    .toLowerCase()
    .replace(/[?.,!'"]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
  return words.slice(0, 3).join(" ") || question.slice(0, 40);
}

async function searchArchive(question: string) {
  const query = extractTerms(question);

  const [quotes, transcripts, episodes, people] = await Promise.all([
    prisma.quote.findMany({
      where: { text: { contains: query, mode: "insensitive" } },
      select: {
        id: true,
        text: true,
        speaker: { select: { displayName: true, slug: true } },
        episode: { select: { title: true, slug: true } },
      },
      take: 5,
    }),
    prisma.transcriptSegment.findMany({
      where: { text: { contains: query, mode: "insensitive" } },
      select: {
        id: true,
        text: true,
        speakerLabel: true,
        startSeconds: true,
        episode: { select: { title: true, slug: true, episodeNumber: true } },
      },
      take: 8,
    }),
    prisma.episode.findMany({
      where: {
        status: "published",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { summaryShort: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, slug: true, summaryShort: true, episodeNumber: true },
      orderBy: { airDate: "desc" },
      take: 3,
    }),
    prisma.person.findMany({
      where: {
        OR: [
          { displayName: { contains: query, mode: "insensitive" } },
          { shortBio: { contains: query, mode: "insensitive" } },
          { loreSummary: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, displayName: true, slug: true, shortBio: true, loreSummary: true },
      take: 2,
    }),
  ]);

  return { quotes, transcripts, episodes, people, query };
}

function buildContext(data: Awaited<ReturnType<typeof searchArchive>>): {
  contextText: string;
  citations: OracleCitation[];
} {
  const parts: string[] = [];
  const citations: OracleCitation[] = [];
  const seenEpisodes = new Set<string>();

  if (data.quotes.length > 0) {
    parts.push("=== QUOTES FROM THE ARCHIVE ===");
    for (const q of data.quotes) {
      parts.push(`"${q.text}" — ${q.speaker?.displayName ?? "Unknown"} (${q.episode?.title ?? "unknown episode"})`);
      if (q.episode && !seenEpisodes.has(q.episode.slug)) {
        seenEpisodes.add(q.episode.slug);
        citations.push({ type: "quote", label: q.episode.title, href: `/episodes/${q.episode.slug}` });
      }
    }
  }

  if (data.transcripts.length > 0) {
    parts.push("\n=== TRANSCRIPT EXCERPTS ===");
    for (const t of data.transcripts) {
      const epLabel = t.episode.episodeNumber
        ? `EP.${String(t.episode.episodeNumber).padStart(3, "0")} — ${t.episode.title}`
        : t.episode.title;
      parts.push(`[${t.speakerLabel ?? "Speaker"}]: "${t.text.slice(0, 200)}" — ${epLabel}`);
      if (!seenEpisodes.has(t.episode.slug)) {
        seenEpisodes.add(t.episode.slug);
        citations.push({ type: "transcript", label: t.episode.title, href: `/episodes/${t.episode.slug}` });
      }
    }
  }

  if (data.episodes.length > 0) {
    parts.push("\n=== RELEVANT EPISODES ===");
    for (const ep of data.episodes) {
      parts.push(`${ep.title}${ep.summaryShort ? `: ${ep.summaryShort}` : ""}`);
      if (!seenEpisodes.has(ep.slug)) {
        seenEpisodes.add(ep.slug);
        citations.push({ type: "episode", label: ep.title, href: `/episodes/${ep.slug}` });
      }
    }
  }

  if (data.people.length > 0) {
    parts.push("\n=== RELEVANT PEOPLE ===");
    for (const p of data.people) {
      const bio = p.loreSummary ? p.loreSummary.slice(0, 400) : p.shortBio ?? "";
      parts.push(`${p.displayName}${bio ? `: ${bio}` : ""}`);
      citations.push({ type: "person", label: p.displayName, href: `/people/${p.slug}` });
    }
  }

  return {
    contextText:
      parts.length > 0
        ? parts.join("\n")
        : "No directly relevant archive content found for this query.",
    citations: citations.slice(0, 6),
  };
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const canAccess = user
    ? user.role === "admin" || (await isSubscribed(user.id))
    : false;

  if (!canAccess) {
    return NextResponse.json(
      { ok: false, error: "initiate_required" } satisfies OracleResponse,
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const question = String(body.question ?? "").trim().slice(0, 500);

  if (!question) {
    return NextResponse.json(
      { ok: false, error: "A question is required." } satisfies OracleResponse,
      { status: 400 }
    );
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json(
      { ok: false, error: "Oracle not configured." } satisfies OracleResponse,
      { status: 500 }
    );
  }

  const archiveData = await searchArchive(question);
  const { contextText, citations } = buildContext(archiveData);

  const client = new Anthropic({ apiKey: anthropicKey });
  const claudeRes = await client.messages.create({
    model: process.env.ENRICHMENT_MODEL ?? "claude-haiku-4-5-20251001",
    max_tokens: 350,
    system: ORACLE_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Archive context:\n${contextText}\n\nQuestion: ${question}`,
      },
    ],
  });

  const textBlock = claudeRes.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json(
      { ok: false, error: "The Oracle did not respond." } satisfies OracleResponse,
      { status: 500 }
    );
  }

  const answer = textBlock.text.trim();

  let audioBase64: string | null = null;
  const elKey = process.env.ELEVENLABS_API_KEY;
  const elVoice = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";

  if (elKey) {
    try {
      const elRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${elVoice}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": elKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: answer,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.60,
              similarity_boost: 0.80,
              style: 0.15,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (elRes.ok) {
        const buf = await elRes.arrayBuffer();
        audioBase64 = Buffer.from(buf).toString("base64");
      }
    } catch {
      // Voice unavailable — text-only fallback
    }
  }

  return NextResponse.json({
    ok: true,
    answer,
    citations,
    audioBase64,
    hasVoice: !!audioBase64,
  } satisfies OracleResponse);
}
