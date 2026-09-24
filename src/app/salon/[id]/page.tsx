import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { hasSystemTier } from "@/lib/subscription";
import { getSalonThread } from "@/lib/queries/salon";
import { PageHero } from "@/components/ui/page-hero";
import { buildMetadata } from "@/lib/seo";
import { SalonThreadView } from "@/components/salon/salon-thread-view";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const thread = await getSalonThread(id);
  return buildMetadata({
    title: thread ? `${thread.title} — The Salon` : "The Salon",
    description: thread?.prompt ?? "The Oracle-tier members salon.",
    path: `/salon/${id}`,
  });
}

export default async function SalonThreadPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const unlocked = user ? await hasSystemTier(user.id) : false;

  if (!unlocked) {
    return (
      <>
        <PageHero title="THE SALON" subtitle="Oracle members only." label="oracle_only" backgroundImage="/hero-bg.jpg" />
        <main id="main-content" className="mx-auto max-w-2xl px-4 py-16 text-center">
          <Link
            href="/premium#system"
            className="inline-flex items-center gap-2 rounded-lg border border-accent-violet bg-accent-violet/15 px-6 py-3 font-mono text-sm font-bold text-accent-violet-text transition-all hover:bg-accent-violet/25"
          >
            Become Oracle to enter →
          </Link>
        </main>
      </>
    );
  }

  const thread = await getSalonThread(id);
  if (!thread) notFound();

  return (
    <>
      <PageHero title="THE SALON" subtitle={thread.title} label="oracle_salon" backgroundImage="/hero-bg.jpg" />
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-12">
        <Link href="/salon" className="font-mono text-xs text-text-muted hover:text-accent-violet-text">
          ← All threads
        </Link>

        <div className="mt-4 rounded-xl border border-accent-violet/30 bg-gradient-to-b from-accent-violet/5 to-surface p-6">
          <h1 className="font-display text-2xl font-bold text-text-primary">{thread.title}</h1>
          <p className="mt-3 font-mono text-sm text-text-muted leading-relaxed whitespace-pre-line">
            {thread.prompt}
          </p>
        </div>

        <SalonThreadView
          threadId={thread.id}
          closed={thread.closed}
          initialPosts={thread.posts.map((p) => ({
            id: p.id,
            content: p.content,
            createdAt: p.createdAt.toISOString(),
            user: {
              id: p.user.id,
              displayName: p.user.displayName,
              avatarUrl: p.user.avatarUrl,
              memberTitle: p.user.memberTitle,
            },
          }))}
          currentUserId={user!.id}
        />
      </main>
    </>
  );
}
