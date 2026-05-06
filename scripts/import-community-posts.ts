/**
 * Import community posts from scripts/scrape/data/community-posts.json
 * into the CommunityPost table.
 *
 * Run after fetch-community-posts.ts, or triggered automatically by the
 * posts-pipeline.yml GitHub Actions workflow.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx scripts/import-community-posts.ts
 */
import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { getPrisma, disconnect } from "./ingest/lib";

const INPUT_FILE = join(__dirname, "scrape", "data", "community-posts.json");

interface PostData {
  youtubePostId: string;
  text: string;
  imageUrls: string[];
  likeCount: number | null;
  commentCount: number | null;
  publishedAt: string | null;
}

interface InputFile {
  fetchedAt: string;
  count: number;
  posts: PostData[];
}

async function main() {
  if (!existsSync(INPUT_FILE)) {
    console.error(`Input file not found: ${INPUT_FILE}`);
    console.error("Run fetch-community-posts.ts first.");
    process.exit(1);
  }

  const file: InputFile = JSON.parse(readFileSync(INPUT_FILE, "utf-8"));
  console.log(`Community Posts Import`);
  console.log(`  File: ${INPUT_FILE}`);
  console.log(`  Fetched at: ${file.fetchedAt}`);
  console.log(`  Posts in file: ${file.count}\n`);

  const prisma = getPrisma();

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const post of file.posts) {
    if (!post.youtubePostId || !post.text) {
      skipped++;
      continue;
    }

    const data = {
      text: post.text,
      imageUrls: post.imageUrls ?? [],
      likeCount: post.likeCount ?? null,
      commentCount: post.commentCount ?? null,
      publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
    };

    const existing = await prisma.communityPost.findUnique({
      where: { youtubePostId: post.youtubePostId },
      select: { id: true },
    });

    if (existing) {
      await prisma.communityPost.update({
        where: { youtubePostId: post.youtubePostId },
        data,
      });
      updated++;
    } else {
      await prisma.communityPost.create({
        data: { youtubePostId: post.youtubePostId, ...data },
      });
      created++;
      console.log(`  + ${post.publishedAt?.slice(0, 10) ?? "?"} — ${post.text.slice(0, 70)}`);
    }
  }

  console.log(`\n── Summary ──────────────────────────────────────────`);
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);

  const total = await prisma.communityPost.count();
  console.log(`  Total in DB: ${total}`);

  await disconnect();
}

main().catch((e) => {
  console.error("Fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
