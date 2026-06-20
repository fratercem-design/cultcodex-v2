import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  title: "Contact — CULT CODEX",
  description: "How to reach the CultCodex archive maintainers — corrections, billing questions, and general inquiries.",
};

export const revalidate = false;

const CONTACT_EMAIL = "psychetarotchannel@gmail.com";

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="CONTACT"
        subtitle="Reach the archive maintainers"
        backgroundImage="/wiki-page-header.jpg"
        label="contact"
      />
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 space-y-8">

        <SectionCard title="General Inquiries">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              For questions about the archive, the show, partnerships, or anything else, email us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-accent-gold hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Corrections to the Archive">
          <div className="space-y-3 text-sm text-text-muted leading-relaxed">
            <p>
              Spotted an error in an episode, transcript, quote, or person profile? Submit it through
              the{" "}
              <Link href="/corrections" className="text-accent-gold hover:underline">
                corrections page
              </Link>{" "}
              so we can review and fix it.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Billing &amp; Subscriptions">
          <div className="space-y-3 text-sm text-text-muted leading-relaxed">
            <p>
              For questions about Initiate+ or Oracle subscriptions, the Psychenomicon book purchase,
              or a charge you believe was made in error, email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-accent-gold hover:underline"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              or see the{" "}
              <Link href="/refund" className="text-accent-gold hover:underline">
                refund policy
              </Link>
              . You can manage or cancel an active subscription any time from your{" "}
              <Link href="/settings" className="text-accent-gold hover:underline">
                account settings
              </Link>
              .
            </p>
          </div>
        </SectionCard>

      </main>
    </>
  );
}
