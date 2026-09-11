import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/content-policy" },
  title: "Content Policy — CULT CODEX",
  description: "Content sourcing, attribution, and privacy policies for the Cult Codex archive",
};

export default function ContentPolicyPage() {
  return (
    <>
      <PageHero
        title="CONTENT POLICY"
        subtitle="Sourcing, attribution, and privacy"
        backgroundImage="/wiki-page-header.jpg"
      label="policy"
      />
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        <SectionCard title="Content Sources">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              All content in the Cult Codex is derived from publicly available sources:
            </p>
            <ul className="space-y-2 list-disc list-inside text-text-muted">
              <li>Public YouTube livestreams and videos from the Psyche Awakens channel</li>
              <li>Public Rumble uploads from the Panelverse VODs channel</li>
              <li>Publicly visible stream titles, descriptions, and metadata</li>
              <li>In-stream statements, introductions, and discussions</li>
            </ul>
            <p>
              No private communications, DMs, or off-stream content is included.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Person Profiles">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              Person profiles in the archive are auto-generated based on their
              appearances in publicly streamed episodes. These profiles:
            </p>
            <ul className="space-y-2 list-disc list-inside text-text-muted">
              <li>Use display names as seen on stream (not legal names unless publicly stated)</li>
              <li>Include only information discussed in public streams</li>
              <li>Are not endorsements or character assessments</li>
              <li>May contain AI-generated biographical summaries that should be treated as approximate</li>
            </ul>
            <p>
              Individuals mentioned in the archive may request corrections or removal
              via our{" "}
              <Link href="/corrections" className="text-accent-gold hover:underline">
                corrections page
              </Link>.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="AI-Generated Content">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              Significant portions of this archive are generated or assisted by AI
              (OpenAI Whisper for transcription, Anthropic Claude for enrichment).
              AI-generated content is identified by provenance badges on episode pages.
            </p>
            <p>
              AI-generated summaries, topic tags, and lore entries should be understood
              as best-effort interpretations, not authoritative statements. The archive
              maintainers review and correct AI output on an ongoing basis.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="No Endorsement">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              The Cult Codex is an independent fan archive. It does not represent the
              views of Psyche, any stream guests, or any individuals mentioned.
              Inclusion in this archive does not imply endorsement, affiliation,
              or agreement with any content.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Copyright">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              Episode recordings and original stream content are the property of their
              respective creators. This archive provides metadata, summaries, and
              analysis under fair use for purposes of commentary, criticism, and
              archival reference. Full episode content is linked to original sources
              rather than reproduced.
            </p>
          </div>
        </SectionCard>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
          <Link href="/about/methodology" className="font-mono text-accent-gold hover:underline">
            Methodology
          </Link>
          <span className="text-text-muted">|</span>
          <Link href="/corrections" className="font-mono text-accent-gold hover:underline">
            Corrections
          </Link>
          <span className="text-text-muted">|</span>
          <Link href="/privacy" className="font-mono text-accent-gold hover:underline">
            Privacy Policy
          </Link>
          <span className="text-text-muted">|</span>
          <Link href="/terms" className="font-mono text-accent-gold hover:underline">
            Terms of Service
          </Link>
        </div>
      </main>
    </>
  );
}
