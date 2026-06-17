import { prisma } from "@/lib/db";
import { moderateAnnotation } from "@/app/annotations/actions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community Annotations — Admin",
};

async function getAnnotations() {
  return prisma.annotation.findMany({
    select: {
      id: true,
      targetType: true,
      targetId: true,
      body: true,
      status: true,
      votes: true,
      createdAt: true,
      user: { select: { displayName: true, email: true } },
    },
    // pending first, then most recent
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 300,
  });
}

const STATUS_COLOR: Record<string, string> = {
  pending: "text-accent-gold",
  approved: "text-green-400",
  hidden: "text-red-400/60",
};

export default async function AdminAnnotationsPage() {
  const annotations = await getAnnotations();
  const pending = annotations.filter((a) => a.status === "pending");

  return (
    <main id="main-content" className="p-8 max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-accent-gold mb-2">
        Community Annotations
      </h1>
      <p className="font-mono text-xs text-text-muted mb-8">
        {annotations.length} total · {pending.length} pending review
      </p>

      {annotations.length === 0 ? (
        <p className="font-mono text-sm text-text-muted">No annotations yet.</p>
      ) : (
        <div className="space-y-4">
          {annotations.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-center">
                  <span className="font-mono text-xl font-bold text-accent-cyan">{a.votes}</span>
                  <p className="font-mono text-[9px] text-text-muted">votes</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`font-mono text-[10px] uppercase tracking-wide ${STATUS_COLOR[a.status] ?? "text-text-muted"}`}>
                      {a.status}
                    </span>
                    <span className="text-text-muted/30">·</span>
                    <span className="font-mono text-[10px] text-accent-cyan/60">
                      {a.targetType}/{a.targetId}
                    </span>
                    <span className="text-text-muted/30">·</span>
                    <span className="font-mono text-[10px] text-text-muted/70">
                      {a.user.displayName} · {a.user.email}
                    </span>
                    <span className="font-mono text-[10px] text-text-muted/60">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary mb-3 leading-relaxed">{a.body}</p>
                  <div className="flex items-center gap-2">
                    <form action={moderateAnnotation.bind(null, a.id, "approved")}>
                      <button type="submit" className="rounded px-3 py-1 font-mono text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                        Approve
                      </button>
                    </form>
                    <form action={moderateAnnotation.bind(null, a.id, "hidden")}>
                      <button type="submit" className="rounded px-3 py-1 font-mono text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                        Hide
                      </button>
                    </form>
                    <form action={moderateAnnotation.bind(null, a.id, "pending")}>
                      <button type="submit" className="rounded px-3 py-1 font-mono text-xs bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20 transition-colors">
                        Reset
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
