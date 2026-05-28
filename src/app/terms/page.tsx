import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — CULT CODEX",
  description: "Terms governing use of the CultCodex archive and subscription services.",
};

export const revalidate = false;

export default function TermsPage() {
  return (
    <>
      <PageHero
        title="TERMS OF SERVICE"
        subtitle="Rules of the archive"
        backgroundImage="/wiki-page-header.jpg"
        label="legal"
      />
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 space-y-8">

        <div className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 px-4 py-3 font-mono text-[11px] text-text-muted">
          Last updated: May 2025. By using cultcodex.me you agree to these terms.
        </div>

        <SectionCard title="Acceptance">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              By accessing or using CultCodex you agree to these Terms of Service. If you do not
              agree, do not use the site. We may update these terms at any time; continued use
              after changes constitutes acceptance.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Service Description">
          <div className="space-y-3 text-sm text-text-muted leading-relaxed">
            <p>
              CultCodex is an independent fan-run archive of publicly available Cult of Psyche
              livestream content. The service includes episode summaries, transcripts, guest profiles,
              lore entries, topic indexes, search, and AI-assisted exploration tools.
            </p>
            <p>
              Some features are available only to subscribers. We reserve the right to modify,
              suspend, or discontinue any part of the service at any time.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="User Accounts">
          <div className="space-y-3 text-sm text-text-muted leading-relaxed">
            <p>
              Creating an account requires Google OAuth authentication. You are responsible for
              maintaining the security of your account. Notify us immediately of any unauthorized
              use via the corrections or contact page.
            </p>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms or
              engage in abuse of the platform.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Subscriptions and Billing">
          <div className="space-y-3 text-sm text-text-muted leading-relaxed">
            <p>
              Paid subscriptions (Initiate+ and Oracle tiers) are billed monthly through Stripe.
              Subscriptions renew automatically unless cancelled before the renewal date.
              You may cancel at any time; access continues until the end of the current billing period.
            </p>
            <p>
              Refunds are handled on a case-by-case basis. Contact us through the corrections page
              if you believe a charge was made in error.
            </p>
            <p>
              We reserve the right to change subscription pricing with reasonable notice. Existing
              subscribers will be notified before any price change takes effect.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Acceptable Use">
          <div className="space-y-3 text-sm text-text-muted leading-relaxed">
            <p>You agree not to:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Scrape, crawl, or systematically download archive content at scale without permission</li>
              <li>Share subscriber-only content publicly or distribute subscription credentials</li>
              <li>Attempt to circumvent paywalls, authentication, or access controls</li>
              <li>Submit false corrections or abuse the corrections system</li>
              <li>Use the Oracle AI feature to generate harmful, harassing, or illegal content</li>
              <li>Misrepresent yourself or impersonate others in the community</li>
            </ul>
          </div>
        </SectionCard>

        <SectionCard title="Intellectual Property">
          <div className="space-y-3 text-sm text-text-muted leading-relaxed">
            <p>
              Episode recordings and stream content are the property of their respective creators.
              CultCodex operates under fair use principles for archival, commentary, and research
              purposes. Archive-original content (structured data, AI summaries, lore compositions,
              UI design) is owned by CultCodex.
            </p>
            <p>
              You may link to archive pages freely. Reproducing substantial portions of archive
              content without attribution or permission is not permitted.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Disclaimers and Limitation of Liability">
          <div className="space-y-3 text-sm text-text-muted leading-relaxed">
            <p>
              The archive is provided &quot;as is&quot; without warranties of any kind. AI-generated content
              (summaries, transcripts, lore entries) may contain errors and should not be treated as
              authoritative. We are not responsible for the accuracy of AI-assisted content.
            </p>
            <p>
              CultCodex is not affiliated with Psyche, any stream guests, or any organizations
              mentioned in the archive. Inclusion in the archive does not constitute endorsement.
            </p>
            <p>
              To the fullest extent permitted by law, CultCodex shall not be liable for indirect,
              incidental, or consequential damages arising from use of the service.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Governing Law">
          <div className="space-y-3 text-sm text-text-muted leading-relaxed">
            <p>
              These terms are governed by applicable law. Disputes will be resolved through
              good-faith negotiation before any formal proceeding.
            </p>
          </div>
        </SectionCard>

        <div className="flex items-center justify-center gap-4 text-xs">
          <Link href="/privacy" className="font-mono text-accent-gold hover:underline">
            Privacy Policy
          </Link>
          <span className="text-text-muted">|</span>
          <Link href="/content-policy" className="font-mono text-accent-gold hover:underline">
            Content Policy
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
