import Link from "next/link";
import type { Metadata } from "next";
import { subscriberTokenValid } from "@/lib/subscriber-links";
import { confirmWorkbookReader } from "@/lib/workbook";

// Reached from the workbook email. Opening it proves the reader owns the
// address, so it confirms them on the list before offering the file.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your workbook — CultCodex",
  robots: { index: false, follow: false },
};

const NEXT_STEPS: { href: string; label: string; note: string }[] = [
  { href: "/archetype-quiz", label: "Take the archetype quiz", note: "Day 1 starts here" },
  { href: "/oracle", label: "Ask the Oracle", note: "3 free questions a month" },
  { href: "/premium", label: "See Initiate+", note: "the full archive" },
];

export default async function WorkbookDownloadPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; t?: string }>;
}) {
  const { e, t } = await searchParams;
  const valid = subscriberTokenValid("workbook", e ?? null, t ?? null);

  if (!valid) {
    return (
      <main id="main-content" className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-accent-gold">That link didn&rsquo;t work</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          It may have been cut short by your email app. Ask for a fresh one and it&rsquo;ll arrive in a minute.
        </p>
        <Link href="/initiation" className="mt-6 font-mono text-xs text-accent-gold-text hover:underline">
          Send me a new link →
        </Link>
      </main>
    );
  }

  await confirmWorkbookReader(e!);
  const fileHref = `/api/workbook/download?${new URLSearchParams({ e: e!, t: t! })}`;

  return (
    <main id="main-content" className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">{"// "}the first gate</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-text-primary">Your workbook is ready, darling.</h1>
      <p className="mt-3 text-sm leading-relaxed text-text-muted">
        44 pages, US Letter. Print it or fill it in on a tablet. This link keeps working, so you can come back for
        another copy.
      </p>
      <a
        href={fileHref}
        className="mt-6 rounded border border-accent-gold bg-accent-gold/15 px-6 py-3 font-mono text-sm font-bold text-accent-gold-text transition hover:bg-accent-gold/25"
      >
        Download the PDF
      </a>
      <ul className="mt-10 w-full space-y-2 text-left">
        {NEXT_STEPS.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="flex justify-between rounded border border-border px-4 py-3 font-mono text-xs text-text-primary transition hover:border-accent-gold/60"
            >
              <span>{s.label} →</span>
              <span className="text-text-muted">{s.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
