import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "fs";
import { join } from "path";
import { parsePublishedDate } from "./lib";
import type { YouTubeVideo, YouTubeRaw } from "./types";
import type { EpisodeRow } from "../ingest/schemas";

const SCRAPE_DATA_DIR = join(__dirname, "data");
const RAW_FILE = join(SCRAPE_DATA_DIR, "youtube-raw.json");
const TRANSCRIPT_DIR = join(SCRAPE_DATA_DIR, "transcripts");
const INGEST_DATA_DIR = join(__dirname, "..", "ingest", "data");

function hasContentBeyondUrls(text: string): boolean {
  const withoutUrls = text.replace(/https?:\/\/\S+/g, "").trim();
  const cleaned = withoutUrls
    .replace(/support the stream:?\s*/gi, "")
    .replace(/streaming software/gi, "")
    .replace(/support:?\s*/gi, "")
    .trim();
  return cleaned.length > 10;
}

function extractSummary(description: string): string | undefined {
  if (!description || !hasContentBeyondUrls(description)) return undefined;

  const beforeUrl = description.split(/https?:\/\//)[0].trim();
  if (beforeUrl.length > 10) return beforeUrl;

  const cleaned = description.replace(/https?:\/\/\S+/g, "").trim();
  return cleaned.length > 10 ? cleaned : undefined;
}

export function transformVideo(
  video: YouTubeVideo,
  episodeNumber: number,
): EpisodeRow {
  return {
    title: video.title,
    episodeNumber,
    airDate: parsePublishedDate(video.publishedAt) || undefined,
    duration: video.duration || undefined,
    youtubeVideoId: video.videoId,
    thumbnailUrl: video.thumbnailUrl || undefined,
    summaryShort: extractSummary(video.description),
    guests: [],
    topics: [],
    lore: [],
  };
}

interface TranscriptSegment {
  offset: number;
  duration: number;
  text: string;
}

interface IngestTranscriptSegment {
  episodeSlug: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  if (!existsSync(RAW_FILE)) {
    console.error(
      "youtube-raw.json not found. Run npm run scrape:youtube first.",
    );
    process.exit(1);
  }

  const raw: YouTubeRaw = JSON.parse(readFileSync(RAW_FILE, "utf-8"));
  console.log(`Transforming ${raw.totalVideos} videos...`);

  const episodes: EpisodeRow[] = raw.videos.map((video, index) =>
    transformVideo(video, index + 1),
  );

  if (!existsSync(INGEST_DATA_DIR))
    mkdirSync(INGEST_DATA_DIR, { recursive: true });

  const episodesFile = join(INGEST_DATA_DIR, "episodes.json");
  writeFileSync(episodesFile, JSON.stringify(episodes, null, 2));
  console.log(`Episodes: ${episodes.length} written to ${episodesFile}`);

  if (existsSync(TRANSCRIPT_DIR)) {
    const transcriptFiles = readdirSync(TRANSCRIPT_DIR).filter((f) =>
      f.endsWith(".json"),
    );
    const allSegments: IngestTranscriptSegment[] = [];

    const videoIdToSlug = new Map<string, string>();
    for (const video of raw.videos) {
      videoIdToSlug.set(video.videoId, slugify(video.title));
    }

    for (const file of transcriptFiles) {
      const videoId = file.replace(".json", "");
      const episodeSlug = videoIdToSlug.get(videoId);
      if (!episodeSlug) continue;

      const segments: TranscriptSegment[] = JSON.parse(
        readFileSync(join(TRANSCRIPT_DIR, file), "utf-8"),
      );

      for (const seg of segments) {
        const startSeconds = Math.round(seg.offset / 1000);
        const endSeconds = Math.round((seg.offset + seg.duration) / 1000);
        allSegments.push({
          episodeSlug,
          startSeconds,
          endSeconds,
          text: seg.text,
        });
      }
    }

    const segmentsFile = join(INGEST_DATA_DIR, "transcript-segments.json");
    writeFileSync(segmentsFile, JSON.stringify(allSegments, null, 2));
    console.log(
      `Transcript segments: ${allSegments.length} from ${transcriptFiles.length} videos written to ${segmentsFile}`,
    );
  } else {
    console.log(
      "No transcripts directory found — skipping transcript transform",
    );
  }

  console.log(
    "\nDone! Now run: npm run ingest:episodes scripts/ingest/data/episodes.json",
  );
}

// Only run main() when executed directly, not when imported for testing
if (process.argv[1]?.includes("youtube-to-ingest")) {
  main().catch((e) => {
    console.error("Error:", e.message || e);
    process.exit(1);
  });
}
