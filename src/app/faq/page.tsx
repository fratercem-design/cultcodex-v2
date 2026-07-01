import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { buildMetadata, jsonLdScript } from "@/lib/seo";
import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "FAQ — CultCodex",
  description:
    "Frequently asked questions about CultCodex: what it is, how the Oracle works, AI reliability, subscriptions, corrections, and privacy.",
  path: "/faq",
});

/**
 * Q&A is authored as { q, plain, body }. `plain` is the text-only answer used
 * for the FAQPage JSON-LD (search engines want a string); `body` is the rich
 * JSX rendered on the page. Keeping both avoids hardcoding markup into the
 * structured data.
 */
const FAQS: { q: string; plain: string; body: ReactNode }[] = [
  {
    q: "Is CultCodex official?",
    plain:
      "No. CultCodex is an independent fan-built archive of the Cult of Psyche livestream universe. It is not an official Cult of Psyche publication.",
    body: (
      <p>
        No. CultCodex is an independent, fan-built archive of the Cult of Psyche universe — not an
        official publication. It exists to make the streams searchable, explorable, and permanent.
      </p>
    ),
  },
  {
    q: "What is the Cult of Psyche?",
    plain:
      "The Cult of Psyche is an ongoing occult-and-drama livestream world across three YouTube channels: @CultofPsyche, @PsychesNightmares, and @NightmareFrequenciesTV. CultCodex indexes all of them.",
    body: (
      <p>
        An ongoing occult-and-drama livestream world spread across three YouTube channels —
        @CultofPsyche, @PsychesNightmares, and @NightmareFrequenciesTV. CultCodex indexes all of
        them into one continuous archive. More on the{" "}
        <Link href="/about" className="text-accent-gold hover:underline">about page</Link>.
      </p>
    ),
  },
  {
    q: "How does the Oracle work?",
    plain:
      "The Oracle answers questions using the actual episode transcripts and cites the episodes it drew from, so every answer is traceable back to something that aired.",
    body: (
      <p>
        Ask the{" "}
        <Link href="/oracle" className="text-accent-gold hover:underline">Oracle</Link> anything
        about the archive and it answers using the real episode transcripts — and it cites the
        episodes it pulled from, so you can trace every answer back to a moment that actually aired.
      </p>
    ),
  },
  {
    q: "What is the Psychenomicon?",
    plain:
      "The Psychenomicon is a living myth-engine inside the archive — chapters, entities, and threads that map the recurring mythology of the Cult of Psyche. Volume I is also available as a 58-page PDF.",
    body: (
      <p>
        The Psychenomicon is the archive&apos;s living myth-engine — chapters, entities, and threads
        that map the recurring mythology of the show. It is included with Initiate+. You can also
        purchase{" "}
        <Link href="/psychenomicon" className="text-accent-gold hover:underline">
          Volume I as a PDF
        </Link>{" "}
        to keep.
      </p>
    ),
  },
  {
    q: "Can I trust the AI-generated summaries and profiles?",
    plain:
      "Treat them as a guide, not gospel. AI summaries and character profiles describe on-stream performance, not verified real-world facts, and AI can make mistakes. The methodology page documents the sourcing and limitations in full.",
    body: (
      <p>
        Treat them as a guide, not gospel. Summaries and character profiles describe what happened
        on stream, not verified real-world facts — and AI can get things wrong. We document exactly
        how content is generated and where it can fail on the{" "}
        <Link href="/about/methodology" className="text-accent-gold hover:underline">
          methodology page
        </Link>.
      </p>
    ),
  },
  {
    q: "What do I get with a subscription?",
    plain:
      "Free visitors can browse and search the archive. Paid tiers unlock deeper Oracle access and members-only features. Current tiers and pricing are on the premium page.",
    body: (
      <p>
        Browsing and searching the archive is free. Paid tiers unlock deeper Oracle access and
        members-only features. The current tiers and pricing live on the{" "}
        <Link href="/premium" className="text-accent-gold hover:underline">premium page</Link>.
      </p>
    ),
  },
  {
    q: "Can I gift a subscription?",
    plain:
      "Not yet. Gift subscriptions are on the roadmap. For now, you can support the archive by upgrading your own account or through the tip jar.",
    body: (
      <p>
        Not yet — gift subscriptions are on the roadmap. For now, you can support the archive by
        upgrading your own account or through the{" "}
        <Link href="/premium" className="text-accent-gold hover:underline">support options</Link>.
      </p>
    ),
  },
  {
    q: "How do I report an error or request a removal?",
    plain:
      "Use the corrections page, or the correction link on any episode or person page. Typical turnaround is 1–3 days; urgent removal requests are prioritised.",
    body: (
      <p>
        Use the{" "}
        <Link href="/corrections" className="text-accent-gold hover:underline">corrections page</Link>,
        or the correction link on any episode or person page. Typical turnaround is 1–3 days, and
        urgent removal requests are prioritised.
      </p>
    ),
  },
  {
    q: "Is my payment information secure?",
    plain:
      "Yes. All payments are processed by Stripe. CultCodex never sees or stores your card number or full payment details.",
    body: (
      <p>
        Yes. Payments are handled entirely by Stripe — CultCodex never sees or stores your card
        number or full payment details. See the{" "}
        <Link href="/privacy" className="text-accent-gold hover:underline">privacy policy</Link> for
        how data is handled.
      </p>
    ),
  },
  {
    q: "What data do you collect about me?",
    plain:
      "If you sign in, we store your email and display name to identify your account, plus subscription status from Stripe. We use anonymised analytics and do not sell your data. Full details are in the privacy policy.",
    body: (
      <p>
        If you sign in, we store your email and display name to identify your account, plus
        subscription status from Stripe. Analytics are anonymised and we never sell your data. Full
        detail is in the{" "}
        <Link href="/privacy" className="text-accent-gold hover:underline">privacy policy</Link>.
      </p>
    ),
  },
  {
    q: "Can I get my channel or appearance featured — or removed?",
    plain:
      "Guests and creators can claim or promote their archive pages, and anyone can request removal. Start from the appear page or the corrections page.",
    body: (
      <p>
        Guests and creators can claim and promote their archive pages — start at{" "}
        <Link href="/appear" className="text-accent-gold hover:underline">appear</Link>. Removal
        requests go through{" "}
        <Link href="/corrections" className="text-accent-gold hover:underline">corrections</Link>.
      </p>
    ),
  },
  {
    q: "Where does the archive content come from?",
    plain:
      "Episode metadata comes from YouTube, transcripts from captions and Whisper transcription, and the AI enrichment from Anthropic Claude. The methodology page lists every source.",
    body: (
      <p>
        Metadata from YouTube, transcripts from captions and our own Whisper transcription, and AI
        enrichment from Anthropic Claude. Every source is listed on the{" "}
        <Link href="/about/methodology" className="text-accent-gold hover:underline">
          methodology page
        </Link>.
      </p>
    ),
  },
];

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.plain },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd) }}
      />
      <PageHero
        title="FREQUENTLY ASKED QUESTIONS"
        subtitle="What CultCodex is, and how it works"
        backgroundImage="/wiki-page-header.jpg"
        label="help"
      />
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 space-y-5">
        {FAQS.map((f) => (
          <SectionCard key={f.q} title={f.q} accent="gold">
            <div className="text-sm text-text-primary leading-relaxed">{f.body}</div>
          </SectionCard>
        ))}

        <div className="flex items-center justify-center gap-4 text-xs pt-2">
          <Link href="/about" className="font-mono text-accent-gold hover:underline">
            About
          </Link>
          <span className="text-text-muted">|</span>
          <Link href="/about/methodology" className="font-mono text-accent-gold hover:underline">
            Methodology
          </Link>
          <span className="text-text-muted">|</span>
          <Link href="/corrections" className="font-mono text-accent-gold hover:underline">
            Corrections
          </Link>
        </div>
      </main>
    </>
  );
}
