import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "How CultCodex Works — Methodology & Transparency",
  description:
    "How CultCodex builds the archive: where transcripts come from, what AI generates, the editorial standards, the known limitations, and how to report inaccuracies.",
  path: "/about/methodology",
});

const SECTION_CLS = "border border-border rounded-lg bg-surface overflow-hidden";
const HEADING_CLS =
  "flex items-center gap-2 border-b border-border bg-elevated px-4 py-2.5";
const BODY_CLS = "px-4 py-4 space-y-3 text-sm text-text-primary leading-relaxed";
const STEP_CLS = "font-mono text-xs text-accent-gold uppercase tracking-wider font-bold";

function SectionBlock({
  sigil,
  title,
  children,
}: {
  sigil: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={SECTION_CLS}>
      <div className={HEADING_CLS}>
        <span className="font-mono text-xs text-accent-gold-text">{sigil}</span>
        <h2 className="font-mono text-[12px] uppercase tracking-[0.12em] font-semibold text-text-muted">
          {title}
        </h2>
      </div>
      <div className={BODY_CLS}>{children}</div>
    </div>
  );
}

function DotList({ items, tone = "gold" }: { items: string[]; tone?: "gold" | "red" }) {
  const dot = tone === "red" ? "text-red-400/60" : "text-accent-gold/60";
  return (
    <ul className="space-y-2 mt-1">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className={`${dot} shrink-0 mt-0.5`}>·</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function MethodologyPage() {
  return (
    <>
      <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: "CultCodex", href: "/" },
            { label: "About", href: "/about" },
            { label: "Methodology" },
          ]}
        />

        {/* Page header */}
        <div className="space-y-1">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-violet-text">
            {"/// transparency_log"}
          </p>
          <h1 className="text-2xl font-bold text-text-primary">How CultCodex Works</h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            CultCodex is a fan-built archive for the Cult of Psyche livestream universe. This page
            explains how content is sourced, where AI is involved, what standards the archive holds
            itself to, and how to flag errors.
          </p>
        </div>

        <SectionBlock sigil="◈" title="What CultCodex Is">
          <p>
            CultCodex is an independent fan archive — not an official Cult of Psyche publication.
            It indexes episodes, guests, lore, and topics from the @CultofPsyche and
            @PsychesNightmares YouTube channels to make the archive searchable and explorable.
          </p>
          <p>
            Episode metadata (titles, dates, thumbnails) is pulled directly from the YouTube API.
            Transcripts are fetched from YouTube&rsquo;s auto-generated captions where available.
          </p>
        </SectionBlock>

        <SectionBlock sigil="⟶" title="The Pipeline">
          <h3 className={STEP_CLS}>1. Transcript acquisition</h3>
          <p>
            Transcripts come from YouTube captions where available. When captions are disabled,
            the audio is downloaded and transcribed locally with OpenAI Whisper (medium model).
            Either way, transcripts are stored as timestamped segments, which is what lets a
            search result or an Oracle citation jump to the exact moment in the video.
          </p>

          <h3 className={`${STEP_CLS} mt-4`}>2. AI enrichment</h3>
          <p>
            Each transcript is processed by Anthropic Claude to extract structured data: episode
            summaries, guest identifications, topic tags, notable quotes, lore references, and
            content-type classification. The model is prompted with explicit editorial guidelines
            that require neutral, factual language.
          </p>

          <h3 className={`${STEP_CLS} mt-4`}>3. Database import</h3>
          <p>
            Enriched data is imported into a PostgreSQL database (Xata) via Prisma. The import
            deduplicates people, topics, and lore entries by slug, so one guest with three display
            names still resolves to one profile.
          </p>

          <h3 className={`${STEP_CLS} mt-4`}>4. Provenance badges</h3>
          <p>
            Every episode shows whether its data is &ldquo;transcript-backed&rdquo; (derived from a
            full transcript) or &ldquo;inferred&rdquo; (generated from the title and metadata only),
            so you can judge how much weight an entry deserves.
          </p>
        </SectionBlock>

        <SectionBlock sigil="⬡" title="AI-Generated Content">
          <p>
            Several content types on CultCodex are generated by AI (Anthropic Claude) based on
            episode transcripts and metadata. These include:
          </p>
          <DotList
            items={[
              "Episode summaries (short and long)",
              'Guest / character profiles ("Codex entries")',
              "Notable quotes extraction",
              "Lore entries and topic clusters",
              "Psychenomicon narrative chapters (explicitly mythic/symbolic interpretations)",
            ]}
          />
          <p className="text-text-secondary">
            AI-generated content is clearly marked with a{" "}
            <span className="font-mono text-accent-violet-text text-xs">◈ AI-generated</span> notice
            wherever it appears.
          </p>
        </SectionBlock>

        <SectionBlock sigil="⚖" title="Editorial Standards">
          <DotList
            items={[
              "Summaries use neutral, descriptive language without editorial judgment.",
              "Guest identifications are based on in-stream introductions and display names.",
              "Quotes are extracted verbatim from transcripts where possible.",
              "Topic tags are normalized to avoid duplicates (e.g. “AI” vs “Artificial Intelligence”).",
              "Lore entries distinguish canonical (stated on stream), speculative, and community myth.",
              "Person pages carry an archive-context notice explaining that profiles are auto-generated.",
            ]}
          />
        </SectionBlock>

        <SectionBlock sigil="⚡" title="Important Limitations">
          <p className="font-medium text-text-secondary">
            AI summaries and character profiles describe on-stream discussion and performance
            personas — not verified real-world claims.
          </p>
          <DotList
            tone="red"
            items={[
              "Summaries are generated from transcripts and may misattribute statements, misidentify speakers, or miss context.",
              "Character profiles reflect how someone appears across recorded streams, not their private life.",
              "AI models can hallucinate — descriptions may contain factual errors.",
              "Transcript accuracy varies: auto-generated captions and Whisper both mishear words and names, especially in overlapping speech or low-quality audio.",
              "Some early episodes have no transcript at all and only minimal metadata.",
              "Guest identification relies on display names, which may not reflect legal or preferred names.",
              "Topic and lore categorization involves subjective judgment by the AI model.",
              "Psychenomicon chapters are explicitly symbolic/mythic interpretations, not factual reporting.",
            ]}
          />
        </SectionBlock>

        <SectionBlock sigil="◉" title="How to Report Errors">
          <p>
            If you find inaccurate, harmful, or outdated information, please use the correction form
            linked on every episode and person page.
          </p>
          <p>
            Typical turnaround for corrections is 1–3 days. For urgent removal requests (e.g.
            content that puts someone at risk), contact the site owner directly.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/corrections"
              className="inline-flex items-center gap-1.5 rounded border border-accent-violet/30 bg-accent-violet/10 px-3 py-1.5 font-mono text-xs text-accent-violet-text hover:border-accent-violet/60 transition-colors"
            >
              <span>◈</span>
              <span>Suggest a Correction</span>
            </Link>
            <Link href="/content-policy" className="font-mono text-xs text-accent-gold hover:underline">
              Content Policy
            </Link>
          </div>
        </SectionBlock>

        <SectionBlock sigil="◇" title="Data Sources">
          <ul className="space-y-2">
            {[
              { label: "Video metadata", source: "YouTube Data API v3" },
              { label: "Transcripts", source: "YouTube auto-generated captions via Supadata API; OpenAI Whisper (medium) run locally when captions are unavailable" },
              { label: "AI enrichment", source: "Anthropic Claude (claude-opus-4-8)" },
              { label: "Semantic search", source: "OpenAI text-embedding-3-small + pgvector" },
              { label: "Storage", source: "PostgreSQL on Xata, via Prisma" },
            ].map(({ label, source }) => (
              <li key={label} className="flex gap-3 text-sm">
                <span className="text-text-muted shrink-0 min-w-[120px]">{label}</span>
                <span className="text-text-secondary">{source}</span>
              </li>
            ))}
          </ul>
        </SectionBlock>

        <p className="text-[12px] text-text-muted font-mono text-center pt-2">
          Last updated: September 2026 · CultCodex is an independent fan project
        </p>
      </main>
    </>
  );
}
