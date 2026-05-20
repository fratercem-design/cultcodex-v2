import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format/date";
import { upsertWeeklyDigest, deleteWeeklyDigest, togglePublished } from "./actions";

export const dynamic = "force-dynamic";

function startOfWeek(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay()); // Sunday
  return d.toISOString().slice(0, 10);
}

export default async function AdminDigestPage() {
  await requireAdmin();

  const digests = await prisma.weeklyDigest.findMany({
    orderBy: { weekOf: "desc" },
    take: 12,
  });

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Weekly Digest</h1>
          <p className="font-mono text-xs text-text-muted mt-1">
            Curate "This week in the archive" — published at /this-week
          </p>
        </div>
      </div>

      {/* Create / edit form */}
      <section className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-muted">New Digest</h2>
        <form action={upsertWeeklyDigest} className="space-y-4">
          <input type="hidden" name="id" value="" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Week of</label>
              <input
                name="weekOf"
                type="date"
                defaultValue={startOfWeek()}
                required
                className="w-full rounded border border-border bg-void px-3 py-2 font-mono text-xs text-text-primary focus:border-accent-gold/60 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Title</label>
              <input
                name="title"
                type="text"
                placeholder="This week in the archive"
                required
                className="w-full rounded border border-border bg-void px-3 py-2 font-mono text-xs text-text-primary focus:border-accent-gold/60 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Blurb (optional)</label>
            <textarea
              name="blurb"
              rows={2}
              placeholder="A short framing sentence for this week's selections."
              className="w-full rounded border border-border bg-void px-3 py-2 font-mono text-xs text-text-primary focus:border-accent-gold/60 focus:outline-none resize-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { name: "quoteIds", label: "Quote IDs (one per line)" },
              { name: "episodeIds", label: "Episode IDs (one per line)" },
              { name: "personIds", label: "Person IDs (one per line)" },
            ].map((f) => (
              <div key={f.name} className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted">{f.label}</label>
                <textarea
                  name={f.name}
                  rows={5}
                  placeholder="paste IDs here"
                  className="w-full rounded border border-border bg-void px-3 py-2 font-mono text-[10px] text-text-primary focus:border-accent-gold/60 focus:outline-none resize-none"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 font-mono text-xs text-text-muted">
              <input type="hidden" name="published" value="false" />
              <input
                type="checkbox"
                name="published"
                value="true"
                className="accent-accent-gold"
              />
              Publish immediately
            </label>
            <button
              type="submit"
              className="ml-auto rounded border border-accent-gold bg-accent-gold/15 px-5 py-2 font-mono text-xs font-bold text-accent-gold hover:bg-accent-gold/25 transition-colors"
            >
              Save digest →
            </button>
          </div>
        </form>
      </section>

      {/* Existing digests */}
      {digests.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Saved Digests</h2>
          <div className="space-y-3">
            {digests.map((d) => (
              <div
                key={d.id}
                className="flex items-start gap-4 rounded-lg border border-border bg-surface p-4"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded ${d.published ? "bg-green-900/40 text-green-400" : "bg-border text-text-muted"}`}>
                      {d.published ? "live" : "draft"}
                    </span>
                    <span className="font-mono text-[10px] text-text-muted">
                      Week of {formatDate(d.weekOf)}
                    </span>
                  </div>
                  <p className="font-display text-sm font-bold text-text-primary">{d.title}</p>
                  <p className="font-mono text-[10px] text-text-muted">
                    {d.quoteIds.length} quotes · {d.episodeIds.length} episodes · {d.personIds.length} people
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <form action={togglePublished.bind(null, d.id, !d.published)}>
                    <button className="font-mono text-[10px] text-text-muted hover:text-accent-gold transition-colors">
                      {d.published ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                  <form action={deleteWeeklyDigest.bind(null, d.id)}>
                    <button className="font-mono text-[10px] text-accent-crimson hover:text-accent-crimson/70 transition-colors">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
