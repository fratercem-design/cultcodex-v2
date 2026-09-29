/**
 * Draft a Transmission Kit from a replay's captions.
 *
 *   npm run kit:draft -- https://youtube.com/live/VIDEO_ID
 *   npm run kit:draft -- --srt path/to/replay.srt [--title "Sunday reading"]
 *   add --out path/to/draft.md to choose where the draft is written
 *
 * YouTube links use the video's captions (auto-generated is fine). For
 * Rumble, Twitch or anything else, export or download an .srt and pass --srt.
 * Writes Markdown to kit-drafts/ (gitignored: it holds buyers' content).
 *
 * Needs ANTHROPIC_API_KEY (read from .env.local or .env). Optional:
 * KIT_DRAFT_MODEL (default claude-opus-5), KIT_DRAFT_EFFORT (default high),
 * ANTHROPIC_WORKSPACE_ID for an org-level key. Roughly $0.30–0.80 per 3-hour stream.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join, basename } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { fetchTranscript } from "youtube-transcript";
import {
  DRAFT_SYSTEM_PROMPT,
  KitDraftSchema,
  formatTranscript,
  parseSrt,
  renderDraftMarkdown,
  segmentsFromYouTube,
  tidyDraft,
  youtubeVideoId,
  type CaptionSegment,
} from "../src/lib/kit/draft";

type Effort = "low" | "medium" | "high" | "xhigh" | "max";

function parseArgs(argv: string[]) {
  const flags: Record<string, string> = {};
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) flags[argv[i].slice(2)] = argv[++i] ?? "";
    else positional.push(argv[i]);
  }
  return { url: positional[0], srt: flags.srt, title: flags.title, out: flags.out };
}

function fail(msg: string): never {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

async function loadCaptions(args: ReturnType<typeof parseArgs>): Promise<{ segments: CaptionSegment[]; source: string; slug: string }> {
  if (args.srt) {
    const segments = parseSrt(readFileSync(args.srt, "utf-8"));
    return { segments, source: args.title ?? basename(args.srt), slug: basename(args.srt).replace(/\.srt$/i, "") };
  }
  if (!args.url) fail("Pass a YouTube replay link, or --srt <file> for other platforms.");
  const id = youtubeVideoId(args.url);
  if (!id) fail(`Not a YouTube link: ${args.url}. For Rumble/Twitch, download the .srt and use --srt.`);
  try {
    const raw = await fetchTranscript(id);
    return { segments: segmentsFromYouTube(raw), source: args.title ?? args.url, slug: id };
  } catch (err) {
    fail(`Couldn't fetch captions for ${id}: ${err instanceof Error ? err.message : err}. Captions may be off or still processing; download an .srt and use --srt instead.`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    fail("ANTHROPIC_API_KEY is not set (add it to .env.local).");
  }
  const { segments, source, slug } = await loadCaptions(args);
  if (segments.length === 0) fail("No caption text found.");

  const durationSec = Math.ceil(segments[segments.length - 1].startSec + 5);
  const transcript = formatTranscript(segments);
  console.log(`Captions: ${segments.length} lines, ${Math.round(durationSec / 60)} min. Drafting…`);

  // Org-level keys must name a workspace; workspace-scoped keys must not.
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
  const client = new Anthropic(workspaceId ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } } : {});

  const response = await client.beta.messages.parse({
    model: process.env.KIT_DRAFT_MODEL ?? "claude-opus-5",
    // Non-streaming ceiling in the TS SDK is ~21K; thinking shares this budget.
    max_tokens: 20000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: (process.env.KIT_DRAFT_EFFORT ?? "high") as Effort,
      format: betaZodOutputFormat(KitDraftSchema),
    },
    // If a safety classifier declines, the API retries on a fallback model in the same call.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: DRAFT_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `<transcript source="${source}">\n${transcript}\n</transcript>\n\nDraft the Transmission Kit for this stream.`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    fail(`The model declined this transcript (${response.stop_details?.category ?? "no category"}). Draft this one by hand.`);
  }
  if (response.stop_reason === "max_tokens") {
    fail("Ran out of output room before finishing. Retry with KIT_DRAFT_EFFORT=medium.");
  }
  if (!response.parsed_output) fail("The response didn't match the kit format. Try again.");

  const draft = tidyDraft(response.parsed_output, durationSec);
  const markdown = renderDraftMarkdown(draft, { source, durationSec, generatedAt: new Date() });
  const outPath = args.out ?? join("kit-drafts", `${slug}-${new Date().toISOString().slice(0, 10)}.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, markdown);

  const u = response.usage;
  console.log(`✓ Draft written to ${outPath}`);
  console.log(`  ${draft.chapters.length} chapters, ${draft.clips.length} clips, ${draft.hooks.length} hooks`);
  console.log(`  Model: ${response.model} · tokens in ${u.input_tokens}, out ${u.output_tokens}`);
}

main().catch((err) => {
  if (err instanceof Anthropic.AuthenticationError) fail("Anthropic rejected the API key.");
  if (err instanceof Anthropic.RateLimitError) fail("Rate limited by Anthropic. Wait a minute and retry.");
  if (err instanceof Anthropic.APIError) fail(`Anthropic API error ${err.status}: ${err.message}`);
  fail(err instanceof Error ? err.message : String(err));
});
