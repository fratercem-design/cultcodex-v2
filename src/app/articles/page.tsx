import Link from "next/link";
import type { Metadata } from "next";
import { getLoreEntries, getLoreCount } from "@/lib/queries/lore";

export const revalidate = 600;

export const metadata: Metadata = {
  alternates: { canonical: "/articles" },
  title: "Articles — CULT CODEX",
  description:
    "Long-form writing drawn from the show — essays, deep dives, and field reports from inside the Cult of Psyche.",
};

export default async function ArticlesPage() {
  const [entries, total] = await Promise.all([
    getLoreEntries({ category: "article", take: 100 }),
    getLoreCount({ category: "article" }),
  ]);

  return (
    <main className="min-h-screen bg-void">
      {/* Hero */}
      <section className="border-b border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-void py-12 px-4">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-accent-violet-text/60">
            {"/// field_reports"}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
            Articles
          </h1>
          <p className="text-sm text-text-muted max-w-lg mx-auto leading-relaxed">
            Long-form writing drawn from the show — essays, deep dives, and
            field reports from inside the Cult of Psyche.
          </p>
          <p className="font-mono text-[10px] text-text-muted/60">
            {total} article{total === 1 ? "" : "s"} in the record
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
        {entries.length === 0 ? (
          <div className="rounded border border-border bg-surface px-6 py-16 text-center space-y-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet-text/60">
              {"/// presses_warming_up"}
            </p>
            <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
              The first field reports are being transcribed. Until then, the{" "}
              <Link href="/lore" className="text-accent-violet-text hover:underline">
                lore archive
              </Link>{" "}
              runs deep.
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <Link
              key={entry.slug}
              href={`/lore/${entry.slug}`}
              className="group block rounded border border-border bg-surface p-5 hover:border-accent-violet/40 hover:bg-accent-violet/5 transition-all"
            >
              <div className="space-y-1.5">
                <h2 className="font-display text-lg font-bold text-text-primary group-hover:text-accent-violet-text transition-colors">
                  {entry.title}
                </h2>
                {entry.summary && (
                  <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                    {entry.summary}
                  </p>
                )}
                <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted/40 pt-1">
                  Read the full report →
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
