/**
 * Transcript → Psychenomicon Chapter Pipeline
 *
 * Usage:
 *   TRANSCRIPT_FILE=path/to/transcript.txt \
 *   CHAPTER_NUMBER=6 \
 *   CHAPTER_TITLE="The Fracture Deepens" \
 *   npx tsx scripts/generate-chapter-from-transcript.ts
 *
 * What it does:
 *   1. Reads transcript text
 *   2. Keyword-detects archetype events per participant
 *   3. Extracts key quotes for the Record layer
 *   4. Generates interpretation skeleton
 *   5. Writes a JSON chapter draft to /tmp/chapter-draft-N.json
 *   6. (Optional) Upserts to DB if WRITE_TO_DB=true
 *
 * The myth layer must be written by a human — this pipeline outputs
 * the Record and Analysis layers only.
 */
import * as fs from "fs";
import { PrismaClient } from "@/generated/prisma";

const p = new PrismaClient();

// ── Archetype detection rules ────────────────────────────────────────────────

const ARCHETYPE_RULES: Array<{
  archetype: string;
  keywords: string[];
  confidence: number;
}> = [
  { archetype: "The Accuser",        keywords: ["liar", "accuse", "that's not true", "i heard", "he said", "she said"], confidence: 0.85 },
  { archetype: "The Siren Trickster",keywords: ["just kidding", "haha", "laugh", "boob", "flash", "teasing", "you know i'm joking"], confidence: 0.8 },
  { archetype: "The Challenger",     keywords: ["prove it", "no you're wrong", "disagree", "actually", "let me push back", "debate"], confidence: 0.75 },
  { archetype: "The Confessor",      keywords: ["sorry", "i apologize", "i was wrong", "forgive", "my fault", "admit"], confidence: 0.8 },
  { archetype: "The Defender",       keywords: ["i didn't", "that's not fair", "in my defense", "you don't know", "let me explain"], confidence: 0.7 },
  { archetype: "The Amplifier",      keywords: ["yes exactly", "oh wow", "tell them", "say it again", "i agree", "absolutely"], confidence: 0.65 },
  { archetype: "The Mirror",         keywords: ["what do you think", "i reflect", "it depends on you", "your choice", "freedom"], confidence: 0.7 },
  { archetype: "The Seeker",         keywords: ["why", "can you explain", "what does that mean", "i don't understand", "curious"], confidence: 0.65 },
  { archetype: "The Loyalist",       keywords: ["i'll always", "i'm with you", "defend", "stand by", "no matter what"], confidence: 0.75 },
  { archetype: "The Phantom",        keywords: ["been a while", "i'm back", "i left", "had to step away", "returned"], confidence: 0.7 },
];

// ── Participant extraction ────────────────────────────────────────────────────

interface ParticipantEvent {
  name: string;
  archetype: string;
  confidence: number;
  triggerLine: string;
  lineNumber: number;
}

function detectParticipantEvents(lines: string[]): ParticipantEvent[] {
  const events: ParticipantEvent[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match speaker patterns: "Name: text" or "[Name] text"
    const speakerMatch = line.match(/^([A-Z][a-zA-Z\s-]{1,24}):\s+(.+)/) ||
                         line.match(/^\[([A-Z][a-zA-Z\s-]{1,24})\]\s+(.+)/);
    if (!speakerMatch) continue;

    const speaker = speakerMatch[1].trim();
    const utterance = speakerMatch[2].toLowerCase();

    let bestMatch: { archetype: string; confidence: number } | null = null;

    for (const rule of ARCHETYPE_RULES) {
      const hit = rule.keywords.some((kw) => utterance.includes(kw));
      if (hit && (!bestMatch || rule.confidence > bestMatch.confidence)) {
        bestMatch = { archetype: rule.archetype, confidence: rule.confidence };
      }
    }

    if (bestMatch) {
      events.push({
        name: speaker,
        archetype: bestMatch.archetype,
        confidence: bestMatch.confidence,
        triggerLine: line.trim(),
        lineNumber: i + 1,
      });
    }
  }

  return events;
}

