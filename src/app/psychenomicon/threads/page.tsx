import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Threads — Psychenomicon — CULT CODEX",
  description: "All narrative threads tracked in the Psychenomicon — active, emerging, and resolved.",
};

const STATUS_ORDER = ["emerging", "active", "resolved"] as const;

const STATUS_META = {
  emerging: {
    label: "Emerging",
    dot: "bg-accent-gold animate-pulse",
    badge: "border-accent-gold/30 text-accent-gold bg-accent-gold/5",
    heading: "text-accent-gold",
  },
  active: {
    label: "Active",
    dot: "bg-accent-violet",
    badge: "border-accent-violet/30 text-accent-violet bg-accent-violet/5",
    heading: "text-accent-violet",
  },
  resolved: {
    label: "Resolved",
    dot: "bg-border",
    badge: "border-border text-text-muted bg-surface",
    heading: "text-text-muted",
  },
} as const;

export default async function ThreadsIndexPage() {
  const user = await getCurrentUser();
  const canRead = user ? await isSubscribed(user.id).catch(() => false) : false;

  if (!canRead) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet">{"/// initiate_only"}</p>
          <p className="font-display text-xl font-bold text-text-primary">The thread registry is sealed.</p>
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 px-5 py-2 font-mono text-xs font-bold text-accent-violet hover:bg-accent-violet/20 transition-colors"
          >
            Become Initiate+ →
          </Link>
        </div>
      </main>
    );
  }

  const threads = await prisma.psychenomiconThread.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      chapterLinks: {
        include: {
          chapter: {
            select: { slug: true, chapterNumber: true, title: true, isMajorEvent: true },
          },
        },
        orderBy: { chapter: { chapterNumber: "asc" } },
      },
    },
  }).catch(() => []);

  const byStatus = Object.fromEntries(
    STATUS_ORDER.map((s) => [s, threads.filter((t) => t.status === s)])
  ) as Record<(typeof STATUS_ORDER)[number], typeof threads>;

  const counts = {
    emerging: byStatus.emerging.length,
    active: byStatus.active.length,
    resolved: byStatus.resolved.length,
  };

  return (
    <main className="min-h-screen bg-void">
      <header className="border-b border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-void py-10 px-4">
        <div className="mx-auto max-w-5xl space-y-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-accent-violet/60">
            ψ PSYCHENOMICON · THREADS ψ
          </p>
          <h1 className="font-display text-2xl font-bold text-text-primary">Thread Registry</h1>
          <p className="text-xs text-text-muted">
            {threads.length} thread{threads.length !== 1 ? "s" : ""} tracked &middot;&nbsp;
            <span className="text-accent-gold">{counts.emerging} emerging</span>
            &nbsp;&middot;&nbsp;
            <span className="text-accent-violet">{counts.active} active</span>
            &nbsp;&middot;&nbsp;
            <span>{counts.resolved} resolved</span>
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 space-y-12">
        {STATUS_ORDER.map((status) => {
          const group = byStatus[status];
          if (group.length === 0) return null;
          const meta = STATUS_META[status];
          return (
            <section key={status} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${meta.dot}`} />
                <p className={`font-mono text-[10px] uppercase tracking-[0.35em] ${meta.heading}`}>
                  {meta.label} — {group.length}
                </p>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {group.map((thread) => (
                  <Link
                    key={thread.slug}
                    href={`/psychenomicon/threads/${thread.slug}`}
                    className="group rounded-lg border border-border bg-surface p-5 space-y-3 hover:border-accent-violet/40 hover:bg-accent-violet/5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-xs font-bold text-text-primary group-hover:text-accent-violet transition-colors leading-snug">
                        {thread.title}
                      </p>
                      <span className={`flex-shrink-0 inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[8px] uppercase ${meta.badge}`}>
                        {meta.label}
                      </span>
                    </div>

                    {thread.description && (
                      <p className="text-[11px] text-text-muted leading-relaxed line-clamp-3">
                        {thread.description}
                      </p>
                    )}

                    {thread.chapterLinks.length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-border/60">
                        <p className="font-mono text-[8px] uppercase tracking-widest text-text-muted/50">
                          {thread.chapterLinks.length} chapter{thread.chapterLinks.length !== 1 ? "s" : ""}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {thread.chapterLinks.slice(0, 6).map(({ chapter: c }) => (
                            <span
                              key={c.slug}
                              className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[8px] ${
                                c.isMajorEvent
                                  ? "border-accent-gold/30 text-accent-gold bg-accent-gold/5"
                                  : "border-border text-text-muted"
                              }`}
                            >
                              CH.{String(c.chapterNumber).padStart(3, "0")}
                            </span>
                          ))}
                          {thread.chapterLinks.length > 6 && (
                            <span className="font-mono text-[8px] text-text-muted/50 self-center">
                              +{thread.chapterLinks.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {threads.length === 0 && (
          <p className="text-center text-sm text-text-muted italic py-16">
            No threads recorded yet. Generate a chapter to begin.
          </p>
        )}

        <Link
          href="/psychenomicon"
          className="block font-mono text-[10px] text-text-muted hover:text-accent-violet transition-colors"
        >
          ← Return to Psychenomicon
        </Link>
      </div>
    </main>
  );
}
