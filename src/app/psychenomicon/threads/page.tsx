export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/psychenomicon/threads" },
  title: "Threads — Psychenomicon — CULT CODEX",
  description: "All narrative threads tracked in the Psychenomicon — active, emerging, and resolved.",
};

const STATUS_ORDER = ["emerging", "active", "resolved"] as const;

const STATUS_META = {
  emerging: {
    label: "Emerging",
    dot: "bg-accent-gold animate-pulse",
    badge: "border-accent-gold/30 text-accent-gold-text bg-accent-gold/5",
    heading: "text-accent-gold-text",
  },
  active: {
    label: "Active",
    dot: "bg-accent-violet",
    badge: "border-accent-violet/30 text-accent-violet-text bg-accent-violet/5",
    heading: "text-accent-violet-text",
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
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet-text">{"/// initiate_only"}</p>
          <p className="font-display text-xl font-bold text-text-primary">The thread registry is sealed.</p>
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 px-5 py-2 font-mono text-xs font-bold text-accent-violet-text hover:bg-accent-violet/20 transition-colors"
          >
            Become Initiate+ →
          </Link>
        </div>
      </main>
    );
  }

  // ~2,000 threads exist — never load them all. Show the live ones
  // (emerging + active) generously and sample resolved; the chapter links
  // per card are capped with a real total via _count.
  const TAKE: Record<(typeof STATUS_ORDER)[number], number> = { emerging: 40, active: 60, resolved: 12 };
  const threadInclude = {
    chapterLinks: {
      take: 6,
      orderBy: { chapter: { chapterNumber: "asc" as const } },
      include: { chapter: { select: { slug: true, chapterNumber: true, title: true, isMajorEvent: true } } },
    },
    _count: { select: { chapterLinks: true } },
  };

  const [statusCounts, emerging, active, resolved] = await Promise.all([
    prisma.psychenomiconThread.groupBy({ by: ["status"], _count: { _all: true } }).catch(() => [] as { status: string; _count: { _all: number } }[]),
    prisma.psychenomiconThread.findMany({ where: { status: "emerging" }, orderBy: { updatedAt: "desc" }, take: TAKE.emerging, include: threadInclude }).catch(() => []),
    prisma.psychenomiconThread.findMany({ where: { status: "active" }, orderBy: { updatedAt: "desc" }, take: TAKE.active, include: threadInclude }).catch(() => []),
    prisma.psychenomiconThread.findMany({ where: { status: "resolved" }, orderBy: { updatedAt: "desc" }, take: TAKE.resolved, include: threadInclude }).catch(() => []),
  ]);

  const byStatus = { emerging, active, resolved } as Record<(typeof STATUS_ORDER)[number], typeof emerging>;

  const countFor = (s: string) => statusCounts.find((r) => r.status === s)?._count._all ?? 0;
  const counts = { emerging: countFor("emerging"), active: countFor("active"), resolved: countFor("resolved") };
  const totalThreads = counts.emerging + counts.active + counts.resolved;

  return (
    <main className="min-h-screen bg-void">
      <header className="border-b border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-void py-10 px-4">
        <div className="mx-auto max-w-5xl space-y-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-accent-violet-text/70">
            ψ PSYCHENOMICON · THREADS ψ
          </p>
          <h1 className="font-display text-2xl font-bold text-text-primary">Thread Registry</h1>
          <p className="text-xs text-text-muted">
            {totalThreads.toLocaleString("en-US")} thread{totalThreads !== 1 ? "s" : ""} tracked &middot;&nbsp;
            <span className="text-accent-gold-text">{counts.emerging} emerging</span>
            &nbsp;&middot;&nbsp;
            <span className="text-accent-violet-text">{counts.active} active</span>
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
          const totalForStatus = counts[status];
          return (
            <section key={status} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${meta.dot}`} />
                <p className={`font-mono text-[10px] uppercase tracking-[0.35em] ${meta.heading}`}>
                  {meta.label} — {totalForStatus}{group.length < totalForStatus ? ` · showing ${group.length}` : ""}
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
                      <p className="font-mono text-xs font-bold text-text-primary group-hover:text-accent-violet-text transition-colors leading-snug">
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

                    {thread._count.chapterLinks > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-border/60">
                        <p className="font-mono text-[8px] uppercase tracking-widest text-text-muted/50">
                          {thread._count.chapterLinks} chapter{thread._count.chapterLinks !== 1 ? "s" : ""}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {thread.chapterLinks.map(({ chapter: c }) => (
                            <span
                              key={c.slug}
                              className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[8px] ${
                                c.isMajorEvent
                                  ? "border-accent-gold/30 text-accent-gold-text bg-accent-gold/5"
                                  : "border-border text-text-muted"
                              }`}
                            >
                              CH.{String(c.chapterNumber).padStart(3, "0")}
                            </span>
                          ))}
                          {thread._count.chapterLinks > thread.chapterLinks.length && (
                            <span className="font-mono text-[8px] text-text-muted/50 self-center">
                              +{thread._count.chapterLinks - thread.chapterLinks.length} more
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

        {totalThreads === 0 && (
          <p className="text-center text-sm text-text-muted italic py-16">
            No threads recorded yet. Generate a chapter to begin.
          </p>
        )}

        <Link
          href="/psychenomicon"
          className="block font-mono text-[10px] text-text-muted hover:text-accent-violet-text transition-colors"
        >
          ← Return to Psychenomicon
        </Link>
      </div>
    </main>
  );
}