// ── Quote extraction (high-signal lines) ─────────────────────────────────────

const QUOTE_SIGNAL_KEYWORDS = [
  "cult", "control", "freedom", "i heard", "accuse", "forgive", "you always",
  "you never", "why would you", "i can't believe", "that's exactly", "leave",
  "block", "trust", "betrayal", "loyalty", "toxic", "manipulate",
];

function extractKeyQuotes(lines: string[], max = 10): string[] {
  const scored: Array<{ line: string; score: number }> = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    const score = QUOTE_SIGNAL_KEYWORDS.filter((kw) => lower.includes(kw)).length;
    if (score > 0 && line.includes(":")) {
      scored.push({ line: line.trim(), score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((s) => `"${s.line}"`);
}

// ── Aggregate archetype state ─────────────────────────────────────────────────

function aggregateArchetypes(events: ParticipantEvent[]): Record<string, Record<string, number>> {
  const state: Record<string, Record<string, number>> = {};

  for (const event of events) {
    if (!state[event.name]) state[event.name] = {};
    state[event.name][event.archetype] = (state[event.name][event.archetype] ?? 0) + event.confidence;
  }

  // Normalize per participant
  for (const name of Object.keys(state)) {
    const total = Object.values(state[name]).reduce((a, b) => a + b, 0);
    for (const arch of Object.keys(state[name])) {
      state[name][arch] = parseFloat((state[name][arch] / total).toFixed(2));
    }
  }

  return state;
}

// ── Generate chapter draft ────────────────────────────────────────────────────

interface ChapterDraft {
  chapterNumber: number;
  title: string;
  slug: string;
  status: string;
  canonText: string;
  interpretationText: string;
  mythicText: string;
  emergingSignals: string[];
  archetypesData: Array<{ name: string; archetype: string; significance: string }>;
  detectedEvents: ParticipantEvent[];
  aggregatedState: Record<string, Record<string, number>>;
}

function generateDraft(
  chapterNumber: number,
  title: string,
  lines: string[],
  events: ParticipantEvent[],
  quotes: string[],
  state: Record<string, Record<string, number>>,
): ChapterDraft {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // Build canon text from quotes + event summary
  const participantSummary = Object.entries(state)
    .map(([name, archetypes]) => {
      const primary = Object.entries(archetypes).sort((a, b) => b[1] - a[1])[0];
      return `${name} → ${primary?.[0] ?? "Unknown"} (${Math.round((primary?.[1] ?? 0) * 100)}%)`;
    })
    .join("\n");

  const canonText = [
    `Source: Transcript (auto-generated draft)`,
    `Chapter: ${chapterNumber}`,
    ``,
    `RECORD`,
    ``,
    quotes.slice(0, 6).join("\n"),
    ``,
    `PARTICIPANTS DETECTED`,
    participantSummary || "(none detected — check transcript format)",
    ``,
    `CORE DYNAMIC`,
    `[To be completed by author]`,
  ].join("\n");

  // Build interpretation skeleton
  const archetypeInsights = Object.entries(state)
    .map(([name, archetypes]) => {
      const sorted = Object.entries(archetypes).sort((a, b) => b[1] - a[1]);
      const primary = sorted[0];
      const secondary = sorted[1];
      return `${name.toUpperCase()}\n— Primary: ${primary?.[0]} (${Math.round((primary?.[1] ?? 0) * 100)}%)\n${secondary ? `— Secondary: ${secondary[0]} (${Math.round(secondary[1] * 100)}%)` : ""}`;
    })
    .join("\n\n");

  const interpretationText = [
    `ARCHETYPE STATE (auto-detected)`,
    ``,
    archetypeInsights || "(no events detected)",
    ``,
    `[[ORACLE: KEY DYNAMIC`,
    `[To be completed — add hidden layer insight here]]]`,
    ``,
    `PSYCHOLOGICAL ANALYSIS`,
    `[To be completed by author]`,
    ``,
    `CHARACTER DEVELOPMENT`,
    `[To be completed by author]`,
  ].join("\n");

  const archetypesData = Object.entries(state).map(([name, archetypes]) => {
    const primary = Object.entries(archetypes).sort((a, b) => b[1] - a[1])[0];
    return {
      name,
      archetype: primary?.[0] ?? "Unknown",
      significance: "[To be completed]",
    };
  });

  const emergingSignals = [
    "[Emerging signal 1 — to be completed]",
    "[Emerging signal 2 — to be completed]",
  ];

  return {
    chapterNumber,
    title,
    slug,
    status: "evolving",
    canonText,
    interpretationText,
    mythicText: `[Mythic layer — to be written by author]\n\nThis chapter requires the symbolic retelling.\nInsert the story form here.`,
    emergingSignals,
    archetypesData,
    detectedEvents: events.slice(0, 20),
    aggregatedState: state,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const transcriptFile = process.env.TRANSCRIPT_FILE;
  const chapterNumber = parseInt(process.env.CHAPTER_NUMBER ?? "0", 10);
  const title = process.env.CHAPTER_TITLE ?? "Untitled Chapter";
  const writeToDB = process.env.WRITE_TO_DB === "true";

  if (!transcriptFile || !fs.existsSync(transcriptFile)) {
    console.error("❌ TRANSCRIPT_FILE not set or file not found.");
    console.error("Usage: TRANSCRIPT_FILE=path/to/transcript.txt CHAPTER_NUMBER=6 CHAPTER_TITLE=\"The Title\" npx tsx scripts/generate-chapter-from-transcript.ts");
    process.exit(1);
  }

  if (!chapterNumber) {
    console.error("❌ CHAPTER_NUMBER must be a positive integer.");
    process.exit(1);
  }

  console.log(`Processing transcript: ${transcriptFile}`);
  console.log(`Chapter: ${chapterNumber} — "${title}"\n`);

  const raw = fs.readFileSync(transcriptFile, "utf-8");
  const lines = raw.split("\n");

  console.log(`Lines: ${lines.length}`);

  const events = detectParticipantEvents(lines);
  const quotes = extractKeyQuotes(lines);
  const state = aggregateArchetypes(events);

  console.log(`Detected events: ${events.length}`);
  console.log(`Key quotes: ${quotes.length}`);
  console.log(`Participants: ${Object.keys(state).join(", ") || "(none)"}`);

  const draft = generateDraft(chapterNumber, title, lines, events, quotes, state);

  const outPath = `/tmp/chapter-draft-${chapterNumber}.json`;
  fs.writeFileSync(outPath, JSON.stringify(draft, null, 2));
  console.log(`\n✓ Draft written to ${outPath}`);

  if (writeToDB) {
    console.log("\nWriting to database...");
    await p.psychenomiconChapter.upsert({
      where: { chapterNumber },
      update: {
        title: draft.title,
        status: draft.status,
        canonText: draft.canonText,
        interpretationText: draft.interpretationText,
        mythicText: draft.mythicText,
        emergingSignals: draft.emergingSignals,
        archetypesData: draft.archetypesData,
      },
      create: {
        chapterNumber: draft.chapterNumber,
        title: draft.title,
        slug: draft.slug,
        status: draft.status,
        canonText: draft.canonText,
        interpretationText: draft.interpretationText,
        mythicText: draft.mythicText,
        emergingSignals: draft.emergingSignals,
        archetypesData: draft.archetypesData,
        isMajorEvent: false,
      },
    });
    console.log("✓ Chapter upserted to DB");
  }

  console.log("\n═══════════════════════════════════════");
  console.log(`  Chapter draft ${chapterNumber} complete`);
  console.log("═══════════════════════════════════════");
  console.log("  Next steps:");
  console.log("  1. Review /tmp/chapter-draft-N.json");
  console.log("  2. Fill in [To be completed] sections");
  console.log("  3. Write the mythic layer (story form)");
  console.log("  4. Add [[ORACLE:]] hidden insights");
  console.log("  5. Run with WRITE_TO_DB=true to publish");
  console.log("═══════════════════════════════════════");
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
