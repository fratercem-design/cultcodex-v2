import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";


export const metadata: Metadata = buildMetadata({
  title: "About CultCodex — The Cult of Psyche Archive",
  description:
    "CultCodex is the searchable archive of the Cult of Psyche livestream universe — episodes, transcripts, lore, and the Oracle. An independent fan project.",
  path: "/about",
});

const CHANNELS: { handle: string; href: string; blurb: string }[] = [
  {
    handle: "@CultofPsyche",
    href: "https://www.youtube.com/@cultofpsyche",
    blurb: "The main current — occult study, ritual drama, and the long-running livestream saga.",
  },
  {
    handle: "@PsychesNightmares",
    href: "https://www.youtube.com/@psychesnightmares",
    blurb: "The darker channel — nightmares, confrontations, and the unfiltered late-night signal.",
  },
  {
    handle: "@NightmareFrequenciesTV",
    href: "https://www.youtube.com/@nightmarefrequenciestv",
    blurb: "Broadcast experiments and transmissions from the edge of the frequency.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="ABOUT CULTCODEX"
        subtitle="The searchable memory of the Cult of Psyche"
        backgroundImage="/wiki-page-header.jpg"
        label="the archive"
      />
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        <div className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 px-4 py-3 font-mono text-[11px] text-text-muted">
          An independent fan archive of the Cult of Psyche universe — not an official publication.
        </div>

        <SectionCard title="What CultCodex Is" accent="gold">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              CultCodex is the searchable memory of the Cult of Psyche livestream
              universe. Every transmission that aired is indexed here — not just
              titles and thumbnails, but the full transcript, the guests who appeared,
              the lore that surfaced, and the behavioral patterns that repeat across
              hundreds of hours of unscripted conversation.
            </p>
            <p>
              Search by word, theme, or person. Trace a running joke from its first
              mention to its latest callback. Follow a guest across every appearance
              and watch how their role shifts. Or simply ask the{" "}
              <Link href="/oracle" className="text-accent-gold hover:underline">Oracle</Link>{" "}
              a question and get an answer drawn straight from the transcripts — with
              citations to the exact moment it happened.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="The Cult of Psyche Universe" accent="violet">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              The Cult of Psyche is an ongoing occult-and-drama livestream world spread across three
              YouTube channels. CultCodex indexes them all into one continuous, navigable memory.
            </p>
            <ul className="space-y-3 mt-1">
              {CHANNELS.map((c) => (
                <li key={c.handle} className="flex flex-col gap-0.5">
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs font-semibold text-accent-cyan hover:underline"
                  >
                    {c.handle}
                  </a>
                  <span className="text-text-muted">{c.blurb}</span>
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        <SectionCard title="The Oracle" accent="cyan">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              The Oracle is the archive&apos;s answer engine. Ask it anything about the
              archive and it responds using the actual transcripts — and it{" "}
              <span className="text-text-secondary">cites the episodes it drew from</span>,
              so every answer is traceable back to a moment that really aired.
            </p>
            <p className="text-text-muted">
              It is a guide through the signal, not an authority on anyone&apos;s private
              life. How it&apos;s generated — and where it can be wrong — is documented in
              full on the{" "}
              <Link href="/about/methodology" className="text-accent-gold hover:underline">
                methodology page
              </Link>.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Where the Archive Comes From" accent="muted">
          <div className="space-y-3 text-sm text-text-muted leading-relaxed">
            <p>
              Episode metadata comes from YouTube. Transcripts come from captions and our own
              Whisper transcription pipeline. Summaries, character profiles, lore entries, and
              Psychenomicon chapters are generated by AI (Anthropic Claude) from those transcripts,
              and every AI-generated surface carries a provenance mark so you know what was
              machine-read and what was human-reviewed.
            </p>
            <p>
              We show our work. The full sourcing, the role of AI, known limitations, and the
              correction process all live on the{" "}
              <Link href="/about/methodology" className="text-accent-gold hover:underline">
                methodology &amp; transparency log
              </Link>.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Independent & Unofficial" accent="red">
          <div className="space-y-3 text-sm text-text-muted leading-relaxed">
            <p>
              CultCodex is an independent fan project. It is not an official Cult of Psyche
              publication, and the profiles and summaries here describe on-stream performance and
              discussion — not verified real-world claims. If something is wrong, harmful, or out of
              date, tell us and we&apos;ll fix it: see{" "}
              <Link href="/corrections" className="text-accent-gold hover:underline">corrections</Link>.
            </p>
          </div>
        </SectionCard>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/episodes"
            className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-accent-gold transition-all hover:bg-accent-gold/25"
          >
            Explore the Archive
          </Link>
          <Link
            href="/oracle"
            className="inline-flex items-center gap-2 rounded-lg border border-accent-cyan/40 bg-accent-cyan/10 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-accent-cyan transition-all hover:bg-accent-cyan/20"
          >
            Ask the Oracle
          </Link>
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 rounded-lg border border-accent-violet/40 bg-accent-violet/10 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-accent-violet transition-all hover:bg-accent-violet/20"
          >
            Become an Initiate
          </Link>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs pt-2">
          <Link href="/about/methodology" className="font-mono text-accent-gold hover:underline">
            Methodology
          </Link>
          <span className="text-text-muted">|</span>
          <Link href="/faq" className="font-mono text-accent-gold hover:underline">
            FAQ
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
