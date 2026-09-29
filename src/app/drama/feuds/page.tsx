import Link from "next/link";
import type { Metadata } from "next";
import { getFeuds } from "@/lib/queries/feuds";
import { RELATION_LABELS } from "@/lib/relationships";
import { formatDate } from "@/lib/format/date";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/drama/feuds" },
  title: "Feuds — The Drama Files — CULT CODEX",
  description: "Every feud in the Cult of Psyche archive as a dated, cited timeline: the turns, the receipts, and the exact moments on stream.",
};

export default async function FeudsPage() {
  const feuds = await getFeuds().catch(() => []);

  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-10">
      <header className="space-y-3 text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-red-400/70">{"/// feud_files"}</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">Feuds</h1>
        <p className="mx-auto max-w-lg text-sm text-text-muted">
          Each feud as a timeline: every recorded turn between the two, and every time one named the other on
          stream, linked to the moment it was said.
        </p>
      </header>

      {feuds.length === 0 ? (
        <p className="mt-12 rounded border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">
          No feuds on file yet.
        </p>
      ) : (
        <ol className="mt-10 space-y-3">
          {feuds.map((f, i) => (
            <li key={f.slug}>
              <Link
                href={`/drama/feuds/${f.slug}`}
                className="group flex items-center justify-between gap-4 rounded border border-border bg-surface p-4 hover:border-red-400/40 hover:bg-red-500/5 transition-all"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-red-400/60">
                    FEUD №{String(i + 1).padStart(2, "0")} · {RELATION_LABELS[f.state]}
                  </p>
                  <h2 className="mt-1 font-display text-lg font-bold text-text-primary group-hover:text-red-300 transition-colors">
                    {f.people[0].displayName} <span className="text-red-400/70">vs</span> {f.people[1].displayName}
                  </h2>
                  <p className="mt-0.5 font-mono text-[12px] text-text-muted">
                    {f.events} beat{f.events === 1 ? "" : "s"} · {f.hostile} hostile
                    {f.lastAt && ` · latest ${formatDate(f.lastAt)}`}
                  </p>
                </div>
                <span className="flex-shrink-0 font-mono text-[12px] text-text-muted group-hover:text-red-400/70">OPEN →</span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <p className="pt-8 text-center">
        <Link href="/drama" className="font-mono text-[12px] text-text-muted hover:text-red-300 transition-colors">
          ← The Drama Files
        </Link>
      </p>
    </main>
  );
}
