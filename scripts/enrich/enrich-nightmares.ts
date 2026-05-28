// AI enrichment for @PsychesNightmares episodes.
// Finds nightmares episodes in the DB that lack summaryLong, reads their
// transcripts from the shared transcripts/ dir, and enriches them with Claude.
// Saves each enrichment result as scripts/enrich/data/<slug>.json, which
// import-enriched.ts then imports back into the DB.
//
// Usage:
//   npx dotenvx run -- npx tsx scripts/enrich/enrich-nightmares.ts [--batch N] [--force]
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { getPrisma, disconnect } from "../ingest/lib";
import { EnrichmentResultSchema, type EnrichmentResult } from "./schemas";
import { buildTranscriptText } from "./lib";

const NIGHTMARES_RAW = path.join(
  __dirname,
  "..",
  "scrape",
  "data",
  "youtube-raw-psychesnightmares.json"
);
const TRANSCRIPTS_DIR = path.join(__dirname, "..", "scrape", "data", "transcripts");
const DATA_DIR = path.join(__dirname, "data");
const LOG_PATH = path.join(__dirname, "enrich-nightmares.log");

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
}

// ── System prompt tuned for @PsychesNightmares content ───────────────────────
const NIGHTMARES_SYSTEM_PROMPT = `You are an expert analyst for the "Cult of Psyche" archive — specifically for the @PsychesNightmares secondary channel. This channel hosts overflow streaming content: tarot readings, open-panel discussions, consciousness exploration, dark mythology deep-dives, and occult/esoteric topics. The host is known as "Psyche" or "Trix."

The @PsychesNightmares channel tends to feature:
- Late-night streams with a more raw, unfiltered tone
- Recurring community members and panel guests
- Spiritual warfare, trauma healing, shadow work themes
- Discussions of internet drama, creator controversies
- Tarot pulls, oracle readings, and psychic discussions
- Recurring community lore and inside references

Your task: analyze the provided episode transcript and extract structured data. Be accurate — only extract what's genuinely present. Do not hallucinate guests, quotes, or lore not discussed.

Return a JSON object with this exact structure:
{
  "summaryShort": "1-2 sentence summary of the episode",
  "summaryLong": "2-3 paragraph comprehensive summary covering main topics, key moments, recurring characters present, and themes",
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
- For guests: include the host as personType "host". People who appear regularly (across many episodes) are "recurring". One-time guests are "guest". People discussed but not present are "mentioned".
- For quotes: extract the 3-5 most notable, interesting, or representative quotes.
- For lore: identify mythology references, recurring show concepts, spiritual/occult ideas, and community inside-lore discussed.
- For topics: list the main subjects discussed.
- Return ONLY valid JSON. No markdown, no code fences, no explanation.`;

interface RawVideo {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
}

function parseArgs(): { batch: number; force: boolean } {
  const args = process.argv.slice(2);
  let batch = parseInt(process.env.ENRICHMENT_BATCH_SIZE ?? "10", 10);
  let force = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--batch" && args[i + 1]) {
      batch = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === "--force") force = true;
  }

  return { batch, force };
}

async function enrichEpisode(input: {
  title: string;
  episodeNumber: number | null;
  airDate: string;
  description: string;
  transcript: string;
}): Promise<EnrichmentResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic({ apiKey });
  const model = process.env.ENRICHMENT_MODEL ?? "claude-sonnet-4-6";

  const userMessage = `Episode: "${input.title}"
${input.episodeNumber ? `Episode ${input.episodeNumber} — ` : ""}Aired ${input.airDate}

Description:
${input.description || "(none)"}

Transcript:
${input.transcript}`;

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: NIGHTMARES_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text response");

  let jsonText = textBlock.text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  return EnrichmentResultSchema.parse(JSON.parse(jsonText));
}

