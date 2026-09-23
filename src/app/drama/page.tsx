import Link from "next/link";
import type { Metadata } from "next";
import { getLoreEntries, getLoreCount } from "@/lib/queries/lore";

export const revalidate = 600;

export const metadata: Metadata = {
  alternates: { canonical: "/drama" },
  title: "The Drama Files — CULT CODEX",
  description:
    "Official case files on the least dignified moments in Cult of Psyche history. Every feud, meltdown, and chat catastrophe — catalogued with the seriousness it does not deserve.",
};

const SEVERITY_LABELS = [
  "MILD DISTURBANCE",
  "ELEVATED NONSENSE",
  "FULL POLTERGEIST",
];

function severityFor(index: number): string {
  return SEVERITY_LABELS[index % SEVERITY_LABELS.length];
}

export default async function DramaPage() {
  // Prerendering runs without a database, so a query rejection must degrade
  // to the empty state below rather than failing the whole build.
  const [entries, total] = await Promise.all([
    getLoreEntries({ category: "drama", take: 100 }).catch(() => []),
    getLoreCount({ category: "drama" }).catch(() => 0),
  ]);

  return (
    <main className="min-h-screen bg-void">
      {/* Hero */}
      <section className="border-b border-red-500/20 bg-gradient-to-b from-red-500/5 to-void py-12 px-4">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-red-400/70">
            {"/// incident_archive · clearance: none_required"}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
            The Drama Files
          </h1>
          <p className="text-sm text-text-muted max-w-lg mx-auto leading-relaxed">
            A solemn record of the least dignified moments in the archive.
            Feuds, meltdowns, chat catastrophes — preserved here with the
            bureaucratic seriousness they absolutely do not deserve.
          </p>
          <p className="font-mono text-[12px] text-text-muted">
            {total} incident{total === 1 ? "" : "s"} on file · the Codex forgives nothing
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
        {entries.length === 0 ? (
          <div className="rounded border border-border bg-surface px-6 py-16 text-center space-y-3">
            <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-red-400/60">
              {"/// no_incidents_declassified"}
            </p>
            <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
              The first case files are being prepared by the Department of
              Regrettable Events. Check back — the chat always provides.
            </p>
          </div>
        ) : (
          entries.map((entry, i) => (
            <Link
              key={entry.slug}
              href={`/lore/${entry.slug}`}
              className="group block rounded border border-border bg-surface p-5 hover:border-red-400/40 hover:bg-red-500/5 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-red-400/60">
                    CASE №{String(i + 1).padStart(3, "0")} · SEVERITY: {severityFor(i)}
                  </p>
                  <h2 className="font-display text-lg font-bold text-text-primary group-hover:text-red-300 transition-colors">
                    {entry.title}
                  </h2>
                  {entry.summary && (
                    <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                      {entry.summary}
                    </p>
                  )}
                </div>
                <span className="flex-shrink-0 font-mono text-[12px] text-text-muted group-hover:text-red-400/70 transition-colors">
                  OPEN FILE →
                </span>
              </div>
            </Link>
          ))
        )}

        <div className="pt-6 text-center">
          <Link
            href="/fun"
            className="font-mono text-[12px] text-text-muted hover:text-accent-violet-text transition-colors"
          >
            ← Return to the Fun Wing
          </Link>
        </div>
      </div>
    </main>
  );
}
