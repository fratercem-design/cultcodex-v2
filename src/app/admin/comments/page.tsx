export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format/date";
import { CommentActions } from "./comment-actions";

export default async function AdminCommentsPage() {
  const comments = await prisma.codexComment.findMany({
    orderBy: [{ flagged: "desc" }, { createdAt: "desc" }],
    take: 50,
    include: {
      user: { select: { id: true, displayName: true, email: true } },
      episode: { select: { title: true, slug: true } },
      reports: { include: { user: { select: { displayName: true } } } },
    },
  });

  const flaggedCount = comments.filter((c) => c.flagged).length;

  return (
    <main id="main-content" className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-accent-gold">
          Comment Moderation
        </h1>
        {flaggedCount > 0 && (
          <span className="rounded-full bg-red-500/20 px-3 py-1 font-mono text-xs text-red-400">
            {flaggedCount} flagged
          </span>
        )}
      </div>

      {comments.length === 0 ? (
        <p className="font-mono text-sm text-text-muted">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`rounded-lg border p-4 ${
                comment.flagged
                  ? "border-red-400/30 bg-red-400/5"
                  : "border-border bg-surface"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-text-primary">
                      {comment.user.displayName}
                    </span>
                    <span className="font-mono text-[10px] text-text-muted">
                      {comment.user.email}
                    </span>
                    {comment.flagged && (
                      <StatusBadge label="Flagged" variant="purple" />
                    )}
                  </div>
                  <p className="text-sm text-text-primary mb-2">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-3 font-mono text-[10px] text-text-muted">
                    <span>
                      on{" "}
                      <a
                        href={`/episodes/${comment.episode.slug}`}
                        className="text-accent-gold-text hover:underline"
                      >
                        {comment.episode.title}
                      </a>
                    </span>
                    <span>{formatDate(comment.createdAt)}</span>
                    {comment.reports.length > 0 && (
                      <span className="text-red-400">
                        {comment.reports.length} report{comment.reports.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {comment.flaggedReason && (
                    <p className="mt-1 font-mono text-[10px] text-red-400 italic">
                      Reason: {comment.flaggedReason}
                    </p>
                  )}
                </div>
                <CommentActions commentId={comment.id} flagged={comment.flagged} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
