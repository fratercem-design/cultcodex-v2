import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Signal Proposals — Admin",
};

async function getProposals() {
  return prisma.signalProposal.findMany({
    select: {
      id: true,
      question: true,
      context: true,
      status: true,
      votes: true,
      createdAt: true,
      user: { select: { displayName: true, email: true } },
    },
    orderBy: [{ votes: "desc" }, { createdAt: "desc" }],
  });
}

const STATUSES = ["open", "under_review", "investigating", "published", "declined"] as const;

export default async function AdminSignalsPage() {
  const proposals = await getProposals();

  return (
    <main id="main-content" className="p-8 max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-accent-gold mb-2">
        Signal Proposals
      </h1>
      <p className="font-mono text-xs text-text-muted mb-8">
        {proposals.length} proposals from Oracle members
      </p>

      {proposals.length === 0 ? (
        <p className="font-mono text-sm text-text-muted">No proposals yet.</p>
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-center">
                  <span className="font-mono text-xl font-bold text-accent-gold-text">{p.votes}</span>
                  <p className="font-mono text-[9px] text-text-muted">votes</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono text-[10px] text-text-muted/70">
                      {p.user.displayName} · {p.user.email}
                    </span>
                    <span className="font-mono text-[10px] text-text-muted/60">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="font-mono text-sm text-text-primary mb-2">{p.question}</p>
                  {p.context && (
                    <p className="font-mono text-xs text-text-muted/60 mb-3">{p.context}</p>
                  )}
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      const status = formData.get("status") as string;
                      await prisma.signalProposal.update({
                        where: { id: p.id },
                        data: { status },
                      });
                      revalidatePath("/admin/signals");
                      revalidatePath("/signals");
                    }}
                    className="flex items-center gap-2"
                  >
                    <select
                      name="status"
                      defaultValue={p.status}
                      className="rounded border border-border bg-elevated px-2 py-1 font-mono text-xs text-text-primary focus:border-accent-gold focus:outline-none"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded px-3 py-1 font-mono text-xs bg-accent-gold/10 text-accent-gold-text hover:bg-accent-gold/20 transition-colors"
                    >
                      Update
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
