import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import { getQuestProgress } from "@/lib/quests/get-quest-progress";
import { QUESTS, type QuestAccent } from "@/lib/quests/quests";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "The Trials — Unlock Hidden Fragments",
  description:
    "Complete the Trials of the Codex — favorite transmissions, save signals, contribute — to unlock hidden lore fragments and rise through the cult.",
  path: "/quests",
});

const ACCENT: Record<QuestAccent, { text: string; border: string; bar: string; hex: string }> = {
  gold: { text: "text-accent-gold", border: "border-accent-gold/30", bar: "bg-accent-gold", hex: "#C8A96B" },
  cyan: { text: "text-accent-cyan", border: "border-accent-cyan/30", bar: "bg-accent-cyan", hex: "#5DB7D8" },
  violet: { text: "text-accent-violet", border: "border-accent-violet/30", bar: "bg-accent-violet", hex: "#9B6ED0" },
  crimson: { text: "text-accent-crimson", border: "border-accent-crimson/30", bar: "bg-accent-crimson", hex: "#A94A4A" },
};

export default async function QuestsPage() {
  const user = await getCurrentUser();
  const isMember = user
    ? user.role === "admin" || (await isSubscribed(user.id).catch(() => false))
    : false;
  const progress = user ? await getQuestProgress(user.id, isMember) : null;
  const completed = progress?.filter((p) => p.done).length ?? 0;

  return (
    <>
      <PageHero
        title="THE TRIALS"
        subtitle="Complete the rites. Unlock what's hidden."
        backgroundImage="/hero-bg.jpg"
        label="trials"
      />

      <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 space-y-10">
        <section className="text-center max-w-xl mx-auto space-y-2">
          <p className="text-sm text-text-muted leading-relaxed">
            Each Trial is a rite of passage through the archive. Complete one to unlock a hidden
            lore fragment — and climb the <Link href="/rank" className="text-accent-gold hover:underline">ranks</Link>.
          </p>
          {progress && (
            <p className="font-mono text-[11px] text-text-muted/60">
              {completed} of {QUESTS.length} trials complete
            </p>
          )}
        </section>

        {!user && (
          <section className="rounded-2xl border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-surface p-6 text-center space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold/60">{"/// sign_in_to_begin"}</p>
            <p className="font-mono text-[11px] text-text-muted max-w-md mx-auto">
              The Trials track your real activity in the archive. Sign in to begin your rites.
            </p>
            <Link href="/auth/signin" className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-6 py-3 font-mono text-sm font-bold text-accent-gold transition-all hover:bg-accent-gold/25">
              Sign in →
            </Link>
          </section>
        )}

        <section className="space-y-4">
          {QUESTS.map((q) => {
            const a = ACCENT[q.accent];
            const p = progress?.find((x) => x.quest.slug === q.slug);
            const done = p?.done ?? false;
            return (
              <div
                key={q.slug}
                className={`rounded-xl border p-5 space-y-3 transition-all ${
                  done ? `${a.border} bg-gradient-to-r from-white/[0.02] to-surface` : "border-border bg-surface"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className={`font-mono text-[9px] uppercase tracking-[0.3em] ${a.text}`}>{q.rite}</p>
                    <h2 className="font-display text-lg font-bold text-text-primary">{q.title}</h2>
                    <p className="font-mono text-[11px] text-text-muted leading-relaxed">{q.description}</p>
                  </div>
                  {done ? (
                    <span className={`shrink-0 font-mono text-[9px] uppercase tracking-widest ${a.text}`}>✓ complete</span>
                  ) : (
                    <span className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-text-muted/60">locked</span>
                  )}
                </div>

                {/* Progress */}
                {p && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between font-mono text-[10px] text-text-muted/60">
                      <span>{p.current} / {p.target} {q.metricLabel}</span>
                      <span>{p.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-void overflow-hidden border border-border">
                      <div className={`h-full rounded-full ${a.bar} transition-all`} style={{ width: `${p.pct}%`, opacity: done ? 1 : 0.7 }} />
                    </div>
                  </div>
                )}

                {/* Action */}
                <div className="flex items-center gap-3 pt-1">
                  {done ? (
                    <Link href={`/quests/${q.slug}`} className={`font-mono text-[11px] uppercase tracking-widest rounded border ${a.border} ${a.text} px-3 py-1.5 hover:bg-white/5 transition-colors`}>
                      Claim fragment →
                    </Link>
                  ) : (
                    <Link href={q.hintHref} className="font-mono text-[11px] uppercase tracking-widest text-text-muted/60 hover:text-text-primary transition-colors">
                      {q.hint} →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </>
  );
}
