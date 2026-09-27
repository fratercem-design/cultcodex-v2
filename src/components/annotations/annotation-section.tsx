import { prisma } from "@/lib/db";
import { voteAnnotation } from "@/app/annotations/actions";
import { AnnotationGate } from "./annotation-gate";

interface Props {
  targetType: "episode" | "lore" | "person" | "topic";
  targetId: string;       // slug
  returnPath: string;     // current page path (for revalidation)
  /** Optional heading override. */
  label?: string;
}

/**
 * AnnotationSection — community annotations for an archive entity.
 *
 * Shows approved annotations (most-voted first) and, for Initiate+
 * members, a submit form. Reads no cookies, so pages using it stay
 * cacheable; the per-viewer form/prompt lives in AnnotationGate.
 * Degrades gracefully if the table is missing (pre-migration) so it can
 * never break a detail page.
 */
export async function AnnotationSection({ targetType, targetId, returnPath, label }: Props) {
  let annotations: {
    id: string; body: string; votes: number; createdAt: Date;
    user: { displayName: string; memberTitle: string | null };
  }[] = [];

  try {
    annotations = await prisma.annotation.findMany({
      where: { targetType, targetId, status: "approved" },
      select: {
        id: true, body: true, votes: true, createdAt: true,
        user: { select: { displayName: true, memberTitle: true } },
      },
      orderBy: [{ votes: "desc" }, { createdAt: "desc" }],
      take: 50,
    });
  } catch {
    return null; // table not migrated yet — fail silent
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-cyan/60">
          {"/// community_annotations"}
        </span>
        {annotations.length > 0 && (
          <span className="font-mono text-[12px] text-text-muted">{annotations.length}</span>
        )}
      </div>

      {label && <p className="font-mono text-[12px] text-text-muted">{label}</p>}

      {/* List */}
      {annotations.length > 0 ? (
        <div className="space-y-3">
          {annotations.map((a) => (
            <div key={a.id} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
              <form action={voteAnnotation.bind(null, a.id, returnPath)} className="shrink-0">
                <button
                  type="submit"
                  className="flex flex-col items-center gap-0.5 rounded-lg border border-border px-2 py-1.5 hover:border-accent-cyan/40 hover:bg-accent-cyan/5 transition-all group"
                  title="Upvote"
                >
                  <span className="text-accent-cyan/60 group-hover:text-accent-cyan text-[12px]">▲</span>
                  <span className="font-mono text-xs font-bold text-text-primary">{a.votes}</span>
                </button>
              </form>
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-sm text-text-primary leading-relaxed">{a.body}</p>
                <p className="font-mono text-[12px] uppercase tracking-widest text-text-muted">
                  {a.user.displayName}
                  {a.user.memberTitle && <span className="text-accent-gold-text/80"> · {a.user.memberTitle}</span>}
                  {" · "}
                  {new Date(a.createdAt).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-mono text-xs text-text-muted italic">
          No annotations yet.
        </p>
      )}

      <AnnotationGate targetType={targetType} targetId={targetId} returnPath={returnPath} />
    </section>
  );
}
