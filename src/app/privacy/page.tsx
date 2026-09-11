import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  title: "Privacy Policy — CULT CODEX",
  description: "How CultCodex collects, uses, and protects your personal information.",
};

export const revalidate = false;

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        title="PRIVACY POLICY"
        subtitle="How we handle your data"
        backgroundImage="/wiki-page-header.jpg"
        label="legal"
      />
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 space-y-8">

        <div className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 px-4 py-3 font-mono text-[11px] text-text-muted">
          Last updated: June 2026. This policy applies to cultcodex.me.
        </div>

        <SectionCard title="Who We Are">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              CultCodex is an independent fan archive of the Cult of Psyche livestream community.
              We operate the website at <span className="font-mono text-accent-gold">cultcodex.me</span>.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Information We Collect">
          <div className="space-y-4 text-sm text-text-primary leading-relaxed">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-accent-cyan mb-2">Account Information</h3>
              <p className="text-text-muted">
                When you sign in via Google OAuth, we receive your Google account name, email address,
                and profile photo. We store your email address and display name to identify your account.
                We do not store your Google password.
              </p>
            </div>
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-accent-cyan mb-2">Payment Information</h3>
              <p className="text-text-muted">
                Subscription payments are processed by Stripe. We never see or store your card number,
                CVV, or full payment details. Stripe returns a customer ID and subscription status,
                which we store to gate subscriber features. Stripe&apos;s privacy policy governs payment data.
              </p>
            </div>
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-accent-cyan mb-2">Usage Data</h3>
              <p className="text-text-muted">
                We use Google Analytics (via Google Tag Manager) to measure aggregate page views
                and performance metrics. Analytics data is anonymised — no personally identifiable
                information is sent to Google. You can opt out via the{" "}
                <a href="https://tools.google.com/dlpage/gaoptout" className="text-accent-gold hover:underline" target="_blank" rel="noopener noreferrer">
                  Google Analytics opt-out add-on
                </a>.
              </p>
            </div>
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-accent-cyan mb-2">User-Generated Content</h3>
              <p className="text-text-muted">
                Content you submit through the corrections form, comments, or Oracle queries is stored
                to fulfil the service. Corrections and comments may be reviewed by archive maintainers.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="How We Use Your Information">
          <div className="space-y-2 text-sm text-text-muted leading-relaxed">
            <ul className="space-y-2 list-disc list-inside">
              <li>To authenticate your account and remember your session</li>
              <li>To verify your subscription tier and gate subscriber-only features</li>
              <li>To send transactional emails (e.g. subscription receipts via Stripe)</li>
              <li>To process correction requests and improvement feedback</li>
              <li>To measure aggregate site performance (Vercel Analytics)</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal data. We do not use your data for advertising profiling.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Data Retention">
          <div className="space-y-3 text-sm text-text-muted leading-relaxed">
            <p>
              Account data is retained as long as your account exists. You may request deletion of
              your account and associated personal data by emailing us at the address below.
              Stripe subscription records are governed by Stripe&apos;s retention policies.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Cookies and Local Storage">
          <div className="space-y-3 text-sm text-text-muted leading-relaxed">
            <p>
              We use a session cookie to maintain your login state (via NextAuth.js). This cookie is
              strictly necessary for the site to function and does not track you across other websites.
              Vercel Analytics operates without cookies.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Third-Party Services">
          <div className="space-y-2 text-sm text-text-muted leading-relaxed">
            <ul className="space-y-2 list-disc list-inside">
              <li><span className="text-text-primary font-medium">Google OAuth</span> — sign-in authentication</li>
              <li><span className="text-text-primary font-medium">Stripe</span> — payment processing</li>
              <li><span className="text-text-primary font-medium">Google Analytics / Tag Manager</span> — anonymised usage analytics</li>
              <li><span className="text-text-primary font-medium">Vercel</span> — application hosting</li>
              <li><span className="text-text-primary font-medium">Xata</span> — database hosting (PostgreSQL)</li>
              <li><span className="text-text-primary font-medium">Resend</span> — transactional and newsletter email</li>
              <li><span className="text-text-primary font-medium">Anthropic Claude</span> — AI enrichment of archive data (content only, not user data)</li>
              <li><span className="text-text-primary font-medium">ElevenLabs</span> — voice synthesis for Oracle audio (query text only, not user data)</li>
            </ul>
          </div>
        </SectionCard>

        <SectionCard title="Your Rights">
          <div className="space-y-3 text-sm text-text-muted leading-relaxed">
            <p>
              Depending on your jurisdiction, you may have the right to access, correct, or delete
              personal data we hold about you. To exercise these rights, contact us using the
              corrections page or the email address below.
            </p>
            <p>
              GDPR (EU/UK residents): You have the right to access, rectify, erase, restrict processing,
              data portability, and to object. You may also lodge a complaint with your local supervisory authority.
            </p>
            <p>
              CCPA (California residents): You have the right to know what personal information is collected,
              to opt out of sale (we do not sell data), and to request deletion.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Contact">
          <div className="space-y-3 text-sm text-text-muted leading-relaxed">
            <p>
              For privacy-related requests or questions, use our{" "}
              <Link href="/corrections" className="text-accent-gold hover:underline">
                corrections page
              </Link>{" "}
              or reach out through the community channels linked in the archive.
            </p>
          </div>
        </SectionCard>

        <div className="flex items-center justify-center gap-4 text-xs">
          <Link href="/content-policy" className="font-mono text-accent-gold hover:underline">
            Content Policy
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
