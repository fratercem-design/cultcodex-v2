import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/corrections" },
  title: "Corrections — CULT CODEX",
  description: "How to report errors or request changes in the Cult Codex archive",
};

export default async function CorrectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; title?: string }>;
}) {
  const { type, title } = await searchParams;
  const bannerTitle = title ? title.slice(0, 120) : null;

  return (
    <>
      <PageHero
        title="CORRECTIONS"
        subtitle="Help us maintain an accurate archive"
        backgroundImage="/wiki-page-header.jpg"
      label="corrections"
      />
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {bannerTitle && (
          <div className="rounded-lg border border-border/50 bg-surface/30 px-4 py-3 font-mono text-xs text-text-muted">
            Reporting: {type} &mdash; &ldquo;{bannerTitle}&rdquo;
          </div>
        )}
        <SectionCard title="Report an Error">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              The Cult Codex strives for accuracy, but as an AI-assisted archive,
              errors can occur. We welcome corrections for any of the following:
            </p>
            <ul className="space-y-2 list-disc list-inside text-text-muted">
              <li>Misidentified guests or speakers</li>
              <li>Inaccurate episode summaries or descriptions</li>
              <li>Misattributed quotes</li>
              <li>Incorrect dates, episode numbers, or metadata</li>
              <li>Topic or lore categorization errors</li>
              <li>Privacy concerns about personal information</li>
            </ul>
          </div>
        </SectionCard>

        <SectionCard title="How to Submit">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              To submit a correction, please provide:
            </p>
            <ol className="space-y-2 list-decimal list-inside text-text-muted">
              <li>The URL of the page containing the error</li>
              <li>A description of what is incorrect</li>
              <li>The correct information (if known)</li>
              <li>Any supporting context (e.g., timestamp in the episode)</li>
            </ol>
            <p className="mt-4">
              Contact the archive maintainers via the{" "}
              <a
                href="https://github.com/fratercem-design/cultcodex-v2/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-gold-text hover:underline"
              >
                GitHub Issues
              </a>{" "}
              page.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Content Removal Requests">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              If you are mentioned in this archive and would like your information
              modified or removed, please submit a request through GitHub Issues
              with the subject &ldquo;Content Removal Request&rdquo;. We will review
              and respond to all requests promptly.
            </p>
            <p className="text-text-muted text-xs">
              All content in this archive is derived from publicly available streams
              and recordings. See our{" "}
              <Link href="/content-policy" className="text-accent-gold-text hover:underline">
                Content Policy
              </Link>{" "}
              for more details.
            </p>
          </div>
        </SectionCard>

        <div className="flex items-center justify-center gap-4 text-xs">
          <Link href="/methodology" className="font-mono text-accent-gold-text hover:underline">
            Methodology
          </Link>
          <span className="text-text-muted">|</span>
          <Link href="/content-policy" className="font-mono text-accent-gold-text hover:underline">
            Content Policy
          </Link>
        </div>
      </main>
    </>
  );
}
