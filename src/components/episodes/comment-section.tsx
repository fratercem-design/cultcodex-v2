"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { relativeTime } from "@/lib/format/relative-time";
import { useSSE } from "@/lib/sse/use-sse";

interface CommentUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
  replies: {
    id: string;
    content: string;
    createdAt: string;
    user: CommentUser;
  }[];
}

interface CommentSectionProps {
  slug: string;
  initialComments: Comment[];
  initialTotalCount: number;
  isAuthenticated: boolean;
  currentUserId?: string;
}

export function CommentSection({
  slug,
  initialComments,
  initialTotalCount,
  isAuthenticated,
  currentUserId,
}: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useSSE({
    url: `/api/sse/episodes/${slug}`,
    onMessage: (event) => {
      if (event.type === "new-comment" && event.data) {
        const d = event.data as {
          id: string;
          content: string;
          userId: string;
          displayName: string;
          avatarUrl: string | null;
          createdAt: string;
          parentId: string | null;
          flagged: boolean;
        };
        if (d.flagged) return;
        const newComment: Comment = {
          id: d.id,
          content: d.content,
          createdAt: d.createdAt,
          user: { id: d.userId, displayName: d.displayName, avatarUrl: d.avatarUrl },
          replies: [],
        };
        setComments((prev) => {
          if (prev.some((c) => c.id === newComment.id)) return prev;
          if (d.parentId) {
            // Check replies too for dedup
            if (prev.some((c) => c.replies.some((r) => r.id === newComment.id))) return prev;
            return prev.map((c) =>
              c.id === d.parentId
                ? { ...c, replies: [...c.replies, { id: d.id, content: d.content, createdAt: d.createdAt, user: newComment.user }] }
                : c,
            );
          }
          return [newComment, ...prev];
        });
      }
    },
  });

  const submitComment = useCallback(
    async (content: string, parentId?: string) => {
      if (!isAuthenticated) {
        window.location.href = "/auth/signin";
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        const res = await fetch(`/api/episodes/${slug}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, parentId }),
        });

        const data = await res.json();

        if (res.status === 202) {
          setError("Your comment is being reviewed. It will appear once approved.");
          return;
        }

        if (!res.ok) {
          setError(data.error || "Failed to post comment");
          return;
        }

        if (parentId) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentId
                ? { ...c, replies: [...c.replies, { ...data, createdAt: data.createdAt }] }
                : c,
            ),
          );
          setReplyTo(null);
          setReplyText("");
        } else {
          setComments((prev) => [{ ...data, replies: [], createdAt: data.createdAt }, ...prev]);
          setNewComment("");
        }
        setTotalCount((prev) => prev + 1);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [slug, isAuthenticated],
  );

  const reportComment = useCallback(
    async (commentId: string) => {
      if (!isAuthenticated) return;
      const reason = prompt("Why are you reporting this comment?");
      if (!reason) return;

      await fetch(`/api/comments/${commentId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      alert("Report submitted. Thank you.");
    },
    [isAuthenticated],
  );

  return (
    <div className="space-y-6">
      {/* Comment form */}
      <div className="space-y-3">
        {isAuthenticated ? (
          <>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts on this episode..."
              maxLength={2000}
              rows={3}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-gold focus:outline-none focus:ring-1 focus:ring-accent-gold resize-none transition-colors"
            />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-text-muted">
                {newComment.length}/2000
              </span>
              <button
                onClick={() => submitComment(newComment)}
                disabled={submitting || newComment.trim().length === 0}
                className="rounded bg-accent-gold/10 px-4 py-1.5 font-mono text-xs text-accent-gold transition-colors hover:bg-accent-gold/20 disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-border bg-surface p-4 text-center">
            <p className="text-sm text-text-muted">
              <a href="/auth/signin" className="text-accent-gold hover:underline">Sign in</a>{" "}
              to join the conversation.
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-accent-crimson font-mono">{error}</p>}

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-center text-sm text-text-muted py-4">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              <CommentCard
                comment={comment}
                isAuthenticated={isAuthenticated}
                currentUserId={currentUserId}
                onReply={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                onReport={() => reportComment(comment.id)}
              />

              {comment.replies.length > 0 && (
                <div className="ml-8 space-y-3 border-l border-border/50 pl-4">
                  {comment.replies.map((reply) => (
                    <CommentCard
                      key={reply.id}
                      comment={reply}
                      isAuthenticated={isAuthenticated}
                      currentUserId={currentUserId}
                      onReport={() => reportComment(reply.id)}
                      isReply
                    />
                  ))}
                </div>
              )}

              {replyTo === comment.id && isAuthenticated && (
                <div className="ml-8 space-y-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    maxLength={2000}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent-gold focus:outline-none focus:ring-1 focus:ring-accent-gold resize-none transition-colors"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitComment(replyText, comment.id)}
                      disabled={submitting || replyText.trim().length === 0}
                      className="rounded bg-accent-gold/10 px-3 py-1 font-mono text-[10px] text-accent-gold transition-colors hover:bg-accent-gold/20 disabled:opacity-50"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => { setReplyTo(null); setReplyText(""); }}
                      className="rounded px-3 py-1 font-mono text-[10px] text-text-muted transition-colors hover:text-text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentCard({
  comment,
  isAuthenticated,
  currentUserId,
  onReply,
  onReport,
  isReply = false,
}: {
  comment: { id: string; content: string; createdAt: string; user: CommentUser };
  isAuthenticated: boolean;
  currentUserId?: string;
  onReply?: () => void;
  onReport: () => void;
  isReply?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center gap-2 mb-2">
        <Link href={`/user/${comment.user.id}`} className="flex items-center gap-2 group">
          {comment.user.avatarUrl ? (
            <Image src={comment.user.avatarUrl} alt="" width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-gold/20 text-[10px] text-accent-gold font-bold">
              {comment.user.displayName[0]?.toUpperCase()}
            </div>
          )}
          <span className="font-mono text-xs text-text-primary font-medium group-hover:text-accent-gold transition-colors">
            {comment.user.displayName}
          </span>
        </Link>
        <span className="font-mono text-[10px] text-text-muted">
          {relativeTime(comment.createdAt)}
        </span>
      </div>
      <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
        {comment.content}
      </p>
      <div className="mt-2 flex gap-3">
        {onReply && !isReply && (
          <button onClick={onReply} className="font-mono text-[10px] text-text-muted hover:text-accent-gold transition-colors">
            Reply
          </button>
        )}
        {isAuthenticated && comment.user.id !== currentUserId && (
          <button onClick={onReport} className="font-mono text-[10px] text-text-muted hover:text-accent-crimson transition-colors">
            Report
          </button>
        )}
      </div>
    </div>
  );
}
