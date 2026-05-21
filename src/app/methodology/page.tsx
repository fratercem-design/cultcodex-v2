import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology — CULT CODEX",
  description: "How the Cult Codex archive is built, maintained, and quality-checked",
};

export default function MethodologyPage() {
  return (
    <>
      <PageHero
        title="METHODOLOGY"
        subtitle="How this archive is built and maintained"
        backgroundImage="/wiki-page-header.jpg"
      label="methodology"
      />
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        <SectionCard title="Overview">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              The Cult Codex is a structured archive of the Cult of Psyche podcast.
              It uses a combination of automated transcription, AI-assisted analysis,
              and human curation to catalog episodes, identify participants, extract
              quotes, and map recurring topics and lore.
            </p>
            <p>
              This page documents the processes, tools, and editorial standards
              used to build and maintain the archive.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Data Pipeline">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <h3 className="font-mono text-xs text-accent-gold uppercase tracking-wider font-bold">
              1. Transcript Acquisition
            </h3>
            <p>
              Transcripts are sourced from YouTube captions where available. When
              YouTube captions are disabled, audio is downloaded and transcribed
              locally using OpenAI Whisper (medium model). Transcripts are stored
              as timestamped segments.
            </p>

            <h3 className="font-mono text-xs text-accent-gold uppercase tracking-wider font-bold mt-4">
              2. AI Enrichment
            </h3>
            <p>
              Each transcript is processed by an AI model (Claude) to extract structured
              data: episode summaries, guest identifications, topic tags, notable quotes,
              lore references, and content type classification. The AI is prompted with
              explicit editorial guidelines emphasizing neutral, factual language.
            </p>

            <h3 className="font-mono text-xs text-accent-gold uppercase tracking-wider font-bold mt-4">
              3. Database Import
            </h3>
            <p>
              Enriched data is imported into a PostgreSQL database (Neon) via Prisma ORM.
              The import process handles deduplication of people, topics, and lore entries
              using slug-based matching.
            </p>

            <h3 className="font-mono text-xs text-accent-gold uppercase tracking-wider font-bold mt-4">
              4. Quality Indicators
            </h3>
            <p>
              Each episode displays provenance badges indicating whether its data is
              &ldquo;transcript-backed&rdquo; (derived from a full transcript) or
              &ldquo;inferred&rdquo; (generated from title and metadata only).
              This helps members gauge the reliability of each entry.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Editorial Standards">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <ul className="space-y-2 list-disc list-inside text-text-muted">
              <li>Summaries use neutral, descriptive language without editorial judgment</li>
              <li>Guest identifications are based on in-stream introductions and display names</li>
              <li>Quotes are extracted verbatim from transcripts where possible</li>
              <li>Topic tags are normalized to avoid duplicates (e.g., &ldquo;AI&rdquo; vs &ldquo;Artificial Intelligence&rdquo;)</li>
              <li>Lore entries distinguish between canonical (stated on stream), speculative, and community myth</li>
              <li>Person pages include archive context notices explaining that profiles are auto-generated</li>
            </ul>
          </div>
        </SectionCard>

        <SectionCard title="Limitations">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <ul className="space-y-2 list-disc list-inside text-text-muted">
              <li>AI-generated summaries may occasionally misidentify speakers or misattribute statements</li>
              <li>Whisper transcriptions of overlapping speech or low-quality audio may contain errors</li>
              <li>Some early episodes lack transcripts entirely and have minimal metadata</li>
              <li>Guest identification relies on display names which may not reflect legal or preferred names</li>
              <li>Topic and lore categorization involves subjective judgment by the AI model</li>
            </ul>
          </div>
        </SectionCard>

        <div className="flex items-center justify-center gap-4 text-xs">
          <Link href="/corrections" className="font-mono text-accent-gold hover:underline">
            Submit a Correction
          </Link>
          <span className="text-text-muted">|</span>
          <Link href="/content-policy" className="font-mono text-accent-gold hover:underline">
            Content Policy
          </Link>
        </div>
      </main>
    </>
  );
}