async function main() {
  const { batch, force } = parseArgs();
  const prisma = getPrisma();

  // Load optional local metadata for descriptions (may not exist in CI)
  const videoMeta = new Map<string, RawVideo>();
  if (fs.existsSync(NIGHTMARES_RAW)) {
    const raw = JSON.parse(fs.readFileSync(NIGHTMARES_RAW, "utf-8")) as { videos: RawVideo[] };
    for (const v of raw.videos) videoMeta.set(v.videoId, v);
    log(`Loaded ${videoMeta.size} video metadata entries from local file`);
  } else {
    log("No local raw JSON — descriptions will be sourced from DB summaryShort");
  }

  // Find nightmares episodes in DB that need enrichment (contentType=livestream)
  const episodes = await prisma.episode.findMany({
    where: {
      contentType: "livestream",
      youtubeVideoId: { not: null },
      OR: [{ summaryLong: null }, { summaryLong: "" }],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      episodeNumber: true,
      airDate: true,
      youtubeVideoId: true,
      summaryShort: true,
    },
    orderBy: { episodeNumber: "asc" },
  });

  log(`Found ${episodes.length} nightmares episodes needing enrichment`);

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const candidates = await Promise.all(
    episodes
      .filter((ep) => {
        if (!ep.youtubeVideoId) return false;
        if (!force) {
          const enrichedPath = path.join(DATA_DIR, `${ep.slug}.json`);
          if (fs.existsSync(enrichedPath)) return false;
        }
        return true;
      })
      .map(async (ep) => {
        const localPath = path.join(TRANSCRIPTS_DIR, `${ep.youtubeVideoId}.json`);
        const hasLocal = fs.existsSync(localPath);
        if (!hasLocal) {
          const count = await prisma.transcriptSegment.count({ where: { episodeId: ep.id } });
          if (count === 0) { log(`  SKIP (no transcript): ${ep.slug}`); return null; }
        }
        return ep;
      })
  ).then((eps) => eps.filter(Boolean) as typeof episodes);

  log(`${candidates.length} candidates with transcripts (batch: ${batch})`);

  const toProcess = candidates.slice(0, batch);
  let success = 0;
  let failures = 0;

  for (const ep of toProcess) {
    log(`Processing: ${ep.slug} (${ep.title})`);
    try {
      const localPath = path.join(TRANSCRIPTS_DIR, `${ep.youtubeVideoId!}.json`);
      let segments: Array<{ offset: number; duration: number; text: string }>;
      if (fs.existsSync(localPath)) {
        segments = JSON.parse(fs.readFileSync(localPath, "utf-8"));
      } else {
        const dbSegs = await prisma.transcriptSegment.findMany({
          where: { episodeId: ep.id },
          orderBy: { startSeconds: "asc" },
          select: { startSeconds: true, endSeconds: true, text: true },
        });
        segments = dbSegs.map((s) => ({
          offset: s.startSeconds * 1000,
          duration: Math.max((s.endSeconds - s.startSeconds) * 1000, 1000),
          text: s.text,
        }));
      }
      const transcriptText = buildTranscriptText(segments);

      const MAX_CHARS = 400_000;
      const truncated =
        transcriptText.length > MAX_CHARS
          ? transcriptText.slice(0, MAX_CHARS) + "\n\n[TRANSCRIPT TRUNCATED]"
          : transcriptText;

      const meta = videoMeta.get(ep.youtubeVideoId!);
      const result = await enrichEpisode({
        title: ep.title,
        episodeNumber: ep.episodeNumber,
        airDate: ep.airDate?.toISOString().split("T")[0] ?? "unknown",
        description: meta?.description ?? ep.summaryShort ?? "",
        transcript: truncated,
      });

      const outPath = path.join(DATA_DIR, `${ep.slug}.json`);
      fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
      log(`  ✓ Saved → ${ep.slug}.json`);
      success++;

      // Small delay between API calls
      await new Promise((r) => setTimeout(r, 500));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`  ✗ FAILED ${ep.slug}: ${msg}`);
      failures++;
    }
  }

  log(`\nDone — success: ${success}, failures: ${failures}`);
  log(`Run 'npx dotenvx run -- npx tsx scripts/enrich/import-enriched.ts' to import into DB.`);

  await disconnect();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
