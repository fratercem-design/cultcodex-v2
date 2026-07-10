import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "fs";
import { join } from "path";
import { parsePublishedDate } from "./lib";
import { cleanSummary, isJunkSummary } from "../../src/lib/content-hygiene";
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
  const candidate =
    beforeUrl.length > 10 ? beforeUrl : description.replace(/https?:\/\/\S+/g, "").trim();
  if (candidate.length <= 10) return undefined;

  // Strip sponsor/boilerplate prose (StreamYard promos, vidIQ, AI preambles)
  // so junk never enters the DB — same patterns data-ops uses to clean prod.
  const cleaned = cleanSummary(candidate);
  return isJunkSummary(cleaned) ? undefined : cleaned;
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

  // Deduplicate titles by appending episode number to duplicates
  const titleCounts = new Map<string, number>();
  const dedupedVideos = raw.videos.map((video, index) => {
    const baseSlug = slugify(video.title);
    const count = titleCounts.get(baseSlug) || 0;
    titleCounts.set(baseSlug, count + 1);
    // If this title has been seen before, append episode number to make it unique
    if (count > 0) {
      return { ...video, title: `${video.title} Ep ${index + 1}` };
    }
    return video;
  });

  // Second pass: also fix the first occurrence if its slug has duplicates
  const slugsWithDupes = new Set(
    [...titleCounts.entries()].filter(([, c]) => c > 1).map(([s]) => s)
  );
  const episodes: EpisodeRow[] = dedupedVideos.map((video, index) => {
    const baseSlug = slugify(video.title);
    // If original slug (without Ep N suffix) has dupes AND this is the first occurrence
    // (which wasn't modified in the first pass), fix it too
    if (slugsWithDupes.has(baseSlug) && video === raw.videos[index]) {
      return transformVideo({ ...video, title: `${video.title} Ep ${index + 1}` }, index + 1);
    }
    return transformVideo(video, index + 1);
  });

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

    // Use the same deduped titles for slug mapping
    const videoIdToSlug = new Map<string, string>();
    for (let i = 0; i < dedupedVideos.length; i++) {
      const video = dedupedVideos[i];
      const original = raw.videos[i];
      const baseSlug = slugify(video.title);
      if (slugsWithDupes.has(slugify(original.title)) && video === original) {
        videoIdToSlug.set(video.videoId, slugify(`${video.title} Ep ${i + 1}`));
      } else {
        videoIdToSlug.set(video.videoId, slugify(video.title));
      }
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
