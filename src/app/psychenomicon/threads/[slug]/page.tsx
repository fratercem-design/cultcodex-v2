import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const thread = await prisma.psychenomiconThread.findUnique({
    where: { slug },
    select: { title: true, description: true },
  }).catch(() => null);
  if (!thread) return { title: "Thread Not Found — CULT CODEX" };
  return {
    title: `${thread.title} — Thread — Psychenomicon`,
    description: thread.description ?? "A narrative thread in the Psychenomicon.",
  };
}

const STATUS_STYLES: Record<string, { label: string; dot: string; badge: string }> = {
  active:   { label: "active",   dot: "bg-accent-violet",         badge: "border-accent-violet/30 text-accent-violet-text bg-accent-violet/10" },
  emerging: { label: "emerging", dot: "bg-accent-gold animate-pulse", badge: "border-accent-gold/30 text-accent-gold-text bg-accent-gold/10" },
  resolved: { label: "resolved", dot: "bg-border",                badge: "border-border text-text-muted" },
};

export default async function ThreadPage({ params }: PageProps) {
  const { slug } = await params;

  const user = await getCurrentUser();
  const canRead = user ? await isSubscribed(user.id).catch(() => false) : false;

  if (!canRead) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet-text">{"/// initiate_only"}</p>
          <p className="font-display text-xl font-bold text-text-primary">This thread is sealed.</p>
          <Link
            href="/premium#access"
            className="inline-flex items-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 px-5 py-2 font-mono text-xs font-bold text-accent-violet-text hover:bg-accent-violet/20 transition-colors"
          >
            Become Initiate+ →
          </Link>
        </div>
      </main>
    );
  }

  const thread = await prisma.psychenomiconThread.findUnique({
    where: { slug },
    include: {
      chapterLinks: {
        include: {
          chapter: {
            select: {
              slug: true,
              chapterNumber: true,
              title: true,
              isMajorEvent: true,
              emergingSignals: true,
              episode: { select: { title: true, slug: true, episodeNumber: true } },
            },
          },
        },
        orderBy: { chapter: { chapterNumber: "asc" } },
      },
    },
  }).catch(() => null);

  if (!thread) notFound();

  const style = STATUS_STYLES[thread.status] ?? STATUS_STYLES.active;
  const chapters = thread.chapterLinks.map((tc) => tc.chapter);

  return (
    <main className="min-h-screen bg-void">
      {/* Header */}
      <header className="border-b border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-void py-10 px-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex items-center gap-3">
            <Link
              href="/psychenomicon"
              className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet-text/70 hover:text-accent-violet-text transition-colors"
            >
              ← Psychenomicon
            </Link>
            <span className="text-border">/</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-text-muted">thread</span>
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${style.dot}`} />
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary leading-tight">
                  {thread.title}
                </h1>
              </div>
              {thread.description && (
                <p className="text-sm text-text-muted leading-relaxed">{thread.description}</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className={`inline-flex items-center rounded border px-2.5 py-1 font-mono text-[9px] uppercase ${style.badge}`}>
                {style.label}
              </span>
              <span className="font-mono text-[9px] text-text-muted">
                {chapters.length} chapter{chapters.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">

        {/* Thread status callout */}
        {thread.status === "resolved" && (
          <div className="rounded-lg border border-border bg-surface px-5 py-4 text-xs text-text-muted italic">
            This thread has been resolved. It no longer appears in active chapter signals.
          </div>
        )}
        {thread.status === "emerging" && (
          <div className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 px-5 py-4 flex items-start gap-3">
            <span className="text-accent-gold-text text-sm flex-shrink-0 mt-0.5">▸</span>
            <p className="text-xs text-text-muted leading-relaxed">
              This thread is <span className="text-accent-gold-text font-medium">emerging</span> — patterns are forming but not yet fully named. Watch for escalation.
            </p>
          </div>
        )}

        {/* Chapter timeline */}
        {chapters.length > 0 ? (
          <section className="space-y-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">{"/// chapter_appearances"}</p>
            <div className="relative pl-6">
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
              <div className="space-y-4">
                {chapters.map((c, i) => {
                  const isLast = i === chapters.length - 1;
                  return (
                    <div key={c.slug} className="relative">
                      <div className={`absolute -left-6 top-2 h-3 w-3 rounded-full border-2 border-void ${
                        c.isMajorEvent ? "bg-accent-gold" : isLast ? "bg-accent-violet" : "bg-border"
                      }`} />
                      <Link
                        href={`/psychenomicon/chapters/${c.slug}`}
                        className="group block rounded-lg border border-border bg-surface p-4 hover:border-accent-violet/40 hover:bg-accent-violet/5 transition-all space-y-2"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`font-mono text-[10px] flex-shrink-0 ${c.isMajorEvent ? "text-accent-gold-text" : "text-text-muted"}`}>
                            CH.{String(c.chapterNumber).padStart(3, "0")}{c.isMajorEvent ? " ✦" : ""}
                          </span>
                          {c.episode && (
                            <span className="font-mono text-[9px] text-text-muted truncate">
                              {c.episode.episodeNumber ? `EP.${String(c.episode.episodeNumber).padStart(3, "0")} ·` : ""} {c.episode.title}
                            </span>
                          )}
                        </div>
                        <p className={`font-mono text-xs font-medium group-hover:text-accent-violet-text transition-colors ${c.isMajorEvent ? "text-accent-gold-text" : "text-text-primary"}`}>
                          {c.title}
                        </p>
                        {c.emergingSignals.length > 0 && (
                          <div className="space-y-1 pt-1">
                            {c.emergingSignals.slice(0, 2).map((s, j) => (
                              <div key={j} className="flex items-start gap-2">
                                <span className="text-accent-gold-text/80 font-mono text-[9px] flex-shrink-0 mt-0.5">▸</span>
                                <p className="text-[10px] text-text-muted leading-relaxed line-clamp-1">{s}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : (
          <p className="text-xs text-text-muted italic">No chapters linked to this thread yet.</p>
        )}

        {/* Footer nav */}
        <div className="border-t border-border pt-6 flex items-center justify-between">
          <Link
            href="/psychenomicon"
            className="font-mono text-[10px] text-text-muted hover:text-accent-violet-text transition-colors"
          >
            ← Return to Psychenomicon
          </Link>
        </div>
      </div>
    </main>
  );
}
