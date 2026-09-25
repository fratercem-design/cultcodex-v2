import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import Link from "next/link";
import type { Metadata } from "next";
import { CorrectionForm } from "@/components/corrections/correction-form";
import { defaultCorrectionType } from "@/lib/corrections";

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
  const subject = bannerTitle
    ? `CultCodex correction: ${bannerTitle}`
    : "CultCodex correction request";
  const correctionEmail = `mailto:psychetarotchannel@gmail.com?subject=${encodeURIComponent(subject)}`;
  const removalEmail = `mailto:psychetarotchannel@gmail.com?subject=${encodeURIComponent("Private CultCodex content removal request")}`;

  return (
    <>
      <PageHero
        title="CORRECTIONS"
        subtitle="Help us maintain an accurate archive"
        backgroundImage="/wiki-page-header.jpg"
      label="corrections"
      />
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 space-y-8">
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

        <SectionCard title="Submit a Correction">
          <div className="space-y-5">
            <CorrectionForm initialType={defaultCorrectionType(type)} entityTitle={bannerTitle} />
            <p className="text-xs leading-relaxed text-text-muted">
              Prefer email? Write to{" "}
              <a href={correctionEmail} className="text-accent-gold-text hover:underline">
                psychetarotchannel@gmail.com
              </a>{" "}
              with the page URL, what&apos;s wrong, and the correct information if you know it.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Content Removal Requests">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              If you are mentioned in this archive and would like your information
              modified or removed, please send a{" "}
              <a href={removalEmail} className="text-accent-gold-text hover:underline">
                private content removal request
              </a>
              , or use the form above and choose &ldquo;Privacy concern or removal
              request&rdquo;. Both reach the maintainers privately. Include the page URL
              and the change you need, and we will review and respond promptly.
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
          <Link href="/about/methodology" className="font-mono text-accent-gold-text hover:underline">
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
