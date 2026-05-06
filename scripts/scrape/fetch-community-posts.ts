/**
 * Fetch @CultofPsyche YouTube community posts using yt-dlp.
 *
 * Writes scraped posts to scripts/scrape/data/community-posts.json.
 *
 * Usage:
 *   npx tsx scripts/scrape/fetch-community-posts.ts
 *
 * Env vars:
 *   YOUTUBE_CHANNEL_HANDLE — defaults to @CultofPsyche
 *   YOUTUBE_COOKIES_FILE   — path to Netscape cookies file (recommended)
 */
import { execFileSync } from "child_process";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import * as os from "os";

const HANDLE = (process.env.YOUTUBE_CHANNEL_HANDLE ?? "@CultofPsyche").replace(/^@/, "");
const COOKIES_FILE = process.env.YOUTUBE_COOKIES_FILE ?? "";
const DATA_DIR = join(__dirname, "data");
const OUTPUT_FILE = join(DATA_DIR, "community-posts.json");

interface RawYtDlpPost {
  id?: string;
  post_id?: string;
  title?: string;
  description?: string;
  content?: string;
  text?: string;
  like_count?: number;
  comment_count?: number;
  timestamp?: number;
  upload_date?: string;
  thumbnails?: Array<{ url: string }>;
  images?: Array<{ url: string }>;
  attachments?: Array<{ thumbnails?: Array<{ url: string }> }>;
}

interface CommunityPostData {
  youtubePostId: string;
  text: string;
  imageUrls: string[];
  likeCount: number | null;
  commentCount: number | null;
  publishedAt: string | null;
}

function parsePosts(raw: string): CommunityPostData[] {
  const posts: CommunityPostData[] = [];
  const lines = raw.trim().split("\n").filter(Boolean);

  for (const line of lines) {
    let data: RawYtDlpPost;
    try {
      data = JSON.parse(line) as RawYtDlpPost;
    } catch {
      continue;
    }

    const id = data.id ?? data.post_id;
    if (!id) continue;

    // Community posts have various text fields depending on yt-dlp version
    const text =
      data.description ??
      data.content ??
      data.title ??
      data.text ??
      "";

    if (!text) continue;

    // Collect image URLs from multiple possible fields
    const imageUrls: string[] = [];
    if (data.thumbnails?.length) {
      // Get highest-res thumbnail per image
      imageUrls.push(data.thumbnails[data.thumbnails.length - 1].url);
    }
    if (data.images?.length) {
      for (const img of data.images) {
        if (img.url && !imageUrls.includes(img.url)) imageUrls.push(img.url);
      }
    }
    if (data.attachments?.length) {
      for (const att of data.attachments) {
        if (att.thumbnails?.length) {
          const url = att.thumbnails[att.thumbnails.length - 1].url;
          if (!imageUrls.includes(url)) imageUrls.push(url);
        }
      }
    }

    // Parse publishedAt from timestamp or upload_date
    let publishedAt: string | null = null;
    if (data.timestamp) {
      publishedAt = new Date(data.timestamp * 1000).toISOString();
    } else if (data.upload_date && data.upload_date.length === 8) {
      const y = data.upload_date.slice(0, 4);
      const m = data.upload_date.slice(4, 6);
      const d = data.upload_date.slice(6, 8);
      publishedAt = `${y}-${m}-${d}T00:00:00.000Z`;
    }

    posts.push({
      youtubePostId: id,
      text: text.trim(),
      imageUrls,
      likeCount: data.like_count ?? null,
      commentCount: data.comment_count ?? null,
      publishedAt,
    });
  }

  return posts;
}

async function main() {
  console.log(`Fetching community posts for @${HANDLE}`);

  // Verify yt-dlp
  try {
    execFileSync("yt-dlp", ["--version"], { stdio: "pipe" });
  } catch {
    console.error("yt-dlp not found — install with: pip install yt-dlp");
    process.exit(1);
  }

  const communityUrl = `https://www.youtube.com/@${HANDLE}/community`;
  console.log(`URL: ${communityUrl}`);

  const args = [
    "--flat-playlist",
    "--dump-json",
    "--no-warnings",
  ];

  if (COOKIES_FILE && existsSync(COOKIES_FILE)) {
    args.push("--cookies", COOKIES_FILE);
    console.log(`Cookies: ${COOKIES_FILE}`);
  } else {
    console.log("Cookies: none (unauthenticated — may get fewer posts)");
  }

  args.push(communityUrl);

  let raw = "";
  try {
    raw = execFileSync("yt-dlp", args, { stdio: "pipe", timeout: 120_000, encoding: "utf-8" });
  } catch (err) {
    // yt-dlp exits with nonzero if some items fail but may still produce output
    const e = err as { stdout?: string; stderr?: string; message?: string };
    raw = e.stdout ?? "";
    if (!raw.trim()) {
      console.error("yt-dlp produced no output:", e.stderr?.slice(0, 500) ?? e.message);
      process.exit(1);
    }
    console.warn("yt-dlp exited with errors (partial output may be usable)");
  }

  const posts = parsePosts(raw);
  console.log(`Parsed ${posts.length} posts`);

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  writeFileSync(
    OUTPUT_FILE,
    JSON.stringify({ fetchedAt: new Date().toISOString(), count: posts.length, posts }, null, 2),
  );

  console.log(`\nSaved to ${OUTPUT_FILE}`);
  for (const p of posts.slice(0, 5)) {
    console.log(`  ${p.publishedAt?.slice(0, 10) ?? "?"} — ${p.text.slice(0, 80)}`);
  }
  if (posts.length > 5) console.log(`  ... and ${posts.length - 5} more`);
}

main().catch((e) => {
  console.error("Fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
