import { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://cultcodex.me";

interface PageProps {
  searchParams: Promise<{ q?: string; a?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q, a } = await searchParams;
  const question = (q ?? "").slice(0, 120);
  const answer = (a ?? "").slice(0, 240);

  const title = question
    ? `The Oracle on: "${question.slice(0, 60)}${question.length > 60 ? "…" : ""}" — CULT CODEX`
    : "The Oracle Speaks — CULT CODEX";
  const description = answer || "The Oracle has answered. Read the transmission at CultCodex.";

  const ogImageUrl = `${SITE_URL}/api/oracle/og?q=${encodeURIComponent(question)}&a=${encodeURIComponent(answer)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    robots: { index: false, follow: false },
  };
}

export default async function OracleSharePage({ searchParams }: PageProps) {
  const { q, a } = await searchParams;
  const question = (q ?? "").trim();
  const answer = (a ?? "").trim();

  return (
    <>
      <PageHero
        title="THE ORACLE"
        subtitle="A transmission from the archive"
        backgroundImage="/wiki-page-header.jpg"
        label="oracle"
      />
      <main className="mx-auto max-w-2xl px-4 py-12 space-y-6">
        {question && (
          <div className="font-mono text-xs text-text-muted/60 uppercase tracking-[0.2em]">
            Question asked:
          </div>
        )}
        {question && (
          <p className="font-mono text-sm text-text-muted leading-relaxed border-l-2 border-accent-violet/30 pl-4">
            {question}
          </p>
        )}

        <div
          className="relative rounded-xl border border-accent-violet/20 bg-surface/80 p-6 sm:p-8"
          style={{
            background:
              "linear-gradient(135deg, rgba(110,75,174,0.06) 0%, transparent 50%)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl text-accent-violet-text" aria-hidden="true">◉</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-violet-text/70">
              The Oracle Responds
            </span>
          </div>
          <blockquote className="font-serif text-lg sm:text-xl leading-relaxed text-text-primary italic">
            {answer || "The archive holds many answers."}
          </blockquote>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/oracle"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-accent-violet/50 bg-accent-violet/10 px-6 py-3 font-mono text-sm font-bold text-accent-violet-text transition-all hover:border-accent-violet/70 hover:bg-accent-violet/15"
          >
            Ask the Oracle →
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 font-mono text-sm text-text-muted transition-all hover:border-accent-violet/30 hover:text-accent-violet-text"
          >
            Enter the Codex
          </Link>
        </div>
      </main>
    </>
  );
}
