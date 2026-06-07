import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { hasSystemTier } from "@/lib/subscription";
import { prisma } from "@/lib/db";
import { submitSignalProposal, voteOnProposal } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/signals" },
  title: "Signal Proposals — CultCodex",
  description: "Oracle members propose what gets investigated next in the archive.",
};

export const dynamic = "force-dynamic";

async function getProposals() {
  return prisma.signalProposal.findMany({
    select: {
      id: true,
      question: true,
      context: true,
      status: true,
      votes: true,
      createdAt: true,
      user: {
        select: { displayName: true, memberTitle: true, avatarUrl: true },
      },
    },
    orderBy: [{ votes: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "text-text-muted/70" },
  under_review: { label: "Under Review", color: "text-accent-gold" },
  investigating: { label: "Investigating", color: "text-accent-cyan" },
  published: { label: "Published", color: "text-green-400" },
  declined: { label: "Declined", color: "text-red-400/60" },
};

export default async function SignalsPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/auth/signin?callbackUrl=/signals");

  const oracle = await hasSystemTier(user.id);

  if (!oracle) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="mb-4 text-5xl font-mono text-accent-gold/30">◈</div>
          <h1 className="font-display text-3xl font-bold text-accent-gold mb-3">
            Oracle Access Required
          </h1>
          <p className="font-mono text-sm text-text-muted mb-6 leading-relaxed">
            Signal Proposals are an Oracle-tier feature. Your questions become the work —
            the investigations that shape what the archive examines next.
          </p>
          <Link
            href="/premium"
            className="inline-block rounded px-6 py-3 font-mono text-sm font-bold bg-accent-gold text-void hover:bg-accent-gold/80 transition-colors"
          >
            Become an Oracle →
          </Link>
        </div>
      </div>
    );
  }

  const proposals = await getProposals();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-accent-gold/10 bg-gradient-to-b from-[#0d0020] via-[#07001a] to-void">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,rgba(180,100,255,0.3)_0%,transparent_70%)]" />
        <div className="relative mx-auto max-w-4xl px-6 py-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold/60 mb-3">
            ✦ &nbsp; Oracle Feature &nbsp; ✦
          </p>
          <h1
            className="font-display text-4xl font-black tracking-tight text-accent-gold sm:text-5xl"
            style={{ textShadow: "0 0 40px rgba(212,175,55,0.3)" }}
          >
            Signal Proposals
          </h1>
          <p className="mt-4 font-mono text-sm leading-relaxed text-text-muted max-w-xl">
            Your signal shapes what gets investigated next. Submit questions,
            patterns you want traced, figures who need deeper analysis.
            The most-voted proposals become the next investigations.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Submit Form */}
        <section className="mb-10">
          <h2 className="font-mono text-xs uppercase tracking-widest text-accent-gold mb-5">
            Propose an Investigation
          </h2>
          <form action={submitSignalProposal} className="rounded-xl border border-accent-gold/20 bg-surface p-6 space-y-4">
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase mb-1.5 tracking-wider">
                Your Question or Investigation Request *
              </label>
              <textarea
                name="question"
                required
                rows={3}
                maxLength={1000}
                placeholder="What pattern do you want traced? Which figure needs deeper analysis? What connection hasn't been made yet?"
                className="w-full rounded border border-border bg-elevated px-3 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted/50 focus:border-accent-gold focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase mb-1.5 tracking-wider">
                Additional Context (optional)
              </label>
              <textarea
                name="context"
                rows={2}
                maxLength={2000}
                placeholder="Episode numbers, timestamps, related figures, why this matters..."
                className="w-full rounded border border-border bg-elevated px-3 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted/50 focus:border-accent-gold focus:outline-none resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded px-6 py-2.5 font-mono text-sm font-bold bg-accent-gold text-void hover:bg-accent-gold/80 transition-colors"
              >
                Submit Signal ✦
              </button>
            </div>
          </form>
        </section>

        {/* Proposal List */}
        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-text-muted mb-5">
            Active Proposals ({proposals.filter((p) => p.status !== "declined").length})
          </h2>

          {proposals.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-4 text-accent-gold/20">◈</p>
              <p className="font-mono text-sm text-text-muted">
                No proposals yet. Be the first Oracle to signal.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal, i) => {
                const statusInfo = STATUS_LABELS[proposal.status] ?? STATUS_LABELS.open;
                return (
                  <div
                    key={proposal.id}
                    className="rounded-xl border border-border bg-surface p-5"
                  >
                    <div className="flex items-start gap-4">
                      {/* Vote button */}
                      <form action={voteOnProposal.bind(null, proposal.id)} className="flex-shrink-0">
                        <button
                          type="submit"
                          className="flex flex-col items-center gap-0.5 rounded-lg border border-border px-2.5 py-2 hover:border-accent-gold/40 hover:bg-accent-gold/5 transition-all group"
                          title="Upvote this proposal"
                        >
                          <span className="text-accent-gold/60 group-hover:text-accent-gold text-xs">▲</span>
                          <span className="font-mono text-sm font-bold text-text-primary">{proposal.votes}</span>
                        </button>
                      </form>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`font-mono text-[10px] uppercase tracking-wide ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <span className="text-text-muted/30">·</span>
                          <span className="font-mono text-[10px] text-text-muted/50">
                            {proposal.user.displayName}
                            {proposal.user.memberTitle && (
                              <span className="text-accent-gold/50"> · {proposal.user.memberTitle}</span>
                            )}
                          </span>
                          <span className="text-text-muted/30">·</span>
                          <span className="font-mono text-[10px] text-text-muted/40">
                            {new Date(proposal.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          {i < 3 && (
                            <>
                              <span className="text-text-muted/30">·</span>
                              <span className="font-mono text-[10px] text-accent-gold">
                                #{i + 1} Ranked
                              </span>
                            </>
                          )}
                        </div>

                        <p className="font-mono text-sm text-text-primary leading-relaxed">
                          {proposal.question}
                        </p>

                        {proposal.context && (
                          <p className="mt-2 font-mono text-xs text-text-muted/70 leading-relaxed">
                            {proposal.context}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
