import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/basement" },
  title: "░░░░░░ — CULT CODEX",
  description: "This page does not exist. You are not reading this.",
  robots: { index: false, follow: false },
};

const SUPPRESSED_FILES: { id: string; label: string; note: string; href?: string }[] = [
  {
    id: "BSMT-001",
    label: "The Cat Question",
    note: "Subject insists it is 'just a cat.' Evidence disagrees.",
    href: "/meow",
  },
  {
    id: "BSMT-002",
    label: "Incident Compendium (Unabridged)",
    note: "The upstairs copy is redacted. This one is merely embarrassing.",
    href: "/drama",
  },
  {
    id: "BSMT-003",
    label: "██████████ ████ ███",
    note: "File checked out in 2019. Never returned. Do not ask by whom.",
  },
  {
    id: "BSMT-004",
    label: "Chapter Zero",
    note: "The Psychenomicon claims to begin at chapter one. It is lying.",
  },
  {
    id: "BSMT-005",
    label: "Visitor Log, Sub-Level 3",
    note: "One signature, repeated 340 times, in improving handwriting.",
  },
  {
    id: "BSMT-006",
    label: "The Stairwell",
    note: "Maintenance swears the stairs stop here. They do not stop here.",
    href: "/stairwell",
  },
];

export default function BasementPage() {
  return (
    <main className="min-h-screen bg-void flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-xl space-y-8">
        <header className="space-y-2 text-center">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-red-400/50">
            {"/// sub-level_access · unlogged"}
          </p>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            The Basement
          </h1>
          <p className="font-mono text-[12px] text-text-muted leading-relaxed">
            Files the Codex declined to index. The stairs you took to get here
            are not on the floor plan. Mind the dust — some of it minds back.
          </p>
        </header>

        <div className="space-y-2">
          {SUPPRESSED_FILES.map((f) =>
            f.href ? (
              <Link
                key={f.id}
                href={f.href}
                className="group flex items-baseline gap-3 rounded border border-border bg-surface px-4 py-3 hover:border-red-400/30 hover:bg-red-500/5 transition-all"
              >
                <span className="font-mono text-[12px] text-red-400/50 flex-shrink-0">{f.id}</span>
                <span className="min-w-0">
                  <span className="block font-mono text-xs text-text-primary group-hover:text-red-300 transition-colors">
                    {f.label}
                  </span>
                  <span className="block text-[12px] text-text-muted leading-relaxed">{f.note}</span>
                </span>
              </Link>
            ) : (
              <div
                key={f.id}
                className="flex items-baseline gap-3 rounded border border-border/50 bg-surface/50 px-4 py-3 opacity-60 cursor-not-allowed select-none"
                title="ACCESS DENIED"
              >
                <span className="font-mono text-[12px] text-red-400/40 flex-shrink-0">{f.id}</span>
                <span className="min-w-0">
                  <span className="block font-mono text-xs text-text-muted">{f.label}</span>
                  <span className="block text-[12px] text-text-muted leading-relaxed">{f.note}</span>
                </span>
              </div>
            )
          )}
        </div>

        <footer className="text-center space-y-3">
          <p className="font-mono text-[12px] text-text-muted leading-relaxed">
            You were never here. The footer glyph will remember you anyway.
          </p>
          <Link
            href="/"
            className="inline-block font-mono text-[12px] text-text-muted hover:text-accent-violet-text transition-colors"
          >
            ← Back upstairs, quietly
          </Link>
        </footer>
      </div>
    </main>
  );
}
