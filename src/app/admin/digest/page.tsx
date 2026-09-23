import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format/date";
import { upsertWeeklyDigest, deleteWeeklyDigest, togglePublished } from "./actions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Weekly Digest — Admin" };

function startOfWeek(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().slice(0, 10);
}

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminDigestPage({ searchParams }: PageProps) {
  await requireAdmin();

  const { q } = await searchParams;
  const search = q?.trim();

  const [digests, refQuotes, refEpisodes, refPeople] = await Promise.all([
    prisma.weeklyDigest.findMany({ orderBy: { weekOf: "desc" }, take: 12 }),

    // Reference quotes — search by speaker name or quote text
    prisma.quote.findMany({
      where: search
        ? {
            OR: [
              { text: { contains: search, mode: "insensitive" } },
              { speaker: { displayName: { contains: search, mode: "insensitive" } } },
              { episode: { title: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {},
      select: {
        id: true,
        text: true,
        speaker: { select: { displayName: true } },
        episode: { select: { episodeNumber: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),

    // Reference episodes
    prisma.episode.findMany({
      where: search
        ? {
            status: "published",
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
            ],
          }
        : { status: "published" },
      select: { id: true, slug: true, title: true, episodeNumber: true, airDate: true },
      orderBy: { airDate: "desc" },
      take: 8,
    }),

    // Reference people
    prisma.person.findMany({
      where: search
        ? { displayName: { contains: search, mode: "insensitive" } }
        : {},
      select: { id: true, slug: true, displayName: true },
      orderBy: { displayName: "asc" },
      take: 10,
    }),
  ]);

  const inputCls =
    "w-full rounded border border-border bg-void px-3 py-2 font-mono text-xs text-text-primary focus:border-accent-gold/60 focus:outline-none";
  const textareaCls =
    "w-full rounded border border-border bg-void px-3 py-2 font-mono text-[12px] text-text-primary focus:border-accent-gold/60 focus:outline-none resize-none";
  const labelCls = "font-mono text-[12px] uppercase tracking-widest text-text-muted";

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Weekly Digest</h1>
        <p className="font-mono text-xs text-text-muted mt-1">
          Curate &quot;This week in the archive&quot; — published at{" "}
          <a href="/this-week" target="_blank" className="text-accent-gold-text underline">/this-week</a>
        </p>
      </div>

      {/* Reference search */}
      <section className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <h2 className={labelCls}>Find content by name</h2>
        <form method="GET" className="flex gap-2">
          <input
            name="q"
            type="text"
            defaultValue={search}
            placeholder="Search episodes, quotes, or people…"
            className={inputCls}
          />
          <button
            type="submit"
            className="rounded border border-border px-4 py-2 font-mono text-xs text-text-muted hover:border-accent-gold/40 hover:text-accent-gold-text transition-colors whitespace-nowrap"
          >
            Search →
          </button>
        </form>

        {search && (
          <div className="space-y-4 text-[12px] font-mono">
            {/* Episodes */}
            {refEpisodes.length > 0 && (
              <div className="space-y-1">
                <p className={`${labelCls} mb-1`}>Episodes (use slug or id)</p>
                {refEpisodes.map((ep) => (
                  <div key={ep.id} className="flex items-start gap-3 rounded border border-border bg-void px-3 py-2">
                    <span className="text-accent-cyan shrink-0">
                      {ep.episodeNumber ? `EP.${String(ep.episodeNumber).padStart(3, "0")}` : "—"}
                    </span>
                    <span className="flex-1 text-text-primary truncate">{ep.title}</span>
                    <code className="shrink-0 text-text-muted select-all">{ep.slug}</code>
                  </div>
                ))}
              </div>
            )}

            {/* Quotes */}
            {refQuotes.length > 0 && (
              <div className="space-y-1">
                <p className={`${labelCls} mb-1`}>Quotes (use id)</p>
                {refQuotes.map((q) => (
                  <div key={q.id} className="flex items-start gap-3 rounded border border-border bg-void px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary truncate">
                        &ldquo;{q.text.slice(0, 80)}{q.text.length > 80 ? "…" : ""}&rdquo;
                      </p>
                      {q.speaker && (
                        <p className="text-text-muted mt-0.5">— {q.speaker.displayName}</p>
                      )}
                    </div>
                    <code className="shrink-0 text-text-muted select-all text-[12px]">{q.id}</code>
                  </div>
                ))}
              </div>
            )}

            {/* People */}
            {refPeople.length > 0 && (
              <div className="space-y-1">
                <p className={`${labelCls} mb-1`}>People (use slug or id)</p>
                {refPeople.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded border border-border bg-void px-3 py-2">
                    <span className="flex-1 text-text-primary">{p.displayName}</span>
                    <code className="shrink-0 text-text-muted select-all">{p.slug}</code>
                  </div>
                ))}
              </div>
            )}

            {!refEpisodes.length && !refQuotes.length && !refPeople.length && (
              <p className="text-text-muted">No results for &ldquo;{search}&rdquo;</p>
            )}
          </div>
        )}

        {!search && (
          <p className="font-mono text-[12px] text-text-muted">
            Search to find IDs/slugs. Episodes and people accept slugs (e.g. <code>episode-1234</code>, <code>john-doe</code>) or raw IDs. Quotes require the full ID.
          </p>
        )}
      </section>

      {/* Create form */}
      <section className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <h2 className={labelCls}>New Digest</h2>
        <form action={upsertWeeklyDigest} className="space-y-4">
          <input type="hidden" name="id" value="" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className={labelCls}>Week of</label>
              <input name="weekOf" type="date" defaultValue={startOfWeek()} required className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Title</label>
              <input name="title" type="text" placeholder="This week in the archive" required className={inputCls} />
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelCls}>Blurb (optional)</label>
            <textarea name="blurb" rows={2} placeholder="A short framing sentence." className={textareaCls} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { name: "quoteIds", label: "Quote IDs (one per line)" },
              { name: "episodeIds", label: "Episode slugs or IDs" },
              { name: "personIds", label: "Person slugs or IDs" },
            ].map((f) => (
              <div key={f.name} className="space-y-1">
                <label className={labelCls}>{f.label}</label>
                <textarea name={f.name} rows={6} placeholder="paste here" className={textareaCls} />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 font-mono text-xs text-text-muted cursor-pointer">
              <input type="hidden" name="published" value="false" />
              <input type="checkbox" name="published" value="true" className="accent-accent-gold" />
              Publish immediately
            </label>
            <button
              type="submit"
              className="ml-auto rounded border border-accent-gold bg-accent-gold/15 px-5 py-2 font-mono text-xs font-bold text-accent-gold-text hover:bg-accent-gold/25 transition-colors"
            >
              Save digest →
            </button>
          </div>
        </form>
      </section>

      {/* Existing digests */}
      {digests.length > 0 && (
        <section className="space-y-3">
          <h2 className={labelCls}>Saved Digests</h2>
          <div className="space-y-3">
            {digests.map((d) => (
              <div key={d.id} className="flex items-start gap-4 rounded-lg border border-border bg-surface p-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[12px] uppercase tracking-widest px-2 py-0.5 rounded ${d.published ? "bg-green-900/40 text-green-400" : "bg-border text-text-muted"}`}>
                      {d.published ? "live" : "draft"}
                    </span>
                    <span className="font-mono text-[12px] text-text-muted">
                      Week of {formatDate(d.weekOf)}
                    </span>
                  </div>
                  <p className="font-display text-sm font-bold text-text-primary">{d.title}</p>
                  <p className="font-mono text-[12px] text-text-muted">
                    {d.quoteIds.length} quotes · {d.episodeIds.length} episodes · {d.personIds.length} people
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <form action={togglePublished.bind(null, d.id, !d.published)}>
                    <button className="font-mono text-[12px] text-text-muted hover:text-accent-gold-text transition-colors">
                      {d.published ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                  <form action={deleteWeeklyDigest.bind(null, d.id)}>
                    <button className="font-mono text-[12px] text-accent-crimson-text hover:text-accent-crimson-text/80 transition-colors">
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
