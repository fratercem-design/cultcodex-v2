import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { CodexSigil } from "@/components/graphics/codex-sigil";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import { getSingleQuestProgress } from "@/lib/quests/get-quest-progress";
import { getQuestBySlug, QUESTS } from "@/lib/quests/quests";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const quest = getQuestBySlug(slug);
  return buildMetadata({
    title: quest ? `${quest.title} — The Trials` : "Trial Not Found",
    description: quest?.description ?? "A hidden trial of the Codex.",
    path: `/quests/${slug}`,
  });
}

const HEX: Record<string, string> = {
  gold: "#C8392E", cyan: "#62E4C8", violet: "#4A2D6E", crimson: "#A94A4A",
};

export default async function QuestRewardPage({ params }: Props) {
  const { slug } = await params;
  const quest = getQuestBySlug(slug);
  if (!quest) notFound();

  const user = await getCurrentUser();
  const isMember = user
    ? user.role === "admin" || (await isSubscribed(user.id).catch(() => false))
    : false;
  const progress = user ? await getSingleQuestProgress(user.id, isMember, slug) : null;
  const unlocked = progress?.done ?? false;
  const hex = HEX[quest.accent] ?? "#C8392E";

  return (
    <>
      <PageHero
        title={quest.title.toUpperCase()}
        subtitle={unlocked ? "Fragment unlocked." : "Sealed — complete the trial to unlock."}
        backgroundImage="/hero-bg.jpg"
        label="trial"
      />

      <main id="main-content" className="mx-auto max-w-2xl px-4 py-12 space-y-10">
        <nav aria-label="Breadcrumb" className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
          <Link href="/quests" className="hover:text-accent-gold-text transition-colors">The Trials</Link>
          <span className="mx-2">/</span>
          <span style={{ color: hex }}>{quest.title}</span>
        </nav>

        {unlocked ? (
          <article className="space-y-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <span style={{ color: hex, textShadow: `0 0 24px ${hex}66` }}>
                <CodexSigil size={56} glow />
              </span>
              <p className="font-mono text-[9px] uppercase tracking-[0.4em]" style={{ color: hex }}>
                {"/// fragment_unlocked"}
              </p>
              <h2 className="font-display text-2xl font-bold text-white">{quest.reward.title}</h2>
            </div>
            <MysticalDivider />
            <div className="space-y-4">
              {quest.reward.body.map((para, i) => (
                <p key={i} className="font-serif text-[15px] text-text-primary leading-relaxed">{para}</p>
              ))}
            </div>
            <MysticalDivider />
            <div className="text-center">
              <Link href="/quests" className="font-mono text-[11px] uppercase tracking-widest text-text-muted hover:text-accent-gold-text transition-colors">
                ← Back to the Trials
              </Link>
            </div>
          </article>
        ) : (
          <section className="rounded-2xl border border-border bg-surface p-8 text-center space-y-5">
            <div className="text-5xl text-text-muted/20" aria-hidden="true">🔒</div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted/50">{"/// sealed"}</p>
            <p className="font-display text-lg font-bold text-text-primary">This fragment is hidden.</p>
            <p className="font-mono text-[11px] text-text-muted max-w-sm mx-auto leading-relaxed">
              {quest.description}
            </p>
            {progress ? (
              <div className="space-y-1.5 max-w-xs mx-auto">
                <div className="flex items-center justify-between font-mono text-[10px] text-text-muted/60">
                  <span>{progress.current} / {progress.target} {quest.metricLabel}</span>
                  <span>{progress.pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-void overflow-hidden border border-border">
                  <div className="h-full rounded-full transition-all" style={{ width: `${progress.pct}%`, background: hex }} />
                </div>
              </div>
            ) : (
              <p className="font-mono text-[11px] text-text-muted/60">Sign in to track this trial.</p>
            )}
            <Link
              href={user ? quest.hintHref : "/auth/signin"}
              className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 font-mono text-xs font-bold transition-all hover:bg-white/5"
              style={{ borderColor: `${hex}66`, color: hex }}
            >
              {user ? `${quest.hint} →` : "Sign in →"}
            </Link>
          </section>
        )}
      </main>
    </>
  );
}

export function generateStaticParams() {
  return QUESTS.map((q) => ({ slug: q.slug }));
}
