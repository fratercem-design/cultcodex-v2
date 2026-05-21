"use client";

import { useState } from "react";
import Image from "next/image";
import { relativeTime } from "@/lib/format/relative-time";

interface SalonPost {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    memberTitle: string | null;
  };
}

interface SalonThreadViewProps {
  threadId: string;
  closed: boolean;
  initialPosts: SalonPost[];
  currentUserId: string;
}

export function SalonThreadView({
  threadId,
  closed,
  initialPosts,
  currentUserId,
}: SalonThreadViewProps) {
  const [posts, setPosts] = useState<SalonPost[]>(initialPosts);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || status === "sending") return;
    setStatus("sending");
    setNotice(null);

    try {
      const res = await fetch(`/api/salon/threads/${threadId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

      if (res.status === 201) {
        const post = (await res.json()) as SalonPost;
        setPosts((prev) => [...prev, post]);
        setContent("");
      } else if (res.status === 202) {
        setContent("");
        setNotice("Your post is being reviewed before it appears.");
      } else {
        const data = await res.json().catch(() => ({}));
        setNotice(data.error || "Could not post. Try again.");
      }
    } catch {
      setNotice("Network error. Try again.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="space-y-4">
        {posts.length === 0 && (
          <p className="font-mono text-xs text-text-muted">
            No voices yet. Be the first to speak.
          </p>
        )}
        {posts.map((p) => (
          <div
            key={p.id}
            className={`rounded-lg border p-4 ${
              p.user.id === currentUserId ? "border-accent-violet/30 bg-accent-violet/5" : "border-border bg-surface"
            }`}
          >
            <div className="flex items-center gap-2">
              {p.user.avatarUrl ? (
                <Image
                  src={p.user.avatarUrl}
                  alt=""
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-accent-violet/20" />
              )}
              <span className="font-mono text-xs font-bold text-text-primary">
                {p.user.displayName}
              </span>
              {p.user.memberTitle && (
                <span className="font-mono text-[9px] uppercase tracking-widest text-accent-violet">
                  {p.user.memberTitle}
                </span>
              )}
              <span className="font-mono text-[10px] text-text-muted/60">
                {relativeTime(p.createdAt)}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-line font-mono text-sm text-text-muted leading-relaxed">
              {p.content}
            </p>
          </div>
        ))}
      </div>

      {closed ? (
        <p className="font-mono text-xs text-text-muted">This thread is closed.</p>
      ) : (
        <form onSubmit={submit} className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add your voice…"
            rows={4}
            maxLength={4000}
            disabled={status === "sending"}
            className="w-full rounded-lg border border-border bg-void px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted/40 focus:border-accent-violet/60 focus:outline-none resize-y disabled:opacity-50"
          />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-text-muted/50">{content.length}/4000</span>
            <button
              type="submit"
              disabled={!content.trim() || status === "sending"}
              className="rounded-lg border border-accent-violet bg-accent-violet/15 px-6 py-2.5 font-mono text-sm font-bold text-accent-violet transition-all hover:bg-accent-violet/25 disabled:opacity-40"
            >
              {status === "sending" ? "Posting…" : "Post"}
            </button>
          </div>
          {notice && <p className="font-mono text-xs text-accent-cyan">{notice}</p>}
        </form>
      )}
    </div>
  );
}
