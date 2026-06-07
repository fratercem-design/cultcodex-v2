export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Image from "next/image";
import { PageHero } from "@/components/ui/page-hero";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { prisma } from "@/lib/db";
import { parsePage, paginationArgs, buildPaginationMeta } from "@/lib/pagination";

export const revalidate = 300;

export const metadata = {
  alternates: { canonical: "/posts" },
  title: "Community Posts — CULT CODEX",
  description: "YouTube community posts from Cult of Psyche",
};

const PAGE_SIZE = 20;

interface PostsPageProps {
  searchParams: Promise<{ page?: string }>;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function PostCard({
  post,
}: {
  post: {
    id: string;
    youtubePostId: string;
    text: string;
    imageUrls: string[];
    likeCount: number | null;
    commentCount: number | null;
    publishedAt: Date | null;
  };
}) {
  const postUrl = `https://www.youtube.com/post/${post.youtubePostId}`;
  const hasImages = post.imageUrls.length > 0;

  return (
    <article className="rounded-lg border border-border bg-surface overflow-hidden">
      {/* Images row */}
      {hasImages && (
        <div className={`grid gap-1 ${post.imageUrls.length === 1 ? "" : "grid-cols-2"}`}>
          {post.imageUrls.slice(0, 4).map((url, i) => (
            <div key={i} className="relative aspect-video bg-void overflow-hidden">
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              {post.imageUrls.length > 4 && i === 3 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <span className="font-mono text-lg font-bold text-white">
                    +{post.imageUrls.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line line-clamp-6">
          {post.text}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-3 font-mono text-[10px] text-text-muted">
            {post.publishedAt && (
              <span>{formatDate(post.publishedAt)}</span>
            )}
            {post.likeCount != null && (
              <>
                <span className="opacity-40">·</span>
                <span>♥ {post.likeCount.toLocaleString()}</span>
              </>
            )}
            {post.commentCount != null && (
              <>
                <span className="opacity-40">·</span>
                <span>💬 {post.commentCount.toLocaleString()}</span>
              </>
            )}
          </div>
          <a
            href={postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-accent-cyan hover:underline"
          >
            View ↗
          </a>
        </div>
      </div>
    </article>
  );
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const { page: pageParam } = await searchParams;

  const totalCount = await prisma.communityPost.count();
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const page = parsePage(pageParam, totalPages);
  const { skip, take } = paginationArgs(page, PAGE_SIZE);
  const meta = buildPaginationMeta(page, PAGE_SIZE, totalCount);

  const posts = await prisma.communityPost.findMany({
    orderBy: { publishedAt: "desc" },
    skip,
    take,
    select: {
      id: true,
      youtubePostId: true,
      text: true,
      imageUrls: true,
      likeCount: true,
      commentCount: true,
      publishedAt: true,
    },
  });

  return (
    <div className="min-h-screen bg-void">
      <PageHero
        title="Community Posts"
        subtitle={`${totalCount.toLocaleString()} posts from @CultofPsyche`}
        backgroundImage="/articles-bacgkground.jpg"
      />

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {posts.length === 0 ? (
          <p className="text-center text-sm text-text-muted italic py-12">
            No posts imported yet. Run the posts-pipeline workflow.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            <Suspense>
              <PaginationControls meta={meta} basePath="/posts" />
            </Suspense>
          </>
        )}
      </div>
    </div>
  );
}
