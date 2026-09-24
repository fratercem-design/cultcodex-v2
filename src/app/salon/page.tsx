import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { hasSystemTier } from "@/lib/subscription";
import { getSalonThreads } from "@/lib/queries/salon";
import { PageHero } from "@/components/ui/page-hero";
import { buildMetadata } from "@/lib/seo";
import { relativeTime } from "@/lib/format/relative-time";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "The Salon",
  description:
    "The Oracle-tier members salon — the room behind the room. Slow conversation with the people who've gone deepest into the archive.",
  path: "/salon",
});

export default async function SalonPage() {
  const user = await getCurrentUser();
  const unlocked = user ? await hasSystemTier(user.id) : false;

  if (!unlocked) {
    return (
      <>
        <PageHero title="THE SALON" subtitle="The room behind the room." label="oracle_only" backgroundImage="/hero-bg.jpg" />
        <main id="main-content" className="mx-auto max-w-2xl px-4 py-16">
          <div className="rounded-2xl border border-accent-violet/40 bg-gradient-to-b from-accent-violet/10 to-surface p-8 text-center space-y-4">
            <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-violet-text/70">
              {"/// oracle_tier_only"}
            </p>
            <h2 className="font-display text-2xl font-bold text-accent-violet-text">
              The Salon is for Oracle members.
            </h2>
            <p className="mx-auto max-w-md font-mono text-xs text-text-muted leading-relaxed">
              A slow, members-only room for the people who&apos;ve gone deepest into the
              archive. Weekly prompts, no algorithm, no noise. Become Oracle to take a seat.
            </p>
            <div className="pt-2">
              <Link
                href="/premium#system"
                className="inline-flex items-center gap-2 rounded-lg border border-accent-violet bg-accent-violet/15 px-6 py-3 font-mono text-sm font-bold text-accent-violet-text transition-all hover:bg-accent-violet/25"
              >
                {user ? "Become Oracle — $25/mo →" : "Sign in & become Oracle →"}
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const threads = await getSalonThreads();

  return (
    <>
      <PageHero
        title="THE SALON"
        subtitle="The room behind the room. Speak freely."
        label="oracle_salon"
        backgroundImage="/hero-bg.jpg"
      />
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 space-y-4">
        {threads.length === 0 && (
          <p className="text-center font-mono text-sm text-text-muted py-12">
            No threads yet. The first prompt is on its way.
          </p>
        )}
        {threads.map((t) => (
          <Link
            key={t.id}
            href={`/salon/${t.id}`}
            className="block rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent-violet/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {t.pinned && (
                    <span className="font-mono text-[12px] uppercase tracking-widest text-accent-violet-text">
                      ✦ pinned
                    </span>
                  )}
                  {t.closed && (
                    <span className="font-mono text-[12px] uppercase tracking-widest text-text-muted">
                      closed
                    </span>
                  )}
                </div>
                <h2 className="font-display text-lg font-bold text-text-primary">{t.title}</h2>
                <p className="font-mono text-xs text-text-muted leading-relaxed line-clamp-2">
                  {t.prompt}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 font-mono text-[12px] text-text-muted">
              <span>{t._count.posts} {t._count.posts === 1 ? "voice" : "voices"}</span>
              <span>·</span>
              <span>opened {relativeTime(t.createdAt)}</span>
            </div>
          </Link>
        ))}
      </main>
    </>
  );
}
